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
      console.log("Calling reviewCoordinatorSubmission API with:", {
        kpiId,
        action,
        comments,
      });
      const res =
        await HodCoordinatorWorkflowService.reviewCoordinatorSubmission(
          kpiId,
          action,
          comments,
        );
      console.log("API response:", res);
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
      // Invalidate the specific KPI details query
      queryClient.invalidateQueries({
        queryKey: ["hod", "kpi-details", variables.kpiId],
      });
      // Invalidate faculty KPI queries to refresh coordinator status
      queryClient.invalidateQueries({
        queryKey: ["faculty", "kpi-details", variables.kpiId],
      });
      queryClient.invalidateQueries({ queryKey: ["faculty", "kpis"] });
    },
    onError: (error: any) => {
      toast.error("Failed to review submission", {
        description: error.message,
      });
    },
  });
}
