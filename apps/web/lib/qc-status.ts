import { DepartmentKpi } from "@/services/qc/department-assignment.service";

export type KpiStatusType = DepartmentKpi["kpi_status"];

export type DerivedDisplayStatus =
  | "Pending"
  | "Awaiting Approval"
  | "Revision Requested"
  | "Approved"
  | "Rejected"
  | "Overdue"
  // Coordinator workflow extended statuses
  | "To Fill"
  | "Pending HOD Review"
  | "Approved by HOD"
  | "Rejected by HOD";

export function deriveDisplayStatus(opts: {
  status: KpiStatusType;
  hasFormResponses: boolean;
  isSubmittedToQc?: boolean;
}): DerivedDisplayStatus {
  const { status, hasFormResponses, isSubmittedToQc } = opts;
  switch (status) {
    case "APPROVED":
      return "Approved";
    case "REJECTED":
      return "Rejected";
    case "REVISION":
      return "Revision Requested";
    case "PENDING":
      // If officially submitted to QC, show "Awaiting Approval"
      if (isSubmittedToQc) {
        return "Awaiting Approval";
      }
      // For non-submitted KPIs, show "Pending" (whether filled or not)
      return "Pending";
    case "OVERDUE":
      return "Overdue";
    default:
      return "Pending";
  }
}

export function displayStatusToBadgeVariant(
  display: DerivedDisplayStatus,
): string {
  switch (display) {
    case "Approved":
      return "approved";
    case "Rejected":
      return "rejected";
    case "Revision Requested":
      return "revision";
    case "Awaiting Approval":
      return "awaiting"; // Use awaiting variant (blue)
    case "Pending":
      return "pending"; // Use pending variant (yellow)
    case "Overdue":
      return "overdue";
    case "To Fill":
      return "pending";
    case "Pending HOD Review":
      return "waiting";
    case "Approved by HOD":
      return "approved";
    case "Rejected by HOD":
      return "rejected";
    default:
      return "pending";
  }
}

// Helper specific to coordinator workflow raw state -> display
export function deriveCoordinatorDisplayStatus(
  status?: string,
): DerivedDisplayStatus | undefined {
  switch (status) {
    case "PENDING":
      return "To Fill";
    case "SUBMITTED":
      return "Pending HOD Review";
    case "APPROVED_BY_HOD":
      return "Approved by HOD";
    case "REJECTED_BY_HOD":
      return "Rejected by HOD";
    case "REVISION_REQUESTED":
      return "Revision Requested";
    default:
      return undefined;
  }
}
