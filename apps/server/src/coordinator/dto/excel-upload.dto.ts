import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsNumber, IsBoolean } from 'class-validator';

/**
 * DTO for Excel upload validation errors
 */
export class ExcelValidationErrorDto {
  @ApiProperty({
    description: 'Row number where the error occurred',
    example: 3,
  })
  @IsNumber()
  row: number;

  @ApiProperty({
    description: 'Column/field name where the error occurred',
    example: 'Student Name',
  })
  @IsString()
  field: string;

  @ApiProperty({
    description: 'Error message describing the validation failure',
    example: 'Required field is empty',
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Value that caused the validation error',
    example: '',
  })
  @IsOptional()
  @IsString()
  value?: string;
}

/**
 * DTO for Excel upload response with validation results
 */
export class ExcelUploadResponseDto {
  @ApiProperty({
    description: 'Success status of the upload operation',
    example: true,
  })
  @IsBoolean()
  success: boolean;

  @ApiProperty({
    description: 'Number of rows successfully processed',
    example: 45,
  })
  @IsNumber()
  processedRows: number;

  @ApiProperty({
    description: 'Number of rows with validation errors',
    example: 2,
  })
  @IsNumber()
  errorRows: number;

  @ApiProperty({
    description: 'Total number of rows in the Excel file',
    example: 47,
  })
  @IsNumber()
  totalRows: number;

  @ApiProperty({
    description: 'Validation errors found in the Excel data',
    type: [ExcelValidationErrorDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  validationErrors?: ExcelValidationErrorDto[];

  @ApiProperty({
    description: 'Success message or error description',
    example: 'Excel data uploaded successfully with 2 validation errors',
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Whether the data was successfully saved to the database',
    example: true,
  })
  @IsBoolean()
  dataSaved: boolean;
}
