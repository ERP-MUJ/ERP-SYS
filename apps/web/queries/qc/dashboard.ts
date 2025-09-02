import { useQuery } from "@tanstack/react-query";
import { QcDashboardService } from "@/services/qc/dashboard.service";

/**
 * React Query hook for fetching QAC dashboard data
 * @returns Query result with dashboard data
 */
export function useGetDashboardData() {
  return useQuery({
    queryKey: ["qc-dashboard"],
    queryFn: async () => {
      const response = await QcDashboardService.getDashboardData();
      return response.data;
    },
  });
}
