// Add these to your existing types file
import { KpiStatus } from "@repo/db/prisma/client";

export interface AssignKpiToCoordinatorRequest {
  coordinatorId: string;
  kpiIds: string[];
}

export interface CoordinatorKpiAssignment {
  id: string;
  coordinator_id: string;
  kpi_id: string;
  assigned_date: string;
}

export interface CoordinatorWithAssignments {
  id: string;
  user_name: string;
  user_email: string;
  assigned_kpis: string[];
}

export interface DepartmentKpiWithMetadata extends DepartmentKpi {
  metadata?: {
    coordinator_status?:
      | "PENDING_HOD"
      | "APPROVED_BY_HOD"
      | "REJECTED_BY_HOD"
      | "REVISION_REQUESTED";
    coordinator_comments?: string;
    hod_comments?: string;
    submission_history?: Array<{
      timestamp: string;
      status: string;
      submitter_id: string;
      comments?: string;
    }>;
  };
}

export interface DepartmentKpi {
  id: string;
  dept_id: string;
  dept_pillar_id: string;
  template_id: string;
  kpi_number: number;
  kpi_metric_name: string;
  kpi_description?: string;
  kpi_value?: number;
  percentage_target_achieved?: number;
  performance?: number;
  data_provided_by?: string;
  kpi_data: any;
  academic_year: number;
  kpi_calculated_metrics: any;
  kpi_status: KpiStatus;
  assigned_date: string;
  due_date?: string;
  completed_date?: string;
  comments?: string;
  form_responses?: any;
  user_ids: string[];
  assigned_users: UserInfo[];
}

export interface UserInfo {
  id: string;
  user_name: string;
  user_email: string;
  user_role: string;
}
