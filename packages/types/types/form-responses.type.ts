/**
 * Base form response entry type
 */
export interface FormEntry {
  [key: string]: unknown;
}

/**
 * Coordinator workflow structure within form responses
 */
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

/**
 * Form responses structure for KPIs
 */
export interface KpiFormResponses {
  entries?: FormEntry[];
  coordinator_workflow?: CoordinatorWorkflow;
}

/**
 * Type for entries count response
 */
export interface KpiEntriesCount {
  total: number;
}
