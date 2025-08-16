import { ApiClient } from "@/lib/api-client";

export interface CoordinatorKpi {
  id: string;
  kpi_number: number;
  kpi_metric_name: string;
  kpi_description?: string;
  pillar_name: string;
  kpi_status: string;
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
  due_date?: string;
}

export interface CoordinatorKpiDetails extends CoordinatorKpi {
  elements: unknown[];
  coordinator_workflow?: {
    assigned_to?: string;
    assigned_at?: string;
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
    revision_history?: Array<{
      revision_number: number;
      requested_at: string;
      completed_at?: string;
      reason: string;
    }>;
  };
  existing_data: Record<string, unknown>[];
}

export class CoordinatorKpiService {
  /**
   * Get all KPIs assigned to the coordinator
   */
  static async getAssignedKpis() {
    return await ApiClient.get<CoordinatorKpi[]>("/coordinator/kpi/assigned");
  }

  /**
   * Get details of a specific KPI for form filling
   */
  static async getKpiDetails(kpiId: string) {
    return await ApiClient.get<CoordinatorKpiDetails>(
      `/coordinator/kpi/${kpiId}`,
    );
  }

  /**
   * Submit KPI form data
   */
  static async submitKpiForm(
    kpiId: string,
    formData: { entries: Record<string, unknown>[]; comments?: string },
  ) {
    return await ApiClient.post(`/coordinator/kpi/${kpiId}/submit`, formData);
  }

  /**
   * Save draft (does not submit to HOD)
   */
  static async saveDraft(
    kpiId: string,
    formData: { entries: Record<string, unknown>[]; comments?: string },
  ) {
    return await ApiClient.post(`/coordinator/kpi/${kpiId}/draft`, formData);
  }

  /**
   * Resubmit KPI after revision request
   */
  static async resubmitAfterRevision(
    kpiId: string,
    formData: { entries: Record<string, unknown>[]; comments?: string },
  ) {
    return await ApiClient.patch(
      `/coordinator/kpi/${kpiId}/resubmit`,
      formData,
    );
  }
}
