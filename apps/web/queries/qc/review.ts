import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  QcReviewService,
  UpdateKpiStatusPayload,
} from "@/services/qc/review.service";
import { toast } from "sonner";

export function useGetKpi(kpiId: string | null) {
  return useQuery({
    queryKey: ["qc-review-kpi", kpiId],
    queryFn: async () => {
      if (!kpiId) throw new Error("KPI ID required");
      const res = await QcReviewService.getKpi(kpiId);
      if (res.data) return res.data;
      throw new Error(res.error?.message || "Failed to fetch KPI");
    },
    enabled: !!kpiId,
  });
}

export function useUpdateKpiStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      kpiId,
      payload,
    }: {
      kpiId: string;
      payload: UpdateKpiStatusPayload;
    }) => {
      const res = await QcReviewService.updateStatus(kpiId, payload);
      if (res.data) return res.data;
      throw new Error(res.error?.message || "Failed to update KPI status");
    },
    onSuccess: (_data, vars) => {
      toast.success("KPI status updated");
      qc.invalidateQueries({ queryKey: ["qc-review-kpi", vars.kpiId] });
      qc.invalidateQueries({ queryKey: ["qc", "review", "departments"] });
    },
    onError: (err: any) => {
      toast.error("Update failed", { description: err.message });
    },
  });
}
