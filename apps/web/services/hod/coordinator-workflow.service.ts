import { ApiClient } from "@/lib/api-client";

export interface HodCoordinatorReviewKpi {
  id: string;
  kpi_number: number;
  kpi_metric_name: string;
  kpi_description?: string;
  pillar_name: string;
  coordinator_workflow?: {
    coordinator_status: string;
    coordinator_submission?: {
      submitted_at: string;
      data: Record<string, unknown>[];
      comments?: string;
    };
    hod_review?: {
      reviewed_at: string;
      action: string;
      comments: string;
    };
  };
  coordinator_submission?: {
    submitted_at: string;
    data: Record<string, unknown>[];
    comments?: string;
  };
}

export interface DepartmentCoordinator {
  id: string;
  user_name: string;
  user_email: string;
  user_role: string;
}

export class HodCoordinatorWorkflowService {
  /**
   * Get KPIs submitted by coordinators for HOD review
   */
  static async getKpisForReview() {
    return await ApiClient.get<HodCoordinatorReviewKpi[]>(
      "/hod/coordinator-workflow/review",
    );
  }

  /**
   * Review coordinator submission
   */
  static async reviewCoordinatorSubmission(
    kpiId: string,
    action: "APPROVE" | "REJECT" | "REQUEST_REVISION",
    comments: string,
  ) {
    return await ApiClient.post(`/hod/coordinator-workflow/review/${kpiId}`, {
      action,
      comments,
    });
  }

  /**
   * Get all coordinators in HOD's department
   */
  static async getDepartmentCoordinators() {
    return await ApiClient.get<DepartmentCoordinator[]>(
      "/hod/coordinator-workflow/coordinators",
    );
  }
}
