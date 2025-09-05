import { ApiClient } from "@/lib/api-client";
import {
  ScoreSheetKpi,
  DepartmentPillar,
} from "@workspace/types/types/qc-dashboard.type";

export class HodDashboardService {
  static async getScoreSheet(pillarId?: string) {
    const url = `/hod/dashboard/score-sheet${pillarId ? `?pillarId=${pillarId}` : ""}`;
    return ApiClient.get<ScoreSheetKpi[]>(url);
  }

  static async getDepartmentPillars() {
    return ApiClient.get<DepartmentPillar[]>(`/hod/dashboard/pillars`);
  }
}
