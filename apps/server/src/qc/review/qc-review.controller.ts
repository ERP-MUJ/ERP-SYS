import { Controller, Get, Param, Patch, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { QcReviewService } from './qc-review.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
import { RequestUser } from 'src/auth/dto/request-user.dto';
import { UserRole } from '@repo/db/prisma/client';

@Controller('qc/review')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QcReviewController {
  constructor(private readonly reviewService: QcReviewService) {}

  @Get('kpis/:kpiId')
  @Roles(UserRole.QAC)
  async getKpi(@CurrentUser() user: RequestUser, @Param('kpiId') kpiId: string) {
    return this.reviewService.getKpi(user.id, user.role, kpiId);
  }

  @Patch('kpis/:kpiId/status')
  @Roles(UserRole.QAC)
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

  @Patch('kpis/:kpiId/entries/:entryIndex/comment')
  @Roles(UserRole.QAC)
  async saveEntryComment(
    @CurrentUser() user: RequestUser,
    @Param('kpiId') kpiId: string,
    @Param('entryIndex') entryIndex: string,
    @Body() body: { comment: string },
  ) {
    const index = parseInt(entryIndex, 10);
    if (isNaN(index)) {
      throw new BadRequestException('Invalid entry index');
    }

    return this.reviewService.saveEntryComment(user.id, user.role, kpiId, index, body.comment || '');
  }

  @Get('kpis/:kpiId/entry-comments')
  @Roles(UserRole.QAC, UserRole.HOD, UserRole.FACULTY)
  async getEntryComments(@CurrentUser() user: RequestUser, @Param('kpiId') kpiId: string) {
    return this.reviewService.getEntryComments(user.id, user.role, kpiId);
  }
}
