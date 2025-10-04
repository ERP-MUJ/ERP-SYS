import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HodEntryCommentsService } from "@/services/hod/entry-comments.service";
import { toast } from "sonner";

export function useGetHodEntryComments(kpiId: string | null) {
  return useQuery({
    queryKey: ["hod-entry-comments", kpiId],
    queryFn: async () => {
      if (!kpiId) throw new Error("KPI ID required");
      const res = await HodEntryCommentsService.getEntryComments(kpiId);
      if (res.data) return res.data;
      throw new Error(res.error?.message || "Failed to fetch entry comments");
    },
    enabled: !!kpiId,
  });
}

export function useSaveHodEntryComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      kpiId,
      entryIndex,
      comment,
    }: {
      kpiId: string;
      entryIndex: number;
      comment: string;
    }) => {
      const res = await HodEntryCommentsService.saveEntryComment(
        kpiId,
        entryIndex,
        comment,
      );
      if (res.data) return res.data;
      throw new Error(res.error?.message || "Failed to save comment");
    },
    onSuccess: (_data, vars) => {
      toast.success("Comment saved");
      queryClient.invalidateQueries({
        queryKey: ["hod-entry-comments", vars.kpiId],
      });
      // Also invalidate the main KPI data query since comments might be part of it
      queryClient.invalidateQueries({ queryKey: ["hod-kpi", vars.kpiId] });
    },
    onError: (err: any) => {
      toast.error("Failed to save comment", { description: err.message });
    },
  });
}
