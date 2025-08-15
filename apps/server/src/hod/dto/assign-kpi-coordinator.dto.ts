import { IsString } from 'class-validator';

export class AssignKpiCoordinatorDto {
  @IsString()
  coordinatorId: string;
}
