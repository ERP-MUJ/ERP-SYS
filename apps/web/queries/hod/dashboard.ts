import { useQuery } from "@tanstack/react-query";
import { HodDashboardService } from "@/services/hod/dashboard.service";

export function useGetScoreSheet() {
  const { data: pillarsData } = useGetDepartmentPillars();

  return useQuery({
    queryKey: ["hod-scoresheet", pillarsData],
    queryFn: async () => {
      if (!pillarsData?.length) return [];

      const allScores = await Promise.all(
        pillarsData.map(async (pillar) => {
          const response = await HodDashboardService.getScoreSheet(pillar.id);
          return (
            response.data?.map((kpi) => ({
              ...kpi,
              dept_pillar_id: pillar.id,
              hod_percentage_target_achieved:
                kpi.hod_percentage_target_achieved ||
                kpi.percentage_target_achieved,
            })) || []
          );
        }),
      );

      return allScores.flat();
    },
    enabled: Boolean(pillarsData?.length),
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
