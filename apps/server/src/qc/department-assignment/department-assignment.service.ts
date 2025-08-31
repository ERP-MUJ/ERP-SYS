import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from '@repo/db/prisma/client';

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
    return this.prisma.departmentPillar.findMany({
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
  }

  getAllDepartmentPillars(userId: string, userRole: UserRole) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertQacRole(userRole);
    return this.prisma.departmentPillar.findMany({
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
    });
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
        pillar_target: pillarTarget,
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

  /**
   * Updates a DepartmentPillar, specifically its pillar_weight
   * @param userId - The QAC's user ID
   * @param userRole - The QAC's role
   * @param departmentPillarId - The ID of the DepartmentPillar to update
   * @param pillarWeight - The new value for the pillar weight
   * @returns The updated DepartmentPillar
   */
  async updateDepartmentPillar(userId: string, userRole: UserRole, departmentPillarId: string, pillarWeight?: number, pillarTarget?: number) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertQacRole(userRole);

    const departmentPillar = await this.prisma.departmentPillar.findUnique({
      where: { id: departmentPillarId },
    });
    if (!departmentPillar) {
      throw new NotFoundException('Department pillar not found');
    }

    const updateData: any = {};
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
    return kpis.filter((k) => {
      const fr = (k.form_responses || {}) as Record<string, unknown>;
      const cw = fr['coordinator_workflow'] as { coordinator_status?: string } | undefined;
      if (!cw) return true;
      return cw.coordinator_status === 'APPROVED_BY_HOD';
    });
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
        kpi_target: kpiTarget,
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

  async updateDepartmentKpi(userId: string, userRole: UserRole, departmentKpiId: string, kpiValue?: number, kpiTarget?: number) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertQacRole(userRole);
    const departmentKpi = await this.prisma.departmentKpi.findUnique({
      where: { id: departmentKpiId },
    });
    if (!departmentKpi) {
      throw new NotFoundException('Department KPI not found');
    }
    const updateData: any = {};
    if (kpiValue !== undefined) {
      if (kpiValue < 0 || kpiValue > 1) {
        throw new ForbiddenException('KPI value must be between 0 and 1');
      }
      updateData.kpi_value = kpiValue;
    }
    if (kpiTarget !== undefined) {
      if (kpiTarget < 0) {
        throw new ForbiddenException('KPI target cannot be negative');
      }
      updateData.kpi_target = kpiTarget;
    }
    const updatedKpi = await this.prisma.departmentKpi.update({
      where: { id: departmentKpiId },
      data: updateData,
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
