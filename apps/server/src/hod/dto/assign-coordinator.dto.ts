import { IsUUID, IsEnum, IsNotEmpty } from 'class-validator';

/**
 * DTO for assigning/changing faculty roles
 */
export class AssignCoordinatorDto {
  @IsUUID()
  @IsNotEmpty()
  faculty_id: string;

  @IsEnum(['FACULTY', 'KPI_COORDINATOR'])
  @IsNotEmpty()
  new_role: 'FACULTY' | 'KPI_COORDINATOR';
}
