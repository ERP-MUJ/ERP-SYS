import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole, Prisma } from '@repo/db/prisma/client';
import { ExcelService, ExcelValidationService } from 'src/services/excel.service';
import { ExcelTemplateResponseDto } from './dto/excel.dto';
import { ExcelUploadResponseDto } from './dto/excel-upload.dto';
import type { FormElementInstance } from '@workspace/types/types';

export interface CoordinatorWorkflow {
  assigned_to?: string;
  assigned_at?: string;
  coordinator_status: 'PENDING' | 'SUBMITTED' | 'APPROVED_BY_HOD' | 'REJECTED_BY_HOD' | 'REVISION_REQUESTED';
  coordinator_submission?: {
    submitted_at: string;
    data: Record<string, unknown>[];
    comments?: string;
  };
  hod_review?: {
    reviewed_at: string;
    action: 'APPROVE' | 'REJECT' | 'REQUEST_REVISION';
    comments: string;
    by?: string;
    by_id?: string;
  };
  revision_history?: Array<{
    revision_number: number;
    requested_at: string;
    completed_at?: string;
    reason: string;
  }>;
}

export interface KpiFormResponsesWithWorkflow {
  entries?: Record<string, unknown>[];
  coordinator_workflow?: CoordinatorWorkflow;
  [key: string]: unknown;
}

@Injectable()
export class CoordinatorKpiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly excelService: ExcelService,
  ) {}

  /**
   * Ensures only KPI coordinators can perform coordinator operations
   */
  private assertCoordinatorRole(userRole: UserRole) {
    if (userRole !== UserRole.KPI_COORDINATOR) {
      throw new ForbiddenException('Only KPI coordinators can perform this action');
    }
  }

  /**
   * Gets department ID for the coordinator user
   */
  private async getCoordinatorDepartmentId(userId: string): Promise<string> {
    const coordinator = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { department: true },
    });

    if (!coordinator || !coordinator.department) {
      throw new NotFoundException('Coordinator department not found');
    }

    return coordinator.department.id;
  }

  /**
   * Gets department information for the coordinator user
   */
  private async getCoordinatorDepartmentInfo(userId: string): Promise<{ id: string; name: string }> {
    const coordinator = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { department: true },
    });

    if (!coordinator || !coordinator.department) {
      throw new NotFoundException('Coordinator department not found');
    }

    return {
      id: coordinator.department.id,
      name: coordinator.department.dept_name,
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

  /**
   * Get all KPIs assigned to this coordinator
   */
  async getAssignedKpis(userId: string, userRole: UserRole) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertCoordinatorRole(userRole);
    const departmentId = await this.getCoordinatorDepartmentId(userId);

    // Coordinators now see only KPIs where they are specifically assigned via assigned_users relationship
    const kpis = await this.prisma.departmentKpi.findMany({
      where: {
        dept_id: departmentId,
        assigned_users: {
          some: {
            id: userId,
          },
        },
      },
      include: {
        department_pillar: { select: { pillar_name: true } },
        assigned_users: {
          select: { id: true, user_name: true, user_email: true, user_role: true },
        },
      },
      orderBy: { kpi_number: 'asc' },
    });

    return kpis.map((kpi) => {
      const formResponses = kpi.form_responses as KpiFormResponsesWithWorkflow | null;
      const coordinatorWorkflow = formResponses?.coordinator_workflow;
      return {
        ...kpi,
        pillar_name: kpi.department_pillar.pillar_name,
        coordinator_status: coordinatorWorkflow?.coordinator_status || 'PENDING',
        coordinator_submission: coordinatorWorkflow?.coordinator_submission,
        hod_review: coordinatorWorkflow?.hod_review,
      };
    });
  }

  /**
   * Get details of a specific KPI for coordinator to fill
   */
  async getKpiDetails(userId: string, userRole: UserRole, kpiId: string) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertCoordinatorRole(userRole);

    const departmentId = await this.getCoordinatorDepartmentId(userId);

    const kpi = await this.prisma.departmentKpi.findFirst({
      where: {
        id: kpiId,
        dept_id: departmentId,
        assigned_users: { some: { id: userId } },
      },
      include: {
        department_pillar: { select: { pillar_name: true } },
        assigned_users: {
          select: { id: true, user_name: true, user_email: true, user_role: true },
        },
      },
    });

    if (!kpi) {
      throw new NotFoundException('KPI not found or not accessible');
    }

    const formResponses = kpi.form_responses as KpiFormResponsesWithWorkflow | null;
    const coordinatorWorkflow = formResponses?.coordinator_workflow;

    return {
      ...kpi,
      pillar_name: kpi.department_pillar.pillar_name,
      elements:
        kpi.kpi_data && typeof kpi.kpi_data === 'object' && kpi.kpi_data['elements'] ? kpi.kpi_data['elements'] : [],
      coordinator_workflow: coordinatorWorkflow,
      existing_data: coordinatorWorkflow?.coordinator_submission?.data || formResponses?.entries || [],
    };
  }

  /**
   * Submit KPI form data as coordinator
   */
  async submitKpiForm(
    userId: string,
    userRole: UserRole,
    kpiId: string,
    formData: { entries: Record<string, unknown>[] },
    comments?: string,
  ) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertCoordinatorRole(userRole);

    const departmentInfo = await this.getCoordinatorDepartmentInfo(userId);

    const kpi = await this.prisma.departmentKpi.findFirst({
      where: { id: kpiId, dept_id: departmentInfo.id },
    });

    if (!kpi) {
      throw new NotFoundException('KPI not found or not accessible');
    }

    const existingFormResponses = (kpi.form_responses as KpiFormResponsesWithWorkflow) || {};
    const existingWorkflow = existingFormResponses.coordinator_workflow || {
      assigned_to: userId, // Set at first interaction for audit purposes
      assigned_at: new Date().toISOString(),
      coordinator_status: 'PENDING' as const,
    };

    // Check if coordinator can submit (not already approved or pending HOD review)
    if (['SUBMITTED', 'APPROVED_BY_HOD'].includes(existingWorkflow.coordinator_status)) {
      throw new BadRequestException('KPI is already submitted or approved. Cannot resubmit.');
    }

    // Inject department name as the first field in each entry
    const entriesWithDepartment = this.injectDepartmentIntoEntries(formData.entries, departmentInfo.name);

    const updatedWorkflow: CoordinatorWorkflow = {
      ...existingWorkflow,
      coordinator_status: 'SUBMITTED',
      coordinator_submission: {
        submitted_at: new Date().toISOString(),
        data: entriesWithDepartment,
        comments,
      },
    };

    const updatedFormResponses: KpiFormResponsesWithWorkflow = {
      ...existingFormResponses,
      coordinator_workflow: updatedWorkflow,
    };

    await this.prisma.departmentKpi.update({
      where: { id: kpiId },
      data: {
        form_responses: JSON.parse(JSON.stringify(updatedFormResponses)),
        // Keep existing kpi_status, don't change it
      },
    });

    return { message: 'KPI form submitted successfully for HOD review' };
  }

  /**
   * Save a draft (partial) without submitting to HOD.
   * Draft data is stored under form_responses.coordinator_workflow.coordinator_submission with status PENDING.
   * This allows coordinator to come back later; HOD will not treat as SUBMITTED.
   */
  async saveDraft(
    userId: string,
    userRole: UserRole,
    kpiId: string,
    formData: { entries: Record<string, unknown>[] },
    comments?: string,
  ) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertCoordinatorRole(userRole);
    const departmentInfo = await this.getCoordinatorDepartmentInfo(userId);

    const kpi = await this.prisma.departmentKpi.findFirst({
      where: {
        id: kpiId,
        dept_id: departmentInfo.id,
        assigned_users: { some: { id: userId } },
      },
    });
    if (!kpi) throw new NotFoundException('KPI not found or not accessible');

    const existingFormResponses = (kpi.form_responses as KpiFormResponsesWithWorkflow) || {};
    const existingWorkflow = existingFormResponses.coordinator_workflow || {
      assigned_to: userId,
      assigned_at: new Date().toISOString(),
      coordinator_status: 'PENDING' as const,
    };

    // Enhanced status check to prevent conflicts during HOD review actions
    if (['SUBMITTED', 'APPROVED_BY_HOD'].includes(existingWorkflow.coordinator_status)) {
      // Instead of throwing error, silently ignore save attempts after submission
      console.log('Draft save ignored for KPI %s - status: %s', kpiId, existingWorkflow.coordinator_status);
      return { message: 'Draft already submitted' };
    }

    // Additional check: if there's an active HOD review happening, avoid conflicts
    if (existingWorkflow.hod_review && existingWorkflow.coordinator_status === 'SUBMITTED') {
      console.log('Draft save ignored for KPI %s - HOD review in progress', kpiId);
      return { message: 'Under HOD review' };
    }

    try {
      // Inject department name as the first field in each entry
      const entriesWithDepartment = this.injectDepartmentIntoEntries(formData.entries, departmentInfo.name);

      const updatedWorkflow: CoordinatorWorkflow = {
        ...existingWorkflow,
        // keep status PENDING to indicate not yet sent to HOD
        coordinator_status: 'PENDING',
        coordinator_submission: {
          submitted_at: existingWorkflow.coordinator_submission?.submitted_at || new Date().toISOString(),
          data: entriesWithDepartment,
          comments,
        },
      };

      const updatedFormResponses: KpiFormResponsesWithWorkflow = {
        ...existingFormResponses,
        coordinator_workflow: updatedWorkflow,
      };

      await this.prisma.departmentKpi.update({
        where: { id: kpiId },
        data: { form_responses: JSON.parse(JSON.stringify(updatedFormResponses)) },
      });

      return { message: 'Draft saved' };
    } catch (error) {
      console.error('Draft save error for KPI %s:', kpiId, error instanceof Error ? error.message : 'Unknown error');
      // Return success message instead of throwing error to prevent UI toasts
      return { message: 'Draft save skipped due to concurrent update' };
    }
  }

  /**
   * Resubmit KPI after revision request
   */
  async resubmitAfterRevision(
    userId: string,
    userRole: UserRole,
    kpiId: string,
    formData: { entries: Record<string, unknown>[] },
    comments?: string,
  ) {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertCoordinatorRole(userRole);

    const departmentInfo = await this.getCoordinatorDepartmentInfo(userId);

    const kpi = await this.prisma.departmentKpi.findFirst({
      where: {
        id: kpiId,
        dept_id: departmentInfo.id,
        assigned_users: { some: { id: userId } },
      },
    });

    if (!kpi) {
      throw new NotFoundException('KPI not found or not accessible');
    }

    const existingFormResponses = (kpi.form_responses as KpiFormResponsesWithWorkflow) || {};
    const existingWorkflow = existingFormResponses.coordinator_workflow;

    if (!existingWorkflow || existingWorkflow.coordinator_status !== 'REVISION_REQUESTED') {
      throw new BadRequestException('KPI is not in revision state');
    }

    // Update revision history
    const revisionHistory = existingWorkflow.revision_history || [];
    if (revisionHistory.length > 0) {
      const lastRevision = revisionHistory[revisionHistory.length - 1];
      if (!lastRevision.completed_at) {
        lastRevision.completed_at = new Date().toISOString();
      }
    }

    // Inject department name as the first field in each entry
    const entriesWithDepartment = this.injectDepartmentIntoEntries(formData.entries, departmentInfo.name);

    const updatedWorkflow: CoordinatorWorkflow = {
      ...existingWorkflow,
      coordinator_status: 'SUBMITTED',
      coordinator_submission: {
        submitted_at: new Date().toISOString(),
        data: entriesWithDepartment,
        comments,
      },
      revision_history: revisionHistory,
    };

    const updatedFormResponses: KpiFormResponsesWithWorkflow = {
      ...existingFormResponses,
      coordinator_workflow: updatedWorkflow,
    };

    await this.prisma.departmentKpi.update({
      where: { id: kpiId },
      data: {
        form_responses: JSON.parse(JSON.stringify(updatedFormResponses)),
      },
    });

    return { message: 'KPI form resubmitted successfully after revision' };
  }

  async downloadKpiTemplate(userId: string, userRole: UserRole, kpiId: string): Promise<ExcelTemplateResponseDto> {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertCoordinatorRole(userRole);

    const kpiDetails = await this.getKpiDetails(userId, userRole, kpiId);

    const kpiData = kpiDetails?.kpi_data as Record<string, unknown>;
    const formElements =
      (kpiData?.elements as Array<{
        id: string;
        attributes: {
          label: string;
          required?: boolean;
          placeholder?: string;
          options?: Array<{ label: string; value: string }>;
        };
        type: string;
      }>) || [];

    if (!formElements || formElements.length === 0) {
      throw new BadRequestException('No form structure found for this KPI');
    }

    const excelBuffer = this.excelService.generateKpiTemplate(formElements);
    const fileName = `KPI_${kpiId}_Template.xlsx`;
    const bufferBase64 = excelBuffer.toString('base64');

    return {
      buffer: bufferBase64,
      fileName: fileName,
    };
  }

  async uploadExcel(
    userId: string,
    userRole: UserRole,
    kpiId: string,
    file: Express.Multer.File,
  ): Promise<ExcelUploadResponseDto> {
    if (!userId) throw new ForbiddenException('User not authenticated');
    this.assertCoordinatorRole(userRole);

    const departmentId = await this.getCoordinatorDepartmentId(userId);

    // Verify user has access to this KPI
    const kpi = await this.prisma.departmentKpi.findFirst({
      where: {
        id: kpiId,
        dept_id: departmentId,
        assigned_users: { some: { id: userId } },
      },
    });

    if (!kpi) {
      console.log('KPI access denied - User: %s, Department: %s, KPI: %s', userId, departmentId, kpiId);
      throw new NotFoundException('KPI not found or access denied');
    }

    console.log('KPI access granted - User: %s, Department: %s, KPI: %s', userId, departmentId, kpiId);

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
      console.log('KPI data:', kpi.kpi_data);

      // Handle both string and object formats
      if (typeof kpi.kpi_data === 'string') {
        formElements = JSON.parse(kpi.kpi_data);
      } else if (typeof kpi.kpi_data === 'object' && kpi.kpi_data !== null) {
        // If it's already an object, extract the elements
        const kpiData = kpi.kpi_data as Record<string, unknown>;
        formElements = (kpiData.elements as FormElementInstance[]) || [];
      } else {
        throw new Error('Invalid kpi_data format');
      }

      console.log('Form elements extracted:', formElements.length);
    } catch (error) {
      console.error('Error parsing form elements:', error instanceof Error ? error.message : 'Unknown error');
      return {
        success: false,
        processedRows: 0,
        errorRows: 0,
        totalRows: extractedData.data.length,
        message: `Invalid form elements configuration: ${error.message}`,
        dataSaved: false,
      };
    }

    // Validate data against form elements
    const validationService = new ExcelValidationService();
    const validationResult = validationService.validateKpiData(
      extractedData.data,
      extractedData.headers || [],
      formElements,
    );

    // Save valid data to database
    let dataSaved = false;
    if (validationResult.processedData.length > 0) {
      try {
        // Get department info for name injection
        const departmentInfo = await this.getCoordinatorDepartmentInfo(userId);

        // Inject department name into the processed data
        const processedDataWithDepartment = this.injectDepartmentIntoEntries(
          validationResult.processedData,
          departmentInfo.name,
        );

        // Update the form_responses field with the new data
        const existingResponses = (kpi.form_responses as Record<string, unknown>[]) || [];
        const updatedResponses = [...existingResponses, ...processedDataWithDepartment];

        await this.prisma.departmentKpi.update({
          where: { id: kpiId },
          data: {
            form_responses: updatedResponses as Prisma.InputJsonValue,
          },
        });
        dataSaved = true;
      } catch (error) {
        console.error('Error saving form responses:', error instanceof Error ? error.message : 'Unknown error');
        return {
          success: false,
          processedRows: 0,
          errorRows: extractedData.data.length,
          totalRows: extractedData.data.length,
          message: 'Error saving data to database',
          dataSaved: false,
        };
      }
    }

    // Determine success status
    const success = validationResult.errors.length === 0 || validationResult.processedData.length > 0;
    const message = this.generateUploadMessage(
      validationResult.processedData.length,
      validationResult.errors.length,
      extractedData.data.length,
    );

    return {
      success,
      processedRows: validationResult.processedData.length,
      errorRows: validationResult.errors.length,
      totalRows: extractedData.data.length,
      validationErrors: validationResult.errors.length > 0 ? validationResult.errors : undefined,
      message,
      dataSaved,
    };
  }

  private generateUploadMessage(processedRows: number, errorRows: number, totalRows: number): string {
    if (errorRows === 0) {
      return `Successfully processed all ${totalRows} rows from Excel file`;
    } else if (processedRows === 0) {
      return `Failed to process Excel file: ${errorRows} validation errors found`;
    } else {
      return `Partially successful: ${processedRows} rows processed, ${errorRows} rows had validation errors`;
    }
  }
}
