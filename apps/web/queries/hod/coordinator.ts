import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getDepartmentFaculty,
  assignCoordinator,
  DepartmentFaculty,
  AssignCoordinatorPayload,
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
      throw new Error(res.error?.message || "Failed to fetch department faculty");
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
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error("Failed to assign coordinator", {
        description: error.message || "An error occurred",
      });
    },
  });
}