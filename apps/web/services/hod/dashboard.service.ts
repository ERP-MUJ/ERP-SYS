import { ApiClient } from "@/lib/api-client";
import {
  ScoreSheetKpi,
  DepartmentPillar,
  HodScoreSheetKpi,
} from "@workspace/types/types/qc-dashboard.type";

export class HodDashboardService {
  static async getScoreSheet(pillarId?: string) {
    const url = `/hod/dashboard/score-sheet${pillarId ? `?pillarId=${pillarId}` : ""}`;
    console.log("Fetching score sheet from:", url);
    return ApiClient.get<HodScoreSheetKpi[]>(url);
  }

  static async getDepartmentPillars() {
    console.log("Fetching department pillars");
    return ApiClient.get<DepartmentPillar[]>(`/hod/dashboard/pillars`);
  }
}
