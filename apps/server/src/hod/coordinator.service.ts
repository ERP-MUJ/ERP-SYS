import { Injectable, ForbiddenException, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole, User, Department, DepartmentKpi, Prisma } from '@repo/db/prisma/client';
import { AssignCoordinatorDto } from './dto/assign-coordinator.dto';

/**
 * Service for HOD operations related to faculty and coordinator assignments
 * Handles role switching between FACULTY and KPI_COORDINATOR
 */
@Injectable()
export class CoordinatorService {
  private readonly logger = new Logger(CoordinatorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Asserts that the user has HOD role
   * @param userRole - The user's role to validate
   * @throws ForbiddenException if user is not HOD
   */
  private assertHodRole(userRole: UserRole): void {
    if (userRole !== UserRole.HOD) {
      throw new ForbiddenException('Only HOD users can perform this action');
    }
  }

  /**
   * Validates user authentication
   * @param userId - User ID to validate
   * @throws ForbiddenException if user is not authenticated
   */
  private validateAuthentication(userId: string): void {
    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }
  }

  /**
   * Gets HOD's department with validation
   * @param userId - The HOD's user ID
   * @returns HOD user with department information
   * @throws NotFoundException if HOD or department not found
   */
  private async getHodDepartment(userId: string): Promise<User & { department: Department }> {
    const hod = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { department: true },
    });

    if (!hod || !hod.department) {
      this.logger.error(`HOD department not found for user: ${userId}`);
      throw new NotFoundException('HOD department not found');
    }

    // Type assertion is safe here because we've checked that department is not null
    return hod as User & { department: Department };
  }

  /**
   * Validates that a faculty member belongs to the HOD's department
   * @param facultyId - The faculty member's ID
   * @param hodDepartmentId - The HOD's department ID
   * @returns Faculty user information
   * @throws NotFoundException if faculty member not found or doesn't belong to department
   */
  private async validateFacultyInDepartment(
    facultyId: string,
    hodDepartmentId: string,
  ): Promise<User & { department: Department | null }> {
    const faculty = await this.prisma.user.findFirst({
      where: {
        id: facultyId,
        dept_id: hodDepartmentId,
        user_role: { in: [UserRole.FACULTY, UserRole.KPI_COORDINATOR] },
      },
      include: { department: true },
    });

    if (!faculty) {
      this.logger.warn(`Faculty ${facultyId} not found in department ${hodDepartmentId}`);
      throw new NotFoundException('Faculty member not found in your department');
    }

    return faculty;
  }

  /**
   * Validates that a coordinator belongs to the HOD's department
   * @param coordinatorId - The coordinator's ID
   * @param hodDepartmentId - The HOD's department ID
   * @returns Coordinator user information
   * @throws NotFoundException if coordinator not found or doesn't belong to department
   */
  private async validateCoordinatorInDepartment(coordinatorId: string, hodDepartmentId: string): Promise<User> {
    const coordinator = await this.prisma.user.findFirst({
      where: {
        id: coordinatorId,
        dept_id: hodDepartmentId,
        user_role: UserRole.KPI_COORDINATOR,
      },
    });

    if (!coordinator) {
      this.logger.warn(`Coordinator ${coordinatorId} not found in department ${hodDepartmentId}`);
      throw new NotFoundException('Coordinator not found in your department');
    }

    return coordinator;
  }

  /**
   * Validates that a KPI belongs to the HOD's department
   * @param kpiId - The KPI ID
   * @param hodDepartmentId - The HOD's department ID
   * @returns KPI information
   * @throws NotFoundException if KPI not found or doesn't belong to department
   */
  private async validateKpiInDepartment(kpiId: string, hodDepartmentId: string): Promise<DepartmentKpi> {
    const kpi = await this.prisma.departmentKpi.findFirst({
      where: { id: kpiId, dept_id: hodDepartmentId },
    });

    if (!kpi) {
      this.logger.warn(`KPI ${kpiId} not found in department ${hodDepartmentId}`);
      throw new NotFoundException('KPI not found in your department');
    }

    return kpi;
  }

  /**
   * Removes all KPI assignments for a coordinator when role changes to FACULTY
   * @param facultyId - The faculty member's ID
   * @param hodDepartmentId - The HOD's department ID
   */
  private async removeCoordinatorKpiAssignments(facultyId: string, hodDepartmentId: string): Promise<void> {
    try {
      // Find all KPIs assigned to this coordinator
      const assignedKpis = await this.prisma.departmentKpi.findMany({
        where: {
          dept_id: hodDepartmentId,
          assigned_users: {
            some: { id: facultyId },
          },
        },
        select: { id: true, kpi_number: true },
      });

      if (assignedKpis.length === 0) {
        this.logger.log(`No KPI assignments found for faculty ${facultyId}`);
        return;
      }

      // Remove coordinator from each assigned KPI
      await Promise.all(
        assignedKpis.map((kpi) =>
          this.prisma.departmentKpi.update({
            where: { id: kpi.id },
            data: {
              assigned_users: {
                disconnect: { id: facultyId },
              },
            },
          }),
        ),
      );

      this.logger.log(`Removed ${assignedKpis.length} KPI assignments for faculty ${facultyId}`);
    } catch (error) {
      this.logger.error(`Failed to remove KPI assignments for faculty ${facultyId}:`, error);
      throw new BadRequestException('Failed to remove KPI assignments');
    }
  }

  /**
   * Validates that the faculty member belongs to the HOD's department
   * @param facultyId - The faculty member's ID
   * @param hodDepartmentId - The HOD's department ID
   * @throws NotFoundException if faculty member not found or doesn't belong to department
   * @deprecated Use validateFacultyInDepartment instead
   */
  private async validateHodDepartment(facultyId: string, hodDepartmentId: string) {
    const faculty = await this.prisma.user.findFirst({
      where: {
        id: facultyId,
        dept_id: hodDepartmentId,
        user_role: { in: [UserRole.FACULTY, UserRole.KPI_COORDINATOR] },
      },
    });

    if (!faculty) {
      throw new NotFoundException('Faculty member not found in your department');
    }
  }

  /**
   * Assigns or updates a faculty member's role as KPI coordinator
   * @param payload - Assignment data containing faculty ID and new role
   * @param userId - The HOD's user ID
   * @param userRole - The HOD's role
   * @returns Updated user information with success message
   * @throws ForbiddenException if user is not authenticated or not HOD
   * @throws NotFoundException if HOD department or faculty not found
   * @throws BadRequestException if role assignment fails
   */
  async assignCoordinator(payload: AssignCoordinatorDto, userId: string, userRole: UserRole) {
    this.validateAuthentication(userId);
    this.assertHodRole(userRole);

    this.logger.log(`Processing role assignment: ${payload.faculty_id} -> ${payload.new_role}`);

    // Get HOD's department with validation
    const hod = await this.getHodDepartment(userId);

    // Validate faculty exists and belongs to department
    const faculty = await this.validateFacultyInDepartment(payload.faculty_id, hod.department.id);

    // Handle role change from COORDINATOR to FACULTY - remove KPI assignments
    if (payload.new_role === 'FACULTY' && faculty.user_role === 'KPI_COORDINATOR') {
      await this.removeCoordinatorKpiAssignments(payload.faculty_id, hod.department.id);
    }

    // Update user role
    const updatedUser = await this.prisma.user.update({
      where: { id: payload.faculty_id },
      data: { user_role: payload.new_role },
      include: { department: true },
    });

    this.logger.log(`Successfully updated user ${payload.faculty_id} role to ${payload.new_role}`);

    return {
      message: `Faculty role updated to ${payload.new_role} successfully`,
      user: {
        id: updatedUser.id,
        user_name: updatedUser.user_name,
        user_email: updatedUser.user_email,
        user_role: updatedUser.user_role,
        department: updatedUser.department,
      },
    };
  }

  /**
   * Retrieves all faculty and KPI coordinators in the HOD's department
   * @param userId - The HOD's user ID
   * @param userRole - The HOD's role
   * @returns Array of department faculty members
   * @throws ForbiddenException if user is not authenticated or not HOD
   * @throws NotFoundException if HOD department not found
   */
  async getDepartmentFaculty(userId: string, userRole: UserRole) {
    this.validateAuthentication(userId);
    this.assertHodRole(userRole);

    const hod = await this.getHodDepartment(userId);

    return this.prisma.user.findMany({
      where: {
        dept_id: hod.department.id,
        user_role: { in: [UserRole.FACULTY, UserRole.KPI_COORDINATOR] },
      },
      select: {
        id: true,
        user_name: true,
        user_email: true,
        user_role: true,
        created_at: true,
      },
      orderBy: { user_name: 'asc' },
    });
  }

  /**
   * Get all KPIs in HOD's department with assigned coordinators
   * @param userId - The HOD's user ID
   * @param userRole - The HOD's role
   * @returns Array of department KPIs with assigned coordinators
   * @throws ForbiddenException if user is not authenticated or not HOD
   * @throws NotFoundException if HOD department not found
   */
  async getDepartmentKpis(userId: string, userRole: UserRole) {
    this.validateAuthentication(userId);
    this.assertHodRole(userRole);

    const hod = await this.getHodDepartment(userId);

    return this.prisma.departmentKpi.findMany({
      where: { dept_id: hod.department.id },
      include: {
        department_pillar: { select: { pillar_name: true } },
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
   * Assign a coordinator to a specific KPI
   * @param userId - The HOD's user ID
   * @param userRole - The HOD's role
   * @param kpiId - The KPI ID to assign coordinator to
   * @param coordinatorId - The coordinator ID to assign
   * @returns Success message with coordinator details
   * @throws ForbiddenException if user is not authenticated or not HOD
   * @throws NotFoundException if HOD department, KPI, or coordinator not found
   */
  async assignCoordinatorToKpi(userId: string, userRole: UserRole, kpiId: string, coordinatorId: string) {
    this.validateAuthentication(userId);
    this.assertHodRole(userRole);

    const hod = await this.getHodDepartment(userId);

    // Validate KPI and coordinator belong to HOD's department
    await this.validateKpiInDepartment(kpiId, hod.department.id);
    const coordinator = await this.validateCoordinatorInDepartment(coordinatorId, hod.department.id);

    // Add coordinator to KPI's assigned_users
    await this.prisma.departmentKpi.update({
      where: { id: kpiId },
      data: {
        assigned_users: {
          connect: { id: coordinatorId },
        },
      },
    });

    this.logger.log(`Assigned coordinator ${coordinatorId} to KPI ${kpiId}`);

    return {
      message: `Coordinator ${coordinator.user_name} assigned to KPI successfully`,
    };
  }

  /**
   * Remove a coordinator from a specific KPI
   * @param userId - The HOD's user ID
   * @param userRole - The HOD's role
   * @param kpiId - The KPI ID to remove coordinator from
   * @param coordinatorId - The coordinator ID to remove
   * @returns Success message
   * @throws ForbiddenException if user is not authenticated or not HOD
   * @throws NotFoundException if HOD department or KPI not found
   */
  async removeCoordinatorFromKpi(userId: string, userRole: UserRole, kpiId: string, coordinatorId: string) {
    this.validateAuthentication(userId);
    this.assertHodRole(userRole);

    const hod = await this.getHodDepartment(userId);

    // Validate KPI belongs to HOD's department
    await this.validateKpiInDepartment(kpiId, hod.department.id);

    // Remove coordinator from KPI's assigned_users
    await this.prisma.departmentKpi.update({
      where: { id: kpiId },
      data: {
        assigned_users: {
          disconnect: { id: coordinatorId },
        },
      },
    });

    this.logger.log(`Removed coordinator ${coordinatorId} from KPI ${kpiId}`);

    return {
      message: 'Coordinator removed from KPI successfully',
    };
  }
}
