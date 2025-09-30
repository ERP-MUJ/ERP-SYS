import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { KpiStatus } from '@workspace/types/enums';

export class ReviewKpiEntryDto {
  @IsUUID()
  @IsNotEmpty()
  entry_id: string;

  @IsEnum(KpiStatus)
  @IsNotEmpty()
  status: KpiStatus;

  @IsString()
  @IsOptional()
  review?: string;
}

export class BulkReviewKpiEntriesDto {
  @IsUUID()
  @IsNotEmpty()
  kpi_id: string;

  @IsNotEmpty()
  entries: ReviewKpiEntryDto[];
}
