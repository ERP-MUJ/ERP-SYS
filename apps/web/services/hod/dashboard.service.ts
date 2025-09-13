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
    const response = await ApiClient.get<HodScoreSheetKpi[]>(url);

    // Fetch total entries for each KPI
    if (response.data) {
      // Fetch all entries counts in parallel for better performance
      const kpiEntriesPromises = response.data.map((kpi) =>
        ApiClient.get<{ total: number }>(
          `/hod/dashboard/kpi-entries/${kpi.kpi_number}`,
        ).then((res) => ({
          kpiNumber: kpi.kpi_number,
          total: res.data?.total || 0,
        })),
      );

      const entryCounts = await Promise.all(kpiEntriesPromises);
      const entryCountMap = new Map(
        entryCounts.map((entry) => [entry.kpiNumber, entry.total]),
      );

      // Add entry counts to KPI data
      const kpisWithEntries = response.data.map((kpi) => ({
        ...kpi,
        total_entries: entryCountMap.get(kpi.kpi_number) || 0,
      }));

      return { ...response, data: kpisWithEntries };
    }

    return response;
  }

  static async getDepartmentPillars() {
    console.log("Fetching department pillars");
    return ApiClient.get<DepartmentPillar[]>(`/hod/dashboard/pillars`);
  }
}
