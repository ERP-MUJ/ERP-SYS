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
  assigned_at?: string;
  coordinator_status?:
    | "PENDING"
    | "SUBMITTED"
    | "APPROVED_BY_HOD"
    | "REJECTED_BY_HOD"
    | "REVISION_REQUESTED";
  coordinator_submission?: {
    submitted_at?: string;
    data?: FormEntry[];
    comments?: string;
  };
  hod_review?: {
    reviewed_at?: string;
    action?: "APPROVE" | "REJECT" | "REQUEST_REVISION";
    comments?: string;
    by?: string;
    by_id?: string;
    status?: string; // Keep for backward compatibility
  };
  revision_history?: Array<{
    revision_number?: number;
    requested_at?: string;
    completed_at?: string;
    reason?: string;
  }>;
}

export interface KpiFormResponses {
  entries?: FormEntry[];
  entries_with_review?: KpiEntryWithReview[];
  coordinator_workflow?: CoordinatorWorkflow;
}

export interface KpiEntriesCount {
  total: number;
}
