import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole, KpiStatus } from '@repo/db/prisma/client';
import { ExcelService, ExcelValidationService } from 'src/services/excel.service';
import { ExcelTemplateResponseDto } from 'src/coordinator/dto/excel.dto';
import { ExcelUploadResponseDto } from 'src/coordinator/dto/excel-upload.dto';
import { QcReviewService } from 'src/qc/review/qc-review.service';
import type { FormElementInstance } from '@workspace/types/types';
@Injectable()
export class HodKpiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly excelService: ExcelService,
    private readonly qcReviewService: QcReviewService,
  ) {}
  private assertHodRole(role: UserRole) {
    if (role !== UserRole.HOD) throw new ForbiddenException('Only HOD users can perform this action');
  }
  private assertDeptAccess(role: UserRole) {
    if (!(role === UserRole.HOD || role === UserRole.KPI_COORDINATOR || role === UserRole.FACULTY)) {
      throw new ForbiddenException('Access denied');
    }
  }
  private async getDeptId(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { dept_id: true } });
    if (!user?.dept_id) throw new NotFoundException('Department not found');
    return user.dept_id;
  }

  /**
   * Gets department information for the HOD user
   */
  private async getHodDepartmentInfo(userId: string): Promise<{ id: string; name: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { department: true },
    });

    if (!user || !user.department) {
      throw new NotFoundException('HOD department not found');
    }

    return {
      id: user.department.id,
      name: user.department.dept_name,
    };
  }

  /**
   * Injects department name as the first field in form entries
   */
  private injectDepartmentIntoEntries(
    entries: Record<string, unknown>[],
    departmentName: string,
  ): Record<string, unknown>[] {
    return entries.map((entry) => ({
      department_name: departmentName,
      ...entry,
    }));
  }
  async getDepartmentPillars(userId: string, role: UserRole) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertDeptAccess(role);
    const deptId = await this.getDeptId(userId);
    return this.prisma.departmentPillar.findMany({
      where: { dept_id: deptId, status: 'active' },
      include: {
        department_kpis: {
          include: { assigned_users: { select: { id: true, user_name: true, user_email: true, user_role: true } } },
          orderBy: { kpi_number: 'asc' },
        },
      },
      orderBy: { assigned_date: 'desc' },
    });
  }
  async getDepartmentPillarKPIs(userId: string, role: UserRole, pillarId: string) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertDeptAccess(role);
    const deptId = await this.getDeptId(userId);
    const pillar = await this.prisma.departmentPillar.findFirst({
      where: { id: pillarId, dept_id: deptId, status: 'active' },
    });
    if (!pillar) throw new NotFoundException('Department pillar not found or not accessible');
    return this.prisma.departmentKpi.findMany({
      where: { dept_pillar_id: pillarId },
      include: { assigned_users: { select: { id: true, user_name: true, user_email: true, user_role: true } } },
      orderBy: { kpi_number: 'asc' },
    });
  }
  async getKpiDetails(userId: string, role: UserRole, kpiId: string) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertDeptAccess(role);
    const deptId = await this.getDeptId(userId);
    const kpi = await this.prisma.departmentKpi.findFirst({
      where: { id: kpiId, dept_id: deptId },
      include: {
        department_pillar: { select: { pillar_name: true } },
        assigned_users: { select: { id: true, user_name: true, user_email: true, user_role: true } },
      },
    });
    if (!kpi) throw new NotFoundException('KPI not found or not accessible');
    type JsonObj = Record<string, unknown>;
    const formResponses = (kpi.form_responses || {}) as JsonObj;
    const workflow = (formResponses['coordinator_workflow'] || {}) as JsonObj & {
      coordinator_status?: string;
      coordinator_submission?: { data?: unknown[] };
    };
    const submission = (workflow['coordinator_submission'] || {}) as { data?: unknown[] };
    const status = workflow.coordinator_status;
    const baseEntries = Array.isArray(formResponses['entries']) ? formResponses['entries'] : [];
    const coordEntries = Array.isArray(submission.data) ? submission.data : [];
    const mergedEntries = status === 'SUBMITTED' || status === 'REVISION_REQUESTED' ? coordEntries : baseEntries;
    return {
      ...kpi,
      kpi_name: kpi.kpi_metric_name,
      elements:
        kpi.kpi_data && typeof kpi.kpi_data === 'object' && (kpi.kpi_data as JsonObj)['elements']
          ? (kpi.kpi_data as JsonObj)['elements']
          : [],
      existingData: mergedEntries,
      coordinator_workflow: workflow,
    };
  }
  async updateKpiResponses(
    userId: string,
    role: UserRole,
    kpiId: string,
    formResponses: { entries: Record<string, unknown>[] },
  ) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertHodRole(role);
    const departmentInfo = await this.getHodDepartmentInfo(userId);
    const kpi = await this.prisma.departmentKpi.findFirst({ where: { id: kpiId, dept_id: departmentInfo.id } });
    if (!kpi) throw new NotFoundException('KPI not found or not accessible');
    // Check if KPI is locked (APPROVED, REJECTED, OVERDUE)
    const lockedStatuses: KpiStatus[] = [KpiStatus.APPROVED, KpiStatus.REJECTED, KpiStatus.OVERDUE];
    if (lockedStatuses.includes(kpi.kpi_status)) {
      throw new ForbiddenException('Cannot modify KPI in current status');
    }
    // Save as draft - keep current status, update form responses
    const newStatus = kpi.kpi_status;
    let preserveComments: string | null = null;
    let preserveMetrics: object | null = null;
    if (kpi.kpi_status === KpiStatus.REVISION) {
      // Preserve QC feedback when saving draft in revision status
      preserveComments = kpi.comments;
      preserveMetrics = kpi.kpi_calculated_metrics as object;
    }

    // Inject department name as the first field in each entry
    const entriesWithDepartment = this.injectDepartmentIntoEntries(formResponses.entries, departmentInfo.name);

    // Get existing metrics and preserve important data while updating draft status
    const existingMetrics = (kpi.kpi_calculated_metrics as Record<string, unknown>) || {};
    const updatedMetrics = {
      ...existingMetrics,
      ...preserveMetrics,
      last_saved_at: new Date().toISOString(),
      is_submitted_to_qc: false, // Mark as draft, not submitted
    };
    // Calculate HOD percentage target achieved
    const entriesCount = entriesWithDepartment.length || 0;
    const kpiTarget = Number(kpi.kpi_target) || 0;
    const hodPercentageAchieved = kpiTarget > 0 ? Number(((entriesCount / kpiTarget) * 100).toFixed(2)) : 0;
    // Calculate HOD performance based on kpi_value and hod_percentage_target_achieved
    const hodPerformance = Number(((Number(kpi.kpi_value) || 0) * hodPercentageAchieved).toFixed(2));
    // Update the KPI first

    // Get existing form responses to preserve coordinator workflow
    const existingFormResponses = (kpi.form_responses as Record<string, unknown>) || {};

    // Prepare updated form responses with department-injected entries preserving coordinator workflow
    const updatedFormResponses = {
      entries: entriesWithDepartment,
      // Preserve coordinator workflow if it exists
      coordinator_workflow: existingFormResponses.coordinator_workflow || null,
    };

    await this.prisma.departmentKpi.update({
      where: { id: kpiId },
      data: {
        form_responses: JSON.parse(JSON.stringify(updatedFormResponses)),
        kpi_status: newStatus,
        completed_date: new Date(),
        hod_performance: hodPerformance,
        kpi_calculated_metrics: JSON.parse(JSON.stringify(updatedMetrics)),
        hod_percentage_target_achieved: hodPercentageAchieved,
        // Preserve QC review data if in revision status
        ...(preserveComments !== null && { comments: preserveComments }),
      },
    });

    // Calculate sum of hod_performance for all KPIs in this pillar
    const allPillarKpis = await this.prisma.departmentKpi.findMany({
      where: { dept_pillar_id: kpi.dept_pillar_id },
      select: { hod_performance: true },
    });

    const totalHodPerformance = allPillarKpis.reduce((sum, kpi) => sum + (kpi.hod_performance || 0), 0);

    // Get current pillar data to calculate hod_performance
    const pillar = await this.prisma.departmentPillar.findUnique({
      where: { id: kpi.dept_pillar_id },
      select: { pillar_weight: true },
    });

    // Update the pillar's hod_percentage_target_achieved and hod_performance
    await this.prisma.departmentPillar.update({
      where: { id: kpi.dept_pillar_id },
      data: {
        hod_percentage_target_achieved: totalHodPerformance,
        hod_performance: Number((totalHodPerformance * (pillar?.pillar_weight || 0)).toFixed(2)),
      },
    });

    return { message: 'KPI draft saved successfully' };
  }
  async submitKpiToQc(
    userId: string,
    role: UserRole,
    kpiId: string,
    formResponses: { entries: Record<string, unknown>[] },
  ) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertHodRole(role);
    const departmentInfo = await this.getHodDepartmentInfo(userId);
    const kpi = await this.prisma.departmentKpi.findFirst({ where: { id: kpiId, dept_id: departmentInfo.id } });
    if (!kpi) throw new NotFoundException('KPI not found or not accessible');
    // Check if KPI is locked (APPROVED, REJECTED, OVERDUE)
    const lockedStatuses: KpiStatus[] = [KpiStatus.APPROVED, KpiStatus.REJECTED, KpiStatus.OVERDUE];
    if (lockedStatuses.includes(kpi.kpi_status)) {
      throw new ForbiddenException('Cannot submit KPI in current status');
    }
    // Validate that there is data to submit
    if (!formResponses.entries || formResponses.entries.length === 0) {
      throw new ForbiddenException('Cannot submit empty KPI. Please add data before submission.');
    }

    // Inject department name as the first field in each entry
    const entriesWithDepartment = this.injectDepartmentIntoEntries(formResponses.entries, departmentInfo.name);

    // Get current user info for submission tracking
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { user_name: true, user_email: true },
    });
    // Prepare submission metadata
    const submissionMetadata = {
      submitted_by: user?.user_name || 'Unknown',
      submitted_by_email: user?.user_email || '',
      submitted_at: new Date().toISOString(),
      previous_status: kpi.kpi_status,
    };
    // Prepare update data
    const existingMetrics = (kpi.kpi_calculated_metrics as Record<string, unknown>) || {};
    const existingHistory = (existingMetrics.submission_history as unknown[]) || [];
    // Calculate HOD percentage target achieved
    const entriesCount = entriesWithDepartment.length || 0;
    const kpiTarget = kpi.kpi_target || 0;
    const hodPercentageAchieved = kpiTarget > 0 ? (entriesCount / kpiTarget) * 100 : 0;

    // Calculate HOD performance based on kpi_value and hod_percentage_target_achieved
    const hodPerformance = Number(((Number(kpi.kpi_value) || 0) * hodPercentageAchieved).toFixed(2));

    // Get existing form responses to preserve coordinator workflow
    const existingFormResponses = (kpi.form_responses as Record<string, unknown>) || {};

    // Prepare updated form responses with department-injected entries preserving coordinator workflow
    const updatedFormResponses = {
      entries: entriesWithDepartment,
      // Preserve coordinator workflow if it exists
      coordinator_workflow: existingFormResponses.coordinator_workflow || null,
    };

    const updateData = {
      form_responses: JSON.parse(JSON.stringify(updatedFormResponses)),
      kpi_status: KpiStatus.PENDING, // Stays PENDING but marked as submitted for QC review
      completed_date: new Date(),
      hod_performance: hodPerformance,
      hod_percentage_target_achieved: hodPercentageAchieved,
      kpi_calculated_metrics: JSON.parse(
        JSON.stringify({
          ...existingMetrics,
          is_submitted_to_qc: true, // Mark as submitted to QC
          submitted_at: new Date().toISOString(),
          submitted_by: user?.user_name || 'Unknown',
          submission_history: [...existingHistory, submissionMetadata],
        }),
      ),
    };
    // Clear QC feedback only when resubmitting from REVISION
    if (kpi.kpi_status === KpiStatus.REVISION) {
      Object.assign(updateData, { comments: null });
    }
    // Update the KPI first
    await this.prisma.departmentKpi.update({
      where: { id: kpiId },
      data: updateData,
    });

    // Calculate sum of hod_performance for all KPIs in this pillar
    const allPillarKpis = await this.prisma.departmentKpi.findMany({
      where: { dept_pillar_id: kpi.dept_pillar_id },
      select: { hod_performance: true },
    });

    const totalHodPerformance = allPillarKpis.reduce((sum, kpi) => sum + (kpi.hod_performance || 0), 0);

    // Get current pillar data to calculate hod_performance
    const pillar = await this.prisma.departmentPillar.findUnique({
      where: { id: kpi.dept_pillar_id },
      select: { pillar_weight: true },
    });

    // Update the pillar's hod_percentage_target_achieved and hod_performance
    await this.prisma.departmentPillar.update({
      where: { id: kpi.dept_pillar_id },
      data: {
        hod_percentage_target_achieved: totalHodPerformance,
        hod_performance: Number((totalHodPerformance * (pillar?.pillar_weight || 0)).toFixed(2)),
      },
    });

    return { message: 'KPI submitted to QC successfully' };
  }

  /**
   * Download Excel template for HOD KPI data entry
   * Creates a template with form elements as columns
   */
  async downloadKpiTemplate(userId: string, userRole: UserRole, kpiId: string): Promise<ExcelTemplateResponseDto> {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertHodRole(userRole);

    const deptId = await this.getDeptId(userId);

    // Verify user has access to this KPI
    const kpi = await this.prisma.departmentKpi.findFirst({
      where: {
        id: kpiId,
        dept_id: deptId,
      },
    });

    if (!kpi) {
      console.log('KPI access denied - User: %s, Department: %s, KPI: %s', userId, deptId, kpiId);
      throw new NotFoundException('KPI not found or access denied');
    }

    console.log('KPI access granted - User: %s, Department: %s, KPI: %s', userId, deptId, kpiId);

    // Parse form elements from kpi_data
    let formElements: FormElementInstance[] = [];
    try {
      console.log('KPI data type:', typeof kpi.kpi_data);
      if (kpi.kpi_data && typeof kpi.kpi_data === 'object') {
        const kpiData = kpi.kpi_data as Record<string, unknown>;
        if (kpiData.elements && Array.isArray(kpiData.elements)) {
          formElements = kpiData.elements as FormElementInstance[];
        }
      }
    } catch (error) {
      console.error('Error parsing KPI data:', error);
      throw new BadRequestException('Invalid KPI data format');
    }

    if (formElements.length === 0) {
      throw new BadRequestException('No form elements found in KPI data');
    }

    // Transform form elements to match Excel service format
    const excelFormElements = formElements.map((element) => ({
      id: element.id,
      type: element.type,
      attributes: {
        label: element.attributes.label || 'Field',
        required: element.attributes.required || false,
        placeholder: element.attributes.placeholder || '',
        options: element.attributes.options || [],
      },
    }));

    // Generate Excel template
    const fileName = `${kpi.kpi_metric_name || 'KPI'}_Template_${new Date().toISOString().split('T')[0]}.xlsx`;
    const buffer = this.excelService.generateKpiTemplate(excelFormElements);
    const bufferBase64 = buffer.toString('base64');

    return {
      buffer: bufferBase64,
      fileName: fileName,
    };
  }

  /**
   * Upload Excel file with HOD KPI data
   * Validates and processes the uploaded data
   */
  async uploadExcel(
    userId: string,
    userRole: UserRole,
    kpiId: string,
    file: Express.Multer.File,
  ): Promise<ExcelUploadResponseDto> {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertHodRole(userRole);

    const departmentInfo = await this.getHodDepartmentInfo(userId);

    // Verify user has access to this KPI
    const kpi = await this.prisma.departmentKpi.findFirst({
      where: {
        id: kpiId,
        dept_id: departmentInfo.id,
      },
    });

    if (!kpi) {
      console.log('KPI access denied - User: %s, Department: %s, KPI: %s', userId, departmentInfo.id, kpiId);
      throw new NotFoundException('KPI not found or access denied');
    }

    console.log('KPI access granted - User: %s, Department: %s, KPI: %s', userId, departmentInfo.id, kpiId);

    // Check if KPI is locked (APPROVED, REJECTED, OVERDUE)
    const lockedStatuses: KpiStatus[] = [KpiStatus.APPROVED, KpiStatus.REJECTED, KpiStatus.OVERDUE];
    if (lockedStatuses.includes(kpi.kpi_status)) {
      throw new ForbiddenException('Cannot modify KPI in current status');
    }

    // Validate file
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file type
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/octet-stream', // Some systems send this for Excel files
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Please upload an Excel file (.xlsx, .xls)');
    }

    // Extract data from Excel file
    const extractionOptions = {
      includeHeaders: true,
      skipEmptyRows: true,
    };

    const extractedData = this.excelService.extractFromBuffer(file.buffer, extractionOptions);

    if (!extractedData.data || extractedData.data.length === 0) {
      return {
        success: false,
        processedRows: 0,
        errorRows: 0,
        totalRows: 0,
        message: 'No data found in Excel file',
        dataSaved: false,
      };
    }

    // Parse form elements from kpi_data
    let formElements: FormElementInstance[] = [];
    try {
      console.log('KPI data type:', typeof kpi.kpi_data);
      if (kpi.kpi_data && typeof kpi.kpi_data === 'object') {
        const kpiData = kpi.kpi_data as Record<string, unknown>;
        if (kpiData.elements && Array.isArray(kpiData.elements)) {
          formElements = kpiData.elements as FormElementInstance[];
        }
      }
    } catch (error) {
      console.error('Error parsing KPI data:', error);
      throw new BadRequestException('Invalid KPI data format');
    }

    if (formElements.length === 0) {
      throw new BadRequestException('No form elements found in KPI data');
    }

    // Validate and process the data
    const validationService = new ExcelValidationService();
    const validationResult = validationService.validateKpiData(
      extractedData.data,
      extractedData.headers || [],
      formElements,
    );

    if (validationResult.errors.length > 0) {
      return {
        success: false,
        processedRows: 0,
        errorRows: validationResult.errors.length,
        totalRows: extractedData.data.length,
        validationErrors: validationResult.errors,
        message: `Validation failed with ${validationResult.errors.length} errors`,
        dataSaved: false,
      };
    }

    // Save the validated data
    try {
      // Inject department name into the processed data
      const processedDataWithDepartment = this.injectDepartmentIntoEntries(
        validationResult.processedData,
        departmentInfo.name,
      );

      const formResponses = {
        entries: processedDataWithDepartment,
        uploaded_at: new Date().toISOString(),
        uploaded_by: userId,
      };

      // Get existing form responses to preserve coordinator workflow
      const existingFormResponses = (kpi.form_responses as Record<string, unknown>) || {};

      // Prepare updated form responses preserving coordinator workflow
      const updatedFormResponses = {
        ...formResponses,
        // Preserve coordinator workflow if it exists
        coordinator_workflow: existingFormResponses.coordinator_workflow || null,
      };

      // Calculate HOD percentage target achieved
      const entriesCount = processedDataWithDepartment.length;
      const kpiTarget = Number(kpi.kpi_target) || 0;
      const hodPercentageAchieved = kpiTarget > 0 ? Number(((entriesCount / kpiTarget) * 100).toFixed(2)) : 0;

      // Calculate HOD performance based on kpi_value and hod_percentage_target_achieved
      const hodPerformance = Number(((Number(kpi.kpi_value) || 0) * hodPercentageAchieved).toFixed(2));

      // Get existing metrics and preserve important data
      const existingMetrics = (kpi.kpi_calculated_metrics as Record<string, unknown>) || {};
      const updatedMetrics = {
        ...existingMetrics,
        last_uploaded_at: new Date().toISOString(),
        uploaded_by: userId,
        is_submitted_to_qc: false, // Mark as draft, not submitted
      };

      await this.prisma.departmentKpi.update({
        where: { id: kpiId },
        data: {
          form_responses: JSON.parse(JSON.stringify(updatedFormResponses)),
          hod_performance: hodPerformance,
          hod_percentage_target_achieved: hodPercentageAchieved,
          kpi_calculated_metrics: JSON.parse(JSON.stringify(updatedMetrics)),
        },
      });

      return {
        success: true,
        processedRows: validationResult.processedData.length,
        errorRows: 0,
        totalRows: extractedData.data.length,
        message: `Successfully processed ${validationResult.processedData.length} rows`,
        dataSaved: true,
      };
    } catch (error) {
      console.error('Error saving uploaded data:', error);
      return {
        success: false,
        processedRows: 0,
        errorRows: extractedData.data.length,
        totalRows: extractedData.data.length,
        message: 'Failed to save data to database',
        dataSaved: false,
      };
    }
  }

  /**
   * Get entry comments for a KPI (delegates to QC service)
   */
  async getEntryComments(userId: string, userRole: UserRole, kpiId: string) {
    return this.qcReviewService.getEntryComments(userId, userRole, kpiId);
  }

  /**
   * Save entry comment for a KPI (delegates to QC service)
   */
  async saveEntryComment(userId: string, userRole: UserRole, kpiId: string, entryIndex: number, comment: string) {
    return this.qcReviewService.saveEntryComment(userId, userRole, kpiId, entryIndex, comment);
  }
}
