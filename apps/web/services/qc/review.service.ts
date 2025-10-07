import { ApiClient } from "@/lib/api-client";
import { ApiError } from "@/types/error";
import { DepartmentKpi } from "@/services/qc/department-assignment.service";

export interface QcReviewedKpi extends DepartmentKpi {
  department?: { dept_name: string };
  department_pillar?: { pillar_name: string };
  locked?: boolean;
  lock_reason?: string;
  preview_entries?: any[];
}

export interface UpdateKpiStatusPayload {
  action: "APPROVE" | "REVISION" | "REJECT";
  remark: string;
}

export interface EntryComment {
  comment: string;
  reviewed_by: string;
  reviewed_by_id: string;
  reviewed_at: string;
}

export interface EntryCommentsResponse {
  kpiId: string;
  qcComments: Record<string, EntryComment>;
  hodComments: Record<string, EntryComment>;
  // Backward compatibility
  entryComments: Record<string, EntryComment>;
}

export class QcReviewService {
  static async getKpi(kpiId: string) {
    return ApiClient.get<QcReviewedKpi>(`/qc/review/kpis/${kpiId}`);
  }

  static async updateStatus(kpiId: string, payload: UpdateKpiStatusPayload) {
    return ApiClient.patch<{ message: string; data: QcReviewedKpi }>(
      `/qc/review/kpis/${kpiId}/status`,
      payload,
    );
  }

  static async getEntryComments(kpiId: string) {
    return ApiClient.get<EntryCommentsResponse>(
      `/qc/review/kpis/${kpiId}/entry-comments`,
    );
  }

  static async saveEntryComment(
    kpiId: string,
    entryIndex: number,
    comment: string,
  ) {
    return ApiClient.patch<{ message: string; data: EntryComment }>(
      `/qc/review/kpis/${kpiId}/entries/${entryIndex}/comment`,
      { comment },
    );
  }

  static async saveHodEntryComment(
    kpiId: string,
    entryIndex: number,
    comment: string,
  ) {
    return ApiClient.patch<{ message: string; data: EntryComment }>(
      `/qc/review/kpis/${kpiId}/entries/${entryIndex}/hod-comment`,
      { comment },
    );
  }
}
