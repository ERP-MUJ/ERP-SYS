/**
 * Custom hooks for QC Assignment handler functions
 * Encapsulates business logic and mutation calls
 */

import { toast } from "sonner";
import {
  PillarData,
  KpiData,
  AssignPillarPayload,
} from "@/lib/types/qc-assignment";
import {
  useAssignPillarToDepartment,
  useUnassignPillarFromDepartment,
  useArchiveOrphanedPillar,
  useRestoreArchivedPillar,
  useUpdateDepartmentPillar,
  useAssignKpiToDepartmentPillar,
  useUnassignKpiFromDepartmentPillar,
  useUpdateDepartmentKpi,
} from "@/queries/qc/department-assignment";

/**
 * Hook for pillar-related handlers
 */
export function usePillarHandlers(selectedDepartmentId: string | null) {
  const assignPillarMutation = useAssignPillarToDepartment();
  const unassignPillarMutation = useUnassignPillarFromDepartment();
  const archiveOrphanedMutation = useArchiveOrphanedPillar();
  const restoreArchivedMutation = useRestoreArchivedPillar();
  const updatePillarMutation = useUpdateDepartmentPillar();

  const handleAssignPillar = (pillar: AssignPillarPayload) => {
    if (!selectedDepartmentId) {
      toast.error("Please select a department first");
      return;
    }
    assignPillarMutation.mutate({
      departmentId: selectedDepartmentId,
      payload: {
        pillarTemplateId: pillar.id,
        pillarWeight: pillar.weightA || pillar.weight || 0,
        pillarTarget: pillar.target,
      },
    });
  };

  const handleUnassignPillar = (pillar: PillarData) => {
    if (!selectedDepartmentId) {
      toast.error("Please select a department first");
      return;
    }
    if (!pillar.departmentPillarId) {
      toast.error("Pillar not found in department");
      return;
    }
    unassignPillarMutation.mutate({
      departmentPillarId: pillar.departmentPillarId,
      departmentId: selectedDepartmentId,
    });
  };

  const handleDeletePillar = (pillar: PillarData) => {
    if (!selectedDepartmentId) {
      toast.error("Please select a department first");
      return;
    }
    if (!pillar.departmentPillarId) {
      toast.error("Pillar not found in department");
      return;
    }

    if (pillar.isOrphaned) {
      // Archive orphaned pillars to preserve historical data
      archiveOrphanedMutation.mutate({
        departmentPillarId: pillar.departmentPillarId,
        departmentId: selectedDepartmentId,
      });
    } else {
      // For regular pillars, use normal unassign (which deletes)
      unassignPillarMutation.mutate({
        departmentPillarId: pillar.departmentPillarId,
        departmentId: selectedDepartmentId,
      });
    }
  };

  const handleRestorePillar = (pillar: PillarData) => {
    if (!selectedDepartmentId) {
      toast.error("Please select a department first");
      return;
    }
    if (!pillar.departmentPillarId) {
      toast.error("Pillar not found in department");
      return;
    }

    restoreArchivedMutation.mutate({
      departmentPillarId: pillar.departmentPillarId,
      departmentId: selectedDepartmentId,
    });
  };

  const handleUpdatePillar = (
    pillar: PillarData,
    weight?: number,
    target?: number,
  ) => {
    if (!selectedDepartmentId) {
      toast.error("Please select a department");
      return;
    }
    if (!pillar.departmentPillarId) {
      toast.error("Cannot find the assigned pillar to update.");
      return;
    }

    // Call mutation with proper parameter structure
    updatePillarMutation.mutate({
      departmentPillarId: pillar.departmentPillarId,
      departmentId: selectedDepartmentId,
      pillarWeight: weight,
      pillarTarget: target,
    });
  };

  const handleBulkAssignAll = (pillars: PillarData[]) => {
    if (!selectedDepartmentId) {
      toast.error("Please select a department first");
      return;
    }

    // Assign all pillars with default weights
    pillars.forEach((pillar) => {
      assignPillarMutation.mutate({
        departmentId: selectedDepartmentId,
        payload: {
          pillarTemplateId: pillar.id,
          pillarWeight: pillar.pillar_value || 0,
          pillarTarget: undefined,
        },
      });
    });

    toast.success(`Assigning ${pillars.length} pillars to department...`);
  };

  const handleBulkUnassignAll = (pillars: PillarData[]) => {
    if (!selectedDepartmentId) {
      toast.error("Please select a department first");
      return;
    }

    // Unassign all regular pillars (not orphaned)
    pillars.forEach((pillar) => {
      if (pillar.departmentPillarId && !pillar.isOrphaned) {
        unassignPillarMutation.mutate({
          departmentPillarId: pillar.departmentPillarId,
          departmentId: selectedDepartmentId,
        });
      }
    });

    toast.success(
      `Unassigning ${pillars.filter((p) => !p.isOrphaned).length} pillars from department...`,
    );
  };

  return {
    handleAssignPillar,
    handleUnassignPillar,
    handleDeletePillar,
    handleRestorePillar,
    handleUpdatePillar,
    handleBulkAssignAll,
    handleBulkUnassignAll,
    mutations: {
      assignPillarMutation,
      unassignPillarMutation,
      archiveOrphanedMutation,
      restoreArchivedMutation,
      updatePillarMutation,
    },
  };
}

/**
 * Hook for KPI-related handlers
 */
export function useKpiHandlers(
  selectedDepartmentPillar: any,
  departmentPillarKPIs: any[],
) {
  const assignKpiMutation = useAssignKpiToDepartmentPillar();
  const unassignKpiMutation = useUnassignKpiFromDepartmentPillar();
  const updateKpiMutation = useUpdateDepartmentKpi();

  const handleAssignKpi = (
    kpi: KpiData,
    weightage: number,
    target?: number,
  ) => {
    if (!selectedDepartmentPillar) {
      toast.error("No department pillar selected");
      return;
    }
    assignKpiMutation.mutate({
      departmentPillarId: selectedDepartmentPillar.id,
      kpiTemplateId: kpi.id,
      kpiValue: weightage,
      kpiTarget: target,
    });
  };

  const handleUnassignKpi = (kpi: KpiData) => {
    if (!selectedDepartmentPillar) {
      toast.error("No department pillar selected");
      return;
    }
    const departmentKpi = departmentPillarKPIs.find(
      (dk) => dk.template_id === kpi.id,
    );
    if (!departmentKpi) {
      toast.error("KPI not found in department pillar");
      return;
    }
    unassignKpiMutation.mutate({
      departmentKpiId: departmentKpi.id,
      departmentPillarId: selectedDepartmentPillar.id,
    });
  };

  const handleUpdateKpi = (
    kpi: KpiData,
    weightage?: number,
    target?: number,
  ) => {
    if (!selectedDepartmentPillar) {
      toast.error("No department pillar selected");
      return;
    }
    if (!kpi.departmentKpiId) {
      toast.error("Cannot find the assigned KPI to update.");
      return;
    }
    const updateData: any = {
      departmentKpiId: kpi.departmentKpiId,
      departmentPillarId: selectedDepartmentPillar.id,
    };
    if (weightage !== undefined) {
      updateData.kpiValue = weightage;
    }
    if (target !== undefined) {
      updateData.kpiTarget = target;
    }
    updateKpiMutation.mutate(updateData);
  };

  return {
    handleAssignKpi,
    handleUnassignKpi,
    handleUpdateKpi,
    mutations: {
      assignKpiMutation,
      unassignKpiMutation,
      updateKpiMutation,
    },
  };
}
