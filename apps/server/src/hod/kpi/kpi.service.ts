import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from '@repo/db/prisma/client';

/**
 * Service for HOD to manage their department's assigned KPIs
 * Handles viewing and managing KPIs assigned to their department
 */
@Injectable()
export class HodKpiService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Asserts that the user has HOD role
   * @param userRole - The user's role to validate
   * @throws ForbiddenException if user is not HOD
   */
  private assertHodRole(userRole: UserRole) {
    if (userRole !== UserRole.HOD) {
      throw new ForbiddenException('Only HOD users can perform this action');
    }
  }

  /**
   * Gets the department ID for the HOD user
   * @param userId - The HOD's user ID
   * @returns The department ID
   * @throws NotFoundException if HOD or department not found
   */
  private async getHodDepartmentId(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { dept_id: true },
    });

    if (!user?.dept_id) {
      throw new NotFoundException('Department not found for HOD');
    }

    return user.dept_id;
  }

  /**
   * Retrieves all pillars assigned to HOD's department
   * @param userId - The HOD's user ID
   * @param userRole - The HOD's role
   * @returns Array of department pillars with their KPIs
   */
  async getDepartmentPillars(userId: string, userRole: UserRole) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertHodRole(userRole);

    const departmentId = await this.getHodDepartmentId(userId);

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
   * Retrieves KPIs for a specific department pillar
   * @param userId - The HOD's user ID
   * @param userRole - The HOD's role
   * @param departmentPillarId - The department pillar ID
   * @returns Array of department KPIs with assigned users
   */
  async getDepartmentPillarKPIs(userId: string, userRole: UserRole, departmentPillarId: string) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertHodRole(userRole);

    const departmentId = await this.getHodDepartmentId(userId);

    // Verify the pillar belongs to HOD's department
    const departmentPillar = await this.prisma.departmentPillar.findFirst({
      where: {
        id: departmentPillarId,
        dept_id: departmentId,
        status: 'active',
      },
    });

    if (!departmentPillar) {
      throw new NotFoundException('Department pillar not found or not accessible');
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

  /**
   * Gets a specific KPI details for HOD's department
   * @param userId - The HOD's user ID
   * @param userRole - The HOD's role
   * @param kpiId - The KPI ID
   * @returns KPI details with form structure
   */
  async getKpiDetails(userId: string, userRole: UserRole, kpiId: string) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertHodRole(userRole);

    const departmentId = await this.getHodDepartmentId(userId);

    // Verify the KPI belongs to HOD's department
    const kpi = await this.prisma.departmentKpi.findFirst({
      where: {
        id: kpiId,
        dept_id: departmentId,
      },
      include: {
        department_pillar: {
          select: {
            pillar_name: true,
          },
        },
        assigned_users: {
          select: {
            id: true,
            user_name: true,
            user_email: true,
            user_role: true,
          },
        },
      },
    });

    if (!kpi) {
      throw new NotFoundException('KPI not found or not accessible');
    }

    return kpi;
  }

  /**
   * Updates KPI form responses (for data entry)
   * @param userId - The HOD's user ID
   * @param userRole - The HOD's role
   * @param kpiId - The KPI ID
   * @param formResponses - The form response data
   * @returns Success message
   */
  async updateKpiResponses(userId: string, userRole: UserRole, kpiId: string, formResponses: Record<string, any>) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertHodRole(userRole);

    const departmentId = await this.getHodDepartmentId(userId);

    // Verify the KPI belongs to HOD's department
    const kpi = await this.prisma.departmentKpi.findFirst({
      where: {
        id: kpiId,
        dept_id: departmentId,
      },
    });

    if (!kpi) {
      throw new NotFoundException('KPI not found or not accessible');
    }

    await this.prisma.departmentKpi.update({
      where: { id: kpiId },
      data: {
        form_responses: formResponses as any,
        kpi_status: 'PENDING', // Set to pending for review
        completed_date: new Date(),
      },
    });

    return {
      message: 'KPI responses updated successfully',
    };
  }
}
