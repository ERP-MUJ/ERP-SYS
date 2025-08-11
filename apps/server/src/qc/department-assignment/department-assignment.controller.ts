import { Controller, Get, Post, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { DepartmentAssignmentService } from './department-assignment.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
import { RequestUser } from 'src/auth/dto/request-user.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('QAC Department Assignment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/qc/department-assignment')
export class DepartmentAssignmentController {
  constructor(private readonly departmentAssignmentService: DepartmentAssignmentService) {}

  @Get('departments')
  async getDepartments(@CurrentUser() user: RequestUser) {
    return this.departmentAssignmentService.getDepartments(user.id, user.role);
  }

  @Get('pillar-templates')
  async getPillarTemplates(@CurrentUser() user: RequestUser) {
    return this.departmentAssignmentService.getPillarTemplates(user.id, user.role);
  }

                @Get('departments/:departmentId/pillars')
              async getDepartmentPillars(
                @CurrentUser() user: RequestUser,
                @Param('departmentId') departmentId: string,
              ) {
                return this.departmentAssignmentService.getDepartmentPillars(user.id, user.role, departmentId);
              }

              @Get('all-department-pillars')
              async getAllDepartmentPillars(@CurrentUser() user: RequestUser) {
                return this.departmentAssignmentService.getAllDepartmentPillars(user.id, user.role);
              }

  @Post('departments/:departmentId/pillars')
  async assignPillarToDepartment(
    @CurrentUser() user: RequestUser,
    @Param('departmentId') departmentId: string,
    @Body() body: { pillarTemplateId: string; pillarWeight?: number },
  ) {
    return this.departmentAssignmentService.assignPillarToDepartment(
      user.id,
      user.role,
      departmentId,
      body.pillarTemplateId,
      body.pillarWeight,
    );
  }

  @Delete('department-pillars/:departmentPillarId')
  async unassignPillarFromDepartment(
    @CurrentUser() user: RequestUser,
    @Param('departmentPillarId') departmentPillarId: string,
  ) {
    return this.departmentAssignmentService.unassignPillarFromDepartment(
      user.id,
      user.role,
      departmentPillarId,
    );
  }

  @Get('department-pillars/:departmentPillarId/kpis')
  async getDepartmentPillarKPIs(
    @CurrentUser() user: RequestUser,
    @Param('departmentPillarId') departmentPillarId: string,
  ) {
    return this.departmentAssignmentService.getDepartmentPillarKPIs(
      user.id,
      user.role,
      departmentPillarId,
    );
  }
}