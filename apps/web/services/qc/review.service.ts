import { ApiClient } from "@/lib/api-client";
import { ApiError } from "@/types/error";
import {
  DepartmentKpi,
  KpiEntryWithReview,
} from "@/services/qc/department-assignment.service";
import { KpiStatus } from "@workspace/types/enums";

export interface QcReviewedKpi extends DepartmentKpi {
  department?: { dept_name: string };
  department_pillar?: { pillar_name: string };
  locked?: boolean;
  lock_reason?: string;
  preview_entries?: any[];
  entries_with_review?: KpiEntryWithReview[];
}

export interface UpdateKpiStatusPayload {
  action: "APPROVE" | "REVISION" | "REJECT";
  remark: string;
}

export interface ReviewKpiEntryPayload {
  entry_id: string;
  status: KpiStatus;
  review?: string;
}

export interface BulkReviewKpiEntriesPayload {
  kpi_id: string;
  entries: ReviewKpiEntryPayload[];
}

export class QcReviewService {
  static async getKpi(kpiId: string) {
    return ApiClient.get<QcReviewedKpi>(`/qc/review/kpis/${kpiId}`);
  }

  static async getKpiEntriesWithReview(kpiId: string) {
    return ApiClient.get<QcReviewedKpi>(`/qc/review/kpis/${kpiId}/entries`);
  }

  static async updateStatus(kpiId: string, payload: UpdateKpiStatusPayload) {
    return ApiClient.patch<{ message: string; data: QcReviewedKpi }>(
      `/qc/review/kpis/${kpiId}/status`,
      payload,
    );
  }

  static async reviewKpiEntry(kpiId: string, payload: ReviewKpiEntryPayload) {
    return ApiClient.post<{ message: string; entry: KpiEntryWithReview }>(
      `/qc/review/kpis/${kpiId}/entries/review`,
      payload,
    );
  }

  static async bulkReviewKpiEntries(payload: BulkReviewKpiEntriesPayload) {
    return ApiClient.post<{
      message: string;
      entries_with_review: KpiEntryWithReview[];
    }>(`/qc/review/kpis/entries/bulk-review`, payload);
  }
}
