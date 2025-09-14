import { ApiClient } from "@/lib/api-client";
import { ApiError } from "@/types/error";

/**
 * Interface for department faculty member data
 */
export interface DepartmentFaculty {
  id: string;
  user_name: string;
  user_email: string;
  user_role: "FACULTY" | "KPI_COORDINATOR";
  created_at: string;
}

/**
 * Interface for coordinator assignment payload
 */
export interface AssignCoordinatorPayload {
  faculty_id: string;
  new_role: "FACULTY" | "KPI_COORDINATOR";
}

/**
 * Interface for coordinator assignment response
 */
export interface AssignCoordinatorResponse {
  message: string;
  user: {
    id: string;
    user_name: string;
    user_email: string;
    user_role: "FACULTY" | "KPI_COORDINATOR";
    department: {
      id: string;
      dept_name: string;
    };
  };
}

/**
 * Interface for department KPI with assigned coordinators
 */
export interface DepartmentKpi {
  id: string;
  dept_id: string;
  kpi_metric_name: string;
  kpi_description?: string;
  kpi_number: number;
  kpi_status: string;
  department_pillar?: {
    pillar_name: string;
  };
  assigned_users?: {
    id: string;
    user_name: string;
    user_email: string;
    user_role: string;
  }[];
} /**
 * Fetches all faculty and KPI coordinators in the HOD's department
 * @returns Promise with department faculty data
 */
export const getDepartmentFaculty = async () => {
  try {
    const response = await ApiClient.get<DepartmentFaculty[]>(
      "/hod/coordinator/faculty",
    );
    return response;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw error;
  }
};

/**
 * Assigns or unassigns a faculty member as KPI coordinator
 * @param payload - Assignment data containing faculty ID and new role
 * @returns Promise with assignment response
 */
export const assignCoordinator = async (payload: AssignCoordinatorPayload) => {
  try {
    const response = await ApiClient.post<AssignCoordinatorResponse>(
      "/hod/coordinator/assign",
      payload,
    );
    return response;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw error;
  }
};

/**
 * Fetches all KPIs in HOD's department with assigned coordinators
 * @returns Promise with department KPIs data
 */
export const getDepartmentKpis = async () => {
  try {
    const response = await ApiClient.get<DepartmentKpi[]>(
      "/hod/coordinator/kpis",
    );
    return response;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw error;
  }
};

/**
 * Assigns a coordinator to a specific KPI
 * @param kpiId - The KPI ID to assign coordinator to
 * @param coordinatorId - The coordinator user ID
 * @returns Promise with assignment response
 */
export const assignCoordinatorToKpi = async (
  kpiId: string,
  coordinatorId: string,
) => {
  try {
    const response = await ApiClient.post(
      `/hod/coordinator/kpis/${kpiId}/assign`,
      { coordinatorId },
    );
    return response;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw error;
  }
};

/**
 * Removes a coordinator from a specific KPI
 * @param kpiId - The KPI ID to remove coordinator from
 * @param coordinatorId - The coordinator user ID
 * @returns Promise with removal response
 */
export const removeCoordinatorFromKpi = async (
  kpiId: string,
  coordinatorId: string,
) => {
  try {
    const response = await ApiClient.delete(
      `/hod/coordinator/kpis/${kpiId}/coordinators/${coordinatorId}`,
    );
    return response;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw error;
  }
};
