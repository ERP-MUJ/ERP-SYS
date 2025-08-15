import { DepartmentKpi } from "@/services/qc/department-assignment.service";

export type KpiStatusType = DepartmentKpi['kpi_status'];

export type DerivedDisplayStatus =
  | "Draft (Not Submitted)"
  | "Awaiting Approval"
  | "Revision Requested"
  | "Approved"
  | "Rejected"
  | "Overdue";

export function deriveDisplayStatus(opts: { status: KpiStatusType; hasFormResponses: boolean }) : DerivedDisplayStatus {
  const { status, hasFormResponses } = opts;
  switch (status) {
    case 'APPROVED':
      return "Approved";
    case 'REJECTED':
      return "Rejected";
    case 'REVISION':
      return "Revision Requested";
    case 'PENDING':
      return hasFormResponses ? "Awaiting Approval" : "Draft (Not Submitted)";
    case 'OVERDUE':
      return "Overdue";
    default:
      return "Draft (Not Submitted)";
  }
}

export function displayStatusToBadgeVariant(display: DerivedDisplayStatus): string {
  switch (display) {
    case "Approved":
      return "approved";
    case "Rejected":
      return "rejected";
    case "Revision Requested":
      return "revision";
  case "Awaiting Approval":
      return "pending";
    case "Draft (Not Submitted)":
      return "secondary";
    case "Overdue":
      return "overdue";
    default:
      return "secondary";
  }
}
