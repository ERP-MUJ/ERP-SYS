import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  downloadDepartmentReport,
  downloadKpiReport,
  getReportKpiOptions,
  triggerBrowserDownload,
} from "@/services/qc/report.service";
import type { QcReportKpiOption } from "@workspace/types/types";

export function useGetReportKpiOptions() {
  return useQuery<QcReportKpiOption[]>({
    queryKey: ["qc-report-kpi-options"],
    queryFn: async () => {
      const response = await getReportKpiOptions();
      if (response.data) return response.data;
      throw new Error(response.error?.message || "Failed to fetch KPI options");
    },
  });
}

export function useDownloadKpiWorkbook() {
  return useMutation({
    mutationFn: async ({
      kpiTemplateId,
      kpiNumber,
      kpiMetricName,
    }: {
      kpiTemplateId: string;
      kpiNumber?: number | string;
      kpiMetricName?: string | null;
    }) => {
      if (!kpiTemplateId) {
        throw new Error("KPI template is required");
      }
      const result = await downloadKpiReport({
        kpiTemplateId,
        kpiNumber,
        kpiMetricName,
      });
      triggerBrowserDownload(result);
      return result.fileName;
    },
    onSuccess: (fileName) => {
      toast.success("KPI report downloaded", {
        description: fileName,
      });
    },
    onError: (error: any) => {
      toast.error("Failed to download KPI report", {
        description: error?.message || "Unexpected error encountered",
      });
    },
  });
}

export function useDownloadDepartmentWorkbook() {
  return useMutation({
    mutationFn: async ({
      departmentId,
      departmentName,
    }: {
      departmentId: string;
      departmentName?: string | null;
    }) => {
      if (!departmentId) {
        throw new Error("Department is required");
      }
      const result = await downloadDepartmentReport({
        departmentId,
        departmentName,
      });
      triggerBrowserDownload(result);
      return result.fileName;
    },
    onSuccess: (fileName) => {
      toast.success("Department report downloaded", {
        description: fileName,
      });
    },
    onError: (error: any) => {
      toast.error("Failed to download department report", {
        description: error?.message || "Unexpected error encountered",
      });
    },
  });
}
