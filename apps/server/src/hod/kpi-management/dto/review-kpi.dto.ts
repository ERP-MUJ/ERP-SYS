import { IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReviewCoordinatorKpiDto {
  @ApiProperty({
    description: 'Action to perform on the coordinator KPI submission',
    example: 'APPROVE',
    enum: ['APPROVE', 'REJECT', 'REQUEST_REVISION'],
  })
  @IsEnum(['APPROVE', 'REJECT', 'REQUEST_REVISION'])
  action: 'APPROVE' | 'REJECT' | 'REQUEST_REVISION';

  @ApiProperty({
    description: 'Optional comments from the HOD about the review',
    example: 'Good job, but please improve the data analysis section',
    required: false,
  })
  @IsString()
  comments?: string;
}
