import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
import { RequestUser } from 'src/auth/dto/request-user.dto';
import { HodKpiService } from './kpi-management.service';
@ApiTags('HOD - KPI Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/hod/kpi-management')
export class HodKpiController {
  constructor(private readonly hodKpiService: HodKpiService) {}
  @Get('/debug')
  @ApiOperation({ summary: 'Debug current user info' })
  @ApiResponse({ status: 200, description: 'Returns current user information' })
  debugUser(@CurrentUser() user: RequestUser) {
    console.log('HOD Controller - Debug user:', user);
    return {
      user,
      message: 'Debug endpoint - check server logs for user info',
    };
  }
  @Get('/pillars')
  @ApiOperation({ summary: 'Get all pillars assigned to HOD department' })
  @ApiResponse({ status: 200, description: 'Returns all department pillars with KPIs' })
  async getDepartmentPillars(@CurrentUser() user: RequestUser) {
    console.log('HOD Controller - getDepartmentPillars called with user:', user);
    return this.hodKpiService.getDepartmentPillars(user.id, user.role);
  }
  @Get('/pillars/:pillarId/kpis')
  @ApiOperation({ summary: 'Get KPIs for a specific department pillar' })
  @ApiResponse({ status: 200, description: 'Returns KPIs for the pillar' })
  async getDepartmentPillarKPIs(@CurrentUser() user: RequestUser, @Param('pillarId') pillarId: string) {
    return this.hodKpiService.getDepartmentPillarKPIs(user.id, user.role, pillarId);
  }
  @Get('/kpi/:kpiId')
  @ApiOperation({ summary: 'Get KPI details for form filling' })
  @ApiResponse({ status: 200, description: 'Returns KPI details with form structure' })
  async getKpiDetails(@CurrentUser() user: RequestUser, @Param('kpiId') kpiId: string) {
    return this.hodKpiService.getKpiDetails(user.id, user.role, kpiId);
  }
  @Put('/kpi/:kpiId/responses')
  @ApiOperation({ summary: 'Update KPI form responses' })
  @ApiResponse({ status: 200, description: 'KPI responses updated successfully' })
  async updateKpiResponses(
    @CurrentUser() user: RequestUser,
    @Param('kpiId') kpiId: string,
    @Body() formResponses: { entries: Record<string, unknown>[] },
  ) {
    return this.hodKpiService.updateKpiResponses(user.id, user.role, kpiId, formResponses);
  }
  @Put('/kpi/:kpiId/submit')
  @ApiOperation({ summary: 'Submit KPI to QC for review' })
  @ApiResponse({ status: 200, description: 'KPI submitted to QC successfully' })
  async submitKpiToQc(
    @CurrentUser() user: RequestUser,
    @Param('kpiId') kpiId: string,
    @Body() formResponses: { entries: Record<string, unknown>[] },
  ) {
    return this.hodKpiService.submitKpiToQc(user.id, user.role, kpiId, formResponses);
  }
}
