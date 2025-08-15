import { ApiClient } from "@/lib/api-client";

export class HodKpiService {
  /**
   * Get all pillars assigned to HOD's department
   */
  static async getDepartmentPillars() {
    return await ApiClient.get("/hod/kpi-management/pillars");
  }

  /**
   * Get KPIs for a specific department pillar
   */
  static async getDepartmentPillarKPIs(pillarId: string) {
    return await ApiClient.get(`/hod/kpi-management/pillars/${pillarId}/kpis`);
  }

  /**
   * Get KPI details for form filling
   */
  static async getKpiDetails(kpiId: string) {
    return await ApiClient.get(`/hod/kpi-management/kpi/${kpiId}`);
  }

  /**
   * Update KPI form responses
   */
  static async updateKpiResponses(
    kpiId: string,
    formResponses: Record<string, any>,
  ) {
    return await ApiClient.put(
      `/hod/kpi-management/kpi/${kpiId}/responses`,
      formResponses,
    );
  }
}
