import { ApiClient } from "@/lib/api-client";
import { ApiError } from "@/types/error";

export interface UpdatePillarWeightPayload {
  pillarWeight?: number;
  pillarTarget?: number;
}

/**
 * Interface for department data
 */
export interface Department {
  id: string;
  dept_name: string;
  hod_name: string | null;
  dept_creation: string | null;
}

/**
 * Interface for KPI template data
 */
export interface KpiTemplate {
  id: string;
  kpi_number: number;
  kpi_metric_name: string;
  kpi_description: string | null;
  kpi_value: number | null;
  data_provided_by: string | null;
  kpi_data: any;
  kpi_calculated_metrics: any;
  academic_year: number;
  created_at: string;
  updated_at: string;
}

/**
 * Interface for pillar template data
 */
export interface PillarTemplate {
  id: string;
  pillar_name: string;
  description: string | null;
  pillar_value: number | null;
  percentage_target_achieved: number | null;
  performance: number | null;
  academic_year: number;
  created_at: string;
  updated_at: string;
  kpi_templates: KpiTemplate[];
}

/**
 * Interface for assigned user data
 */
export interface AssignedUser {
  id: string;
  user_name: string;
  user_email: string;
  user_role: "FACULTY" | "KPI_COORDINATOR" | "HOD" | "QAC";
}

/**
 * Interface for department KPI data
 */
export interface DepartmentKpi {
  id: string;
  dept_id: string;
  dept_pillar_id: string;
  template_id: string;
  kpi_number: number;
  kpi_metric_name: string;
  kpi_description: string | null;
  kpi_value: number | null;
  kpi_target: number | null;
  percentage_target_achieved: number | null;
  performance: number | null;
  data_provided_by: string | null;
  kpi_data: any;
  academic_year: number;
  kpi_calculated_metrics: any;
  kpi_status: "APPROVED" | "OVERDUE" | "REJECTED" | "REVISION" | "PENDING";
  assigned_date: string;
  due_date: string | null;
  completed_date: string | null;
  comments: string | null;
  form_responses: any | null;
  user_ids: string[];
  assigned_users: AssignedUser[];
}

/**
 * Interface for department pillar data
 */
export interface DepartmentPillar {
  id: string;
  dept_id: string;
  template_id: string;
  pillar_name: string;
  description: string | null;
  pillar_weight: number | null;
  pillar_target: number | null;
  percentage_target_achieved: number | null;
  performance: number | null;
  academic_year: number;
  assigned_date: string;
  status: string;
  department_kpis: DepartmentKpi[];
}

/**
 * Interface for pillar assignment payload
 */
export interface AssignPillarPayload {
  pillarTemplateId: string;
  pillarWeight?: number;
  pillarTarget?: number;
}

/**
 * Interface for pillar assignment response
 */
export interface AssignPillarResponse {
  message: string;
  departmentPillar: DepartmentPillar;
}

/**
 * Fetches all departments
 * @returns Promise with departments data
 */
export const getDepartments = async () => {
  try {
    const response = await ApiClient.get<Department[]>(
      "/qc/department-assignment/departments",
    );
    return response;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw error;
  }
};

/**
 * Fetches all pillar templates created by QAC
 * @returns Promise with pillar templates data
 */
export const getPillarTemplates = async () => {
  try {
    const response = await ApiClient.get<PillarTemplate[]>(
      "/qc/department-assignment/pillar-templates",
    );
    return response;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw error;
  }
};

/**
 * Fetches pillars assigned to a specific department
 * @param departmentId - The department ID
 * @returns Promise with department pillars data
 */
export const getDepartmentPillars = async (departmentId: string) => {
  try {
    const response = await ApiClient.get<DepartmentPillar[]>(
      `/qc/department-assignment/departments/${departmentId}/pillars`,
    );
    return response;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw error;
  }
};

/**
 * Fetches all department pillars for overview
 * @returns Promise with all department pillars data
 */
export const getAllDepartmentPillars = async () => {
  try {
    const response = await ApiClient.get<DepartmentPillar[]>(
      "/qc/department-assignment/all-department-pillars",
    );
    return response;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw error;
  }
};

/**
 * Assigns a pillar template to a department
 * @param departmentId - The department ID
 * @param payload - Assignment data containing pillar template ID and weight
 * @returns Promise with assignment response
 */
export const assignPillarToDepartment = async (
  departmentId: string,
  payload: AssignPillarPayload,
) => {
  try {
    const response = await ApiClient.post<AssignPillarResponse>(
      `/qc/department-assignment/departments/${departmentId}/pillars`,
      payload,
    );
    return response;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw error;
  }
};

/**
 * Unassigns a pillar from a department
 * @param departmentPillarId - The department pillar ID
 * @returns Promise with unassignment response
 */
export const unassignPillarFromDepartment = async (
  departmentPillarId: string,
) => {
  try {
    const response = await ApiClient.delete<{ message: string }>(
      `/qc/department-assignment/department-pillars/${departmentPillarId}`,
    );
    return response;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw error;
  }
};

/**
 * Fetches KPIs for a specific department pillar
 * @param departmentPillarId - The department pillar ID
 * @returns Promise with department KPIs data
 */
export const getDepartmentPillarKPIs = async (departmentPillarId: string) => {
  try {
    const response = await ApiClient.get<DepartmentKpi[]>(
      `/qc/department-assignment/department-pillars/${departmentPillarId}/kpis`,
    );
    return response;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw error;
  }
};

/**
 * Assigns a KPI template to a department pillar
 * @param departmentPillarId - The department pillar ID
 * @param kpiTemplateId - The KPI template ID
 * @returns Promise with assignment response
 */
export const assignKpiToDepartmentPillar = async (
  departmentPillarId: string,
  kpiTemplateId: string,
  kpiValue: number,
  kpiTarget?: number,
) => {
  try {
    const response = await ApiClient.post<{
      message: string;
      departmentKpi: DepartmentKpi;
    }>(
      `/qc/department-assignment/department-pillars/${departmentPillarId}/kpis`,
      { kpiTemplateId, kpiValue, kpiTarget },
    );
    return response;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw error;
  }
};

/**
 * Unassigns a KPI from a department pillar
 * @param departmentKpiId - The DepartmentKpi ID
 * @returns Promise with unassignment response
 */
export const unassignKpiFromDepartmentPillar = async (
  departmentKpiId: string,
) => {
  try {
    const response = await ApiClient.delete<{ message: string }>(
      `/qc/department-assignment/department-kpis/${departmentKpiId}`,
    );
    return response;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw error;
  }
};

/**
 * Updates a KPI value in a department pillar
 * @param departmentKpiId - The DepartmentKpi ID
 * @param payload - Update data containing new KPI value
 * @returns Promise with update response
 */
export const updateDepartmentKpi = async (
  departmentKpiId: string,
  payload: { kpiValue?: number; kpiTarget?: number },
) => {
  try {
    const response = await ApiClient.patch<{
      message: string;
      departmentKpi: DepartmentKpi;
    }>(`/qc/department-assignment/department-kpis/${departmentKpiId}`, payload);
    return response;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    return {
      data: null,
      error: {
        message: apiError.message || "An error occurred while updating KPI",
      },
    };
  }
};

export interface ServiceResponse<T = any> {
  data: T | null;
  error?: {
    message: string;
  };
  message?: string;
}

export async function updateDepartmentPillar(
  departmentPillarId: string,
  payload: UpdatePillarWeightPayload,
): Promise<ServiceResponse> {
  try {
    const response = await ApiClient.patch(
      `/qc/department-assignment/department-pillars/${departmentPillarId}`,
      payload,
    );
    return {
      data: response.data || null,
      message: "Pillar weight updated successfully",
    };
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw error;
  }
}
