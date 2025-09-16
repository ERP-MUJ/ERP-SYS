import { useQuery } from "@tanstack/react-query";
import { ApiClient } from "@/lib/api-client";
import { SubmissionSummary } from "@workspace/types/types/submission-summary.type";

export const useGetSubmissionSummary = () => {
  return useQuery({
    queryKey: ["qc", "submission-summary"],
    queryFn: async () => {
      const response = await ApiClient.get<SubmissionSummary[]>(
        "/qc/dashboard/submission-summary",
      );
      return response.data;
    },
  });
};
