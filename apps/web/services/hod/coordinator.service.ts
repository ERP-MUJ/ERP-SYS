import { ApiClient } from "@/lib/api-client";
import { ApiError } from "@/types/error";

/**
 * Interface for department faculty member data
 */
export interface DepartmentFaculty {
  id: string;
  user_name: string;
  user_email: string;
  user_role: 'FACULTY' | 'KPI_COORDINATOR';
  created_at: string;
}

/**
 * Interface for coordinator assignment payload
 */
export interface AssignCoordinatorPayload {
  faculty_id: string;
  new_role: 'FACULTY' | 'KPI_COORDINATOR';
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
    user_role: 'FACULTY' | 'KPI_COORDINATOR';
    department: {
      id: string;
      dept_name: string;
    };
  };
}

/**
 * Fetches all faculty and KPI coordinators in the HOD's department
 * @returns Promise with department faculty data
 */
export const getDepartmentFaculty = async () => {
  try {
    const response = await ApiClient.get<DepartmentFaculty[]>("/hod/coordinator/faculty");
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
    const response = await ApiClient.post<AssignCoordinatorResponse>("/hod/coordinator/assign", payload);
    return response;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw error;
  }
};