import { z } from "zod";

export const SubmissionStatsSchema = z.object({
  totalSubmissions: z
    .number()
    .int()
    .nonnegative()
    .describe("Total number of KPI submissions across all departments."),
  pendingReview: z
    .number()
    .int()
    .nonnegative()
    .describe("Number of KPI submissions currently in 'PENDING' status."),
  departmentsConfigured: z
    .number()
    .int()
    .nonnegative()
    .describe(
      "Number of departments that have both Pillars and KPIs assigned."
    ),
  departmentsPending: z
    .number()
    .int()
    .nonnegative()
    .describe(
      "Number of departments that are missing either Pillar or KPI assignments."
    ),
});

export const DepartmentStatusSchema = z.object({
  id: z.string().uuid().describe("Department's unique identifier (UUID)."),
  name: z.string().describe("Name of the academic department."),
  hod: z.string().nullable().describe("Name of the Head of Department."),
  pillarsSet: z
    .boolean()
    .describe("True if the department has at least one pillar assigned."),
  kpisSet: z
    .boolean()
    .describe("True if the department has at least one KPI assigned."),
  totalSubmissions: z
    .number()
    .int()
    .nonnegative()
    .describe("Total number of KPI submissions from this department."),
  lastSubmission: z
    .string()
    .datetime()
    .nullable()
    .describe("ISO date string of the most recent KPI submission."),
});

export const QacDashboardDataSchema = z.object({
  submissionStats: SubmissionStatsSchema,
  departmentStatus: z.array(DepartmentStatusSchema),
});
