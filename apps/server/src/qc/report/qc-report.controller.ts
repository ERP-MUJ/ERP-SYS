import { Controller, Get, Param, UseGuards, StreamableFile } from '@nestjs/common';
import { QcReportService } from './qc-report.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
import { RequestUser } from 'src/auth/dto/request-user.dto';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { QcReportKpiOption } from '@workspace/types/types';

@ApiTags('QAC Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/qc/report')
export class QcReportController {
  constructor(private readonly qcReportService: QcReportService) {}

  @Get('kpi-options')
  @ApiOperation({ summary: 'List KPI templates available for report generation' })
  @ApiResponse({ status: 200, description: 'List of KPI templates returned successfully' })
  async getKpiOptions(@CurrentUser() user: RequestUser): Promise<QcReportKpiOption[]> {
    return this.qcReportService.getKpiOptions(user.id, user.role);
  }

  @Get('kpi/:kpiTemplateId/download')
  @ApiOperation({ summary: 'Download KPI report workbook for the selected KPI template' })
  @ApiParam({ name: 'kpiTemplateId', description: 'Identifier of the KPI template' })
  @ApiResponse({ status: 200, description: 'Workbook stream initiated successfully', type: StreamableFile })
  async downloadKpiReport(
    @Param('kpiTemplateId') kpiTemplateId: string,
    @CurrentUser() user: RequestUser,
  ): Promise<StreamableFile> {
    return this.qcReportService.generateKpiReport(user.id, user.role, kpiTemplateId);
  }

  @Get('department/:departmentId/download')
  @ApiOperation({ summary: 'Download department-wide performance and KPI report' })
  @ApiParam({ name: 'departmentId', description: 'Department identifier' })
  @ApiResponse({ status: 200, description: 'Workbook stream initiated successfully', type: StreamableFile })
  async downloadDepartmentReport(
    @Param('departmentId') departmentId: string,
    @CurrentUser() user: RequestUser,
  ): Promise<StreamableFile> {
    return this.qcReportService.generateDepartmentReport(user.id, user.role, departmentId);
  }
}
