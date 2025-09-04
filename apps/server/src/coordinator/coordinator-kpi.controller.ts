import { Controller, Get, Post, Patch, Param, Body, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiParam, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
import { UserRole } from '@repo/db/prisma/client';
import { CoordinatorKpiService } from './coordinator-kpi.service';
import { ExcelTemplateResponseDto } from './dto/excel.dto';
import { ExcelUploadResponseDto } from './dto/excel-upload.dto';

interface RequestUser {
  id: string;
  role: UserRole;
}

@ApiTags('Coordinator KPI Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.KPI_COORDINATOR)
@Controller('coordinator/kpi')
export class CoordinatorKpiController {
  constructor(private readonly coordinatorKpiService: CoordinatorKpiService) {}

  // Get all KPIs assigned to the coordinator
  @Get('/assigned')
  async getAssignedKpis(@CurrentUser() user: RequestUser) {
    return this.coordinatorKpiService.getAssignedKpis(user.id, user.role);
  }

  // Get details of a specific KPI for form filling
  @Get('/:kpiId')
  async getKpiDetails(@CurrentUser() user: RequestUser, @Param('kpiId') kpiId: string) {
    return this.coordinatorKpiService.getKpiDetails(user.id, user.role, kpiId);
  }

  // Submit KPI form data
  @Post('/:kpiId/submit')
  async submitKpiForm(
    @CurrentUser() user: RequestUser,
    @Param('kpiId') kpiId: string,
    @Body() body: { entries: Record<string, unknown>[]; comments?: string },
  ) {
    return this.coordinatorKpiService.submitKpiForm(
      user.id,
      user.role,
      kpiId,
      { entries: body.entries },
      body.comments,
    );
  }

  // Save draft (does not submit to HOD)
  @Post('/:kpiId/draft')
  async saveDraft(
    @CurrentUser() user: RequestUser,
    @Param('kpiId') kpiId: string,
    @Body() body: { entries: Record<string, unknown>[]; comments?: string },
  ) {
    return this.coordinatorKpiService.saveDraft(user.id, user.role, kpiId, { entries: body.entries }, body.comments);
  }

  // Resubmit KPI after revision request
  @Patch('/:kpiId/resubmit')
  async resubmitAfterRevision(
    @CurrentUser() user: RequestUser,
    @Param('kpiId') kpiId: string,
    @Body() body: { entries: Record<string, unknown>[]; comments?: string },
  ) {
    return this.coordinatorKpiService.resubmitAfterRevision(
      user.id,
      user.role,
      kpiId,

      { entries: body.entries },
      body.comments,
    );
  }

  @Get('/:kpiId/template')
  @ApiParam({ name: 'kpiId', description: 'KPI ID to generate template for' })
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
    return await this.coordinatorKpiService.downloadKpiTemplate(user.id, user.role, kpiId);
  }

  @Post('/:kpiId/upload')
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
    return await this.coordinatorKpiService.uploadExcel(user.id, user.role, kpiId, file);
  }
}
