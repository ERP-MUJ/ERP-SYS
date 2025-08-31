import { useMutation } from "@tanstack/react-query";
import { ExcelService } from "@/services/excel.service";
import { toast } from "sonner";

export const useDownloadExcelTemplate = () => {
  return useMutation({
    mutationFn: async (kpiId: string) => {
      await ExcelService.downloadKpiTemplate(kpiId);
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
