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
        OR: [
          {
            kpi_status: 'APPROVED',
          },
          {
            kpi_status: 'PENDING',
            kpi_calculated_metrics: {
              path: ['is_submitted_to_qc'],
              equals: true,
            },
          },
        ],
      },
      select: {
        kpi_number: true,
        kpi_metric_name: true,
        kpi_value: true,
        data_provided_by: true,
        kpi_target: true,
        percentage_target_achieved: true,
        dept_pillar_id: true,
        kpi_status: true,
        form_responses: true,
        department_pillar: {
          select: {
            pillar_weight: true,
          },
        },
      },
      orderBy: {
        kpi_number: 'asc',
      },
    });

    return kpis.map((kpi) => {
      // Count entries from form_responses for approved KPIs
      let totalEntries = 0;
      if (kpi.kpi_status === 'APPROVED' && kpi.form_responses) {
        try {
          const responses =
            typeof kpi.form_responses === 'string' ? JSON.parse(kpi.form_responses) : kpi.form_responses;

          // Count objects inside the entries array
          if (responses && Array.isArray(responses.entries)) {
            totalEntries = responses.entries.length;
          }
        } catch (error) {
          console.error('Error parsing form_responses:', error);
          totalEntries = 0;
        }
      }

      return {
        kpi_number: kpi.kpi_number,
        kpi_metric_name: kpi.kpi_metric_name,
        kpi_value: kpi.kpi_value,
        data_provided_by: kpi.data_provided_by,
        kpi_target: kpi.kpi_target,
        percentage_target_achieved: kpi.percentage_target_achieved
          ? Number(kpi.percentage_target_achieved.toFixed(2))
          : null,
        dept_pillar_id: kpi.dept_pillar_id,
        pillar_weight: kpi.department_pillar?.pillar_weight,
        total_entries: totalEntries,
      };
    });
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
        pillar_weight: true,
      },
      orderBy: {
        pillar_name: 'asc',
      },
    });
  }

  async getSubmissionSummary(userId: string, userRole: UserRole) {
    if (!userId) throw new ForbiddenException('User ID is required');
    this.assertQacRole(userRole);

    // Get all departments with their KPI submissions and entry counts
    const departments = await this.prisma.department.findMany({
      select: {
        id: true,
        dept_name: true,
        department_pillars: {
          where: { status: 'active' },
          select: {
            department_kpis: {
              where: {
                OR: [
                  {
                    kpi_status: 'APPROVED',
                  },
                  {
                    kpi_status: 'PENDING',
                    kpi_calculated_metrics: {
                      path: ['is_submitted_to_qc'],
                      equals: true,
                    },
                  },
                ],
              },
              select: {
                form_responses: true,
                kpi_status: true,
                kpi_calculated_metrics: true,
              },
            },
          },
        },
      },
    });

    return departments.map((dept) => {
      let totalEntries = 0;
      const submittedKpis = dept.department_pillars.reduce((acc, pillar) => acc + pillar.department_kpis.length, 0);

      // Calculate total entries from form responses
      dept.department_pillars.forEach((pillar) => {
        pillar.department_kpis.forEach((kpi) => {
          if (kpi.form_responses) {
            try {
              const responses =
                typeof kpi.form_responses === 'string' ? JSON.parse(kpi.form_responses) : kpi.form_responses;

              if (responses && Array.isArray(responses.entries)) {
                totalEntries += responses.entries.length;
              }
            } catch (error) {
              console.error('Error parsing form_responses:', error);
            }
          }
        });
      });

      return {
        id: dept.id,
        name: dept.dept_name,
        submittedKpis,
        totalEntries,
      };
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
        OR: [
          {
            kpi_status: 'APPROVED',
          },
          {
            kpi_status: 'PENDING',
            kpi_calculated_metrics: {
              path: ['is_submitted_to_qc'],
              equals: true,
            },
          },
        ],
      },
    });

    const pendingReview = await this.prisma.departmentKpi.count({
      where: {
        kpi_status: 'PENDING',
        kpi_calculated_metrics: {
          path: ['is_submitted_to_qc'],
          equals: true,
        },
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
            OR: [
              {
                kpi_status: 'APPROVED',
              },
              {
                kpi_status: 'PENDING',
                kpi_calculated_metrics: {
                  path: ['is_submitted_to_qc'],
                  equals: true,
                },
              },
            ],
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
            OR: [
              {
                kpi_status: 'APPROVED',
              },
              {
                kpi_status: 'PENDING',
                kpi_calculated_metrics: {
                  path: ['is_submitted_to_qc'],
                  equals: true,
                },
              },
            ],
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
