import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CoordinatorKpiService } from "@/services/coordinator/kpi.service";

/**
 * Hook to get all KPIs assigned to the coordinator
 */
export function useGetAssignedKpis() {
  return useQuery({
    queryKey: ["coordinator", "assigned-kpis"],
    queryFn: async () => {
      const res = await CoordinatorKpiService.getAssignedKpis();
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
 * Hook to get details of a specific KPI for form filling
 */
export function useGetCoordinatorKpiDetails(kpiId: string | null) {
  return useQuery({
    queryKey: ["coordinator", "kpi-details", kpiId],
    queryFn: async () => {
      if (!kpiId) throw new Error("KPI ID required");
      const res = await CoordinatorKpiService.getKpiDetails(kpiId);
      if (res.data) {
        return res.data;
      }
      if (res.error) {
        throw new Error(res.error.message);
      }
      throw new Error("Failed to fetch KPI details");
    },
    enabled: !!kpiId,
  });
}

/**
 * Hook to submit KPI form data
 */
export function useSubmitCoordinatorKpi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      kpiId,
      formData,
    }: {
      kpiId: string;
      formData: { entries: Record<string, unknown>[]; comments?: string };
    }) => {
      const res = await CoordinatorKpiService.submitKpiForm(kpiId, formData);
      if (res.data) return res.data;
      throw new Error(res.error?.message || "Failed to submit KPI");
    },
    onSuccess: (_, variables) => {
      toast.success("KPI submitted successfully for HOD review");
      queryClient.invalidateQueries({
        queryKey: ["coordinator", "assigned-kpis"],
      });
      queryClient.invalidateQueries({
        queryKey: ["coordinator", "kpi-details", variables.kpiId],
      });
    },
    onError: (error: any) => {
      toast.error("Failed to submit KPI", {
        description: error.message,
      });
    },
  });
}

/**
 * Hook to resubmit KPI after revision request
 */
export function useResubmitCoordinatorKpi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      kpiId,
      formData,
    }: {
      kpiId: string;
      formData: { entries: Record<string, unknown>[]; comments?: string };
    }) => {
      const res = await CoordinatorKpiService.resubmitAfterRevision(
        kpiId,
        formData,
      );
      if (res.data) return res.data;
      throw new Error(res.error?.message || "Failed to resubmit KPI");
    },
    onSuccess: (_, variables) => {
      toast.success("KPI resubmitted successfully");
      queryClient.invalidateQueries({
        queryKey: ["coordinator", "assigned-kpis"],
      });
      queryClient.invalidateQueries({
        queryKey: ["coordinator", "kpi-details", variables.kpiId],
      });
    },
    onError: (error: any) => {
      toast.error("Failed to resubmit KPI", {
        description: error.message,
      });
    },
  });
}

/**
 * Hook to save draft (stays in PENDING state)
 */
export function useSaveCoordinatorDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      kpiId,
      formData,
    }: {
      kpiId: string;
      formData: { entries: Record<string, unknown>[]; comments?: string };
    }) => {
      const res = await CoordinatorKpiService.saveDraft(kpiId, formData);
      if (res.data) return res.data;
      throw new Error(res.error?.message || "Failed to save draft");
    },
    onSuccess: (_data, variables) => {
      toast.success("Draft saved");
      queryClient.invalidateQueries({
        queryKey: ["coordinator", "kpi-details", variables.kpiId],
      });
    },
    onError: (error: any) => {
      toast.error("Failed to save draft", { description: error.message });
    },
  });
}
