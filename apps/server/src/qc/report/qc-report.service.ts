import { Injectable, ForbiddenException, NotFoundException, StreamableFile, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from '@repo/db/prisma/client';
import * as XLSX from 'xlsx-js-style';
import type { QcReportKpiOption } from '@workspace/types/types';
import { QcReportKpiOptionSchema } from '@workspace/types/schema/qc-report.schema';

type BorderStyle = {
  style: string;
  color?: {
    rgb: string;
  };
};

type CellStyle = {
  font?: {
    name?: string;
    bold?: boolean;
    color?: { rgb: string };
    sz?: number;
  };
  fill?: {
    patternType?: string;
    fgColor?: { rgb: string };
    bgColor?: { rgb: string };
  };
  alignment?: {
    horizontal?: 'left' | 'right' | 'center';
    vertical?: 'top' | 'bottom' | 'center';
    wrapText?: boolean;
  };
  border?: Partial<Record<'top' | 'right' | 'bottom' | 'left', BorderStyle>>;
  numFmt?: string;
};

const TABLE_BORDER: BorderStyle = { style: 'thin', color: { rgb: 'FBBF24' } };

const SUMMARY_TITLE_STYLE: CellStyle = {
  font: { bold: true, color: { rgb: 'FFFFFFFF' }, sz: 12 },
  fill: { patternType: 'solid', fgColor: { rgb: 'C2410C' } },
  alignment: { horizontal: 'center', vertical: 'center' },
};

const SUMMARY_LABEL_STYLE: CellStyle = {
  font: { bold: true, color: { rgb: '7C2D12' } },
};

const SUMMARY_VALUE_STYLE: CellStyle = {
  alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
};

const SECTION_LABEL_STYLE: CellStyle = {
  font: { bold: true, color: { rgb: '9A3412' } },
  fill: { patternType: 'solid', fgColor: { rgb: 'FEF3C7' } },
  alignment: { horizontal: 'left', vertical: 'center' },
};

const TABLE_HEADER_STYLE: CellStyle = {
  font: { bold: true, color: { rgb: 'FFFFFFFF' } },
  fill: { patternType: 'solid', fgColor: { rgb: 'EA580C' } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: {
    top: TABLE_BORDER,
    bottom: TABLE_BORDER,
    left: TABLE_BORDER,
    right: TABLE_BORDER,
  },
};

const TABLE_DATA_STYLE: CellStyle = {
  alignment: { vertical: 'center', wrapText: true },
  border: {
    top: TABLE_BORDER,
    bottom: TABLE_BORDER,
    left: TABLE_BORDER,
    right: TABLE_BORDER,
  },
};

const PERFORMANCE_FOOTER_STYLE: CellStyle = {
  font: { bold: true, color: { rgb: '92400E' } },
  fill: { patternType: 'solid', fgColor: { rgb: 'FEF9C3' } },
  border: {
    top: TABLE_BORDER,
    bottom: TABLE_BORDER,
    left: TABLE_BORDER,
    right: TABLE_BORDER,
  },
};

@Injectable()
export class QcReportService {
  constructor(private readonly prisma: PrismaService) {}

  private assertQacRole(userRole: UserRole) {
    if (userRole !== UserRole.QAC) {
      throw new ForbiddenException('Only QAC members can perform this action');
    }
  }

  async getKpiOptions(userId: string, userRole: UserRole): Promise<QcReportKpiOption[]> {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertQacRole(userRole);

    const templates = await this.prisma.kpiTemplate.findMany({
      where: {
        created_by_user: userId,
      },
      select: {
        id: true,
        kpi_number: true,
        kpi_metric_name: true,
      },
      orderBy: [{ kpi_number: 'asc' }, { kpi_metric_name: 'asc' }],
    });

    return templates.map((template) =>
      QcReportKpiOptionSchema.parse({
        id: template.id,
        kpi_number: template.kpi_number,
        kpi_metric_name: template.kpi_metric_name,
      }),
    );
  }

  async generateKpiReport(userId: string, userRole: UserRole, kpiTemplateId: string): Promise<StreamableFile> {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertQacRole(userRole);

    if (!kpiTemplateId) {
      throw new BadRequestException('KPI template identifier is required');
    }

    const kpiTemplate = await this.prisma.kpiTemplate.findFirst({
      where: {
        id: kpiTemplateId,
        created_by_user: userId,
      },
      include: {
        pillar_template: {
          select: {
            pillar_name: true,
          },
        },
      },
    });

    if (!kpiTemplate) {
      throw new NotFoundException('KPI template not found');
    }

    const departmentKpis = await this.prisma.departmentKpi.findMany({
      where: {
        template_id: kpiTemplateId,
      },
      include: {
        department: {
          select: { id: true, dept_name: true },
        },
        department_pillar: {
          select: { pillar_name: true },
        },
        assigned_users: {
          select: {
            id: true,
            user_name: true,
            user_email: true,
            user_role: true,
          },
        },
      },
      orderBy: [{ department: { dept_name: 'asc' } }, { kpi_number: 'asc' }],
    });

    if (departmentKpis.length === 0) {
      throw new NotFoundException('No department assignments found for this KPI template');
    }

    const workbook = XLSX.utils.book_new();
    const usedSheetNames = new Map<string, number>();

    for (const departmentKpi of departmentKpis) {
      const departmentName = departmentKpi.department?.dept_name || 'Unknown Department';
      const sheetName = this.createSheetName(departmentName, usedSheetNames);

      const { rows, summaryRowCount, formHeaderLength, formEntriesCount } = this.buildKpiWorksheetData(
        departmentName,
        departmentKpi.department_pillar?.pillar_name ?? kpiTemplate.pillar_template?.pillar_name ?? '-',
        departmentKpi,
      );

      const worksheet = XLSX.utils.aoa_to_sheet(rows);
      worksheet['!cols'] = this.generateColumnWidths(rows);
      this.applySummaryStyles(worksheet, summaryRowCount);
      if (formHeaderLength > 0) {
        this.applyFormResponseStyles(worksheet, summaryRowCount, formHeaderLength, formEntriesCount);
      }
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    }

    const fileName = `KPI_${kpiTemplate.kpi_number}_report_${new Date().toISOString().split('T')[0]}.xlsx`;
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new StreamableFile(buffer, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: `attachment; filename="${fileName}"`,
    });
  }

  async generateDepartmentReport(userId: string, userRole: UserRole, departmentId: string): Promise<StreamableFile> {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertQacRole(userRole);

    if (!departmentId) {
      throw new BadRequestException('Department identifier is required');
    }

    const department = await this.prisma.department.findUnique({
      where: { id: departmentId },
      select: {
        id: true,
        dept_name: true,
        department_pillars: {
          where: { status: 'active' },
          include: {
            department_kpis: {
              include: {
                assigned_users: {
                  select: {
                    id: true,
                    user_name: true,
                    user_email: true,
                    user_role: true,
                  },
                },
              },
              orderBy: { kpi_number: 'asc' },
            },
          },
          orderBy: { assigned_date: 'asc' },
        },
      },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    if (department.department_pillars.length === 0) {
      throw new NotFoundException('No pillars found for the requested department');
    }

    const workbook = XLSX.utils.book_new();

    // Performance sheet
    const performanceSheet = this.buildPerformanceSheet(department.department_pillars);
    XLSX.utils.book_append_sheet(workbook, performanceSheet, 'Performance');

    const usedSheetNames = new Map<string, number>([['Performance', 1]]);

    for (const pillar of department.department_pillars) {
      for (const departmentKpi of pillar.department_kpis) {
        const baseName = `KPI ${departmentKpi.kpi_number}`;
        const sheetName = this.createSheetName(baseName, usedSheetNames);

        const { rows, summaryRowCount, formHeaderLength, formEntriesCount } = this.buildKpiWorksheetData(
          department.dept_name,
          pillar.pillar_name,
          departmentKpi,
        );

        const worksheet = XLSX.utils.aoa_to_sheet(rows);
        worksheet['!cols'] = this.generateColumnWidths(rows);
        this.applySummaryStyles(worksheet, summaryRowCount);
        if (formHeaderLength > 0) {
          this.applyFormResponseStyles(worksheet, summaryRowCount, formHeaderLength, formEntriesCount);
        }
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      }
    }

    const fileName = `${this.slugify(department.dept_name)}_department_report_${new Date().toISOString().split('T')[0]}.xlsx`;
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new StreamableFile(buffer, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: `attachment; filename="${fileName}"`,
    });
  }

  private buildPerformanceSheet(
    pillars: Array<{
      pillar_name: string;
      pillar_weight: number | null;
      percentage_target_achieved: number | null;
      performance: number | null;
      department_kpis: Array<{ id: string }>;
    }>,
  ) {
    const totalKpis = pillars.reduce((sum, pillar) => sum + pillar.department_kpis.length, 0);

    const headerRow = [
      'Sl. No.',
      `Parameter (${totalKpis} KPIs)`,
      'Weight (A)',
      '% of Target Achieved (B)',
      'Performance (A × B)',
    ];

    const bodyRows = pillars.map((pillar, index) => [
      index + 1,
      pillar.pillar_name,
      this.asNumber(pillar.pillar_weight),
      this.asNumber(pillar.percentage_target_achieved),
      this.asNumber(pillar.performance),
    ]);

    const totalPerformance = pillars.reduce(
      (sum, pillar) => sum + (pillar.performance ? Number(pillar.performance) : 0),
      0,
    );
    const totalWeight = pillars.reduce(
      (sum, pillar) => sum + (pillar.pillar_weight ? Number(pillar.pillar_weight) : 0),
      0,
    );

    const footerRow = ['Overall Performance', '', totalWeight, '', totalPerformance];

    const rows: (string | number | null)[][] = [headerRow, ...bodyRows, footerRow];
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    worksheet['!cols'] = this.generateColumnWidths(rows);

    this.applyRangeStyle(worksheet, 0, 0, 0, headerRow.length - 1, TABLE_HEADER_STYLE);

    if (bodyRows.length > 0) {
      this.applyRangeStyle(worksheet, 1, bodyRows.length, 0, headerRow.length - 1, TABLE_DATA_STYLE);
    }

    const footerRowIndex = rows.length - 1;
    this.applyRangeStyle(worksheet, footerRowIndex, footerRowIndex, 0, headerRow.length - 1, PERFORMANCE_FOOTER_STYLE);

    return worksheet;
  }

  private buildKpiWorksheetData(
    departmentName: string,
    pillarName: string,
    departmentKpi: {
      kpi_number: number;
      kpi_metric_name: string;
      kpi_description: string | null;
      kpi_value: number | null;
      kpi_target: number | null;
      percentage_target_achieved: number | null;
      performance: number | null;
      kpi_status: string;
      academic_year: number;
      data_provided_by: string | null;
      comments: string | null;
      assigned_users: Array<{ user_name: string | null; user_email: string | null; user_role: string; id: string }>;
      form_responses: unknown;
      kpi_calculated_metrics?: unknown;
      kpi_data?: unknown;
    },
  ) {
    const summaryRows: (string | number | null)[][] = [
      ['KPI Summary'],
      [],
      ['Department', departmentName],
      ['Pillar', pillarName],
      ['KPI Number', departmentKpi.kpi_number],
      ['KPI Metric', departmentKpi.kpi_metric_name],
      ['Description', departmentKpi.kpi_description ?? '-'],
      ['KPI Weight / Value', departmentKpi.kpi_value ?? '-'],
      ['Target', departmentKpi.kpi_target ?? '-'],
      ['% Target Achieved', departmentKpi.percentage_target_achieved ?? '-'],
      ['Performance', departmentKpi.performance ?? '-'],
      ['Status', departmentKpi.kpi_status],
      ['Academic Year', departmentKpi.academic_year],
      ['Data Provided By', departmentKpi.data_provided_by ?? '-'],
      ['Comments', departmentKpi.comments ?? '-'],
      [
        'Assigned Users',
        departmentKpi.assigned_users
          .map((user) => `${user.user_name ?? user.user_email ?? user.id} (${user.user_role})`)
          .join(', ') || '-',
      ],
    ];

    const mergedEntries = this.getMergedFormEntries(departmentKpi.form_responses);
    const labelMap = this.extractFormElementLabels(departmentKpi.kpi_data);

    const worksheetRows: (string | number | null)[][] = [...summaryRows];
    let formHeaderLength = 0;
    let formEntriesCount = 0;

    if (mergedEntries.length > 0) {
      worksheetRows.push([]);
      worksheetRows.push(['Form Responses']);

      const headers = this.extractFormHeaders(mergedEntries, labelMap);
      formHeaderLength = headers.length;
      formEntriesCount = mergedEntries.length;
      worksheetRows.push(headers.map((header) => header.label));

      for (const entry of mergedEntries) {
        const row = headers.map((header) => this.formatCellValue(entry[header.key]));
        worksheetRows.push(row);
      }
    }

    return {
      rows: worksheetRows,
      summaryRowCount: summaryRows.length,
      formHeaderLength,
      formEntriesCount,
    };
  }

  private applySummaryStyles(worksheet: XLSX.WorkSheet, summaryRowCount: number) {
    if (summaryRowCount === 0) {
      return;
    }

    this.applyCellStyle(worksheet, 0, 0, SUMMARY_TITLE_STYLE);

    const labelRowsStart = 2;
    const labelRowsEnd = summaryRowCount - 1;

    if (labelRowsStart <= labelRowsEnd) {
      this.applyRangeStyle(worksheet, labelRowsStart, labelRowsEnd, 0, 1, {
        border: {
          top: TABLE_BORDER,
          bottom: TABLE_BORDER,
          left: TABLE_BORDER,
          right: TABLE_BORDER,
        },
        alignment: { vertical: 'center', wrapText: true },
      });

      for (let row = labelRowsStart; row <= labelRowsEnd; row++) {
        this.applyCellStyle(worksheet, row, 0, SUMMARY_LABEL_STYLE);
        this.applyCellStyle(worksheet, row, 1, SUMMARY_VALUE_STYLE);
      }
    }
  }

  private applyFormResponseStyles(
    worksheet: XLSX.WorkSheet,
    summaryRowCount: number,
    headerColumnCount: number,
    formEntriesCount: number,
  ) {
    if (headerColumnCount === 0) {
      return;
    }

    const sectionLabelRow = summaryRowCount + 1;
    this.applyRangeStyle(worksheet, sectionLabelRow, sectionLabelRow, 0, headerColumnCount - 1, SECTION_LABEL_STYLE);

    const headerRow = summaryRowCount + 2;
    this.applyRangeStyle(worksheet, headerRow, headerRow, 0, headerColumnCount - 1, TABLE_HEADER_STYLE);

    if (formEntriesCount > 0) {
      const firstDataRow = headerRow + 1;
      const lastDataRow = headerRow + formEntriesCount;
      this.applyRangeStyle(worksheet, firstDataRow, lastDataRow, 0, headerColumnCount - 1, TABLE_DATA_STYLE);
    }
  }

  private applyRangeStyle(
    worksheet: XLSX.WorkSheet,
    startRow: number,
    endRow: number,
    startCol: number,
    endCol: number,
    style: CellStyle,
  ) {
    if (startRow > endRow || startCol > endCol) {
      return;
    }

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        this.applyCellStyle(worksheet, row, col, style);
      }
    }
  }

  private applyCellStyle(worksheet: XLSX.WorkSheet, row: number, col: number, style: CellStyle) {
    const address = XLSX.utils.encode_cell({ r: row, c: col });
    const cell = worksheet[address] as (XLSX.CellObject & { s?: CellStyle }) | undefined;

    if (!cell) {
      worksheet[address] = { t: 's', v: '', s: { ...style } } as XLSX.CellObject & { s?: CellStyle };
      return;
    }

    const existingStyle = cell.s ?? {};
    cell.s = this.mergeCellStyles(existingStyle, style);
  }

  private mergeCellStyles(existing: CellStyle, incoming: CellStyle): CellStyle {
    const merged: CellStyle = { ...existing, ...incoming };

    if (existing.font || incoming.font) {
      merged.font = { ...(existing.font ?? {}), ...(incoming.font ?? {}) };
    }

    if (existing.fill || incoming.fill) {
      merged.fill = { ...(existing.fill ?? {}), ...(incoming.fill ?? {}) };
    }

    if (existing.alignment || incoming.alignment) {
      merged.alignment = { ...(existing.alignment ?? {}), ...(incoming.alignment ?? {}) };
    }

    merged.border = this.mergeBorders(existing.border, incoming.border);

    return merged;
  }

  private mergeBorders(
    existing?: CellStyle['border'],
    incoming?: CellStyle['border'],
  ): CellStyle['border'] | undefined {
    if (!existing && !incoming) {
      return undefined;
    }

    return {
      ...(existing ?? {}),
      ...(incoming ?? {}),
    };
  }

  private extractFormHeaders(
    entries: Array<Record<string, unknown>>,
    labelMap: Map<string, string>,
  ): Array<{ key: string; label: string }> {
    const orderedKeys: string[] = [];
    const seen = new Set<string>();

    for (const entry of entries) {
      Object.keys(entry || {}).forEach((key) => {
        if (!seen.has(key)) {
          seen.add(key);
          orderedKeys.push(key);
        }
      });
    }

    return orderedKeys.map((key) => ({
      key,
      label: labelMap.get(key) ?? key,
    }));
  }

  private getMergedFormEntries(formResponses: unknown): Array<Record<string, unknown>> {
    if (!formResponses || typeof formResponses !== 'object') {
      return [];
    }

    const responses = formResponses as Record<string, unknown>;
    const baseEntries = Array.isArray(responses['entries'])
      ? (responses['entries'] as Array<Record<string, unknown>>)
      : [];

    const workflow = responses['coordinator_workflow'];
    if (workflow && typeof workflow === 'object') {
      const workflowRecord = workflow as Record<string, unknown> & {
        coordinator_status?: string;
        coordinator_submission?: { data?: unknown[] };
      };

      const coordinatorStatus = workflowRecord.coordinator_status;
      const submissionData = workflowRecord.coordinator_submission;
      const submissionEntries =
        submissionData && typeof submissionData === 'object' && Array.isArray(submissionData.data)
          ? (submissionData.data as Array<Record<string, unknown>>)
          : [];

      if (
        submissionEntries.length > 0 &&
        coordinatorStatus &&
        ['SUBMITTED', 'REVISION_REQUESTED'].includes(coordinatorStatus)
      ) {
        return submissionEntries;
      }
    }

    return baseEntries;
  }

  private extractFormElementLabels(kpiData: unknown): Map<string, string> {
    const labelMap = new Map<string, string>();

    if (!kpiData || typeof kpiData !== 'object') {
      return labelMap;
    }

    const dataRecord = kpiData as Record<string, unknown>;
    const elements = Array.isArray(dataRecord['elements'])
      ? (dataRecord['elements'] as Array<Record<string, unknown>>)
      : [];

    for (const element of elements) {
      if (!element || typeof element !== 'object') continue;

      const elementRecord = element;
      const id = typeof elementRecord['id'] === 'string' ? elementRecord['id'] : undefined;
      if (!id) continue;

      let label: string | undefined;

      const attributes = elementRecord['attributes'];
      if (attributes && typeof attributes === 'object') {
        const attrs = attributes as Record<string, unknown>;
        if (typeof attrs['label'] === 'string') {
          label = attrs['label'];
        } else if (typeof attrs['name'] === 'string') {
          label = attrs['name'];
        }
      }

      if (!label) {
        if (typeof elementRecord['label'] === 'string') {
          label = elementRecord['label'];
        } else if (typeof elementRecord['name'] === 'string') {
          label = elementRecord['name'];
        }
      }

      if (label) {
        labelMap.set(id, label);
      }
    }

    return labelMap;
  }

  private formatCellValue(value: unknown): string | number | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return value;
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    if (value instanceof Date) return value.toISOString();
    try {
      return JSON.stringify(value);
    } catch {
      return '[Unserializable Value]';
    }
  }

  private generateColumnWidths(rows: (string | number | null)[][]) {
    const widths: Array<{ wch: number }> = [];
    for (const row of rows) {
      row.forEach((cell, index) => {
        const length = cell === null ? 4 : String(cell).length + 2;
        if (!widths[index] || widths[index].wch < length) {
          widths[index] = { wch: Math.min(length, 60) };
        }
      });
    }
    return widths;
  }

  private createSheetName(baseName: string, usedNames: Map<string, number>): string {
    const sanitized = this.slugify(baseName).substring(0, 28) || 'Sheet';
    const count = usedNames.get(sanitized) ?? 0;
    usedNames.set(sanitized, count + 1);
    if (count === 0) {
      return sanitized;
    }
    const suffix = `_${count + 1}`;
    return `${sanitized.substring(0, 28 - suffix.length)}${suffix}`;
  }

  private slugify(value: string) {
    return (
      value
        .replace(/[^\w\d]+/g, ' ')
        .trim()
        .replace(/\s+/g, '_')
        .substring(0, 31) || 'Sheet'
    );
  }

  private asNumber(value: number | null): number | null {
    if (value === null || value === undefined) return null;
    return Number(value);
  }
}
