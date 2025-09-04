import { useMutation } from "@tanstack/react-query";
import { ExcelService } from "@/services/excel.service";
import { toast } from "sonner";

export const useDownloadExcelTemplate = () => {
  return useMutation({
    mutationFn: async (kpiId: string) => {
      return ExcelService.downloadKpiTemplate(kpiId);
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

export const useUploadExcel = () => {
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

      return ExcelService.uploadExcel(kpiId, formData);
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
