import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getDepartments,
  getPillarTemplates,
  getDepartmentPillars,
  getAllDepartmentPillars,
  assignPillarToDepartment,
  updateDepartmentPillar,
  unassignPillarFromDepartment,
  getDepartmentPillarKPIs,
  assignKpiToDepartmentPillar,
  unassignKpiFromDepartmentPillar,
  updateDepartmentKpi,
  Department,
  PillarTemplate,
  DepartmentPillar,
  DepartmentKpi,
  AssignPillarPayload,
} from "@/services/qc/department-assignment.service";

export function useGetDepartments() {
  return useQuery({
    queryKey: ["qc-departments"],
    queryFn: async () => {
      const res = await getDepartments();
      if (res.data) return res.data;
      throw new Error(res.error?.message || "Failed to fetch departments");
    },
  });
}

export function useGetPillarTemplates() {
  return useQuery({
    queryKey: ["qc-pillar-templates"],
    queryFn: async () => {
      const res = await getPillarTemplates();
      if (res.data) return res.data;
      throw new Error(res.error?.message || "Failed to fetch pillar templates");
    },
  });
}

export function useGetDepartmentPillars(departmentId: string | null) {
  return useQuery({
    queryKey: ["qc-department-pillars", departmentId],
    queryFn: async () => {
      if (!departmentId) throw new Error("Department ID is required");
      const res = await getDepartmentPillars(departmentId);
      if (res.data) return res.data;
      throw new Error(
        res.error?.message || "Failed to fetch department pillars",
      );
    },
    enabled: Boolean(departmentId),
  });
}

export function useGetAllDepartmentPillars() {
  return useQuery({
    queryKey: ["qc-all-department-pillars"],
    queryFn: async () => {
      const res = await getAllDepartmentPillars();
      if (res.data) return res.data;
      throw new Error(
        res.error?.message || "Failed to fetch all department pillars",
      );
    },
  });
}

export function useGetDepartmentPillarKPIs(departmentPillarId: string | null) {
  return useQuery({
    queryKey: ["qc-department-pillar-kpis", departmentPillarId],
    queryFn: async () => {
      if (!departmentPillarId)
        throw new Error("Department pillar ID is required");
      const res = await getDepartmentPillarKPIs(departmentPillarId);
      if (res.data) return res.data;
      throw new Error(
        res.error?.message || "Failed to fetch department pillar KPIs",
      );
    },
    enabled: Boolean(departmentPillarId),
  });
}

export function useAssignPillarToDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      departmentId,
      payload,
    }: {
      departmentId: string;
      payload: AssignPillarPayload;
    }) => {
      const res = await assignPillarToDepartment(departmentId, payload);
      if (res.data) return res.data;
      throw new Error(
        res.error?.message || "Failed to assign pillar to department",
      );
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["qc-department-pillars", variables.departmentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["qc-all-department-pillars"],
      });
      queryClient.invalidateQueries({ queryKey: ["qc-pillar-templates"] });
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error("Failed to assign pillar to department", {
        description: error.message || "An error occurred",
      });
    },
  });
}

/**
 * React Query mutation hook for updating a department pillar's weight
 * @returns Mutation object with update pillar functionality
 */
export function useUpdateDepartmentPillar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      departmentPillarId,
      pillarWeight,
      departmentId,
    }: {
      departmentPillarId: string;
      pillarWeight: number;
      departmentId: string;
    }) => {
      const res = await updateDepartmentPillar(departmentPillarId, {
        pillarWeight,
      });
      if (res.data) return res.data;
      throw new Error(res.error?.message || "Failed to update pillar weight");
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["qc-department-pillars", variables.departmentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["qc-all-department-pillars"],
      });
      toast.success(data.message || "Pillar weight updated successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to update pillar weight", {
        description: error.message || "An error occurred",
      });
    },
  });
}

export function useUnassignPillarFromDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      departmentPillarId,
      departmentId,
    }: {
      departmentPillarId: string;
      departmentId: string;
    }) => {
      const res = await unassignPillarFromDepartment(departmentPillarId);
      if (res.data) return res.data;
      throw new Error(
        res.error?.message || "Failed to unassign pillar from department",
      );
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["qc-department-pillars", variables.departmentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["qc-all-department-pillars"],
      });
      queryClient.invalidateQueries({ queryKey: ["qc-pillar-templates"] });
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error("Failed to unassign pillar from department", {
        description: error.message || "An error occurred",
      });
    },
  });
}

export function useAssignKpiToDepartmentPillar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      departmentPillarId,
      kpiTemplateId,
      kpiValue,
    }: {
      departmentPillarId: string;
      kpiTemplateId: string;
      kpiValue: number;
    }) => {
      const res = await assignKpiToDepartmentPillar(
        departmentPillarId,
        kpiTemplateId,
        kpiValue,
      );
      if (res.data) return res.data;
      throw new Error(
        res.error?.message || "Failed to assign KPI to department pillar",
      );
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["qc-department-pillar-kpis", variables.departmentPillarId],
      });
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error("Failed to assign KPI to department pillar", {
        description: error.message || "An error occurred",
      });
    },
  });
}

export function useUpdateDepartmentKpi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      departmentKpiId,
      kpiValue,
      departmentPillarId,
    }: {
      departmentKpiId: string;
      kpiValue: number;
      departmentPillarId: string;
    }) => {
      const res = await updateDepartmentKpi(departmentKpiId, { kpiValue });
      if (res.data) return res.data;
      throw new Error(res.error?.message || "Failed to update KPI");
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["qc-department-pillar-kpis", variables.departmentPillarId],
      });
      toast.success(data.message || "KPI updated successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to update KPI", {
        description: error.message || "An error occurred",
      });
    },
  });
}

export function useUnassignKpiFromDepartmentPillar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      departmentKpiId,
      departmentPillarId,
    }: {
      departmentKpiId: string;
      departmentPillarId: string;
    }) => {
      const res = await unassignKpiFromDepartmentPillar(departmentKpiId);
      if (res.data) return res.data;
      throw new Error(
        res.error?.message || "Failed to unassign KPI from department pillar",
      );
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["qc-department-pillar-kpis", variables.departmentPillarId],
      });
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error("Failed to unassign KPI from department pillar", {
        description: error.message || "An error occurred",
      });
    },
  });
}
