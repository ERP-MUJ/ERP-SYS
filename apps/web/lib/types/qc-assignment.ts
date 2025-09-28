/**
 * Shared types for QC Assignment functionality
 * Consolidates interfaces used across multiple components and pages
 */

export interface PillarData {
  id: string;
  pillar_name: string;
  description?: string | null;
  pillar_value?: number | null; // Template default weight
  percentage_target_achieved?: number | null;
  performance?: number | null;
  academic_year?: number;
  created_at?: string;
  updated_at?: string;
  kpi_templates?: any[];
  pillar_weight?: number | null; // Department-specific weight
  pillar_target?: number | null; // Department-specific target
  departmentPillarId?: string;
  isOrphaned?: boolean; // True if template was deleted but department assignment remains
}

export interface KpiData {
  id: string;
  departmentKpiId?: string; // ID of the DepartmentKpi record for updates
  kpiNo?: number;
  kpi_number?: number;
  kpi_no?: number;
  metric?: string;
  kpi_metric_name: string;
  dataProvidedBy?: string | null;
  data_provided_by?: string | null;
  kpi_description?: string | null;
  kpi_value?: number | null;
  kpi_target?: number | null;
  kpi_data?: any;
  kpi_calculated_metrics?: any;
  academic_year?: number;
  percentage_target_achieved?: number | null;
  performance?: number | null;
  kpi_status?: string;
  assigned_date?: string;
  due_date?: string | null;
  completed_date?: string | null;
  comments?: string | null;
  form_responses?: any | null;
  user_ids?: string[];
  assigned_users?: any[];
  isAssigned?: boolean;
}

export interface AssignPillarPayload {
  id: string;
  weight?: number;
  weightA?: number;
  target?: number;
}

export interface DepartmentStats {
  totalPillars: number;
  totalKPIs: number;
  completedKPIs: number;
  pendingKPIs: number;
}
