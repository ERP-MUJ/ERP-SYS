import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole, KpiStatus as PrismaKpiStatus, Prisma } from '@repo/db/prisma/client';
import { KpiStatus } from '@workspace/types/enums';
import { ReviewKpiEntryDto, BulkReviewKpiEntriesDto } from './dto/review-kpi-entry.dto';
import type { KpiEntryWithReview, KpiFormResponses } from '@workspace/types/types';

@Injectable()
export class QcReviewService {
  constructor(private readonly prisma: PrismaService) {}

  private convertPrismaToWorkspaceStatus(status: PrismaKpiStatus): KpiStatus {
    return status as KpiStatus;
  }

  private convertWorkspaceToPrismaStatus(status: KpiStatus): PrismaKpiStatus {
    return status as PrismaKpiStatus;
  }

  private assertQacRole(userRole: UserRole) {
    if (userRole !== UserRole.QAC) {
      throw new ForbiddenException('Only QAC members can perform this action');
    }
  }

  async getKpi(userId: string, userRole: UserRole, kpiId: string) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertQacRole(userRole);
    const kpi = await this.prisma.departmentKpi.findUnique({
      where: { id: kpiId },
      include: {
        department_pillar: { select: { pillar_name: true } },
        department: { select: { dept_name: true } },
        assigned_users: { select: { id: true, user_name: true, user_email: true, user_role: true } },
      },
    });
    if (!kpi) throw new NotFoundException('KPI not found');

    // Check if this KPI has any form responses (either draft or submitted)
    const formResponses = (kpi.form_responses || {}) as Record<string, unknown>;
    const entries = (formResponses['entries'] as unknown[]) || [];
    const metrics = (kpi.kpi_calculated_metrics as Record<string, unknown>) || {};
    const isSubmittedToQc = metrics.is_submitted_to_qc === true;

    // If KPI has no form responses at all, QC can't review it yet
    if (entries.length === 0) {
      return {
        ...kpi,
        locked: true,
        lock_reason: 'No data submitted yet by HOD',
        preview_entries: [],
      };
    }

    // If KPI has form responses but not officially submitted to QC, show as preview
    if (!isSubmittedToQc) {
      return {
        ...kpi,
        locked: true,
        lock_reason: 'HOD is still working on this KPI (draft mode)',
        preview_entries: entries,
      };
    }

    // KPI is officially submitted to QC and can be reviewed
    return { ...kpi, locked: false };
  }

  async updateStatus(
    userId: string,
    userRole: UserRole,
    kpiId: string,
    action: 'APPROVE' | 'REVISION' | 'REJECT',
    remark: string,
  ) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertQacRole(userRole);
    if (!remark?.trim()) throw new BadRequestException('Remark is required');

    // Get user information for review history
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { user_name: true, user_email: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const kpi = await this.prisma.departmentKpi.findUnique({ where: { id: kpiId } });
    if (!kpi) throw new NotFoundException('KPI not found');

    // Check if KPI can be reviewed - only PENDING status is reviewable
    if (kpi.kpi_status !== KpiStatus.PENDING) {
      throw new BadRequestException(`KPI status is ${kpi.kpi_status}. Only KPIs with PENDING status can be reviewed`);
    }

    // Check if KPI has form responses
    const formResponses = (kpi.form_responses || {}) as Record<string, unknown>;
    const entries = (formResponses['entries'] as unknown[]) || [];
    if (entries.length === 0) {
      throw new BadRequestException('KPI has no form responses to review');
    }

    const finalized = new Set<KpiStatus>([KpiStatus.APPROVED, KpiStatus.REJECTED]);
    if (finalized.has(this.convertPrismaToWorkspaceStatus(kpi.kpi_status))) {
      throw new BadRequestException('Finalized KPI cannot be updated');
    }

    let target: KpiStatus;
    switch (action) {
      case 'APPROVE':
        target = KpiStatus.APPROVED;
        break;
      case 'REVISION':
        target = KpiStatus.REVISION;
        break;
      case 'REJECT':
        target = KpiStatus.REJECTED;
        break;
      default:
        throw new BadRequestException('Invalid action');
    }

    type ReviewEntry = { action: string; by: string; by_id?: string; at: string; remark: string };
    const existingMetrics = (kpi.kpi_calculated_metrics ?? {}) as Record<string, unknown> & {
      review_history?: ReviewEntry[];
    };
    const existingHistory = Array.isArray(existingMetrics.review_history) ? existingMetrics.review_history : [];
    const updatedMetrics = {
      ...existingMetrics,
      review_history: [
        ...existingHistory,
        {
          action,
          by: user.user_name ?? user.user_email ?? userId,
          by_id: userId,
          at: new Date().toISOString(),
          remark,
        },
      ],
    };

    console.log('QC Review Service - About to update KPI:', {
      kpiId,
      targetStatus: target,
      remark,
      updatedMetrics,
    });

    interface DepartmentKpiReviewData {
      kpi_status: PrismaKpiStatus;
      comments: string;
      kpi_calculated_metrics: object;
      percentage_target_achieved?: number;
      performance?: number;
    }

    // Calculate percentage_target_achieved when approving
    const updateData: DepartmentKpiReviewData = {
      kpi_status: this.convertWorkspaceToPrismaStatus(target),
      comments: remark,
      kpi_calculated_metrics: updatedMetrics as object,
    };

    if (action === 'APPROVE' && kpi.kpi_target) {
      if (kpi.kpi_target <= 0) {
        throw new BadRequestException('KPI target must be greater than 0');
      }

      const entriesCount = entries.length;
      const percentageAchieved = Number(((entriesCount / kpi.kpi_target) * 100).toFixed(2));
      updateData.percentage_target_achieved = percentageAchieved;

      // Calculate performance as percentage_target_achieved * kpi_value
      if (kpi.kpi_value !== undefined && kpi.kpi_value !== null) {
        updateData.performance = Number((percentageAchieved * kpi.kpi_value).toFixed(2));
      }

      console.log('Calculated percentage achieved and performance:', {
        entriesCount,
        kpiTarget: kpi.kpi_target,
        percentageAchieved,
        kpiValue: kpi.kpi_value,
        calculatedPerformance: updateData.performance,
      });
    }

    // First update the KPI
    const updated = await this.prisma.departmentKpi.update({
      where: { id: kpiId },
      data: updateData,
      include: {
        department_pillar: { select: { pillar_name: true, id: true } },
        department: { select: { dept_name: true } },
        assigned_users: { select: { id: true, user_name: true, user_email: true, user_role: true } },
      },
    });

    // If we've updated the performance, recalculate the pillar's percentage_target_achieved
    if (updateData.performance !== undefined && updated.department_pillar) {
      // Get all KPIs for this pillar and the pillar details
      const [pillarKpis, pillarDetails] = await Promise.all([
        this.prisma.departmentKpi.findMany({
          where: {
            dept_pillar_id: updated.department_pillar.id,
            kpi_status: KpiStatus.APPROVED, // Only consider approved KPIs
          },
          select: { performance: true },
        }),
        this.prisma.departmentPillar.findUnique({
          where: { id: updated.department_pillar.id },
          select: { pillar_weight: true },
        }),
      ]);

      // Calculate total performance for the pillar
      const totalPerformance = pillarKpis.reduce((sum, kpi) => {
        return sum + (kpi.performance || 0);
      }, 0);

      // Calculate pillar's percentage_target_achieved and performance
      const percentageTargetAchieved = Number(totalPerformance.toFixed(2));
      const pillarPerformance = pillarDetails?.pillar_weight
        ? Number((percentageTargetAchieved * pillarDetails.pillar_weight).toFixed(2))
        : null;

      // Update both percentage_target_achieved and performance
      await this.prisma.departmentPillar.update({
        where: { id: updated.department_pillar.id },
        data: {
          percentage_target_achieved: percentageTargetAchieved,
          performance: pillarPerformance,
        },
      });

      console.log('Updated pillar metrics:', {
        pillarId: updated.department_pillar.id,
        totalKpiPerformance: totalPerformance,
        percentageTargetAchieved,
        pillarWeight: pillarDetails?.pillar_weight,
        calculatedPillarPerformance: pillarPerformance,
      });
    }

    return { message: 'KPI status updated', data: updated };
  }

  /**
   * Get individual KPI entries with their review status
   */
  async getKpiEntriesWithReview(userId: string, userRole: UserRole, kpiId: string) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertQacRole(userRole);

    const kpi = await this.prisma.departmentKpi.findUnique({
      where: { id: kpiId },
      include: {
        department_pillar: { select: { pillar_name: true } },
        department: { select: { dept_name: true } },
        assigned_users: { select: { id: true, user_name: true, user_email: true, user_role: true } },
      },
    });

    if (!kpi) throw new NotFoundException('KPI not found');

    const formResponses = (kpi.form_responses || {}) as KpiFormResponses;
    const entries = formResponses.entries || [];
    const entriesWithReview = formResponses.entries_with_review || [];

    // If no entries_with_review exist, create them from regular entries
    if (entriesWithReview.length === 0 && entries.length > 0) {
      const newEntriesWithReview: KpiEntryWithReview[] = entries.map((entry, index) => ({
        entry_id: `entry_${index + 1}`,
        data: entry,
        status: KpiStatus.PENDING,
      }));

      // Update the KPI with entries_with_review structure
      await this.prisma.departmentKpi.update({
        where: { id: kpiId },
        data: {
          form_responses: {
            ...formResponses,
            entries_with_review: newEntriesWithReview,
          } as Prisma.InputJsonValue,
        },
      });

      return {
        ...kpi,
        entries_with_review: newEntriesWithReview,
      };
    }

    return {
      ...kpi,
      entries_with_review: entriesWithReview,
    };
  }

  /**
   * Review individual KPI entry
   */
  async reviewKpiEntry(userId: string, userRole: UserRole, kpiId: string, reviewDto: ReviewKpiEntryDto) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertQacRole(userRole);

    const kpi = await this.prisma.departmentKpi.findUnique({
      where: { id: kpiId },
    });

    if (!kpi) throw new NotFoundException('KPI not found');

    const formResponses = (kpi.form_responses || {}) as KpiFormResponses;
    const entriesWithReview = formResponses.entries_with_review || [];

    // Find the entry to review
    const entryIndex = entriesWithReview.findIndex((entry) => entry.entry_id === reviewDto.entry_id);

    if (entryIndex === -1) {
      throw new NotFoundException('KPI entry not found');
    }

    // Update the entry with review information
    entriesWithReview[entryIndex] = {
      ...entriesWithReview[entryIndex],
      status: reviewDto.status,
      review: reviewDto.review,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
    };

    // Update the KPI with reviewed entries
    const updatedKpi = await this.prisma.departmentKpi.update({
      where: { id: kpiId },
      data: {
        form_responses: {
          ...formResponses,
          entries_with_review: entriesWithReview,
        } as Prisma.InputJsonValue,
      },
    });

    return {
      message: 'KPI entry reviewed successfully',
      entry: entriesWithReview[entryIndex],
    };
  }

  /**
   * Bulk review multiple KPI entries
   */
  async bulkReviewKpiEntries(userId: string, userRole: UserRole, bulkReviewDto: BulkReviewKpiEntriesDto) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertQacRole(userRole);

    const kpi = await this.prisma.departmentKpi.findUnique({
      where: { id: bulkReviewDto.kpi_id },
    });

    if (!kpi) throw new NotFoundException('KPI not found');

    const formResponses = (kpi.form_responses || {}) as KpiFormResponses;
    const entriesWithReview = [...(formResponses.entries_with_review || [])];

    // Update each entry in the bulk review
    for (const reviewDto of bulkReviewDto.entries) {
      const entryIndex = entriesWithReview.findIndex((entry) => entry.entry_id === reviewDto.entry_id);

      if (entryIndex !== -1) {
        entriesWithReview[entryIndex] = {
          ...entriesWithReview[entryIndex],
          status: reviewDto.status,
          review: reviewDto.review,
          reviewed_by: userId,
          reviewed_at: new Date().toISOString(),
        };
      }
    }

    // Update the KPI with all reviewed entries
    const updatedKpi = await this.prisma.departmentKpi.update({
      where: { id: bulkReviewDto.kpi_id },
      data: {
        form_responses: {
          ...formResponses,
          entries_with_review: entriesWithReview,
        } as Prisma.InputJsonValue,
      },
    });

    return {
      message: `${bulkReviewDto.entries.length} KPI entries reviewed successfully`,
      entries_with_review: entriesWithReview,
    };
  }
}
