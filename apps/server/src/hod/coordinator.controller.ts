import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CoordinatorService } from './coordinator.service';
import { AssignCoordinatorDto, AssignKpiCoordinatorDto } from './dto/assign-coordinator.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/user.decorator';
import { RequestUser } from 'src/auth/dto/request-user.dto';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('HOD Coordinator Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('/hod/coordinator')
export class CoordinatorController {
  constructor(private readonly coordinatorService: CoordinatorService) {}

  @Post('assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Assign or update faculty coordinator role',
    description: "Allows HOD to assign or update a faculty member's role between FACULTY and KPI_COORDINATOR",
  })
  @ApiResponse({ status: 200, description: 'Role successfully updated' })
  @ApiResponse({ status: 403, description: 'Forbidden - User not authenticated or not HOD' })
  @ApiResponse({ status: 404, description: 'Faculty member or department not found' })
  async assignCoordinator(@CurrentUser() user: RequestUser, @Body() payload: AssignCoordinatorDto) {
    return this.coordinatorService.assignCoordinator(payload, user.id, user.role);
  }

  @Get('faculty')
  @ApiOperation({
    summary: 'Get department faculty members',
    description: "Retrieves all faculty and KPI coordinators in the HOD's department",
  })
  @ApiResponse({ status: 200, description: 'Successfully retrieved faculty list' })
  @ApiResponse({ status: 403, description: 'Forbidden - User not authenticated or not HOD' })
  @ApiResponse({ status: 404, description: 'HOD department not found' })
  async getDepartmentFaculty(@CurrentUser() user: RequestUser) {
    return this.coordinatorService.getDepartmentFaculty(user.id, user.role);
  }

  @Get('kpis')
  @ApiOperation({
    summary: 'Get department KPIs with assignments',
    description: "Retrieves all KPIs in the HOD's department with their assigned coordinators",
  })
  @ApiResponse({ status: 200, description: 'Successfully retrieved KPI list' })
  @ApiResponse({ status: 403, description: 'Forbidden - User not authenticated or not HOD' })
  @ApiResponse({ status: 404, description: 'HOD department not found' })
  async getDepartmentKpis(@CurrentUser() user: RequestUser) {
    return this.coordinatorService.getDepartmentKpis(user.id, user.role);
  }

  @Post('kpis/:kpiId/assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Assign coordinator to KPI',
    description: "Assigns a coordinator to a specific KPI in the HOD's department",
  })
  @ApiParam({ name: 'kpiId', description: 'The KPI ID to assign coordinator to', type: 'string' })
  @ApiResponse({ status: 200, description: 'Coordinator successfully assigned to KPI' })
  @ApiResponse({ status: 403, description: 'Forbidden - User not authenticated or not HOD' })
  @ApiResponse({ status: 404, description: 'KPI, coordinator, or department not found' })
  async assignCoordinatorToKpi(
    @CurrentUser() user: RequestUser,
    @Param('kpiId', ParseUUIDPipe) kpiId: string,
    @Body() body: AssignKpiCoordinatorDto,
  ) {
    return this.coordinatorService.assignCoordinatorToKpi(user.id, user.role, kpiId, body.coordinatorId);
  }

  @Delete('kpis/:kpiId/coordinators/:coordinatorId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove coordinator from KPI',
    description: 'Removes a coordinator assignment from a specific KPI',
  })
  @ApiParam({ name: 'kpiId', description: 'The KPI ID to remove coordinator from', type: 'string' })
  @ApiParam({ name: 'coordinatorId', description: 'The coordinator ID to remove', type: 'string' })
  @ApiResponse({ status: 200, description: 'Coordinator successfully removed from KPI' })
  @ApiResponse({ status: 403, description: 'Forbidden - User not authenticated or not HOD' })
  @ApiResponse({ status: 404, description: 'KPI or department not found' })
  async removeCoordinatorFromKpi(
    @CurrentUser() user: RequestUser,
    @Param('kpiId', ParseUUIDPipe) kpiId: string,
    @Param('coordinatorId', ParseUUIDPipe) coordinatorId: string,
  ) {
    return this.coordinatorService.removeCoordinatorFromKpi(user.id, user.role, kpiId, coordinatorId);
  }
}
