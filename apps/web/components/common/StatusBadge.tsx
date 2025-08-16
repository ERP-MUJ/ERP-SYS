import { Badge } from "@workspace/ui/components/badge";
import { CheckCircle, AlertCircle, Clock, X } from "lucide-react";
import { ReactNode } from "react";

/**
 * Status types for the StatusBadge component
 */
type StatusType =
  | "active"
  | "inactive"
  | "pending"
  | "approved"
  | "rejected"
  | "revision"
  | "overdue"
  | "waiting"
  | "awaiting";

/**
 * StatusBadge properties
 */
interface StatusBadgeProps {
  status: StatusType;
  /**
   * Optional custom label to display instead of the default status text
   */
  label?: string;
  /**
   * Optional className to add to the badge
   */
  className?: string;
}

/**
 * A reusable status badge component for displaying different statuses
 * with consistent styling across the application
 */
export function StatusBadge({
  status,
  label,
  className = "",
}: StatusBadgeProps) {
  // Configuration for different status types
  const statusConfig: Record<
    StatusType,
    {
      baseVariant:
        | "default"
        | "secondary"
        | "destructive"
        | "outline"
        | "pending"
        | "rejected"
        | "approved";
      icon: ReactNode;
      text: string;
      className: string;
    }
  > = {
    active: {
      baseVariant: "outline",
      icon: <CheckCircle className="w-3 h-3 mr-1" />,
      text: "Active",
      className:
        "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700",
    },
    inactive: {
      baseVariant: "outline",
      icon: <X className="w-3 h-3 mr-1" />,
      text: "Inactive",
      className:
        "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
    },
    pending: {
      baseVariant: "pending",
      icon: <Clock className="w-3 h-3 mr-1" />,
      text: "Pending",
      className: "",
    },
    approved: {
      baseVariant: "approved",
      icon: <CheckCircle className="w-3 h-3 mr-1" />,
      text: "Approved",
      className: "",
    },
    rejected: {
      baseVariant: "rejected",
      icon: <X className="w-3 h-3 mr-1" />,
      text: "Rejected",
      className: "",
    },
    revision: {
      baseVariant: "pending", // mapped
      icon: <AlertCircle className="w-3 h-3 mr-1" />,
      text: "Revision",
      className: "",
    },
    overdue: {
      baseVariant: "destructive", // mapped
      icon: <AlertCircle className="w-3 h-3 mr-1" />,
      text: "Overdue",
      className: "",
    },
    waiting: {
      baseVariant: "pending", // reuse existing pending palette for consistency
      icon: <Clock className="w-3 h-3 mr-1" />,
      text: "Awaiting Approval",
      className: "", // rely on variant styling
    },
    awaiting: {
      baseVariant: "outline",
      icon: <Clock className="w-3 h-3 mr-1" />,
      text: "Awaiting Approval",
      className:
        "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700",
    },
  };

  const config = statusConfig[status];

  return (
    <Badge
      variant={config.baseVariant}
      className={`${config.className} ${className}`}
    >
      {config.icon}
      {label || config.text}
    </Badge>
  );
}
