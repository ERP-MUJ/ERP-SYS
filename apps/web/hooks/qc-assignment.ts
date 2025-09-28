/**
 * Custom hooks for QC Assignment data processing and business logic
 * Extracted from page components to improve modularity and reusability
 */

import { useMemo } from "react";
import { PillarData, KpiData } from "@/lib/types/qc-assignment";

/**
 * Hook to process pillar data into assigned and unassigned categories
 */
export function usePillarAssignments(
  selectedDepartmentId: string | null,
  pillarTemplates: any[],
  selectedDepartmentPillars: any[],
) {
  return useMemo(() => {
    if (!selectedDepartmentId) {
      return { assignedPillars: [], unassignedPillars: [] };
    }

    // Create a map of existing templates
    const templateMap = new Map(pillarTemplates.map((pt) => [pt.id, pt]));

    // Create a map of assigned department pillars
    const assignedPillarMap = new Map(
      selectedDepartmentPillars.map((dp) => [dp.template_id, dp]),
    );

    // Process assigned pillars - include both matched templates and orphaned department pillars
    const assigned: PillarData[] = [];

    // Add pillars that have matching templates
    pillarTemplates
      .filter((pt) => assignedPillarMap.has(pt.id))
      .forEach((pt) => {
        const departmentPillar = assignedPillarMap.get(pt.id);
        assigned.push({
          ...pt,
          departmentPillarId: departmentPillar?.id,
          pillar_weight: departmentPillar?.pillar_weight,
          pillar_target: departmentPillar?.pillar_target,
        });
      });

    // Add orphaned department pillars (where template no longer exists)
    // These are pillars that were assigned but their original templates were deleted
    selectedDepartmentPillars
      .filter((dp) => !templateMap.has(dp.template_id))
      .forEach((dp) => {
        // Only include active orphaned pillars (not archived)
        if (dp.status !== "archived") {
          assigned.push({
            id: dp.template_id, // Use original template ID
            pillar_name: dp.pillar_name,
            description: dp.description,
            pillar_value: null,
            percentage_target_achieved: dp.percentage_target_achieved,
            performance: dp.performance,
            academic_year: dp.academic_year,
            created_at: dp.assigned_date,
            updated_at: dp.assigned_date,
            kpi_templates: [], // No template KPIs available
            departmentPillarId: dp.id,
            pillar_weight: dp.pillar_weight,
            pillar_target: dp.pillar_target,
            isOrphaned: true, // Mark as orphaned for UI distinction
          });
        }
      });

    // Process unassigned pillars (templates not yet assigned)
    const unassigned = pillarTemplates.filter(
      (pt) => !assignedPillarMap.has(pt.id),
    );

    return { assignedPillars: assigned, unassignedPillars: unassigned };
  }, [selectedDepartmentId, pillarTemplates, selectedDepartmentPillars]);
}

/**
 * Hook to process KPI data based on selected pillar
 */
export function useKpiAssignments(
  selectedPillarId: string | null,
  pillarTemplates: any[],
  assignedPillars: PillarData[],
  selectedDepartmentPillar: any,
  departmentPillarKPIs: any[],
) {
  return useMemo(() => {
    if (!selectedPillarId) {
      return { assignedKpis: [], unassignedKpis: [], isOrphanedPillar: false };
    }

    // Check if selected pillar is orphaned
    const selectedAssignedPillar = assignedPillars.find(
      (p) => p.id === selectedPillarId,
    );
    const isOrphaned = selectedAssignedPillar?.isOrphaned || false;

    if (isOrphaned) {
      // For orphaned pillars, show existing department KPIs only (no template KPIs available)
      const assigned = departmentPillarKPIs.map((dk) => ({
        id: dk.template_id,
        departmentKpiId: dk.id,
        kpiNo: dk.kpi_number,
        kpi_number: dk.kpi_number,
        metric: dk.kpi_metric_name,
        kpi_metric_name: dk.kpi_metric_name,
        kpi_description: dk.kpi_description,
        dataProvidedBy: dk.data_provided_by,
        data_provided_by: dk.data_provided_by,
        kpi_value: dk.kpi_value,
        kpi_target: dk.kpi_target,
        kpi_data: dk.kpi_data,
        kpi_calculated_metrics: dk.kpi_calculated_metrics,
        academic_year: dk.academic_year,
        created_at: dk.assigned_date,
        updated_at: dk.assigned_date,
        percentage_target_achieved: dk.percentage_target_achieved,
        performance: dk.performance,
        kpi_status: dk.kpi_status,
        assigned_date: dk.assigned_date,
        due_date: dk.due_date,
        completed_date: dk.completed_date,
        comments: dk.comments,
        form_responses: dk.form_responses,
        user_ids: dk.user_ids,
        assigned_users: dk.assigned_users,
      }));
      return {
        assignedKpis: assigned,
        unassignedKpis: [],
        isOrphanedPillar: true,
      };
    }

    // Regular logic for non-orphaned pillars
    const selectedPillar = pillarTemplates.find(
      (pt) => pt.id === selectedPillarId,
    );
    if (!selectedPillar) {
      return { assignedKpis: [], unassignedKpis: [], isOrphanedPillar: false };
    }
    if (!selectedDepartmentPillar) {
      return {
        assignedKpis: [],
        unassignedKpis: selectedPillar.kpi_templates,
        isOrphanedPillar: false,
      };
    }
    const assigned = departmentPillarKPIs.map((dk) => ({
      id: dk.template_id,
      departmentKpiId: dk.id,
      kpiNo: dk.kpi_number,
      kpi_number: dk.kpi_number,
      metric: dk.kpi_metric_name,
      kpi_metric_name: dk.kpi_metric_name,
      kpi_description: dk.kpi_description,
      dataProvidedBy: dk.data_provided_by,
      data_provided_by: dk.data_provided_by,
      kpi_value: dk.kpi_value,
      kpi_target: dk.kpi_target,
      kpi_data: dk.kpi_data,
      kpi_calculated_metrics: dk.kpi_calculated_metrics,
      academic_year: dk.academic_year,
      created_at: dk.assigned_date,
      updated_at: dk.assigned_date,
      percentage_target_achieved: dk.percentage_target_achieved,
      performance: dk.performance,
      kpi_status: dk.kpi_status,
      assigned_date: dk.assigned_date,
      due_date: dk.due_date,
      completed_date: dk.completed_date,
      comments: dk.comments,
      form_responses: dk.form_responses,
      user_ids: dk.user_ids,
      assigned_users: dk.assigned_users,
    }));
    const assignedTemplateIds = assigned.map((k) => k.id);
    const unassigned = selectedPillar.kpi_templates.filter(
      (kt: any) => !assignedTemplateIds.includes(kt.id),
    );
    return {
      assignedKpis: assigned,
      unassignedKpis: unassigned,
      isOrphanedPillar: false,
    };
  }, [
    selectedPillarId,
    pillarTemplates,
    selectedDepartmentPillar,
    departmentPillarKPIs,
    assignedPillars,
  ]);
}

/**
 * Hook to calculate department statistics
 */
export function useDepartmentStats(
  allDepartmentPillars: any[],
  departmentId: string,
) {
  return useMemo(() => {
    const deptPillars = allDepartmentPillars.filter(
      (dp: { dept_id: string }) => dp.dept_id === departmentId,
    );

    const totalKPIs = deptPillars.reduce(
      (sum: number, pillar: { department_kpis?: any[] }) =>
        sum + (pillar.department_kpis?.length || 0),
      0,
    );

    const completedKPIs = deptPillars.reduce(
      (sum: number, pillar: { department_kpis?: any[] }) =>
        sum +
        (pillar.department_kpis?.filter((kpi) => kpi.kpi_status === "APPROVED")
          .length || 0),
      0,
    );

    return {
      totalPillars: deptPillars.length,
      totalKPIs,
      completedKPIs,
      pendingKPIs: totalKPIs - completedKPIs,
    };
  }, [allDepartmentPillars, departmentId]);
}
