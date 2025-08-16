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
}
