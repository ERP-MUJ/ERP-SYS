import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  QcReviewService,
  UpdateKpiStatusPayload,
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

// Entry comments hooks - can be used by QC, HOD, and Faculty
export function useGetEntryComments(kpiId: string | null) {
  return useQuery({
    queryKey: ["qc-entry-comments", kpiId],
    queryFn: async () => {
      if (!kpiId) throw new Error("KPI ID required");
      const res = await QcReviewService.getEntryComments(kpiId);
      if (res.data) return res.data;
      throw new Error(res.error?.message || "Failed to fetch entry comments");
    },
    enabled: !!kpiId,
  });
}

// Only QAC can save comments
export function useSaveEntryComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      kpiId,
      entryIndex,
      comment,
    }: {
      kpiId: string;
      entryIndex: number;
      comment: string;
    }) => {
      const res = await QcReviewService.saveEntryComment(
        kpiId,
        entryIndex,
        comment,
      );
      if (res.data) return res.data;
      throw new Error(res.error?.message || "Failed to save comment");
    },
    onSuccess: (_data, vars) => {
      toast.success("Comment saved");
      qc.invalidateQueries({ queryKey: ["qc-entry-comments", vars.kpiId] });
    },
    onError: (err: any) => {
      toast.error("Failed to save comment", { description: err.message });
    },
  });
}
