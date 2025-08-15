import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole, KpiStatus } from '@repo/db/prisma/client';

@Injectable()
export class QcReviewService {
  constructor(private readonly prisma: PrismaService) {}

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
    return kpi;
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

    const kpi = await this.prisma.departmentKpi.findUnique({ where: { id: kpiId } });
    if (!kpi) throw new NotFoundException('KPI not found');

    const finalized = new Set<KpiStatus>([KpiStatus.APPROVED, KpiStatus.REJECTED]);
    if (finalized.has(kpi.kpi_status)) {
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

    type ReviewEntry = { action: string; by: string; at: string; remark: string };
    const existingMetrics = (kpi.kpi_calculated_metrics ?? {}) as Record<string, unknown> & {
      review_history?: ReviewEntry[];
    };
    const existingHistory = Array.isArray(existingMetrics.review_history) ? existingMetrics.review_history : [];
    const updatedMetrics = {
      ...existingMetrics,
      review_history: [...existingHistory, { action, by: userId, at: new Date().toISOString(), remark }],
    };

    const updated = await this.prisma.departmentKpi.update({
      where: { id: kpiId },
      data: {
        kpi_status: target,
        comments: remark,
        kpi_calculated_metrics: updatedMetrics,
      },
      include: {
        department_pillar: { select: { pillar_name: true } },
        department: { select: { dept_name: true } },
        assigned_users: { select: { id: true, user_name: true, user_email: true, user_role: true } },
      },
    });

    return { message: 'KPI status updated', data: updated };
  }
}
