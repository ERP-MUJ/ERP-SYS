import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  QcReviewService,
  UpdateKpiStatusPayload,
  ReviewKpiEntryPayload,
  BulkReviewKpiEntriesPayload,
} from "@/services/qc/review.service";
import {
  downloadDepartmentKpiWorkbook,
  triggerBrowserDownload,
} from "@/services/qc/report.service";
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

export function useGetKpiEntriesWithReview(kpiId: string | null) {
  return useQuery({
    queryKey: ["qc-review-kpi-entries", kpiId],
    queryFn: async () => {
      if (!kpiId) throw new Error("KPI ID required");
      const res = await QcReviewService.getKpiEntriesWithReview(kpiId);
      if (res.data) return res.data;
      throw new Error(res.error?.message || "Failed to fetch KPI entries");
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
      qc.invalidateQueries({ queryKey: ["qc-review-kpi-entries", vars.kpiId] });
      qc.invalidateQueries({ queryKey: ["qc", "review", "departments"] });
    },
    onError: (err: any) => {
      toast.error("Update failed", { description: err.message });
    },
  });
}

export function useReviewKpiEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      kpiId,
      payload,
    }: {
      kpiId: string;
      payload: ReviewKpiEntryPayload;
    }) => {
      const res = await QcReviewService.reviewKpiEntry(kpiId, payload);
      if (res.data) return res.data;
      throw new Error(res.error?.message || "Failed to review KPI entry");
    },
    onSuccess: (_data, vars) => {
      toast.success("KPI entry reviewed successfully");
      qc.invalidateQueries({ queryKey: ["qc-review-kpi", vars.kpiId] });
      qc.invalidateQueries({ queryKey: ["qc-review-kpi-entries", vars.kpiId] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to review KPI entry");
    },
  });
}

export function useBulkReviewKpiEntries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: BulkReviewKpiEntriesPayload) => {
      const res = await QcReviewService.bulkReviewKpiEntries(payload);
      if (res.data) return res.data;
      throw new Error(
        res.error?.message || "Failed to bulk review KPI entries",
      );
    },
    onSuccess: (_data, vars) => {
      toast.success("KPI entries reviewed successfully");
      qc.invalidateQueries({ queryKey: ["qc-review-kpi", vars.kpi_id] });
      qc.invalidateQueries({
        queryKey: ["qc-review-kpi-entries", vars.kpi_id],
      });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to bulk review KPI entries");
    },
  });
}

export function useDownloadDepartmentKpiWorkbook() {
  return useMutation({
    mutationFn: async ({
      departmentKpiId,
      departmentName,
      kpiNumber,
      kpiMetricName,
    }: {
      departmentKpiId: string;
      departmentName?: string | null;
      kpiNumber?: number | string;
      kpiMetricName?: string | null;
    }) => {
      if (!departmentKpiId) {
        throw new Error("KPI identifier is required");
      }
      const result = await downloadDepartmentKpiWorkbook({
        departmentKpiId,
        departmentName,
        kpiNumber,
        kpiMetricName,
      });
      triggerBrowserDownload(result);
      return result.fileName;
    },
    onSuccess: (fileName) => {
      toast.success("KPI workbook downloaded", {
        description: fileName,
      });
    },
    onError: (err: any) => {
      toast.error("Failed to download KPI workbook", {
        description: err.message,
      });
    },
  });
}
