import { Injectable, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';

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
