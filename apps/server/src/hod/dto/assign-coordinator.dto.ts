import { IsUUID, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for assigning/changing faculty roles between FACULTY and KPI_COORDINATOR
 */
export class AssignCoordinatorDto {
  @ApiProperty({
    description: 'The UUID of the faculty member to assign/change role',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID(4, { message: 'Faculty ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Faculty ID is required' })
  faculty_id: string;

  @ApiProperty({
    description: 'The new role to assign to the faculty member',
    enum: ['FACULTY', 'KPI_COORDINATOR'],
    example: 'KPI_COORDINATOR',
  })
  @IsEnum(['FACULTY', 'KPI_COORDINATOR'], {
    message: 'Role must be either FACULTY or KPI_COORDINATOR',
  })
  @IsNotEmpty({ message: 'New role is required' })
  new_role: 'FACULTY' | 'KPI_COORDINATOR';
}

/**
 * DTO for assigning coordinator to KPI
 */
export class AssignKpiCoordinatorDto {
  @ApiProperty({
    description: 'The UUID of the coordinator to assign to the KPI',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID(4, { message: 'Coordinator ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Coordinator ID is required' })
  coordinatorId: string;
}
