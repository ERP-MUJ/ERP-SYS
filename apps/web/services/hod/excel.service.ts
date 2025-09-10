import { ApiClient } from "@/lib/api-client";

/**
 * HOD Excel Service
 * Handles Excel download and upload operations for HOD users
 */
export class HodExcelService {
  /**
   * Download Excel template for HOD KPI data entry
   * @param kpiId - The KPI ID to download template for
   */
  static async downloadKpiTemplate(kpiId: string): Promise<void> {
    const response = await ApiClient.get<{ buffer: string; fileName: string }>(
      `/hod/kpi-management/kpi/${kpiId}/template`,
    );

    if (response.error) {
      throw new Error(response.error.message);
    }

    // Convert base64 buffer to blob and download
    const byteCharacters = atob(response.data.buffer);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = response.data.fileName;

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Upload Excel file with HOD KPI data
   * @param kpiId - The KPI ID to upload data for
   * @param formData - FormData containing the Excel file
   */
  static async uploadExcel(
    kpiId: string,
    formData: FormData,
  ): Promise<{
    success: boolean;
    processedRows: number;
    errorRows: number;
    totalRows: number;
    validationErrors?: Array<{
      row: number;
      field: string;
      message: string;
      value: string;
    }>;
    message: string;
    dataSaved: boolean;
  }> {
    const response = await ApiClient.post<{
      success: boolean;
      processedRows: number;
      errorRows: number;
      totalRows: number;
      validationErrors?: Array<{
        row: number;
        field: string;
        message: string;
        value: string;
      }>;
      message: string;
      dataSaved: boolean;
    }>(`/hod/kpi-management/kpi/${kpiId}/upload`, formData);

    if (response.error) {
      throw new Error(response.error.message);
    }
    return response.data;
  }
}
