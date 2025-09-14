import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getKpis,
  getKpiById,
  addKpi,
  updateKpi,
  deleteKpi,
  checkKpiNumberExists,
} from "@/services/qc/kpi.service";
import {
  KpiTemplateInstance,
  CreateKpiRequestData,
} from "@workspace/types/types";
import { toast } from "sonner";

/**
 * Hook to get all KPIs for a specific pillar
 * @param pillarId - The ID of the pillar
 * @returns Query result with KPI instances
 */
export function useGetKpis(pillarId: string) {
  return useQuery<KpiTemplateInstance[]>({
    queryKey: ["kpis", pillarId],
    queryFn: async () => {
      const res = await getKpis(pillarId);
      if (res.data) {
        return res.data;
      }
      return [];
    },
    enabled: !!pillarId, // Only run query if pillarId is provided
  });
}

/**
 * Hook to get a specific KPI by ID
 * @param pillarId - The ID of the pillar
 * @param kpiId - The ID of the KPI
 * @returns Query result with KPI instance
 */
export function useGetKpiById(pillarId: string, kpiId: string) {
  return useQuery<KpiTemplateInstance>({
    queryKey: ["kpi", pillarId, kpiId],
    queryFn: async () => {
      const res = await getKpiById(pillarId, kpiId);
      if (res.data) {
        return res.data;
      }
      throw new Error(res.error?.message || "Failed to fetch KPI");
    },
    enabled: !!pillarId && !!kpiId, // Only run query if both IDs are provided
  });
}

/**
 * Hook to add a new KPI
 * @returns Mutation for adding KPI
 */
export function useAddKpi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      pillarId,
      data,
    }: {
      pillarId: string;
      data: CreateKpiRequestData;
    }): Promise<KpiTemplateInstance> => {
      const res = await addKpi(pillarId, data);
      if (res.data) return res.data;
      throw new Error(res.error?.message || "Failed to add KPI");
    },
    onSuccess: (_, { pillarId }) => {
      // Invalidate queries for the specific pillar's KPIs
      queryClient.invalidateQueries({ queryKey: ["kpis", pillarId] });
      // Also invalidate pillar queries to update KPI count
      queryClient.invalidateQueries({ queryKey: ["pillars"] });
      toast.success("KPI added successfully");
    },
    onError: () => {
      toast.error("Failed to add KPI");
    },
  });
}

/**
 * Hook to update an existing KPI
 * @returns Mutation for updating KPI
 */
export function useUpdateKpi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      pillarId,
      kpiId,
      data,
    }: {
      pillarId: string;
      kpiId: string;
      data: Partial<CreateKpiRequestData>;
    }): Promise<KpiTemplateInstance> => {
      const res = await updateKpi(pillarId, kpiId, data);
      if (res.data) return res.data;
      throw new Error(res.error?.message || "Failed to update KPI");
    },
    onSuccess: (_, { pillarId, kpiId }) => {
      // Invalidate queries for the specific pillar's KPIs and the specific KPI
      queryClient.invalidateQueries({ queryKey: ["kpis", pillarId] });
      queryClient.invalidateQueries({ queryKey: ["kpi", pillarId, kpiId] });
      // Also invalidate pillar queries to update KPI count
      queryClient.invalidateQueries({ queryKey: ["pillars"] });
      toast.success("KPI updated successfully");
    },
    onError: () => {
      toast.error("Failed to update KPI");
    },
  });
}

/**
 * Hook to delete a KPI
 * @returns Mutation for deleting KPI
 */
export function useDeleteKpi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      pillarId,
      kpiId,
    }: {
      pillarId: string;
      kpiId: string;
    }): Promise<KpiTemplateInstance | null> => {
      const res: {
        data?: KpiTemplateInstance | null;
        error?: {
          message: string;
          status: number;
          details?: Record<string, unknown>;
        };
      } = await deleteKpi(pillarId, kpiId);
      if (res.data !== undefined) return res.data;
      throw new Error(res.error?.message || "Failed to delete KPI");
    },
    onSuccess: (_, { pillarId }) => {
      // Invalidate queries for the specific pillar's KPIs
      queryClient.invalidateQueries({ queryKey: ["kpis", pillarId] });
      // Also invalidate pillar queries to update KPI count
      queryClient.invalidateQueries({ queryKey: ["pillars"] });
      toast.success("KPI deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete KPI");
    },
  });
}

/**
 * Hook to check if a KPI number already exists
 * @param pillarId - The ID of the pillar
 * @param kpiNumber - The KPI number to check
 * @param academicYear - The academic year
 * @param excludeKpiId - Optional KPI ID to exclude from check (for edit mode)
 * @returns Query result with duplicate check
 */
export function useCheckKpiNumberExists(
  pillarId: string,
  kpiNumber: number,
  academicYear: number,
  excludeKpiId?: string,
) {
  return useQuery<{ exists: boolean; kpiNumber?: number }>({
    queryKey: [
      "kpi",
      "check-duplicate",
      pillarId,
      kpiNumber,
      academicYear,
      excludeKpiId,
    ],
    queryFn: async () => {
      const res = await checkKpiNumberExists(
        pillarId,
        kpiNumber,
        academicYear,
        excludeKpiId,
      );
      if (res.data) {
        return res.data;
      }
      return { exists: false };
    },
    enabled: !!pillarId && kpiNumber > 0 && academicYear > 0, // Only run query if all required params are provided
  });
}
