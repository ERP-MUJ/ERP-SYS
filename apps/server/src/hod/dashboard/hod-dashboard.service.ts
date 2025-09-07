import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from '@repo/db/prisma/client';

@Injectable()
export class HodDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Asserts that the user has HOD role
   */
  private assertHodRole(userRole: UserRole) {
    if (userRole !== UserRole.HOD) {
      throw new ForbiddenException('Only HOD members can access this resource');
    }
  }

  /**
   * Get score sheet data for the HOD's department
   */
  async getScoreSheetData(userId: string, userRole: UserRole, deptId: string, pillarId?: string) {
    if (!userId) throw new ForbiddenException('User ID is required');
    this.assertHodRole(userRole);

    // Get the HOD's department
    const hodDepartment = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { dept_id: true },
    });

    if (!hodDepartment?.dept_id) {
      throw new ForbiddenException('HOD is not assigned to any department');
    }

    const kpis = await this.prisma.departmentKpi.findMany({
      where: {
        dept_id: hodDepartment.dept_id,
        ...(pillarId && { dept_pillar_id: pillarId }),
      },
      select: {
        kpi_number: true,
        kpi_metric_name: true,
        kpi_value: true,
        data_provided_by: true,
        kpi_target: true,
        hod_percentage_target_achieved: true,
      },
      orderBy: {
        kpi_number: 'asc',
      },
    });

    return kpis.map((kpi) => ({
      ...kpi,
      hod_percentage_target_achieved: kpi.hod_percentage_target_achieved
        ? Number(kpi.hod_percentage_target_achieved.toFixed(2))
        : null,
    }));
  }

  async getDepartmentPillars(userId: string, userRole: UserRole, deptId: string) {
    if (!userId) throw new ForbiddenException('User ID is required');
    this.assertHodRole(userRole);

    // Get the HOD's department
    const hodDepartment = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { dept_id: true },
    });

    if (!hodDepartment?.dept_id) {
      throw new ForbiddenException('HOD is not assigned to any department');
    }

    return await this.prisma.departmentPillar.findMany({
      where: {
        dept_id: hodDepartment.dept_id,
        status: 'active',
      },
      select: {
        id: true,
        pillar_name: true,
        pillar_weight: true,
        hod_percentage_target_achieved: true,
        hod_performance: true,
      },
      orderBy: {
        pillar_name: 'asc',
      },
    });
  }
}
