import { useQuery } from "@tanstack/react-query";
import { getDashboardData } from "@/services/qc/dashboard.service";

/**
 * React Query hook for fetching QAC dashboard data
 * @returns Query result with dashboard data
 */
export function useGetDashboardData() {
  return useQuery({
    queryKey: ["qc-dashboard"],
    queryFn: async () => {
      const res = await getDashboardData();
      if (res.data) return res.data;
      throw new Error(res.error?.message || "Failed to fetch dashboard data");
    },
  });
}
