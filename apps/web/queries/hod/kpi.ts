import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HodKpiService } from "@/services/hod/kpi.service";
import { toast } from "sonner";

/**
 * Hook to get all pillars assigned to HOD's department
 * @returns Query result with department pillars and KPIs
 */
export function useGetDepartmentPillars() {
  return useQuery({
    queryKey: ["hod", "pillars"],
    queryFn: async () => {
      const res = await HodKpiService.getDepartmentPillars();
      if (res.data) {
        return res.data;
      }
      if (res.error) {
        throw new Error(res.error.message);
      }
      return [];
    },
  });
}

/**
 * Hook to get KPIs for a specific department pillar
 * @param pillarId - The pillar ID
 * @returns Query result with KPIs for the pillar
 */
export function useGetDepartmentPillarKPIs(pillarId: string) {
  return useQuery({
    queryKey: ["hod", "pillar-kpis", pillarId],
    queryFn: async () => {
      const res = await HodKpiService.getDepartmentPillarKPIs(pillarId);
      if (res.data) {
        return res.data;
      }
      if (res.error) {
        throw new Error(res.error.message);
      }
      return [];
    },
    enabled: !!pillarId, // Only run query if pillarId is provided
  });
}

/**
 * Hook to get KPI details for form filling
 * @param kpiId - The KPI ID
 * @returns Query result with KPI details
 */
export function useGetKpiDetails(kpiId: string) {
  return useQuery({
    queryKey: ["hod", "kpi-details", kpiId],
    queryFn: async () => {
      const res = await HodKpiService.getKpiDetails(kpiId);
      if (res.data) {
        return res.data;
      }
      if (res.error) {
        throw new Error(res.error.message);
      }
      return null;
    },
    enabled: !!kpiId, // Only run query if kpiId is provided
  });
}

/**
 * Hook to update KPI form responses
 * @returns Mutation for updating KPI responses
 */
export function useUpdateKpiResponses() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ kpiId, formResponses }: { kpiId: string; formResponses: Record<string, any> }) => {
      const res = await HodKpiService.updateKpiResponses(kpiId, formResponses);
      if (res.error) {
        throw new Error(res.error.message);
      }
      return res.data;
    },
    onSuccess: () => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ["hod", "pillars"] });
      queryClient.invalidateQueries({ queryKey: ["hod", "pillar-kpis"] });
      queryClient.invalidateQueries({ queryKey: ["hod", "kpi-details"] });
      toast.success("KPI responses updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update KPI responses: ${error.message}`);
    },
  });
}

/**
 * Hook for saving KPI form data (compatible with TableFormRenderer)
 * @returns Mutation for saving KPI form data
 */
export function useSaveHodKpiData() {
  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: { entries: Record<string, any>[] } }) => {
      // Transform the formData to match the backend expectation
      const formResponses = {
        entries: formData.entries,
        submittedAt: new Date().toISOString(),
      };
      
      const res = await HodKpiService.updateKpiResponses(id, formResponses);
      if (res.error) {
        throw new Error(res.error.message);
      }
      return res.data;
    },
    onSuccess: () => {
      toast.success("KPI data saved successfully");
    },
    onError: (error) => {
      toast.error(`Failed to save KPI data: ${error.message}`);
    },
  });
}
