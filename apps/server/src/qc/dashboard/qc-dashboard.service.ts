import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from '@repo/db/prisma/client';
import { QacDashboardData } from '@workspace/types/types/qc-dashboard.type';

@Injectable()
export class QcDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Asserts that the user has QAC role
   */
  private assertQacRole(userRole: UserRole) {
    if (userRole !== UserRole.QAC) {
      throw new ForbiddenException('Only QAC members can access this resource');
    }
  }

  /**
   * Get complete dashboard data including submission stats and department status
   */
  async getScoreSheetData(userId: string, userRole: UserRole, deptId: string, pillarId?: string) {
    if (!userId) throw new ForbiddenException('User ID is required');
    this.assertQacRole(userRole);

    const kpis = await this.prisma.departmentKpi.findMany({
      where: {
        dept_id: deptId,
        ...(pillarId && { dept_pillar_id: pillarId }),
      },
      select: {
        kpi_number: true,
        kpi_metric_name: true,
        kpi_value: true,
        data_provided_by: true,
        kpi_target: true,
        percentage_target_achieved: true,
      },
      orderBy: {
        kpi_number: 'asc',
      },
    });

    return kpis.map((kpi) => ({
      ...kpi,
      percentage_target_achieved: kpi.percentage_target_achieved
        ? Number(kpi.percentage_target_achieved.toFixed(2))
        : null,
    }));
  }

  async getDepartmentPillars(userId: string, userRole: UserRole, deptId: string) {
    if (!userId) throw new ForbiddenException('User ID is required');
    this.assertQacRole(userRole);

    return await this.prisma.departmentPillar.findMany({
      where: {
        dept_id: deptId,
        status: 'active',
      },
      select: {
        id: true,
        pillar_name: true,
      },
      orderBy: {
        pillar_name: 'asc',
      },
    });
  }

  async getDashboardData(userId: string, userRole: UserRole): Promise<QacDashboardData> {
    if (!userId) throw new ForbiddenException('User ID is required');
    this.assertQacRole(userRole);

    // Get all departments with their pillars and KPIs
    const departments = await this.prisma.department.findMany({
      include: {
        department_pillars: {
          where: { status: 'active' },
          include: {
            department_kpis: true,
          },
        },
      },
    });

    // Calculate submission statistics
    const totalSubmissions = await this.prisma.departmentKpi.count({
      where: {
        kpi_status: {
          in: ['APPROVED', 'PENDING', 'REVISION', 'REJECTED'],
        },
      },
    });

    const pendingReview = await this.prisma.departmentKpi.count({
      where: {
        kpi_status: 'PENDING',
      },
    });

    // Calculate department configuration status
    const departmentsWithPillars = departments.filter((dept) => dept.department_pillars.length > 0).length;

    const departmentsWithKpis = departments.filter((dept) =>
      dept.department_pillars.some((pillar) => pillar.department_kpis.length > 0),
    ).length;
    void departmentsWithKpis; // intentionally not returned yet; reserved for future metrics

    // Get latest submission date and total submissions per department
    const departmentStatus = await Promise.all(
      departments.map(async (dept) => {
        const latestSubmission = await this.prisma.departmentKpi.findFirst({
          where: {
            dept_id: dept.id,
            kpi_status: {
              in: ['APPROVED', 'PENDING', 'REVISION', 'REJECTED'],
            },
          },
          orderBy: {
            completed_date: 'desc',
          },
          select: {
            completed_date: true,
          },
        });

        const totalDeptSubmissions = await this.prisma.departmentKpi.count({
          where: {
            dept_id: dept.id,
            kpi_status: {
              in: ['APPROVED', 'PENDING', 'REVISION', 'REJECTED'],
            },
          },
        });

        return {
          id: dept.id,
          name: dept.dept_name,
          hod: dept.hod_name,
          pillarsSet: dept.department_pillars.length > 0,
          kpisSet: dept.department_pillars.some((pillar) => pillar.department_kpis.length > 0),
          totalSubmissions: totalDeptSubmissions,
          lastSubmission: latestSubmission?.completed_date?.toISOString() || null,
        };
      }),
    );

    return {
      submissionStats: {
        totalSubmissions,
        pendingReview,
        departmentsConfigured: departmentsWithPillars,
        departmentsPending: departments.length - departmentsWithPillars,
      },
      departmentStatus,
    };
  }
}
