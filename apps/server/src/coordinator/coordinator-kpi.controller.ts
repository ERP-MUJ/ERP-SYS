import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
import { UserRole } from '@repo/db/prisma/client';
import { CoordinatorKpiService } from './coordinator-kpi.service';

interface RequestUser {
  id: string;
  email: string;
  role: UserRole;
}

@ApiTags('KPI Coordinator')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.KPI_COORDINATOR)
@Controller('/coordinator/kpi')
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
    return this.coordinatorKpiService.saveDraft(
      user.id,
      user.role,
      kpiId,
      { entries: body.entries },
      body.comments,
    );
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
}
