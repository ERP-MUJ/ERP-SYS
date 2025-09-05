import { useQuery } from "@tanstack/react-query";
import { HodDashboardService } from "@/services/hod/dashboard.service";

export function useGetScoreSheet(pillarId?: string) {
  return useQuery({
    queryKey: ["hod-scoresheet", pillarId],
    queryFn: async () => {
      const response = await HodDashboardService.getScoreSheet(pillarId);
      return response.data;
    },
  });
}

export function useGetDepartmentPillars() {
  return useQuery({
    queryKey: ["hod-department-pillars"],
    queryFn: async () => {
      const response = await HodDashboardService.getDepartmentPillars();
      return response.data;
    },
  });
}
