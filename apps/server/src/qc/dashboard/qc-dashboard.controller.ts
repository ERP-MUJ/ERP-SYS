import { Controller, Get, UseGuards, Param, Query } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
import { RequestUser } from 'src/auth/dto/request-user.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { QcDashboardService } from './qc-dashboard.service';

@ApiTags('QAC Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/qc/dashboard')
export class QcDashboardController {
  constructor(private readonly qcDashboardService: QcDashboardService) {}

  @Get()
  async getDashboardData(@CurrentUser() user: RequestUser) {
    return this.qcDashboardService.getDashboardData(user.id, user.role);
  }

  @Get('score-sheet/:deptId')
  async getScoreSheetData(
    @CurrentUser() user: RequestUser,
    @Param('deptId') deptId: string,
    @Query('pillarId') pillarId?: string,
  ) {
    return this.qcDashboardService.getScoreSheetData(user.id, user.role, deptId, pillarId);
  }

  @Get('departments/:deptId/pillars')
  async getDepartmentPillars(@CurrentUser() user: RequestUser, @Param('deptId') deptId: string) {
    return this.qcDashboardService.getDepartmentPillars(user.id, user.role, deptId);
  }
}
