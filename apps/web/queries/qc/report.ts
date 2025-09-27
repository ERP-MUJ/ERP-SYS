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
    mutationFn: async (kpiTemplateId: string) => {
      const result = await downloadKpiReport(kpiTemplateId);
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
    mutationFn: async (departmentId: string) => {
      const result = await downloadDepartmentReport(departmentId);
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
