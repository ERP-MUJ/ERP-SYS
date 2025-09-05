import { Controller, Get, UseGuards, Param, Query } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
import { RequestUser } from 'src/auth/dto/request-user.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { HodDashboardService } from './hod-dashboard.service';

@ApiTags('HOD Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/hod/dashboard')
export class HodDashboardController {
  constructor(private readonly hodDashboardService: HodDashboardService) {}

  @Get('score-sheet')
  async getScoreSheetData(@CurrentUser() user: RequestUser, @Query('pillarId') pillarId?: string) {
    return this.hodDashboardService.getScoreSheetData(user.id, user.role, '', pillarId);
  }

  @Get('pillars')
  async getDepartmentPillars(@CurrentUser() user: RequestUser) {
    return this.hodDashboardService.getDepartmentPillars(user.id, user.role, '');
  }
}
