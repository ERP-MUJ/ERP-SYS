import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
import { RequestUser } from 'src/auth/dto/request-user.dto';
import { HodCoordinatorWorkflowService } from './hod-coordinator-workflow.service';
import { IsString, IsNotEmpty, IsIn } from 'class-validator';

class ReviewDto {
  @IsIn(['APPROVE', 'REJECT', 'REQUEST_REVISION'])
  action: 'APPROVE' | 'REJECT' | 'REQUEST_REVISION';

  @IsString()
  @IsNotEmpty()
  comments: string;
}

@ApiTags('HOD - Coordinator Workflow')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/hod/coordinator-workflow')
export class HodCoordinatorWorkflowController {
  constructor(private readonly service: HodCoordinatorWorkflowService) {}

  @Get('coordinators')
  getDepartmentCoordinators(@CurrentUser() user: RequestUser) {
    return this.service.getDepartmentCoordinators(user.id, user.role);
  }

  @Get('review')
  getKpisForReview(@CurrentUser() user: RequestUser) {
    return this.service.getKpisForReview(user.id, user.role);
  }

  @Post('review/:kpiId')
  review(@CurrentUser() user: RequestUser, @Param('kpiId') kpiId: string, @Body() body: ReviewDto) {
    console.log('HOD Review Request:', { userId: user.id, kpiId, action: body.action, comments: body.comments });
    return this.service.reviewCoordinatorSubmission(user.id, user.role, kpiId, body.action, body.comments);
  }
}
