import { Controller, Get, UseGuards } from '@nestjs/common';
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
}
