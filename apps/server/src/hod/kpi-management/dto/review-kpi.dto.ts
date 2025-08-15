import { IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReviewCoordinatorKpiDto {
  @ApiProperty({
    description: 'The action to take on the coordinator submission',
    example: 'approve',
    enum: ['approve', 'reject', 'revision'],
  })
  @IsEnum(['approve', 'reject', 'revision'])
  action: 'approve' | 'reject' | 'revision';

  @ApiProperty({
    description: 'Optional comments from the HOD about the review',
    example: 'Good job, but please improve the data analysis section',
    required: false,
  })
  @IsString()
  comments?: string;
}
