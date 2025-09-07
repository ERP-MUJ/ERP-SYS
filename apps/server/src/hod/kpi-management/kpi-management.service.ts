import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole, KpiStatus } from '@repo/db/prisma/client';
@Injectable()
export class HodKpiService {
  constructor(private readonly prisma: PrismaService) {}
  private assertHodRole(role: UserRole) {
    if (role !== UserRole.HOD) throw new ForbiddenException('Only HOD users can perform this action');
  }
  private assertDeptAccess(role: UserRole) {
    if (!(role === UserRole.HOD || role === UserRole.KPI_COORDINATOR || role === UserRole.FACULTY)) {
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
    // Check if KPI is locked (APPROVED, REJECTED, OVERDUE)
    const lockedStatuses: KpiStatus[] = [KpiStatus.APPROVED, KpiStatus.REJECTED, KpiStatus.OVERDUE];
    if (lockedStatuses.includes(kpi.kpi_status)) {
      throw new ForbiddenException('Cannot modify KPI in current status');
    }
    // Save as draft - keep current status, update form responses
    const newStatus = kpi.kpi_status;
    let preserveComments: string | null = null;
    let preserveMetrics: object | null = null;
    if (kpi.kpi_status === KpiStatus.REVISION) {
      // Preserve QC feedback when saving draft in revision status
      preserveComments = kpi.comments;
      preserveMetrics = kpi.kpi_calculated_metrics as object;
    }
    // Get existing metrics and preserve important data while updating draft status
    const existingMetrics = (kpi.kpi_calculated_metrics as Record<string, unknown>) || {};
    const updatedMetrics = {
      ...existingMetrics,
      ...preserveMetrics,
      last_saved_at: new Date().toISOString(),
      is_submitted_to_qc: false, // Mark as draft, not submitted
    };
    // Calculate HOD percentage target achieved
    const entriesCount = formResponses.entries?.length || 0;
    const kpiTarget = Number(kpi.kpi_target) || 0;
    const hodPercentageAchieved = kpiTarget > 0 ? Number(((entriesCount / kpiTarget) * 100).toFixed(2)) : 0;
    // Calculate HOD performance based on kpi_value and hod_percentage_target_achieved
    const hodPerformance = Number(((Number(kpi.kpi_value) || 0) * hodPercentageAchieved).toFixed(2));
    // Update the KPI first

    // Get existing form responses to preserve coordinator workflow
    const existingFormResponses = (kpi.form_responses as Record<string, unknown>) || {};

    // Prepare updated form responses preserving coordinator workflow
    const updatedFormResponses = {
      ...formResponses,
      // Preserve coordinator workflow if it exists
      coordinator_workflow: existingFormResponses.coordinator_workflow || null,
    };
      
    await this.prisma.departmentKpi.update({
      where: { id: kpiId },
      data: {
        form_responses: JSON.parse(JSON.stringify(updatedFormResponses)),
        kpi_status: newStatus,
        completed_date: new Date(),
        hod_performance: hodPerformance,
        kpi_calculated_metrics: JSON.parse(JSON.stringify(updatedMetrics)),
        hod_percentage_target_achieved: hodPercentageAchieved,
        // Preserve QC review data if in revision status
        ...(preserveComments !== null && { comments: preserveComments }),
      },
    });

    // Calculate sum of hod_performance for all KPIs in this pillar
    const allPillarKpis = await this.prisma.departmentKpi.findMany({
      where: { dept_pillar_id: kpi.dept_pillar_id },
      select: { hod_performance: true },
    });

    const totalHodPerformance = allPillarKpis.reduce((sum, kpi) => sum + (kpi.hod_performance || 0), 0);

    // Get current pillar data to calculate hod_performance
    const pillar = await this.prisma.departmentPillar.findUnique({
      where: { id: kpi.dept_pillar_id },
      select: { pillar_weight: true },
    });

    // Update the pillar's hod_percentage_target_achieved and hod_performance
    await this.prisma.departmentPillar.update({
      where: { id: kpi.dept_pillar_id },
      data: {
        hod_percentage_target_achieved: totalHodPerformance,
        hod_performance: Number((totalHodPerformance * (pillar?.pillar_weight || 0)).toFixed(2)),
      },
    });

    return { message: 'KPI draft saved successfully' };
  }
  async submitKpiToQc(
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
    // Check if KPI is locked (APPROVED, REJECTED, OVERDUE)
    const lockedStatuses: KpiStatus[] = [KpiStatus.APPROVED, KpiStatus.REJECTED, KpiStatus.OVERDUE];
    if (lockedStatuses.includes(kpi.kpi_status)) {
      throw new ForbiddenException('Cannot submit KPI in current status');
    }
    // Validate that there is data to submit
    if (!formResponses.entries || formResponses.entries.length === 0) {
      throw new ForbiddenException('Cannot submit empty KPI. Please add data before submission.');
    }
    // Get current user info for submission tracking
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { user_name: true, user_email: true },
    });
    // Prepare submission metadata
    const submissionMetadata = {
      submitted_by: user?.user_name || 'Unknown',
      submitted_by_email: user?.user_email || '',
      submitted_at: new Date().toISOString(),
      previous_status: kpi.kpi_status,
    };
    // Prepare update data
    const existingMetrics = (kpi.kpi_calculated_metrics as Record<string, unknown>) || {};
    const existingHistory = (existingMetrics.submission_history as unknown[]) || [];
    // Calculate HOD percentage target achieved
    const entriesCount = formResponses.entries?.length || 0;
    const kpiTarget = kpi.kpi_target || 0;
    const hodPercentageAchieved = kpiTarget > 0 ? (entriesCount / kpiTarget) * 100 : 0;

      // Calculate HOD performance based on kpi_value and hod_percentage_target_achieved
    const hodPerformance = Number(((Number(kpi.kpi_value) || 0) * hodPercentageAchieved).toFixed(2));

    // Get existing form responses to preserve coordinator workflow
    const existingFormResponses = (kpi.form_responses as Record<string, unknown>) || {};

    // Prepare updated form responses preserving coordinator workflow
    const updatedFormResponses = {
      ...formResponses,
      // Preserve coordinator workflow if it exists
      coordinator_workflow: existingFormResponses.coordinator_workflow || null,
    };
      
    const updateData = {
      form_responses: JSON.parse(JSON.stringify(updatedFormResponses)),
      kpi_status: KpiStatus.PENDING, // Stays PENDING but marked as submitted for QC review
      completed_date: new Date(),
      hod_performance: hodPerformance,
      hod_percentage_target_achieved: hodPercentageAchieved,
      kpi_calculated_metrics: JSON.parse(
        JSON.stringify({
          ...existingMetrics,
          is_submitted_to_qc: true, // Mark as submitted to QC
          submitted_at: new Date().toISOString(),
          submitted_by: user?.user_name || 'Unknown',
          submission_history: [...existingHistory, submissionMetadata],
        }),
      ),
    };
    // Clear QC feedback only when resubmitting from REVISION
    if (kpi.kpi_status === KpiStatus.REVISION) {
      Object.assign(updateData, { comments: null });
    }
    // Update the KPI first
    await this.prisma.departmentKpi.update({
      where: { id: kpiId },
      data: updateData,
    });

    // Calculate sum of hod_performance for all KPIs in this pillar
    const allPillarKpis = await this.prisma.departmentKpi.findMany({
      where: { dept_pillar_id: kpi.dept_pillar_id },
      select: { hod_performance: true },
    });

    const totalHodPerformance = allPillarKpis.reduce((sum, kpi) => sum + (kpi.hod_performance || 0), 0);

    // Get current pillar data to calculate hod_performance
    const pillar = await this.prisma.departmentPillar.findUnique({
      where: { id: kpi.dept_pillar_id },
      select: { pillar_weight: true },
    });

    // Update the pillar's hod_percentage_target_achieved and hod_performance
    await this.prisma.departmentPillar.update({
      where: { id: kpi.dept_pillar_id },
      data: {
        hod_percentage_target_achieved: totalHodPerformance,
        hod_performance: Number((totalHodPerformance * (pillar?.pillar_weight || 0)).toFixed(2)),
      },
    });

    return { message: 'KPI submitted to QC successfully' };
  }
}
