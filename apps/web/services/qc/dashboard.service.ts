import { ApiClient } from "@/lib/api-client";
import { QacDashboardData } from "@workspace/types/types/qc-dashboard.type";
import { ApiError } from "@/types/error";

/**
 * Fetches QAC dashboard data including submission stats and department status
 * @returns Promise with dashboard data
 */
export const getDashboardData = async () => {
  try {
    const response = await ApiClient.get<QacDashboardData>("/qc/dashboard");
    return response;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw error;
  }
};
