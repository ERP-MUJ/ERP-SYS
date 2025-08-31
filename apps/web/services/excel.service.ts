import { ApiClient } from "@/lib/api-client";

export class ExcelService {
  static async downloadKpiTemplate(kpiId: string): Promise<void> {
    const response = await ApiClient.get<{ buffer: string; fileName: string }>(
      `/coordinator/kpi/${kpiId}/template`,
    );

    if (response.error) {
      throw new Error(response.error.message);
    }
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
    }>(`/coordinator/kpi/${kpiId}/upload`, formData);

    if (response.error) {
      throw new Error(response.error.message);
    }
    return response.data;
  }
}
