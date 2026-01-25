import { LucideIcon } from "lucide-react";
import { PillarInstance } from "@workspace/types/types";

export type { PillarInstance } from "@workspace/types/types";

type ErrorName = "PROCESSING_ERROR";

export class ProcessError extends Error {
  name: ErrorName;
  message: string;
  cause: Error | null;

  constructor({
    name,
    message,
    cause,
  }: {
    name: ErrorName;
    message: string;
    cause: any;
  }) {
    super(message);
    this.name = name;
    this.message = message;
    this.cause = cause;
  }
}

// Import shared types from workspace
export type { KpiCalculatedMetrics } from "@workspace/types/types";

// Local types for web app compatibility
export type FormElementType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "checkbox"
  | "radio"
  | "date"
  | "date-range"
  | "email"
  | "file";

export interface FormElementInstance {
  id: string;
  type: FormElementType;
  attributes: Record<string, any>;
}

export interface KpiFormData {
  id: string;
  formData: {
    entries: Record<string, any>[];
  };
}

export interface AssignKpiPayload {
  pillarId: string;
  departmentId: string;
  kpiIds: string[];
}

export interface FormConfig {
  id: string;
  title: string;
  description: string;
  value: number;
  elements: FormElementInstance[];
  createdAt: string;
  updatedAt: string;
  // New KPI fields
  kpiNo?: string;
  metric?: string;
  dataProvidedBy?: string;
  target2025?: string;
  actuals2025?: string;
  percentAchieved?: string;
}

export interface FormSubmission {
  formTitle: string;
  formData: Record<string, any>;
  fileInfo?: Record<string, any>;
}

export interface AppSidebarProps {
  activeSection: string | null;
  setActiveSection: (section: string) => void;
}

export interface SidebarItem {
  icon: LucideIcon;
  label: string;
  id: string;
  path?: string;
  subItems?: SidebarItem[];
}

export interface AssignedKPI {
  assigned_kpi_id: number;
  kpi_name: string;
  kpi_status: string;
  comments: string;
  elements: FormElementInstance[];
  kpi_description?: string;
  form_responses?: Record<string, string | number>[] | null;
  qac_remark?: string;
}

export interface DeptConfig {
  id: string;
  name: string;
  hodid: number | null;
  hodName: string;
  createdAt: string;
  membersCount: number;
  department_pillar: PillarInstance[];
}
