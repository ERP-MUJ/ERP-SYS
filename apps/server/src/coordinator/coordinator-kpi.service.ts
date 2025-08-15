import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole, Prisma } from '@repo/db/prisma/client';

export interface CoordinatorWorkflow {
  assigned_to?: string;
  assigned_at?: string;
  coordinator_status: 'PENDING' | 'SUBMITTED' | 'APPROVED_BY_HOD' | 'REJECTED_BY_HOD' | 'REVISION_REQUESTED';
  coordinator_submission?: {
    submitted_at: string;
    data: Record<string, unknown>[];
    comments?: string;
  };
  hod_review?: {
    reviewed_at: string;
    action: 'APPROVE' | 'REJECT' | 'REQUEST_REVISION';
    comments: string;
  };
  revision_history?: Array<{
    revision_number: number;
    requested_at: string;
    completed_at?: string;
    reason: string;
  }>;
}

export interface KpiFormResponsesWithWorkflow {
  entries?: Record<string, unknown>[];
  coordinator_workflow?: CoordinatorWorkflow;
  [key: string]: unknown;
}

@Injectable()
export class CoordinatorKpiService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ensures only KPI coordinators can perform coordinator operations
   */
  private assertCoordinatorRole(userRole: UserRole) {
    if (userRole !== UserRole.KPI_COORDINATOR) {
      throw new ForbiddenException('Only KPI coordinators can perform this action');
    }
  }

  /**
   * Gets department ID for the coordinator user
   */
  private async getCoordinatorDepartmentId(userId: string): Promise<string> {
    const coordinator = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { department: true },
    });

    if (!coordinator || !coordinator.department) {
      throw new NotFoundException('Coordinator department not found');
    }

    return coordinator.department.id;
  }

  /**
   * Get all KPIs assigned to this coordinator
   */
  async getAssignedKpis(userId: string, userRole: UserRole) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertCoordinatorRole(userRole);
    const departmentId = await this.getCoordinatorDepartmentId(userId);

    // Coordinators now see ALL KPIs in their department (no per-KPI assignment required)
    const kpis = await this.prisma.departmentKpi.findMany({
      where: { dept_id: departmentId },
      include: {
        department_pillar: { select: { pillar_name: true } },
        assigned_users: {
          select: { id: true, user_name: true, user_email: true, user_role: true },
        },
      },
      orderBy: { kpi_number: 'asc' },
    });

    return kpis.map((kpi) => {
      const formResponses = kpi.form_responses as KpiFormResponsesWithWorkflow | null;
      const coordinatorWorkflow = formResponses?.coordinator_workflow;
      return {
        ...kpi,
        pillar_name: kpi.department_pillar.pillar_name,
        coordinator_status: coordinatorWorkflow?.coordinator_status || 'PENDING',
        coordinator_submission: coordinatorWorkflow?.coordinator_submission,
        hod_review: coordinatorWorkflow?.hod_review,
      };
    });
  }

  /**
   * Get details of a specific KPI for coordinator to fill
   */
  async getKpiDetails(userId: string, userRole: UserRole, kpiId: string) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertCoordinatorRole(userRole);

    const departmentId = await this.getCoordinatorDepartmentId(userId);

    const kpi = await this.prisma.departmentKpi.findFirst({
      where: { id: kpiId, dept_id: departmentId },
      include: {
        department_pillar: { select: { pillar_name: true } },
        assigned_users: {
          select: { id: true, user_name: true, user_email: true, user_role: true },
        },
      },
    });

    if (!kpi) {
      throw new NotFoundException('KPI not found or not accessible');
    }

    const formResponses = kpi.form_responses as KpiFormResponsesWithWorkflow | null;
    const coordinatorWorkflow = formResponses?.coordinator_workflow;

    return {
      ...kpi,
      pillar_name: kpi.department_pillar.pillar_name,
      elements: kpi.kpi_data && typeof kpi.kpi_data === 'object' && kpi.kpi_data['elements'] 
        ? kpi.kpi_data['elements'] 
        : [],
      coordinator_workflow: coordinatorWorkflow,
      existing_data: coordinatorWorkflow?.coordinator_submission?.data || formResponses?.entries || [],
    };
  }

  /**
   * Submit KPI form data as coordinator
   */
  async submitKpiForm(
    userId: string,
    userRole: UserRole,
    kpiId: string,
    formData: { entries: Record<string, unknown>[] },
    comments?: string,
  ) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertCoordinatorRole(userRole);

    const departmentId = await this.getCoordinatorDepartmentId(userId);

    const kpi = await this.prisma.departmentKpi.findFirst({
      where: { id: kpiId, dept_id: departmentId },
    });

    if (!kpi) {
      throw new NotFoundException('KPI not found or not accessible');
    }

    const existingFormResponses = (kpi.form_responses as KpiFormResponsesWithWorkflow) || {};
    const existingWorkflow = existingFormResponses.coordinator_workflow || {
      assigned_to: userId, // Set at first interaction for audit purposes
      assigned_at: new Date().toISOString(),
      coordinator_status: 'PENDING' as const,
    };

    // Check if coordinator can submit (not already approved or pending HOD review)
    if (['SUBMITTED', 'APPROVED_BY_HOD'].includes(existingWorkflow.coordinator_status)) {
      throw new BadRequestException('KPI is already submitted or approved. Cannot resubmit.');
    }

    const updatedWorkflow: CoordinatorWorkflow = {
      ...existingWorkflow,
      coordinator_status: 'SUBMITTED',
      coordinator_submission: {
        submitted_at: new Date().toISOString(),
        data: formData.entries,
        comments,
      },
    };

    const updatedFormResponses: KpiFormResponsesWithWorkflow = {
      ...existingFormResponses,
      coordinator_workflow: updatedWorkflow,
    };

    await this.prisma.departmentKpi.update({
      where: { id: kpiId },
      data: {
        form_responses: JSON.parse(JSON.stringify(updatedFormResponses)),
      },
    });

    return { message: 'KPI form submitted successfully for HOD review' };
  }

  /**
   * Save a draft (partial) without submitting to HOD.
   * Draft data is stored under form_responses.coordinator_workflow.coordinator_submission with status PENDING.
   * This allows coordinator to come back later; HOD will not treat as SUBMITTED.
   */
  async saveDraft(
    userId: string,
    userRole: UserRole,
    kpiId: string,
    formData: { entries: Record<string, unknown>[] },
    comments?: string,
  ) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertCoordinatorRole(userRole);
    const departmentId = await this.getCoordinatorDepartmentId(userId);

    const kpi = await this.prisma.departmentKpi.findFirst({ where: { id: kpiId, dept_id: departmentId } });
    if (!kpi) throw new NotFoundException('KPI not found or not accessible');

    const existingFormResponses = (kpi.form_responses as KpiFormResponsesWithWorkflow) || {};
    const existingWorkflow = existingFormResponses.coordinator_workflow || {
      assigned_to: userId,
      assigned_at: new Date().toISOString(),
      coordinator_status: 'PENDING' as const,
    };

    if (['SUBMITTED', 'APPROVED_BY_HOD'].includes(existingWorkflow.coordinator_status)) {
      throw new BadRequestException('Cannot modify draft after submission');
    }

    const updatedWorkflow: CoordinatorWorkflow = {
      ...existingWorkflow,
      // keep status PENDING to indicate not yet sent to HOD
      coordinator_status: 'PENDING',
      coordinator_submission: {
        submitted_at: existingWorkflow.coordinator_submission?.submitted_at || new Date().toISOString(),
        data: formData.entries,
        comments,
      },
    };

    const updatedFormResponses: KpiFormResponsesWithWorkflow = {
      ...existingFormResponses,
      coordinator_workflow: updatedWorkflow,
    };

    await this.prisma.departmentKpi.update({
      where: { id: kpiId },
      data: { form_responses: JSON.parse(JSON.stringify(updatedFormResponses)) },
    });

    return { message: 'Draft saved' };
  }

  /**
   * Resubmit KPI after revision request
   */
  async resubmitAfterRevision(
    userId: string,
    userRole: UserRole,
    kpiId: string,
    formData: { entries: Record<string, unknown>[] },
    comments?: string,
  ) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertCoordinatorRole(userRole);

    const departmentId = await this.getCoordinatorDepartmentId(userId);

    const kpi = await this.prisma.departmentKpi.findFirst({
      where: { id: kpiId, dept_id: departmentId },
    });

    if (!kpi) {
      throw new NotFoundException('KPI not found or not accessible');
    }

    const existingFormResponses = (kpi.form_responses as KpiFormResponsesWithWorkflow) || {};
    const existingWorkflow = existingFormResponses.coordinator_workflow;

    if (!existingWorkflow || existingWorkflow.coordinator_status !== 'REVISION_REQUESTED') {
      throw new BadRequestException('KPI is not in revision state');
    }

    // Update revision history
    const revisionHistory = existingWorkflow.revision_history || [];
    if (revisionHistory.length > 0) {
      const lastRevision = revisionHistory[revisionHistory.length - 1];
      if (!lastRevision.completed_at) {
        lastRevision.completed_at = new Date().toISOString();
      }
    }

    const updatedWorkflow: CoordinatorWorkflow = {
      ...existingWorkflow,
      coordinator_status: 'SUBMITTED',
      coordinator_submission: {
        submitted_at: new Date().toISOString(),
        data: formData.entries,
        comments,
      },
      revision_history: revisionHistory,
    };

    const updatedFormResponses: KpiFormResponsesWithWorkflow = {
      ...existingFormResponses,
      coordinator_workflow: updatedWorkflow,
    };

    await this.prisma.departmentKpi.update({
      where: { id: kpiId },
      data: {
        form_responses: JSON.parse(JSON.stringify(updatedFormResponses)),
      },
    });

    return { message: 'KPI form resubmitted successfully after revision' };
  }
}
