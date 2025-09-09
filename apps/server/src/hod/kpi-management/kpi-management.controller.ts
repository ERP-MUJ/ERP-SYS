import { Controller, Get, Put, Param, Body, UseGuards, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
import { RequestUser } from 'src/auth/dto/request-user.dto';
import { HodKpiService } from './kpi-management.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ExcelTemplateResponseDto } from 'src/coordinator/dto/excel.dto';
import { ExcelUploadResponseDto } from 'src/coordinator/dto/excel-upload.dto';
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

  @Get('/kpi/:kpiId/template')
  @ApiOperation({ summary: 'Download Excel template for KPI data entry' })
  @ApiParam({ name: 'kpiId', description: 'KPI ID to download template for' })
  @ApiResponse({
    status: 200,
    description: 'Excel template downloaded successfully',
    type: ExcelTemplateResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'KPI not found',
  })
  async downloadKpiTemplate(
    @Param('kpiId') kpiId: string,
    @CurrentUser() user: RequestUser,
  ): Promise<ExcelTemplateResponseDto> {
    return await this.hodKpiService.downloadKpiTemplate(user.id, user.role, kpiId);
  }

  @Post('/kpi/:kpiId/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiParam({ name: 'kpiId', description: 'KPI ID to upload data for' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload Excel file with KPI data',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Excel file (.xlsx, .xls) with KPI data',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Excel file uploaded and processed successfully',
    type: ExcelUploadResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file format or validation errors',
  })
  @ApiResponse({
    status: 404,
    description: 'KPI not found',
  })
  async uploadExcel(
    @Param('kpiId') kpiId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: RequestUser,
  ): Promise<ExcelUploadResponseDto> {
    return await this.hodKpiService.uploadExcel(user.id, user.role, kpiId, file);
  }
}
