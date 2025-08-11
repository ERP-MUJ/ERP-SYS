import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { CoordinatorService } from './coordinator.service';
import { AssignCoordinatorDto } from './dto/assign-coordinator.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
import { RequestUser } from 'src/auth/dto/request-user.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('HOD Coordinator Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/hod/coordinator')
export class CoordinatorController {
  constructor(private readonly coordinatorService: CoordinatorService) {}

  @Post('assign')
  async assignCoordinator(
    @CurrentUser() user: RequestUser,
    @Body() payload: AssignCoordinatorDto,
  ) {
    console.log('Assign Coordinator Request:', { userId: user.id, payload });
    return this.coordinatorService.assignCoordinator(user.id, user.role, payload);
  }

  @Get('faculty')
  async getDepartmentFaculty(@CurrentUser() user: RequestUser) {
    return this.coordinatorService.getDepartmentFaculty(user.id, user.role);
  }
} 