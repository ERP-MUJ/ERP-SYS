import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getDepartmentFaculty,
  assignCoordinator,
  getDepartmentKpis,
  assignCoordinatorToKpi,
  removeCoordinatorFromKpi,
  DepartmentFaculty,
  AssignCoordinatorPayload,
  DepartmentKpi,
} from "@/services/hod/coordinator.service";

/**
 * React Query hook for fetching department faculty and coordinators
 * @returns Query result with department faculty data
 */
export function useGetDepartmentFaculty() {
  return useQuery({
    queryKey: ["hod-department-faculty"],
    queryFn: async () => {
      const res = await getDepartmentFaculty();
      if (res.data) return res.data;
      throw new Error(
        res.error?.message || "Failed to fetch department faculty",
      );
    },
  });
}

/**
 * React Query mutation hook for assigning/unassigning KPI coordinators
 * @returns Mutation object with assign coordinator functionality
 */
export function useAssignCoordinator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AssignCoordinatorPayload) => {
      const res = await assignCoordinator(payload);
      if (res.data) return res.data;
      throw new Error(res.error?.message || "Failed to assign coordinator");
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["hod-department-faculty"] });
      queryClient.invalidateQueries({ queryKey: ["hod-department-kpis"] });
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error("Failed to assign coordinator", {
        description: error.message || "An error occurred",
      });
    },
  });
}

/**
 * React Query hook for fetching department KPIs with assigned coordinators
 * @returns Query result with department KPIs data
 */
export function useGetDepartmentKpis() {
  return useQuery({
    queryKey: ["hod-department-kpis"],
    queryFn: async () => {
      const res = await getDepartmentKpis();
      if (res.data) return res.data;
      throw new Error(res.error?.message || "Failed to fetch department KPIs");
    },
  });
}

/**
 * React Query mutation hook for assigning coordinators to specific KPIs
 * @returns Mutation object with assign coordinator to KPI functionality
 */
export function useAssignCoordinatorToKpi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      kpiId,
      coordinatorId,
    }: {
      kpiId: string;
      coordinatorId: string;
    }) => {
      const res = await assignCoordinatorToKpi(kpiId, coordinatorId);
      if (res.data) return res.data;
      throw new Error(
        res.error?.message || "Failed to assign coordinator to KPI",
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["hod-department-kpis"] });
      toast.success("Coordinator assigned to KPI successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to assign coordinator to KPI", {
        description: error.message || "An error occurred",
      });
    },
  });
}

/**
 * React Query mutation hook for removing coordinators from specific KPIs
 * @returns Mutation object with remove coordinator from KPI functionality
 */
export function useRemoveCoordinatorFromKpi() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      kpiId,
      coordinatorId,
    }: {
      kpiId: string;
      coordinatorId: string;
    }) => {
      const res = await removeCoordinatorFromKpi(kpiId, coordinatorId);
      if (res.data) return res.data;
      throw new Error(
        res.error?.message || "Failed to remove coordinator from KPI",
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["hod-department-kpis"] });
      toast.success("Coordinator removed from KPI successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to remove coordinator from KPI", {
        description: error.message || "An error occurred",
      });
    },
  });
}
