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
const DEFAULT_DEPARTMENT_KPI_FILENAME = "department-kpi.xlsx";

function buildFilename(
  parts: Array<string | number | null | undefined>,
  extension = "xlsx",
): string {
  const sanitized = parts
    .map((part) => (part === null || part === undefined ? "" : String(part)))
    .map((part) =>
      part
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .replace(/_+/g, "_")
        .substring(0, 50),
    )
    .filter((part) => part.length > 0);

  const base = sanitized.join("_") || "report";
  return extension ? `${base}.${extension.replace(/^\./, "")}` : base;
}

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
  fallbackParts: Array<string | number | null | undefined> = [],
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
  const computedFallback =
    fallbackParts.length > 0 ? buildFilename(fallbackParts) : fallbackName;
  const fileName =
    extractFilename(response.headers.get("content-disposition")) ||
    computedFallback;
  return { blob, fileName };
}

export async function downloadKpiReport(params: {
  kpiTemplateId: string;
  kpiNumber?: number | string;
  kpiMetricName?: string | null;
}): Promise<DownloadResult> {
  const { kpiTemplateId, kpiNumber, kpiMetricName } = params;
  if (!kpiTemplateId) throw new Error("KPI template is required");

  const fallbackParts =
    (kpiNumber ?? kpiMetricName)
      ? [
          "KPI",
          kpiNumber ?? null,
          kpiMetricName ?? null,
          new Date().toISOString().split("T")[0],
        ]
      : [];

  return authenticatedDownload(
    `${REPORT_BASE_URL}/kpi/${kpiTemplateId}/download`,
    DEFAULT_KPI_FILENAME,
    fallbackParts,
  );
}

export async function downloadDepartmentReport(params: {
  departmentId: string;
  departmentName?: string | null;
}): Promise<DownloadResult> {
  const { departmentId, departmentName } = params;
  if (!departmentId) throw new Error("Department is required");

  const fallbackParts = departmentName
    ? [
        departmentName,
        "department_report",
        new Date().toISOString().split("T")[0],
      ]
    : [];

  return authenticatedDownload(
    `${REPORT_BASE_URL}/department/${departmentId}/download`,
    DEFAULT_DEPARTMENT_FILENAME,
    fallbackParts,
  );
}

export async function downloadDepartmentKpiWorkbook(params: {
  departmentKpiId: string;
  departmentName?: string | null;
  kpiNumber?: number | string;
  kpiMetricName?: string | null;
}): Promise<DownloadResult> {
  const { departmentKpiId, departmentName, kpiNumber, kpiMetricName } = params;
  if (!departmentKpiId) throw new Error("Department KPI is required");

  const fallbackParts =
    (departmentName ?? kpiNumber ?? kpiMetricName)
      ? [
          departmentName ?? "Department",
          "KPI",
          kpiNumber ?? null,
          kpiMetricName ?? null,
          new Date().toISOString().split("T")[0],
        ]
      : [];

  return authenticatedDownload(
    `${REPORT_BASE_URL}/department-kpi/${departmentKpiId}/download`,
    DEFAULT_DEPARTMENT_KPI_FILENAME,
    fallbackParts,
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
