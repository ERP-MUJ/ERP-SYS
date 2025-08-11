import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from '@repo/db/prisma/client';
import { AssignCoordinatorDto } from './dto/assign-coordinator.dto';

/**
 * Service for HOD operations related to faculty and coordinator assignments
 * Handles role switching between FACULTY and KPI_COORDINATOR
 */
@Injectable()
export class CoordinatorService {
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
   * Validates that the faculty member belongs to the HOD's department
   * @param facultyId - The faculty member's ID
   * @param hodDepartmentId - The HOD's department ID
   * @throws NotFoundException if faculty member not found or doesn't belong to department
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
   * Assigns or unassigns a faculty member as KPI coordinator
   * @param userId - The HOD's user ID
   * @param userRole - The HOD's role
   * @param payload - Assignment data containing faculty ID and new role
   * @returns Success message and updated user data
   */
  async assignCoordinator(userId: string, userRole: UserRole, payload: AssignCoordinatorDto) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertHodRole(userRole);

    // Get HOD's department
    const hod = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { department: true },
    });

    if (!hod || !hod.department) {
      throw new NotFoundException('HOD department not found');
    }

    // Validate faculty belongs to HOD's department
    await this.validateHodDepartment(payload.faculty_id, hod.department.id);

    // Update faculty role
    const updatedUser = await this.prisma.user.update({
      where: { id: payload.faculty_id },
      data: { user_role: payload.new_role },
      include: {
        department: {
          select: {
            id: true,
            dept_name: true,
          },
        },
      },
    });

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
   */
  async getDepartmentFaculty(userId: string, userRole: UserRole) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertHodRole(userRole);

    // Get HOD's department
    const hod = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { department: true },
    });

    if (!hod || !hod.department) {
      throw new NotFoundException('HOD department not found');
    }

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
}
