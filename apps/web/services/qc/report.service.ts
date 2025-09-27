import { envConfig } from "@/config";
import { ApiClient } from "@/lib/api-client";
import { ApiError } from "@/types/error";
import { getSession } from "next-auth/react";
import type { QcReportKpiOption } from "@workspace/types/types";

export interface DownloadResult {
  blob: Blob;
  fileName: string;
}

const REPORT_BASE_URL = "/qc/report";

const DEFAULT_KPI_FILENAME = "kpi-report.xlsx";
const DEFAULT_DEPARTMENT_FILENAME = "department-report.xlsx";

export async function getReportKpiOptions() {
  try {
    return await ApiClient.get<QcReportKpiOption[]>(
      `${REPORT_BASE_URL}/kpi-options`,
    );
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw apiError;
  }
}

function extractFilename(disposition: string | null): string | null {
  if (!disposition) return null;
  const match = disposition.match(
    /filename\*=UTF-8''(.+)$|filename="?([^";]+)"?/i,
  );
  if (!match) return null;
  const candidate = match[1] ?? match[2];
  if (!candidate) return null;
  return decodeURIComponent(candidate);
}

async function authenticatedDownload(
  path: string,
  fallbackName: string,
): Promise<DownloadResult> {
  const session = await getSession();
  if (!session?.user?.token) {
    throw new Error("Authentication required to download reports");
  }

  const url = `${envConfig.apiUrl}${path}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${session.user.token}`,
    },
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const errorJson = await response.json();
      throw new Error(errorJson?.message || "Failed to download report");
    }
    throw new Error(`Failed to download report (status ${response.status})`);
  }

  const blob = await response.blob();
  const fileName =
    extractFilename(response.headers.get("content-disposition")) ||
    fallbackName;
  return { blob, fileName };
}

export async function downloadKpiReport(
  kpiTemplateId: string,
): Promise<DownloadResult> {
  if (!kpiTemplateId) throw new Error("KPI template is required");
  return authenticatedDownload(
    `${REPORT_BASE_URL}/kpi/${kpiTemplateId}/download`,
    DEFAULT_KPI_FILENAME,
  );
}

export async function downloadDepartmentReport(
  departmentId: string,
): Promise<DownloadResult> {
  if (!departmentId) throw new Error("Department is required");
  return authenticatedDownload(
    `${REPORT_BASE_URL}/department/${departmentId}/download`,
    DEFAULT_DEPARTMENT_FILENAME,
  );
}

export function triggerBrowserDownload({ blob, fileName }: DownloadResult) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
