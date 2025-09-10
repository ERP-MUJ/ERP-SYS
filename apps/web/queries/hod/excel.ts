import { useMutation } from "@tanstack/react-query";
import { HodExcelService } from "@/services/hod/excel.service";
import { toast } from "sonner";

/**
 * Hook for downloading Excel template for HOD KPI data entry
 * @returns Mutation object for downloading Excel template
 */
export const useDownloadHodExcelTemplate = () => {
  return useMutation({
    mutationFn: async (kpiId: string) => {
      return HodExcelService.downloadKpiTemplate(kpiId);
    },
    onSuccess: () => {
      toast.success("Excel template downloaded successfully!");
    },
    onError: (error) => {
      console.error("Download failed:", error);
      toast.error("Failed to download Excel template", {
        description: error.message || "Please try again",
      });
    },
  });
};

/**
 * Hook for uploading Excel file with HOD KPI data
 * @returns Mutation object for uploading Excel file
 */
export const useUploadHodExcel = () => {
  return useMutation({
    mutationFn: async ({
      kpiId,
      formData,
    }: {
      kpiId: string;
      formData: FormData;
    }) => {
      toast.loading("Uploading Excel file...", {
        description: "Please wait while we process your data",
      });

      return HodExcelService.uploadExcel(kpiId, formData);
    },
    onSuccess: (data) => {
      toast.dismiss();

      if (data.success) {
        if (data.errorRows === 0) {
          toast.success("Excel file uploaded successfully!", {
            description: `All ${data.processedRows} rows were processed successfully.`,
          });
        } else {
          toast.success("Excel file uploaded with some errors", {
            description: `${data.processedRows} rows processed, ${data.errorRows} rows had validation errors.`,
          });
        }
      } else {
        toast.error("Upload failed", {
          description: data.message,
        });
      }
    },
    onError: (error) => {
      toast.dismiss();
      console.error("Upload failed:", error);
      toast.error("Failed to upload Excel file", {
        description: error.message || "Please check your file and try again",
      });
    },
  });
};
