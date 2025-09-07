import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole, Prisma, KpiStatus } from '@repo/db/prisma/client';
import { CoordinatorWorkflow, KpiFormResponsesWithWorkflow } from '../coordinator/coordinator-kpi.service';

@Injectable()
export class HodCoordinatorWorkflowService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ensures only HOD users can perform HOD operations
   */
  private assertHodRole(userRole: UserRole) {
    if (userRole !== UserRole.HOD) {
      throw new ForbiddenException('Only HOD users can perform this action');
    }
  }

  /**
   * Gets department ID for the HOD user
   */
  private async getHodDepartmentId(userId: string): Promise<string> {
    const hod = await this.prisma.user.findUnique({ where: { id: userId }, include: { department: true } });
    if (!hod || !hod.department) throw new NotFoundException('HOD department not found');
    return hod.department.id;
  }

  // Per-KPI assignment removed: coordinators can access all KPIs in their department

  /**
   * Get KPIs submitted by coordinators for HOD review
   */
  async getKpisForReview(userId: string, userRole: UserRole) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertHodRole(userRole);
    const departmentId = await this.getHodDepartmentId(userId);
    const kpis = await this.prisma.departmentKpi.findMany({
      where: {
        dept_id: departmentId,
        form_responses: { path: ['coordinator_workflow', 'coordinator_status'], equals: 'SUBMITTED' },
      },
      include: {
        department_pillar: { select: { pillar_name: true } },
        assigned_users: { select: { id: true, user_name: true, user_email: true, user_role: true } },
      },
      orderBy: { kpi_number: 'asc' },
    });
    return kpis.map((kpi) => {
      const formResponses = kpi.form_responses as KpiFormResponsesWithWorkflow | null;
      const coordinatorWorkflow = formResponses?.coordinator_workflow;
      return {
        ...kpi,
        pillar_name: kpi.department_pillar.pillar_name,
        coordinator_workflow: coordinatorWorkflow,
        coordinator_submission: coordinatorWorkflow?.coordinator_submission,
      };
    });
  }

  /**
   * Review coordinator submission (approve, reject, or request revision)
   */
  async reviewCoordinatorSubmission(
    userId: string,
    userRole: UserRole,
    kpiId: string,
    action: 'APPROVE' | 'REJECT' | 'REQUEST_REVISION',
    comments: string,
  ) {
    console.log('reviewCoordinatorSubmission called:', { userId, userRole, kpiId, action, comments });

    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertHodRole(userRole);

    const departmentId = await this.getHodDepartmentId(userId);
    console.log('HOD department ID:', departmentId);

    const kpi = await this.prisma.departmentKpi.findFirst({ where: { id: kpiId, dept_id: departmentId } });
    if (!kpi) {
      console.log('KPI not found for:', { kpiId, departmentId });
      throw new NotFoundException('KPI not found or not accessible');
    }

    const existingFormResponses = (kpi.form_responses as KpiFormResponsesWithWorkflow) || {};
    const existingWorkflow = existingFormResponses.coordinator_workflow;
    console.log('Existing workflow:', existingWorkflow);

    if (!existingWorkflow || existingWorkflow.coordinator_status !== 'SUBMITTED') {
      console.log('Invalid workflow state:', {
        hasWorkflow: !!existingWorkflow,
        status: existingWorkflow?.coordinator_status,
      });
      throw new BadRequestException('No coordinator submission to review');
    }
    let newCoordinatorStatus: CoordinatorWorkflow['coordinator_status'];
    const reviewData = { reviewed_at: new Date().toISOString(), action, comments };
    if (action === 'APPROVE') {
      newCoordinatorStatus = 'APPROVED_BY_HOD';
      type Entry = Record<string, unknown>;
      interface MutableFormResponses {
        entries?: Entry[];
        promoted_at?: string;
        [key: string]: unknown;
      }
      const mutable = existingFormResponses as unknown as MutableFormResponses;
      mutable.entries = (existingWorkflow.coordinator_submission?.data as Entry[]) || [];
      mutable.promoted_at = new Date().toISOString();
    } else if (action === 'REJECT') {
      newCoordinatorStatus = 'REJECTED_BY_HOD';
    } else if (action === 'REQUEST_REVISION') {
      newCoordinatorStatus = 'REVISION_REQUESTED';
      const revisionHistory = existingWorkflow.revision_history || [];
      revisionHistory.push({
        revision_number: revisionHistory.length + 1,
        requested_at: new Date().toISOString(),
        reason: comments,
      });
      existingWorkflow.revision_history = revisionHistory;
    } else {
      throw new BadRequestException('Invalid action provided');
    }
    const updatedWorkflow: CoordinatorWorkflow = {
      ...existingWorkflow,
      coordinator_status: newCoordinatorStatus,
      hod_review: reviewData,
    };
    const updatedFormResponses: KpiFormResponsesWithWorkflow = {
      ...existingFormResponses,
      coordinator_workflow: updatedWorkflow,
    };
    const updateData: { form_responses: Prisma.InputJsonValue; kpi_status?: KpiStatus; completed_date?: Date } = {
      form_responses: JSON.parse(JSON.stringify(updatedFormResponses)),
    };
    if (action === 'APPROVE') {
      updateData.kpi_status = KpiStatus.PENDING;
      updateData.completed_date = new Date();
    }
    await this.prisma.departmentKpi.update({ where: { id: kpiId }, data: updateData });
    return { message: `Coordinator submission ${action.toLowerCase()}d successfully` };
  }

  /**
   * Get all coordinators in HOD's department for assignment
   */
  async getDepartmentCoordinators(userId: string, userRole: UserRole) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertHodRole(userRole);
    const departmentId = await this.getHodDepartmentId(userId);
    return this.prisma.user.findMany({
      where: { dept_id: departmentId, user_role: UserRole.KPI_COORDINATOR },
      select: { id: true, user_name: true, user_email: true, user_role: true },
      orderBy: { user_name: 'asc' },
    });
  }
}
