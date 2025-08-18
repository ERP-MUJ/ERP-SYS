import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getDepartments,
  getPillarTemplates,
  getDepartmentPillars,
  getAllDepartmentPillars,
  assignPillarToDepartment,
  unassignPillarFromDepartment,
  getDepartmentPillarKPIs,
  assignKpiToDepartmentPillar,
  unassignKpiFromDepartmentPillar,
  Department,
  PillarTemplate,
  DepartmentPillar,
  DepartmentKpi,
  AssignPillarPayload,
} from "@/services/qc/department-assignment.service";

/**
 * React Query hook for fetching all departments
 * @returns Query result with departments data
 */
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

/**
 * React Query hook for fetching pillar templates created by QAC
 * @returns Query result with pillar templates data
 */
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

/**
 * React Query hook for fetching pillars assigned to a department
 * @param departmentId - The department ID
 * @returns Query result with department pillars data
 */
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

/**
 * React Query hook for fetching all department pillars for overview
 * @returns Query result with all department pillars data
 */
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

/**
 * React Query hook for fetching KPIs for a specific department pillar
 * @param departmentPillarId - The department pillar ID
 * @returns Query result with department KPIs data
 */
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

/**
 * React Query mutation hook for assigning pillar to department
 * @returns Mutation object with assign pillar functionality
 */
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
      // Invalidate and refetch department pillars
      queryClient.invalidateQueries({
        queryKey: ["qc-department-pillars", variables.departmentId],
      });
      // Invalidate all department pillars for cards view
      queryClient.invalidateQueries({
        queryKey: ["qc-all-department-pillars"],
      });
      // Invalidate pillar templates to refresh counts
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
 * React Query mutation hook for unassigning pillar from department
 * @returns Mutation object with unassign pillar functionality
 */
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
      // Invalidate and refetch department pillars
      queryClient.invalidateQueries({
        queryKey: ["qc-department-pillars", variables.departmentId],
      });
      // Invalidate all department pillars for cards view
      queryClient.invalidateQueries({
        queryKey: ["qc-all-department-pillars"],
      });
      // Invalidate pillar templates to refresh counts
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

/**
 * React Query mutation hook for assigning KPI to department pillar
 * @returns Mutation object with assign KPI functionality
 */
export function useAssignKpiToDepartmentPillar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      departmentPillarId,
      kpiTemplateId,
    }: {
      departmentPillarId: string;
      kpiTemplateId: string;
    }) => {
      const res = await assignKpiToDepartmentPillar(
        departmentPillarId,
        kpiTemplateId,
      );
      if (res.data) return res.data;
      throw new Error(
        res.error?.message || "Failed to assign KPI to department pillar",
      );
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch KPIs for the department pillar
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

/**
 * React Query mutation hook for unassigning KPI from department pillar
 * @returns Mutation object with unassign KPI functionality
 */
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
      // Invalidate and refetch KPIs for the department pillar
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
