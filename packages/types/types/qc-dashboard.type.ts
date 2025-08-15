import { z } from "zod";
import {
  DepartmentStatusSchema,
  SubmissionStatsSchema,
} from "../schema/qc-dashboard.schema";

// Type for creating department data (based on schema)
export type CreateQcDashboardDepartmentInput = z.infer<
  typeof DepartmentStatusSchema
>;

export interface SubmissionStats {
  totalSubmissions: number;
  pendingReview: number;
  departmentsConfigured: number;
  departmentsPending: number;
}

/**
 * Defines the structure for a single department's status row
 * in the main dashboard table.
 */
export interface DepartmentStatus {
  id: string; // Department UUID
  name: string; // Department name
  hod: string | null; // Head of Department's name
  pillarsSet: boolean; // True if the department has at least one pillar
  kpisSet: boolean; // True if the department has at least one KPI
  totalSubmissions: number; // Total number of KPI submissions from this department
  lastSubmission: string | null; // ISO date string of the most recent submission
}

/**
 * Represents the complete data payload required for the QAC Dashboard.
 * This is the main interface the API endpoint should return.
 */
export interface QacDashboardData {
  submissionStats: SubmissionStats;
  departmentStatus: DepartmentStatus[];
}
