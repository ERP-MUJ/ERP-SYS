import { ApiClient } from "@/lib/api-client";
import {
  CreateKpiRequestData,
  KpiTemplateInstance,
} from "@workspace/types/types";
import { ApiError } from "@/types/error";

/**
 * Get all KPIs for a specific pillar
 * @param pillarId - The ID of the pillar
 * @returns Promise with KPI instances
 */
export const getKpis = async (pillarId: string) => {
  try {
    const response = await ApiClient.get<KpiTemplateInstance[]>(
      `/qc/${pillarId}/kpi`,
    );
    return response;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw error;
  }
};

/**
 * Get a specific KPI by ID
 * @param pillarId - The ID of the pillar
 * @param kpiId - The ID of the KPI
 * @returns Promise with KPI instance
 */
export const getKpiById = async (pillarId: string, kpiId: string) => {
  try {
    const response = await ApiClient.get<KpiTemplateInstance>(
      `/qc/${pillarId}/kpi/${kpiId}`,
    );
    return response;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw error;
  }
};

/**
 * Create a new KPI for a specific pillar
 * @param pillarId - The ID of the pillar
 * @param data - The KPI creation data
 * @returns Promise with created KPI instance
 */
export const addKpi = async (pillarId: string, data: CreateKpiRequestData) => {
  try {
    const response = await ApiClient.post<
      KpiTemplateInstance,
      CreateKpiRequestData
    >(`/qc/${pillarId}/kpi`, data);
    return response;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw error;
  }
};

/**
 * Update an existing KPI
 * @param pillarId - The ID of the pillar
 * @param kpiId - The ID of the KPI to update
 * @param data - The KPI update data
 * @returns Promise with updated KPI instance
 */
export const updateKpi = async (
  pillarId: string,
  kpiId: string,
  data: Partial<CreateKpiRequestData>,
) => {
  try {
    const response = await ApiClient.patch<
      KpiTemplateInstance,
      Partial<CreateKpiRequestData>
    >(`/qc/${pillarId}/kpi/${kpiId}`, data);
    return response;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw error;
  }
};

/**
 * Delete a KPI
 * @param pillarId - The ID of the pillar
 * @param kpiId - The ID of the KPI to delete
 * @returns Promise with deleted KPI instance
 */
export const deleteKpi = async (pillarId: string, kpiId: string) => {
  try {
    const response = await ApiClient.delete<KpiTemplateInstance>(
      `/qc/${pillarId}/kpi/${kpiId}`,
    );
    return response;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw error;
  }
};

/**
 * Check if KPI number already exists in the pillar
 * @param pillarId - The ID of the pillar
 * @param kpiNumber - The KPI number to check
 * @param academicYear - The academic year
 * @param excludeKpiId - Optional KPI ID to exclude from check (for edit mode)
 * @returns Promise with duplicate check result
 */
export const checkKpiNumberExists = async (
  pillarId: string,
  kpiNumber: number,
  academicYear: number,
  excludeKpiId?: string,
) => {
  try {
    const params = new URLSearchParams({
      academicYear: academicYear.toString(),
      ...(excludeKpiId && { excludeKpiId }),
    });

    const response = await ApiClient.get<{
      exists: boolean;
      kpiNumber?: number;
    }>(`/qc/${pillarId}/kpi/check-duplicate/${kpiNumber}?${params}`);
    return response;
  } catch (error: unknown) {
    const apiError = error as ApiError;
    throw error;
  }
};
