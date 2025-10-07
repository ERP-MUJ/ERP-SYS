import { Controller, Get, Post, Delete, Param, Body, UseGuards, Patch } from '@nestjs/common';
import { DepartmentAssignmentService } from './department-assignment.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
import { RequestUser } from 'src/auth/dto/request-user.dto';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('QAC Department Assignment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/qc/department-assignment')
export class DepartmentAssignmentController {
  constructor(private readonly departmentAssignmentService: DepartmentAssignmentService) {}

  @Get('departments')
  getDepartments(@CurrentUser() user: RequestUser) {
    return this.departmentAssignmentService.getDepartments(user.id, user.role);
  }

  @Get('pillar-templates')
  getPillarTemplates(@CurrentUser() user: RequestUser) {
    return this.departmentAssignmentService.getPillarTemplates(user.id, user.role);
  }

  @Get('departments/:departmentId/pillars')
  getDepartmentPillars(@CurrentUser() user: RequestUser, @Param('departmentId') departmentId: string) {
    return this.departmentAssignmentService.getDepartmentPillars(user.id, user.role, departmentId);
  }

  @Get('all-department-pillars')
  getAllDepartmentPillars(@CurrentUser() user: RequestUser) {
    return this.departmentAssignmentService.getAllDepartmentPillars(user.id, user.role);
  }

  @Post('departments/:departmentId/pillars')
  assignPillarToDepartment(
    @CurrentUser() user: RequestUser,
    @Param('departmentId') departmentId: string,
    @Body() body: { pillarTemplateId: string; pillarWeight?: number; pillarTarget?: number },
  ) {
    return this.departmentAssignmentService.assignPillarToDepartment(
      user.id,
      user.role,
      departmentId,
      body.pillarTemplateId,
      body.pillarWeight,
      body.pillarTarget,
    );
  }

  @Post('assign-all')
  @ApiOperation({
    summary: 'Assign all pillar templates and KPIs to all departments',
  })
  assignPillarAndKpiToAllDepartments(@CurrentUser() user: RequestUser) {
    return this.departmentAssignmentService.assignPillarAndKpiToAllDepartments(user.id, user.role);
  }

  /**
   * Update a DepartmentPillar, e.g., its weightage
   * PATCH /qc/department-assignment/department-pillars/:departmentPillarId
   */
  @Patch('department-pillars/:departmentPillarId')
  updateDepartmentPillar(
    @CurrentUser() user: RequestUser,
    @Param('departmentPillarId') departmentPillarId: string,
    @Body() body: { pillarWeight?: number; pillarTarget?: number },
  ) {
    return this.departmentAssignmentService.updateDepartmentPillar(
      user.id,
      user.role,
      departmentPillarId,
      body.pillarWeight,
      body.pillarTarget,
    );
  }

  @Delete('department-pillars/:departmentPillarId')
  unassignPillarFromDepartment(
    @CurrentUser() user: RequestUser,
    @Param('departmentPillarId') departmentPillarId: string,
  ) {
    return this.departmentAssignmentService.unassignPillarFromDepartment(user.id, user.role, departmentPillarId);
  }

  @Get('department-pillars/:departmentPillarId/kpis')
  getDepartmentPillarKPIs(@CurrentUser() user: RequestUser, @Param('departmentPillarId') departmentPillarId: string) {
    return this.departmentAssignmentService.getDepartmentPillarKPIs(user.id, user.role, departmentPillarId);
  }

  @Get('department-pillars/:departmentPillarId/all-kpis')
  getAllDepartmentPillarKPIs(
    @CurrentUser() user: RequestUser,
    @Param('departmentPillarId') departmentPillarId: string,
  ) {
    return this.departmentAssignmentService.getAllDepartmentPillarKPIs(user.id, user.role, departmentPillarId);
  }

  @Post('department-pillars/:departmentPillarId/kpis')
  assignKpiToDepartmentPillar(
    @CurrentUser() user: RequestUser,
    @Param('departmentPillarId') departmentPillarId: string,
    @Body() body: { kpiTemplateId: string; kpiValue: number; kpiTarget?: number },
  ) {
    return this.departmentAssignmentService.assignKpiToDepartmentPillar(
      user.id,
      user.role,
      departmentPillarId,
      body.kpiTemplateId,
      body.kpiValue,
      body.kpiTarget,
    );
  }

  @Patch('department-kpis/:departmentKpiId')
  updateDepartmentKpi(
    @CurrentUser() user: RequestUser,
    @Param('departmentKpiId') departmentKpiId: string,
    @Body() body: { kpiValue?: number; kpiTarget?: number },
  ) {
    return this.departmentAssignmentService.updateDepartmentKpi(
      user.id,
      user.role,
      departmentKpiId,
      body.kpiValue,
      body.kpiTarget,
    );
  }

  @Delete('department-kpis/:departmentKpiId')
  unassignKpiFromDepartmentPillar(@CurrentUser() user: RequestUser, @Param('departmentKpiId') departmentKpiId: string) {
    return this.departmentAssignmentService.unassignKpiFromDepartmentPillar(user.id, user.role, departmentKpiId);
  }
}
