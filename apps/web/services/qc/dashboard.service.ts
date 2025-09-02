import { ApiClient } from "@/lib/api-client";
import {
  QacDashboardData,
  ScoreSheetKpi,
  DepartmentPillar,
} from "@workspace/types/types/qc-dashboard.type";
import { ApiError } from "@/types/error";

export class QcDashboardService {
  static async getDashboardData() {
    return ApiClient.get<QacDashboardData>("/qc/dashboard");
  }

  static async getScoreSheet(deptId: string, pillarId?: string) {
    const url = `/qc/dashboard/score-sheet/${deptId}${pillarId ? `?pillarId=${pillarId}` : ""}`;
    return ApiClient.get<ScoreSheetKpi[]>(url);
  }

  static async getDepartmentPillars(deptId: string) {
    return ApiClient.get<DepartmentPillar[]>(
      `/qc/dashboard/departments/${deptId}/pillars`,
    );
  }
}
