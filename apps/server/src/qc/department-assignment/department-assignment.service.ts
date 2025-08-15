import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from '@repo/db/prisma/client';

/**
 * Service for QAC to manage department pillar and KPI assignments
 * Handles assigning/unassigning pillars and KPIs to departments
 */
@Injectable()
export class DepartmentAssignmentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Asserts that the user has QAC role
   * @param userRole - The user's role to validate
   * @throws ForbiddenException if user is not QAC
   */
  private assertQacRole(userRole: UserRole) {
    if (userRole !== UserRole.QAC) {
      throw new ForbiddenException('Only QAC users can perform this action');
    }
  }

  /**
   * Retrieves all departments
   * @param userId - The QAC's user ID
   * @param userRole - The QAC's role
   * @returns Array of all departments
   */
  async getDepartments(userId: string, userRole: UserRole) {
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

  /**
   * Retrieves all pillar templates created by QAC
   * @param userId - The QAC's user ID
   * @param userRole - The QAC's role
   * @returns Array of pillar templates with their KPIs
   */
  async getPillarTemplates(userId: string, userRole: UserRole) {
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

  /**
   * Retrieves pillars assigned to a specific department
   * @param userId - The QAC's user ID
   * @param userRole - The QAC's role
   * @param departmentId - The department ID
   * @returns Array of department pillars with their KPIs
   */
  async getDepartmentPillars(userId: string, userRole: UserRole, departmentId: string) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertQacRole(userRole);

    // Verify department exists
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

  /**
   * Retrieves all department pillars for overview (used in cards view)
   * @param userId - The QAC's user ID
   * @param userRole - The QAC's role
   * @returns Array of all department pillars with their KPIs
   */
  async getAllDepartmentPillars(userId: string, userRole: UserRole) {
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

  /**
   * Assigns a pillar template to a department
   * @param userId - The QAC's user ID
   * @param userRole - The QAC's role
   * @param departmentId - The department ID
   * @param pillarTemplateId - The pillar template ID
   * @param pillarWeight - The weight to assign to the pillar
   * @returns Success message and created department pillar
   */
  async assignPillarToDepartment(
    userId: string,
    userRole: UserRole,
    departmentId: string,
    pillarTemplateId: string,
    pillarWeight?: number,
  ) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertQacRole(userRole);

    // Verify department exists
    const department = await this.prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    // Verify pillar template exists and belongs to QAC
    const pillarTemplate = await this.prisma.pillarTemplate.findFirst({
      where: {
        id: pillarTemplateId,
        created_by_user: userId,
      },
    });

    if (!pillarTemplate) {
      throw new NotFoundException('Pillar template not found');
    }

    // Check if pillar is already assigned to department
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

    // Create department pillar assignment
    const departmentPillar = await this.prisma.departmentPillar.create({
      data: {
        dept_id: departmentId,
        template_id: pillarTemplateId,
        pillar_name: pillarTemplate.pillar_name,
        description: pillarTemplate.description,
        pillar_weight: pillarWeight || pillarTemplate.pillar_value || 0,
        academic_year: new Date().getFullYear(),
      },
      include: {
        department_kpis: true,
      },
    });

    // Assign all KPIs from the pillar template to the department pillar
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
   * Unassigns a pillar from a department
   * @param userId - The QAC's user ID
   * @param userRole - The QAC's role
   * @param departmentPillarId - The department pillar ID
   * @returns Success message
   */
  async unassignPillarFromDepartment(userId: string, userRole: UserRole, departmentPillarId: string) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertQacRole(userRole);

    // Verify department pillar exists
    const departmentPillar = await this.prisma.departmentPillar.findUnique({
      where: { id: departmentPillarId },
      include: { department: true },
    });

    if (!departmentPillar) {
      throw new NotFoundException('Department pillar not found');
    }

    // Delete all KPIs associated with this pillar
    await this.prisma.departmentKpi.deleteMany({
      where: { dept_pillar_id: departmentPillarId },
    });

    // Delete the department pillar
    await this.prisma.departmentPillar.delete({
      where: { id: departmentPillarId },
    });

    return {
      message: 'Pillar unassigned from department successfully',
    };
  }

  /**
   * Retrieves KPIs for a specific department pillar
   * @param userId - The QAC's user ID
   * @param userRole - The QAC's role
   * @param departmentPillarId - The department pillar ID
   * @returns Array of department KPIs with assigned users
   */
  async getDepartmentPillarKPIs(userId: string, userRole: UserRole, departmentPillarId: string) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertQacRole(userRole);

    // Verify department pillar exists
    const departmentPillar = await this.prisma.departmentPillar.findUnique({
      where: { id: departmentPillarId },
    });

    if (!departmentPillar) {
      throw new NotFoundException('Department pillar not found');
    }

    return this.prisma.departmentKpi.findMany({
      where: { dept_pillar_id: departmentPillarId },
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
    });
  }
}
