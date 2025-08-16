import { IsString, IsArray, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignKpiToCoordinatorDto {
  @ApiProperty({
    description: 'The ID of the coordinator to assign KPIs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  coordinatorId: string;

  @ApiProperty({
    description: 'Array of KPI IDs to assign to the coordinator',
    example: ['123e4567-e89b-12d3-a456-426614174001', '123e4567-e89b-12d3-a456-426614174002'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  kpiIds: string[];
}
