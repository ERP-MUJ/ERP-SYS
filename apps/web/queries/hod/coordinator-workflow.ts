import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { HodCoordinatorWorkflowService } from "@/services/hod/coordinator-workflow.service";

/**
 * Hook to get KPIs submitted by coordinators for HOD review
 */
export function useGetKpisForReview() {
  return useQuery({
    queryKey: ["hod", "coordinator-workflow", "review"],
    queryFn: async () => {
      const res = await HodCoordinatorWorkflowService.getKpisForReview();
      if (res.data) {
        return res.data;
      }
      if (res.error) {
        throw new Error(res.error.message);
      }
      return [];
    },
  });
}

/**
 * Hook to get department coordinators
 */
export function useGetDepartmentCoordinators() {
  return useQuery({
    queryKey: ["hod", "coordinator-workflow", "coordinators"],
    queryFn: async () => {
      const res =
        await HodCoordinatorWorkflowService.getDepartmentCoordinators();
      if (res.data) {
        return res.data;
      }
      if (res.error) {
        throw new Error(res.error.message);
      }
      return [];
    },
  });
}

/**
 * Hook to review coordinator submission
 */
export function useReviewCoordinatorSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      kpiId,
      action,
      comments,
    }: {
      kpiId: string;
      action: "APPROVE" | "REJECT" | "REQUEST_REVISION";
      comments: string;
    }) => {
      const res =
        await HodCoordinatorWorkflowService.reviewCoordinatorSubmission(
          kpiId,
          action,
          comments,
        );
      if (res.data) return res.data;
      throw new Error(res.error?.message || "Failed to review submission");
    },
    onSuccess: (_, variables) => {
      const actionText =
        variables.action === "APPROVE"
          ? "approved"
          : variables.action === "REJECT"
            ? "rejected"
            : "sent for revision";
      toast.success(`Coordinator submission ${actionText} successfully`);
      queryClient.invalidateQueries({
        queryKey: ["hod", "coordinator-workflow", "review"],
      });
      queryClient.invalidateQueries({ queryKey: ["hod", "pillars"] });
    },
    onError: (error: any) => {
      toast.error("Failed to review submission", {
        description: error.message,
      });
    },
  });
}
