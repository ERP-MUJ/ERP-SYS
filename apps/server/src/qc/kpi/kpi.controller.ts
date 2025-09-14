import { Controller, Post, Body, UseGuards, Delete, Param, Patch, Get, Query } from '@nestjs/common';
import { KpiService } from './kpi.service';
import { CreateKpiDto } from './dto/create-kpi.dto';
import { UpdateKpiDto } from './dto/update-kpi.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
import { RequestUser } from 'src/auth/dto/request-user.dto';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Pillar - KPI Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/qc/:pillarId/kpi')
export class KpiController {
  constructor(private readonly kpiService: KpiService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new KPI template for a specific pillar' })
  async createKpi(@CurrentUser() user: RequestUser, @Param('pillarId') pillarId: string, @Body() dto: CreateKpiDto) {
    return this.kpiService.createKpi(user.id, user.role, pillarId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all KPI templates for a specific pillar' })
  async getKpis(@CurrentUser() user: RequestUser, @Param('pillarId') pillarId: string) {
    return this.kpiService.getKpis(user.id, user.role, pillarId);
  }

  @Get(':kpiId')
  @ApiOperation({ summary: 'Get a specific KPI template by ID' })
  async getKpiById(
    @CurrentUser() user: RequestUser,
    @Param('pillarId') pillarId: string,
    @Param('kpiId') kpiId: string,
  ) {
    return this.kpiService.getKpiById(user.id, user.role, kpiId);
  }

  @Patch(':kpiId')
  @ApiOperation({ summary: 'Update an existing KPI template' })
  async updateKpi(
    @CurrentUser() user: RequestUser,
    @Param('pillarId') pillarId: string,
    @Param('kpiId') kpiId: string,
    @Body() dto: UpdateKpiDto,
  ) {
    return this.kpiService.updateKpi(user.id, user.role, kpiId, dto);
  }

  @Get('check-duplicate/:kpiNumber')
  @ApiOperation({ summary: 'Check if KPI number already exists in this pillar' })
  async checkKpiNumberExists(
    @CurrentUser() user: RequestUser,
    @Param('pillarId') pillarId: string,
    @Param('kpiNumber') kpiNumber: string,
    @Query('academicYear') academicYear: string,
    @Query('excludeKpiId') excludeKpiId?: string,
  ) {
    return this.kpiService.checkKpiNumberExists(
      user.id,
      user.role,
      pillarId,
      parseInt(kpiNumber),
      parseInt(academicYear),
      excludeKpiId,
    );
  }

  @Delete(':kpiId')
  @ApiOperation({ summary: 'Delete a KPI template' })
  async deleteKpi(
    @CurrentUser() user: RequestUser,
    @Param('pillarId') pillarId: string,
    @Param('kpiId') kpiId: string,
  ) {
    return this.kpiService.deleteKpi(user.id, user.role, kpiId);
  }
}
