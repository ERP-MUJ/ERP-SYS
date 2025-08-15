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

export class ReviewCoordinatorKpiDto {
  @ApiProperty({
    description: 'The action to take on the coordinator submission',
    example: 'approve',
    enum: ['approve', 'reject', 'revision'],
  })
  @IsString()
  action: 'approve' | 'reject' | 'revision';

  @ApiProperty({
    description: 'Optional comments from the HOD about the review',
    example: 'Good job, but please improve the data analysis section',
    required: false,
  })
  @IsString()
  comments?: string;
}
