import { Controller, Get, Param, Patch, Body, UseGuards, Post } from '@nestjs/common';
import { QcReviewService } from './qc-review.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
import { RequestUser } from 'src/auth/dto/request-user.dto';
import { UserRole } from '@repo/db/prisma/client';
import { ReviewKpiEntryDto, BulkReviewKpiEntriesDto } from './dto/review-kpi-entry.dto';

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
    console.log('QC Review Controller - updateStatus called:', {
      userId: user.id,
      userRole: user.role,
      kpiId,
      body,
    });

    try {
      const result = await this.reviewService.updateStatus(user.id, user.role, kpiId, body.action, body.remark || '');
      console.log('QC Review Controller - updateStatus success:', result);
      return result;
    } catch (error) {
      console.error('QC Review Controller - updateStatus error:', error);
      throw error;
    }
  }

  @Get('kpis/:kpiId/entries')
  async getKpiEntriesWithReview(@CurrentUser() user: RequestUser, @Param('kpiId') kpiId: string) {
    return this.reviewService.getKpiEntriesWithReview(user.id, user.role, kpiId);
  }

  @Post('kpis/:kpiId/entries/review')
  async reviewKpiEntry(
    @CurrentUser() user: RequestUser,
    @Param('kpiId') kpiId: string,
    @Body() reviewDto: ReviewKpiEntryDto,
  ) {
    return this.reviewService.reviewKpiEntry(user.id, user.role, kpiId, reviewDto);
  }

  @Post('kpis/entries/bulk-review')
  async bulkReviewKpiEntries(@CurrentUser() user: RequestUser, @Body() bulkReviewDto: BulkReviewKpiEntriesDto) {
    return this.reviewService.bulkReviewKpiEntries(user.id, user.role, bulkReviewDto);
  }
}
