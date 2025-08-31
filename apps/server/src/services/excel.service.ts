import { Injectable, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { ExcelValidationErrorDto } from '../coordinator/dto/excel-upload.dto';
import type { FormElementInstance } from '@workspace/types/types';

export interface ExcelExtractionOptions {
  sheetName?: string;
  includeHeaders?: boolean;
  startRow?: number;
  endRow?: number;
  skipEmptyRows?: boolean;
}

export interface ExtractedExcelData {
  data: Record<string, unknown>[];
  headers: string[];
  rowCount: number;
  sheetName: string;
}

@Injectable()
export class ExcelValidationService {
  validateKpiData(
    data: Record<string, unknown>[],
    headers: string[],
    formElements: FormElementInstance[],
  ): {
    isValid: boolean;
    errors: ExcelValidationErrorDto[];
    processedData: Record<string, unknown>[];
  } {
    const errors: ExcelValidationErrorDto[] = [];
    const processedData: Record<string, unknown>[] = [];

    // Create a map of form elements by label for quick lookup
    const elementMap = new Map<string, FormElementInstance>();
    formElements.forEach((element) => {
      const label = element.attributes.label || 'Unknown Field';
      elementMap.set(label.toLowerCase(), element);
    });

    // Process each row
    data.forEach((row, rowIndex) => {
      const rowNumber = rowIndex + 2; // +2 because Excel is 1-based and we skip header
      let rowHasErrors = false;

      // Validate each column
      headers.forEach((header) => {
        const element = elementMap.get(header.toLowerCase());
        if (!element) {
          // Skip columns that don't match any form element
          return;
        }

        const value = row[header];
        const validationResult = this.validateField(element, value, header);

        if (!validationResult.isValid) {
          errors.push({
            row: rowNumber,
            field: header,
            message: validationResult.message,
            value: this.safeStringify(value),
          });
          rowHasErrors = true;
        }
      });

      // Only add valid rows to processed data
      if (!rowHasErrors) {
        processedData.push(row);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      processedData,
    };
  }

  /**
   * Validates a single field against its form element definition
   *
   * @param element - Form element to validate against
   * @param value - Value to validate
   * @param fieldName - Name of the field for error reporting
   * @returns Validation result
   */
  private validateField(
    element: FormElementInstance,
    value: unknown,
    fieldName: string,
  ): { isValid: boolean; message: string } {
    const { type, attributes } = element;

    // Check if required field is empty
    if (attributes.required && (value === null || value === undefined || value === '')) {
      return {
        isValid: false,
        message: `Required field '${fieldName}' cannot be empty`,
      };
    }

    // Skip validation for empty optional fields
    if (!attributes.required && (value === null || value === undefined || value === '')) {
      return { isValid: true, message: '' };
    }

    // Type-specific validation
    switch (type) {
      case 'text':
      case 'textarea':
        return this.validateText(value, attributes, fieldName);

      case 'number':
        return this.validateNumber(value, attributes, fieldName);

      case 'email':
        return this.validateEmail(value, fieldName);

      case 'date':
        return this.validateDate(value, fieldName);

      case 'select':
      case 'radio':
        return this.validateSelect(value, attributes, fieldName);

      case 'checkbox':
        return this.validateCheckbox(value, fieldName);

      default:
        return { isValid: true, message: '' };
    }
  }

  /**
   * Validates text fields
   */
  private validateText(
    value: unknown,
    attributes: Record<string, unknown>,
    fieldName: string,
  ): { isValid: boolean; message: string } {
    if (typeof value !== 'string') {
      return {
        isValid: false,
        message: `Field '${fieldName}' must be text`,
      };
    }

    // Check minimum length
    const minLength = typeof attributes.minLength === 'number' ? attributes.minLength : undefined;
    if (minLength && value.length < minLength) {
      return {
        isValid: false,
        message: `Field '${fieldName}' must be at least ${minLength} characters long`,
      };
    }

    // Check maximum length
    const maxLength = typeof attributes.maxLength === 'number' ? attributes.maxLength : undefined;
    if (maxLength && value.length > maxLength) {
      return {
        isValid: false,
        message: `Field '${fieldName}' must be no more than ${maxLength} characters long`,
      };
    }

    return { isValid: true, message: '' };
  }

  /**
   * Validates number fields
   */
  private validateNumber(
    value: unknown,
    attributes: Record<string, unknown>,
    fieldName: string,
  ): { isValid: boolean; message: string } {
    // Convert string to number if needed
    let numValue: number;
    if (typeof value === 'string') {
      numValue = parseFloat(value);
      if (isNaN(numValue)) {
        return {
          isValid: false,
          message: `Field '${fieldName}' must be a valid number`,
        };
      }
    } else if (typeof value === 'number') {
      numValue = value;
    } else {
      return {
        isValid: false,
        message: `Field '${fieldName}' must be a number`,
      };
    }

    // Check minimum value
    const minValue = typeof attributes.min === 'number' ? attributes.min : undefined;
    if (minValue !== undefined && numValue < minValue) {
      return {
        isValid: false,
        message: `Field '${fieldName}' must be at least ${minValue}`,
      };
    }

    // Check maximum value
    const maxValue = typeof attributes.max === 'number' ? attributes.max : undefined;
    if (maxValue !== undefined && numValue > maxValue) {
      return {
        isValid: false,
        message: `Field '${fieldName}' must be no more than ${maxValue}`,
      };
    }

    return { isValid: true, message: '' };
  }

  /**
   * Validates email fields
   */
  private validateEmail(value: unknown, fieldName: string): { isValid: boolean; message: string } {
    if (typeof value !== 'string') {
      return {
        isValid: false,
        message: `Field '${fieldName}' must be text`,
      };
    }

    // Simple email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return {
        isValid: false,
        message: `Field '${fieldName}' must be a valid email address`,
      };
    }

    return { isValid: true, message: '' };
  }

  /**
   * Validates date fields
   */
  private validateDate(value: unknown, fieldName: string): { isValid: boolean; message: string } {
    if (typeof value !== 'string') {
      return {
        isValid: false,
        message: `Field '${fieldName}' must be text`,
      };
    }

    // Check if it's a valid date
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return {
        isValid: false,
        message: `Field '${fieldName}' must be a valid date`,
      };
    }

    return { isValid: true, message: '' };
  }

  /**
   * Validates select/radio fields
   */
  private validateSelect(
    value: unknown,
    attributes: Record<string, unknown>,
    fieldName: string,
  ): { isValid: boolean; message: string } {
    if (typeof value !== 'string') {
      return {
        isValid: false,
        message: `Field '${fieldName}' must be text`,
      };
    }

    const options = (attributes.options as Array<{ label: string; value: string }>) || [];
    const validValues = options.map((option) => option.value.toLowerCase());
    const inputValue = value.toLowerCase();

    if (!validValues.includes(inputValue)) {
      const validOptions = options.map((option) => option.label).join(', ');
      return {
        isValid: false,
        message: `Field '${fieldName}' must be one of: ${validOptions}`,
      };
    }

    return { isValid: true, message: '' };
  }

  /**
   * Validates checkbox fields
   */
  private validateCheckbox(value: unknown, fieldName: string): { isValid: boolean; message: string } {
    // Accept various boolean representations
    const validValues = ['true', 'false', 'yes', 'no', '1', '0', 'on', 'off'];
    const stringValue = this.safeStringify(value).toLowerCase();

    if (!validValues.includes(stringValue)) {
      return {
        isValid: false,
        message: `Field '${fieldName}' must be a boolean value (true/false, yes/no, 1/0)`,
      };
    }

    return { isValid: true, message: '' };
  }

  /**
   * Safely converts a value to string for error reporting
   */
  private safeStringify(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    try {
      return JSON.stringify(value);
    } catch {
      // Fallback for objects that can't be JSON stringified
      if (typeof value === 'object') {
        return '[Object]';
      }
      // At this point, value should only be primitive types
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
      }
      return '[Unknown]';
    }
  }
}

@Injectable()
export class ExcelService {
  /**
   * Generates an Excel template for KPI forms
   * Creates a workbook with headers from form elements
   *
   * @param formElements - Array of form elements with labels
   * @param kpiName - Name for the template (default: 'KPI Template')
   * @returns Buffer containing the Excel file
   */
  generateKpiTemplate(
    formElements: Array<{
      id: string;
      attributes: {
        label: string;
        required?: boolean;
        placeholder?: string;
        options?: Array<{ label: string; value: string }>;
      };
      type: string;
    }>,
  ): Buffer {
    try {
      const headers = formElements.map((element) => {
        return element.attributes.label || 'Field';
      });

      const templateData = [headers];

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(templateData);

      const columnWidths = headers.map(() => ({ wch: 20 }));
      worksheet['!cols'] = columnWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, 'KPI Template');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      return buffer;
    } catch (error) {
      throw new Error(`Failed to generate Excel template: ${error.message}`);
    }
  }

  extractFromBuffer(buffer: Buffer, options: ExcelExtractionOptions = {}): ExtractedExcelData {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = options.sheetName || workbook.SheetNames[0];

      if (!workbook.SheetNames.includes(sheetName)) {
        throw new BadRequestException(
          `Sheet '${sheetName}' not found. Available sheets: ${workbook.SheetNames.join(', ')}`,
        );
      }

      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: options.includeHeaders ? 1 : undefined,
      });

      if (jsonData.length === 0) {
        return {
          data: [],
          headers: [],
          rowCount: 0,
          sheetName,
        };
      }

      let headers: string[];
      let data: Record<string, unknown>[];

      if (options.includeHeaders && jsonData.length > 0) {
        headers = jsonData[0] as string[];
        data = jsonData.slice(1).map((row: unknown) => {
          const obj: Record<string, unknown> = {};
          headers.forEach((header, index) => {
            obj[header] = (row as unknown[])[index];
          });
          return obj;
        });
      } else {
        const firstRow = jsonData[0] as Record<string, unknown>;
        headers = Object.keys(firstRow);
        data = jsonData as Record<string, unknown>[];
      }

      if (options.skipEmptyRows) {
        data = data.filter((row) =>
          Object.values(row).some((value) => value !== null && value !== undefined && value !== ''),
        );
      }

      return {
        data,
        headers,
        rowCount: data.length,
        sheetName,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Invalid Excel file or unable to parse data');
    }
  }
}
