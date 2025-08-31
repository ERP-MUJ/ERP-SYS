import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray } from 'class-validator';

export class ExcelTemplateResponseDto {
  @ApiProperty({
    description: 'Base64 encoded Excel file buffer',
    example: 'UEsDBBQAAAAIAA...',
  })
  @IsString()
  buffer: string;

  @ApiProperty({
    description: 'Filename for the downloaded Excel template',
    example: 'KPI_4a70c8f5-2936-46df-b634-d16559a15ece_Template.xlsx',
  })
  @IsString()
  fileName: string;
}

export class ExcelUploadOptionsDto {
  @ApiProperty({
    description: 'Sheet name to extract data from (if not specified, uses first sheet)',
    required: false,
    example: 'Sheet1',
  })
  @IsOptional()
  @IsString()
  sheetName?: string;

  @ApiProperty({
    description: 'Whether to include header row in the data',
    required: false,
    default: true,
  })
  @IsOptional()
  includeHeaders?: boolean;

  @ApiProperty({
    description: 'Starting row for data extraction (1-based index)',
    required: false,
    example: 2,
  })
  @IsOptional()
  startRow?: number;

  @ApiProperty({
    description: 'Ending row for data extraction (1-based index)',
    required: false,
    example: 100,
  })
  @IsOptional()
  endRow?: number;

  @ApiProperty({
    description: 'Whether to skip empty rows',
    required: false,
    default: true,
  })
  @IsOptional()
  skipEmptyRows?: boolean;
}

/**
 * DTO for Excel processing response
 * Contains extracted data and validation results
 */
export class ExcelProcessingResponseDto {
  @ApiProperty({
    description: 'Success status of the operation',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Extracted data from Excel',
    required: false,
    type: Array,
    items: { type: 'object' },
  })
  @IsOptional()
  @IsArray()
  data?: Record<string, unknown>[];

  @ApiProperty({
    description: 'Headers from the Excel file',
    required: false,
    type: Array,
    items: { type: 'string' },
  })
  @IsOptional()
  @IsArray()
  headers?: string[];

  @ApiProperty({
    description: 'Number of rows processed',
    required: false,
    example: 50,
  })
  @IsOptional()
  rowCount?: number;

  @ApiProperty({
    description: 'Sheet name from which data was extracted',
    required: false,
    example: 'Sheet1',
  })
  @IsOptional()
  @IsString()
  sheetName?: string;

  @ApiProperty({
    description: 'Any validation errors found',
    required: false,
    type: Array,
    items: { type: 'string' },
  })
  @IsOptional()
  @IsArray()
  errors?: string[];

  @ApiProperty({
    description: 'File information',
    required: false,
    type: Object,
  })
  @IsOptional()
  fileInfo?: {
    sheetNames: string[];
    sheetCount: number;
  };
}
