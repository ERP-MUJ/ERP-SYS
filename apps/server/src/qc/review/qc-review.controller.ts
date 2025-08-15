import { Controller, Get, Param, Patch, Body, UseGuards } from '@nestjs/common';
import { QcReviewService } from './qc-review.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
import { RequestUser } from 'src/auth/dto/request-user.dto';
import { UserRole } from '@repo/db/prisma/client';

@Controller('qc/review')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.QAC)
export class QcReviewController {
  constructor(private readonly reviewService: QcReviewService) {}

  @Get('kpis/:kpiId')
  async getKpi(@CurrentUser() user: RequestUser, @Param('kpiId') kpiId: string) {
    return this.reviewService.getKpi(user.id, user.role, kpiId);
  }

  @Patch('kpis/:kpiId/status')
  async updateStatus(
    @CurrentUser() user: RequestUser,
    @Param('kpiId') kpiId: string,
    @Body() body: { action: 'APPROVE' | 'REVISION' | 'REJECT'; remark?: string },
  ) {
    return this.reviewService.updateStatus(user.id, user.role, kpiId, body.action, body.remark || '');
  }
}
