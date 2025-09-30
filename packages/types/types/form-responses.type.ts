import { KpiStatus } from "../enums";

export interface FormEntry {
  [key: string]: unknown;
}

export interface KpiEntryWithReview {
  entry_id: string;
  data: FormEntry;
  status: KpiStatus;
  review?: string;
  reviewed_by?: string;
  reviewed_at?: string;
}

export interface CoordinatorWorkflow {
  assigned_to?: string;
  coordinator_status?: string;
  coordinator_submission?: {
    data?: FormEntry[];
  };
  hod_review?: {
    status: string;
    comments?: string;
  };
}

export interface KpiFormResponses {
  entries?: FormEntry[];
  entries_with_review?: KpiEntryWithReview[];
  coordinator_workflow?: CoordinatorWorkflow;
}

export interface KpiEntriesCount {
  total: number;
}
