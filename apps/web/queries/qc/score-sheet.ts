import { useQuery } from "@tanstack/react-query";
import { QcDashboardService } from "@/services/qc/dashboard.service";
import {
  ScoreSheetKpi,
  DepartmentPillar,
} from "@workspace/types/types/qc-dashboard.type";

export function useGetScoreSheet(deptId: string, pillarId?: string) {
  return useQuery({
    queryKey: ["qc", "score-sheet", deptId, pillarId],
    queryFn: async () => {
      if (!deptId) return [];
      console.log(
        "Fetching score sheet data for dept:",
        deptId,
        "pillar:",
        pillarId,
      );
      const response = await QcDashboardService.getScoreSheet(deptId, pillarId);
      console.log("Score sheet response:", response);
      return response.data || [];
    },
    enabled: !!deptId,
  });
}

export function useGetDepartmentPillars(deptId: string) {
  return useQuery({
    queryKey: ["qc", "department-pillars", deptId],
    queryFn: async () => {
      if (!deptId) return [];
      console.log("Fetching pillars for dept:", deptId);
      const response = await QcDashboardService.getDepartmentPillars(deptId);
      console.log("Pillars response:", response);
      return response.data || [];
    },
    enabled: !!deptId,
  });
}
