import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from '@repo/db/prisma/client';
import type { KpiFormResponses } from '@workspace/types/types';

export interface AssignmentResult {
  departmentId: string;
  departmentName: string;
  status: 'success' | 'skipped' | 'error';
  message: string;
}

@Injectable()
export class DepartmentAssignmentService {
  constructor(private readonly prisma: PrismaService) {}

  private assertQacRole(userRole: UserRole) {
    if (userRole !== UserRole.QAC) {
      throw new ForbiddenException('Only QAC users can perform this action');
    }
  }

  getDepartments(userId: string, userRole: UserRole) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertQacRole(userRole);
    return this.prisma.department.findMany({
      select: {
        id: true,
        dept_name: true,
        hod_name: true,
        dept_creation: true,
      },
      orderBy: { dept_name: 'asc' },
    });
  }

  getPillarTemplates(userId: string, userRole: UserRole) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertQacRole(userRole);
    return this.prisma.pillarTemplate.findMany({
      where: { created_by_user: userId },
      include: {
        kpi_templates: {
          orderBy: { kpi_number: 'asc' },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async getDepartmentPillars(userId: string, userRole: UserRole, departmentId: string) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertQacRole(userRole);
    const department = await this.prisma.department.findUnique({
      where: { id: departmentId },
    });
    if (!department) {
      throw new NotFoundException('Department not found');
    }
    const pillars = await this.prisma.departmentPillar.findMany({
      where: {
        dept_id: departmentId,
        status: 'active',
      },
      include: {
        department_kpis: {
          include: {
            assigned_users: {
              select: {
                id: true,
                user_name: true,
                user_email: true,
                user_role: true,
              },
            },
          },
          orderBy: { kpi_number: 'asc' },
        },
      },
      orderBy: { assigned_date: 'desc' },
    });

    return pillars.map((pillar) => ({
      ...pillar,
      department_kpis: pillar.department_kpis.map((kpi) => ({
        ...kpi,
        total_entries: this.countFormEntries(kpi.form_responses),
      })),
    }));
  }

  getAllDepartmentPillars(userId: string, userRole: UserRole) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertQacRole(userRole);
    return this.prisma.departmentPillar
      .findMany({
        where: {
          status: 'active',
        },
        include: {
          department_kpis: {
            include: {
              assigned_users: {
                select: {
                  id: true,
                  user_name: true,
                  user_email: true,
                  user_role: true,
                },
              },
            },
            orderBy: { kpi_number: 'asc' },
          },
        },
        orderBy: { assigned_date: 'desc' },
      })
      .then((pillars) =>
        pillars.map((pillar) => ({
          ...pillar,
          department_kpis: pillar.department_kpis.map((kpi) => ({
            ...kpi,
            total_entries: this.countFormEntries(kpi.form_responses),
          })),
        })),
      );
  }

  async assignPillarToDepartment(
    userId: string,
    userRole: UserRole,
    departmentId: string,
    pillarTemplateId: string,
    pillarWeight?: number,
    pillarTarget?: number,
  ) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertQacRole(userRole);
    const department = await this.prisma.department.findUnique({
      where: { id: departmentId },
    });
    if (!department) {
      throw new NotFoundException('Department not found');
    }
    const pillarTemplate = await this.prisma.pillarTemplate.findFirst({
      where: {
        id: pillarTemplateId,
        created_by_user: userId,
      },
    });
    if (!pillarTemplate) {
      throw new NotFoundException('Pillar template not found');
    }
    if (pillarTarget !== undefined && pillarTarget < 0) {
      throw new ForbiddenException('Pillar target cannot be negative');
    }
    const existingAssignment = await this.prisma.departmentPillar.findUnique({
      where: {
        dept_id_template_id: {
          dept_id: departmentId,
          template_id: pillarTemplateId,
        },
      },
    });
    if (existingAssignment) {
      throw new ForbiddenException('Pillar is already assigned to this department');
    }
    const departmentPillar = await this.prisma.departmentPillar.create({
      data: {
        dept_id: departmentId,
        template_id: pillarTemplateId,
        pillar_name: pillarTemplate.pillar_name,
        description: pillarTemplate.description,
        pillar_weight: pillarWeight || pillarTemplate.pillar_value || 0,
        pillar_target: pillarTarget ?? undefined,
        academic_year: new Date().getFullYear(),
      },
      include: {
        department_kpis: true,
      },
    });
    const kpiTemplates = await this.prisma.kpiTemplate.findMany({
      where: { pillar_template_id: pillarTemplateId },
      orderBy: { kpi_number: 'asc' },
    });
    for (const kt of kpiTemplates) {
      const kpiDataJson = kt.kpi_data ? JSON.parse(JSON.stringify(kt.kpi_data)) : null;
      const metricsJson = kt.kpi_calculated_metrics ? JSON.parse(JSON.stringify(kt.kpi_calculated_metrics)) : null;
      await this.prisma.departmentKpi.create({
        data: {
          dept_id: departmentId,
          dept_pillar_id: departmentPillar.id,
          template_id: kt.id,
          kpi_number: kt.kpi_number,
          kpi_metric_name: kt.kpi_metric_name,
          kpi_description: kt.kpi_description,
          kpi_value: kt.kpi_value,
          data_provided_by: kt.data_provided_by,
          kpi_data: kpiDataJson ?? undefined,
          kpi_calculated_metrics: metricsJson ?? undefined,
          academic_year: new Date().getFullYear(),
        },
      });
    }
    return {
      message: 'Pillar assigned to department successfully',
      departmentPillar,
    };
  }

  async assignPillarAndKpiToAllDepartments(userId: string, userRole: UserRole) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertQacRole(userRole);

    // Get all pillar templates created by this QAC user
    const pillarTemplates = await this.prisma.pillarTemplate.findMany({
      where: {
        created_by_user: userId,
      },
      include: {
        kpi_templates: {
          orderBy: { kpi_number: 'asc' },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    if (pillarTemplates.length === 0) {
      throw new NotFoundException('No pillar templates found');
    }

    // Get all departments
    const departments = await this.prisma.department.findMany({
      select: { id: true, dept_name: true },
    });

    if (departments.length === 0) {
      throw new NotFoundException('No departments found');
    }

    // Early check: Count existing assignments to see if everything is already assigned
    const totalPossibleAssignments = departments.length * pillarTemplates.length;
    const existingAssignmentsCount = await this.prisma.departmentPillar.count({
      where: {
        template_id: { in: pillarTemplates.map((pt) => pt.id) },
        dept_id: { in: departments.map((d) => d.id) },
      },
    });

    // If all possible assignments exist, we can return early with a specific message
    if (existingAssignmentsCount === totalPossibleAssignments) {
      return {
        message: 'All pillars and KPIs are already assigned to all departments.',
        summary: {
          totalDepartments: departments.length,
          totalPillars: pillarTemplates.length,
          successCount: 0,
          skipCount: existingAssignmentsCount,
          errorCount: 0,
        },
        results: departments.flatMap((dept) =>
          pillarTemplates.map((pillar) => ({
            departmentId: dept.id,
            departmentName: dept.dept_name,
            status: 'skipped' as const,
            message: `${pillar.pillar_name}: Already assigned`,
          })),
        ),
      };
    }

    const results: AssignmentResult[] = [];
    let totalSuccessCount = 0;
    let totalSkipCount = 0;
    let totalErrorCount = 0;

    // Process each department-pillar combination without wrapping in a large transaction
    for (const department of departments) {
      for (const pillarTemplate of pillarTemplates) {
        try {
          // Check if pillar already exists for this department
          const existingDepartmentPillar = await this.prisma.departmentPillar.findUnique({
            where: {
              dept_id_template_id: {
                dept_id: department.id,
                template_id: pillarTemplate.id,
              },
            },
          });

          let departmentPillar = existingDepartmentPillar;
          let pillarAction = '';

          // If pillar doesn't exist, create it in a scoped transaction
          if (!existingDepartmentPillar) {
            departmentPillar = await this.prisma.$transaction(async (tx) => {
              return await tx.departmentPillar.create({
                data: {
                  dept_id: department.id,
                  template_id: pillarTemplate.id,
                  pillar_name: pillarTemplate.pillar_name,
                  description: pillarTemplate.description,
                  pillar_weight: pillarTemplate.pillar_value || 0,
                  pillar_target: undefined,
                  academic_year: new Date().getFullYear(),
                },
              });
            });
            pillarAction = 'Pillar created';
          } else {
            pillarAction = 'Pillar exists';
          }

          // Now handle KPIs - check which ones are missing
          if (!departmentPillar) {
            throw new Error('Failed to create or find department pillar');
          }

          const existingKpis = await this.prisma.departmentKpi.findMany({
            where: {
              dept_pillar_id: departmentPillar.id,
            },
            select: { template_id: true },
          });

          const existingKpiTemplateIds = new Set(existingKpis.map((k) => k.template_id));
          const missingKpiTemplates = pillarTemplate.kpi_templates.filter((kt) => !existingKpiTemplateIds.has(kt.id));

          let kpiAction = '';
          let assignedKpiCount = 0;

          // Assign missing KPIs in a scoped transaction if there are any
          if (missingKpiTemplates.length > 0) {
            await this.prisma.$transaction(async (tx) => {
              for (const kt of missingKpiTemplates) {
                const kpiDataJson = kt.kpi_data ? JSON.parse(JSON.stringify(kt.kpi_data)) : null;
                const metricsJson = kt.kpi_calculated_metrics
                  ? JSON.parse(JSON.stringify(kt.kpi_calculated_metrics))
                  : null;

                await tx.departmentKpi.create({
                  data: {
                    dept_id: department.id,
                    dept_pillar_id: departmentPillar.id,
                    template_id: kt.id,
                    kpi_number: kt.kpi_number,
                    kpi_metric_name: kt.kpi_metric_name,
                    kpi_description: kt.kpi_description,
                    kpi_value: kt.kpi_value,
                    data_provided_by: kt.data_provided_by,
                    kpi_data: kpiDataJson ?? undefined,
                    kpi_calculated_metrics: metricsJson ?? undefined,
                    academic_year: new Date().getFullYear(),
                  },
                });
                assignedKpiCount++;
              }
            });
            kpiAction = `${assignedKpiCount} KPIs assigned`;
          } else {
            kpiAction = 'All KPIs already exist';
          }

          // Determine the overall status and message
          if (!existingDepartmentPillar && assignedKpiCount > 0) {
            // New pillar with all KPIs
            results.push({
              departmentId: department.id,
              departmentName: department.dept_name,
              status: 'success',
              message: `${pillarTemplate.pillar_name}: ${pillarAction}, ${kpiAction}`,
            });
            totalSuccessCount++;
          } else if (existingDepartmentPillar && assignedKpiCount > 0) {
            // Existing pillar with some new KPIs
            results.push({
              departmentId: department.id,
              departmentName: department.dept_name,
              status: 'success',
              message: `${pillarTemplate.pillar_name}: ${pillarAction}, ${kpiAction}`,
            });
            totalSuccessCount++;
          } else {
            // Everything already exists
            results.push({
              departmentId: department.id,
              departmentName: department.dept_name,
              status: 'skipped',
              message: `${pillarTemplate.pillar_name}: ${pillarAction}, ${kpiAction}`,
            });
            totalSkipCount++;
          }
        } catch (error) {
          results.push({
            departmentId: department.id,
            departmentName: department.dept_name,
            status: 'error',
            message: `${pillarTemplate.pillar_name}: Failed - ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
          totalErrorCount++;
        }
      }
    }

    return {
      message:
        totalSuccessCount === 0 && totalErrorCount === 0
          ? `All pillars and KPIs are already assigned. ${totalSkipCount} assignments skipped.`
          : `Assignment completed. ${totalSuccessCount} assignments created/updated, ${totalSkipCount} skipped.`,
      summary: {
        totalDepartments: departments.length,
        totalPillars: pillarTemplates.length,
        successCount: totalSuccessCount,
        skipCount: totalSkipCount,
        errorCount: totalErrorCount,
      },
      results,
    };
  }

  /**
   * Updates a DepartmentPillar, specifically its pillar_weight
   * @param userId - The QAC's user ID
   * @param userRole - The QAC's role
   * @param departmentPillarId - The ID of the DepartmentPillar to update
   * @param pillarWeight - The new value for the pillar weight
   * @returns The updated DepartmentPillar
   */
  async updateDepartmentPillar(
    userId: string,
    userRole: UserRole,
    departmentPillarId: string,
    pillarWeight?: number,
    pillarTarget?: number,
  ) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertQacRole(userRole);

    const departmentPillar = await this.prisma.departmentPillar.findUnique({
      where: { id: departmentPillarId },
    });
    if (!departmentPillar) {
      throw new NotFoundException('Department pillar not found');
    }

    interface DepartmentPillarUpdateData {
      pillar_weight?: number;
      pillar_target?: number;
    }

    const updateData: DepartmentPillarUpdateData = {};
    if (pillarWeight !== undefined) {
      if (pillarWeight < 0) {
        throw new ForbiddenException('Pillar weight cannot be negative');
      }
      updateData.pillar_weight = pillarWeight;
    }
    if (pillarTarget !== undefined) {
      if (pillarTarget < 0) {
        throw new ForbiddenException('Pillar target cannot be negative');
      }
      updateData.pillar_target = pillarTarget;
    }

    const updatedPillar = await this.prisma.departmentPillar.update({
      where: { id: departmentPillarId },
      data: updateData,
    });

    return {
      message: 'Pillar updated successfully',
      departmentPillar: updatedPillar,
    };
  }

  async unassignPillarFromDepartment(userId: string, userRole: UserRole, departmentPillarId: string) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertQacRole(userRole);
    const departmentPillar = await this.prisma.departmentPillar.findUnique({
      where: { id: departmentPillarId },
      include: { department: true },
    });
    if (!departmentPillar) {
      throw new NotFoundException('Department pillar not found');
    }
    await this.prisma.departmentKpi.deleteMany({
      where: { dept_pillar_id: departmentPillarId },
    });
    await this.prisma.departmentPillar.delete({
      where: { id: departmentPillarId },
    });
    return {
      message: 'Pillar unassigned from department successfully',
    };
  }

  async getDepartmentPillarKPIs(userId: string, userRole: UserRole, departmentPillarId: string) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertQacRole(userRole);
    const departmentPillar = await this.prisma.departmentPillar.findUnique({
      where: { id: departmentPillarId },
    });
    if (!departmentPillar) {
      throw new NotFoundException('Department pillar not found');
    }
    const kpis = await this.prisma.departmentKpi.findMany({
      where: { dept_pillar_id: departmentPillarId },
      include: {
        assigned_users: {
          select: { id: true, user_name: true, user_email: true, user_role: true },
        },
      },
      orderBy: { kpi_number: 'asc' },
    });
    return kpis
      .map((kpi) => ({
        ...kpi,
        total_entries: this.countFormEntries(kpi.form_responses),
      }))
      .filter((k) => {
        const fr = (k.form_responses || {}) as Record<string, unknown>;
        const cw = fr['coordinator_workflow'] as { coordinator_status?: string } | undefined;
        if (!cw) return true;
        return cw.coordinator_status === 'APPROVED_BY_HOD';
      });
  }

  private countFormEntries(formResponses: unknown): number {
    if (!formResponses) {
      return 0;
    }

    try {
      const parsed: KpiFormResponses =
        typeof formResponses === 'string'
          ? (JSON.parse(formResponses) as KpiFormResponses)
          : (formResponses as KpiFormResponses);

      if (!parsed || typeof parsed !== 'object') {
        return 0;
      }

      const baseEntries = Array.isArray(parsed.entries) ? parsed.entries.length : 0;
      const coordinatorData = parsed.coordinator_workflow?.coordinator_submission?.data;
      const coordinatorEntries = Array.isArray(coordinatorData) ? coordinatorData.length : 0;

      return baseEntries + coordinatorEntries;
    } catch (error) {
      console.error('Failed to parse form responses for entry count', error);
      return 0;
    }
  }

  async assignKpiToDepartmentPillar(
    userId: string,
    userRole: UserRole,
    departmentPillarId: string,
    kpiTemplateId: string,
    kpiValue: number,
    kpiTarget?: number,
  ) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertQacRole(userRole);
    const departmentPillar = await this.prisma.departmentPillar.findUnique({
      where: { id: departmentPillarId },
    });
    if (!departmentPillar) {
      throw new NotFoundException('Department pillar not found');
    }
    const kpiTemplate = await this.prisma.kpiTemplate.findUnique({
      where: { id: kpiTemplateId },
    });
    if (!kpiTemplate) {
      throw new NotFoundException('KPI template not found');
    }
    const existing = await this.prisma.departmentKpi.findUnique({
      where: {
        dept_pillar_id_template_id: {
          dept_pillar_id: departmentPillarId,
          template_id: kpiTemplateId,
        },
      },
    });
    if (existing) {
      throw new ForbiddenException('KPI already assigned to this pillar');
    }
    if (kpiTarget !== undefined && kpiTarget < 0) {
      throw new ForbiddenException('KPI target cannot be negative');
    }
    const kpiDataJson = kpiTemplate.kpi_data ? JSON.parse(JSON.stringify(kpiTemplate.kpi_data)) : null;
    const metricsJson = kpiTemplate.kpi_calculated_metrics
      ? JSON.parse(JSON.stringify(kpiTemplate.kpi_calculated_metrics))
      : null;
    const departmentKpi = await this.prisma.departmentKpi.create({
      data: {
        dept_id: departmentPillar.dept_id,
        dept_pillar_id: departmentPillarId,
        template_id: kpiTemplateId,
        kpi_number: kpiTemplate.kpi_number,
        kpi_metric_name: kpiTemplate.kpi_metric_name,
        kpi_description: kpiTemplate.kpi_description,
        kpi_value: kpiValue,
        kpi_target: kpiTarget ?? undefined,
        data_provided_by: kpiTemplate.data_provided_by,
        kpi_data: kpiDataJson ?? undefined,
        kpi_calculated_metrics: metricsJson ?? undefined,
        academic_year: new Date().getFullYear(),
      },
    });
    return {
      message: 'KPI assigned to department pillar successfully',
      departmentKpi,
    };
  }

  async updateDepartmentKpi(
    userId: string,
    userRole: UserRole,
    departmentKpiId: string,
    kpiValue?: number,
    kpiTarget?: number,
  ) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertQacRole(userRole);
    const departmentKpi = await this.prisma.departmentKpi.findUnique({
      where: { id: departmentKpiId },
    });
    if (!departmentKpi) {
      throw new NotFoundException('Department KPI not found');
    }
    interface DepartmentKpiUpdateData {
      kpi_value?: number;
      kpi_target?: number;
      hod_performance?: number;
    }

    const updateData: DepartmentKpiUpdateData = {};
    if (kpiValue !== undefined) {
      if (kpiValue < 0 || kpiValue > 1) {
        throw new ForbiddenException('KPI value must be between 0 and 1');
      }
      updateData.kpi_value = kpiValue;
    }
    if (kpiTarget !== undefined) {
      updateData.kpi_target = kpiTarget;
    }

    // Get the current KPI to recalculate hod_performance if kpi_value is updated
    if (kpiValue !== undefined) {
      const currentKpi = await this.prisma.departmentKpi.findUnique({
        where: { id: departmentKpiId },
        select: { hod_percentage_target_achieved: true },
      });

      if (currentKpi && currentKpi.hod_percentage_target_achieved !== null) {
        // Calculate HOD performance based on new kpi_value and existing hod_percentage_target_achieved
        updateData.hod_performance = Number((kpiValue * Number(currentKpi.hod_percentage_target_achieved)).toFixed(2));
      }
    }

    // Update the KPI first
    const updatedKpi = await this.prisma.departmentKpi.update({
      where: { id: departmentKpiId },
      data: updateData,
    });

    // Calculate sum of hod_performance for all KPIs in this pillar
    const allPillarKpis = await this.prisma.departmentKpi.findMany({
      where: { dept_pillar_id: updatedKpi.dept_pillar_id },
      select: { hod_performance: true },
    });

    const totalHodPerformance = allPillarKpis.reduce((sum, kpi) => sum + (kpi.hod_performance || 0), 0);

    // Get current pillar data to calculate hod_performance
    const pillar = await this.prisma.departmentPillar.findUnique({
      where: { id: updatedKpi.dept_pillar_id },
      select: { pillar_weight: true },
    });

    // Update the pillar's hod_percentage_target_achieved and hod_performance
    await this.prisma.departmentPillar.update({
      where: { id: updatedKpi.dept_pillar_id },
      data: {
        hod_percentage_target_achieved: totalHodPerformance,
        hod_performance: Number((totalHodPerformance * (pillar?.pillar_weight || 0)).toFixed(2)),
      },
    });

    return {
      message: 'KPI updated successfully',
      departmentKpi: updatedKpi,
    };
  }

  async unassignKpiFromDepartmentPillar(userId: string, userRole: UserRole, departmentKpiId: string) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertQacRole(userRole);
    const departmentKpi = await this.prisma.departmentKpi.findUnique({
      where: { id: departmentKpiId },
    });
    if (!departmentKpi) {
      throw new NotFoundException('Department KPI not found');
    }
    await this.prisma.departmentKpi.delete({
      where: { id: departmentKpiId },
    });
    return {
      message: 'KPI unassigned from department pillar successfully',
    };
  }
}
