import { ApiClient } from "@/lib/api-client";

export interface EntryComment {
  comment: string;
  reviewed_by: string;
  reviewed_by_id: string;
  reviewed_at: string;
}

export interface EntryCommentsResponse {
  kpiId: string;
  entryComments: Record<string, EntryComment>;
}

export class HodEntryCommentsService {
  static async getEntryComments(kpiId: string) {
    return ApiClient.get<EntryCommentsResponse>(
      `/hod/kpi-management/kpi/${kpiId}/entry-comments`,
    );
  }

  static async saveEntryComment(
    kpiId: string,
    entryIndex: number,
    comment: string,
  ) {
    return ApiClient.put<{ message: string; data: EntryComment }>(
      `/hod/kpi-management/kpi/${kpiId}/entries/${entryIndex}/comment`,
      { comment },
    );
  }
}
