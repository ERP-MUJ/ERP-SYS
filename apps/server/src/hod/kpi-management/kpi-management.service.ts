import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from '@repo/db/prisma/client';
@Injectable()
export class HodKpiService {
  constructor(private readonly prisma: PrismaService) {}

  private assertHodRole(role: UserRole) {
    if (role !== UserRole.HOD) throw new ForbiddenException('Only HOD users can perform this action');
  }
  private assertDeptAccess(role: UserRole) {
    if (
      !(
        role === UserRole.HOD ||
        role === UserRole.KPI_COORDINATOR ||
        role === UserRole.FACULTY
      )
    ) {
      throw new ForbiddenException('Access denied');
    }
  }
  private async getDeptId(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { dept_id: true } });
    if (!user?.dept_id) throw new NotFoundException('Department not found');
    return user.dept_id;
  }

  async getDepartmentPillars(userId: string, role: UserRole) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertDeptAccess(role);
    const deptId = await this.getDeptId(userId);
    return this.prisma.departmentPillar.findMany({
      where: { dept_id: deptId, status: 'active' },
      include: {
        department_kpis: {
          include: { assigned_users: { select: { id: true, user_name: true, user_email: true, user_role: true } } },
          orderBy: { kpi_number: 'asc' },
        },
      },
      orderBy: { assigned_date: 'desc' },
    });
  }

  async getDepartmentPillarKPIs(userId: string, role: UserRole, pillarId: string) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertDeptAccess(role);
    const deptId = await this.getDeptId(userId);
    const pillar = await this.prisma.departmentPillar.findFirst({
      where: { id: pillarId, dept_id: deptId, status: 'active' },
    });
    if (!pillar) throw new NotFoundException('Department pillar not found or not accessible');
    return this.prisma.departmentKpi.findMany({
      where: { dept_pillar_id: pillarId },
      include: { assigned_users: { select: { id: true, user_name: true, user_email: true, user_role: true } } },
      orderBy: { kpi_number: 'asc' },
    });
  }

  async getKpiDetails(userId: string, role: UserRole, kpiId: string) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertDeptAccess(role);
    const deptId = await this.getDeptId(userId);
    const kpi = await this.prisma.departmentKpi.findFirst({
      where: { id: kpiId, dept_id: deptId },
      include: {
        department_pillar: { select: { pillar_name: true } },
        assigned_users: { select: { id: true, user_name: true, user_email: true, user_role: true } },
      },
    });
    if (!kpi) throw new NotFoundException('KPI not found or not accessible');
    type JsonObj = Record<string, unknown>;
    const formResponses = (kpi.form_responses || {}) as JsonObj;
    const workflow = (formResponses['coordinator_workflow'] || {}) as JsonObj & {
      coordinator_status?: string;
      coordinator_submission?: { data?: unknown[] };
    };
    const submission = (workflow['coordinator_submission'] || {}) as { data?: unknown[] };
    const status = workflow.coordinator_status;
    const baseEntries = Array.isArray(formResponses['entries']) ? formResponses['entries'] : [];
    const coordEntries = Array.isArray(submission.data) ? submission.data : [];
    const mergedEntries = status === 'SUBMITTED' || status === 'REVISION_REQUESTED' ? coordEntries : baseEntries;
    return {
      ...kpi,
      kpi_name: kpi.kpi_metric_name,
      elements:
        kpi.kpi_data && typeof kpi.kpi_data === 'object' && (kpi.kpi_data as JsonObj)['elements']
          ? (kpi.kpi_data as JsonObj)['elements']
          : [],
      existingData: mergedEntries,
      coordinator_workflow: workflow,
    };
  }

  async updateKpiResponses(
    userId: string,
    role: UserRole,
    kpiId: string,
    formResponses: { entries: Record<string, unknown>[] },
  ) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertHodRole(role);
    const deptId = await this.getDeptId(userId);
    const kpi = await this.prisma.departmentKpi.findFirst({ where: { id: kpiId, dept_id: deptId } });
    if (!kpi) throw new NotFoundException('KPI not found or not accessible');
    await this.prisma.departmentKpi.update({
      where: { id: kpiId },
      data: {
        form_responses: JSON.parse(JSON.stringify(formResponses)),
        kpi_status: 'PENDING',
        completed_date: new Date(),
      },
    });
    return { message: 'KPI responses updated successfully' };
  }
}
