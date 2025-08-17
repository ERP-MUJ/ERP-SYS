"use client";
import React from "react";
import TableFormRenderer from "@/components/formbuilder/table-rendered";
import {
  useGetKpiDetails,
  useSaveHodKpiData,
  useSubmitKpiToQc,
} from "@/queries/hod/kpi";
import { FormElementType, FormElementInstance } from "@/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { AlertCircle, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";

// Define type for API response
interface KpiData {
  kpi_name?: string;
  kpi_metric_name?: string;
  kpi_description?: string;
  elements?: {
    id: string;
    type: string;
    name: string;
    label: string;
    required: boolean;
    options?: string[];
    placeholder?: string;
    [key: string]: any;
  }[];
  existingData?: Record<string, any>[];
  // Additional properties from the API response
  kpi_data?: {
    elements?: any[];
    metadata?: Record<string, any>;
    layout?: Record<string, any>;
  };
  form_responses?: {
    entries: Record<string, any>[];
    submittedAt?: string;
  };
  kpi_status?: string;
  comments?: string;
  kpi_calculated_metrics?: {
    review_history?: Array<{
      action: string;
      by: string;
      at: string;
      remark: string;
    }>;
    [key: string]: any;
  };
}

// Helper function to get status badge variant
function getStatusBadgeVariant(status?: string) {
  switch (status) {
    case "APPROVED":
      return "approved";
    case "REJECTED":
      return "rejected";
    case "REVISION":
      return "revision";
    case "PENDING":
      return "pending";
    case "OVERDUE":
      return "overdue";
    default:
      return "secondary";
  }
}

// Helper function to get status display text
function getStatusDisplayText(status?: string) {
  switch (status) {
    case "APPROVED":
      return "Approved";
    case "REJECTED":
      return "Rejected";
    case "REVISION":
      return "Revision Required";
    case "PENDING":
      return "Pending Review";
    case "OVERDUE":
      return "Overdue";
    default:
      return status || "Unknown";
  }
}

export default function HodKpiPage(props: any) {
  // Next 15 app router occasionally widens `params` to a Promise in its generic PageProps.
  // Using a loose type here avoids the mismatch (object vs Promise) seen in the build error.
  const id = props?.params?.id as string;
  const { data, isLoading, error } = useGetKpiDetails(id);
  const submitToQc = useSubmitKpiToQc();
  console.log("HOD KPI Data:", data);

  if (isLoading) {
    return <div className="text-center">Loading KPI details...</div>;
  }

  if (error) {
    return <div>Error: {String(error)}</div>;
  }

  if (!data) {
    return <div>No KPI data found</div>;
  }

  // Use proper typing for the API response
  const kpiData = data as KpiData;
  const kpi = kpiData.kpi_name || kpiData.kpi_metric_name || "Untitled KPI";
  const description = kpiData.kpi_description || "No description available";

  // Extract elements from kpi_data if available, or from elements field
  const rawElements =
    kpiData.elements || (kpiData.kpi_data?.elements as any[]) || [];

  // Transform elements to match FormElementInstance interface
  const elements = rawElements.map((el) => {
    // Handle elements that might come in different formats
    if (el.attributes) {
      // Already in the correct format
      return {
        ...el,
        type: el.type as FormElementType,
      } as FormElementInstance;
    } else {
      // Need to extract attributes
      const { id, type, ...otherProps } = el;
      return {
        id,
        type: type as FormElementType,
        attributes: { ...otherProps },
      } as FormElementInstance;
    }
  });

  // Load existing form responses if available
  const existingData =
    kpiData.existingData || kpiData.form_responses?.entries || [];

  // Check if there are QC review comments or status changes
  const hasQcReview =
    kpiData.kpi_status &&
    ["REVISION", "APPROVED", "REJECTED"].includes(kpiData.kpi_status);
  const reviewHistory = kpiData.kpi_calculated_metrics?.review_history || [];
  const latestComment = kpiData.comments;

  // Check if KPI is editable
  const isEditable =
    !kpiData.kpi_status || ["PENDING", "REVISION"].includes(kpiData.kpi_status);
  const isLocked = ["APPROVED", "REJECTED", "OVERDUE"].includes(
    kpiData.kpi_status || "",
  );

  // Handle submit to QC action
  const handleSubmitToQc = async (entries: Record<string, any>[]) => {
    if (!entries || entries.length === 0) {
      toast.error(
        "Cannot submit empty KPI. Please add data before submission.",
      );
      return;
    }

    try {
      await submitToQc.mutateAsync({
        kpiId: id,
        formResponses: {
          entries: entries,
          submittedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      // Error handled by the hook
      console.error("Submit to QC failed:", error);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Status Information */}
      {kpiData.kpi_status && (
        <Card className="border-l-4 border-l-blue-400">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">KPI Status</CardTitle>
              <Badge variant={getStatusBadgeVariant(kpiData.kpi_status) as any}>
                {getStatusDisplayText(kpiData.kpi_status)}
              </Badge>
            </div>
          </CardHeader>
          {isLocked && (
            <CardContent>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-sm mb-1 text-gray-800">
                      {kpiData.kpi_status === "APPROVED"
                        ? "KPI Approved"
                        : kpiData.kpi_status === "REJECTED"
                          ? "KPI Rejected"
                          : "KPI Overdue"}
                    </h4>
                    <p className="text-sm text-gray-700">
                      {kpiData.kpi_status === "APPROVED"
                        ? "This KPI has been approved by QC and is now locked."
                        : kpiData.kpi_status === "REJECTED"
                          ? "This KPI has been rejected by QC and is now locked."
                          : "This KPI is overdue and cannot be modified."}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* QC Review Status and Comments Section */}
      {hasQcReview && (
        <Card className="border-l-4 border-l-amber-400">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                QC Review Status
              </CardTitle>
              <Badge variant={getStatusBadgeVariant(kpiData.kpi_status) as any}>
                {kpiData.kpi_status === "REVISION"
                  ? "Revision Requested"
                  : kpiData.kpi_status === "APPROVED"
                    ? "Approved"
                    : kpiData.kpi_status === "REJECTED"
                      ? "Rejected"
                      : kpiData.kpi_status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Latest QC Comment */}
            {latestComment && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-sm mb-1 text-amber-800">
                      Latest QC Feedback
                    </h4>
                    <p className="text-sm text-amber-700">{latestComment}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Review History */}
            {reviewHistory.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-3">Review History</h4>
                <div className="space-y-2 max-h-64 overflow-auto">
                  {reviewHistory
                    .slice()
                    .reverse()
                    .map((review, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-3 bg-background/50 hover:bg-background/80 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <Badge
                            variant={
                              getStatusBadgeVariant(review.action) as any
                            }
                            className="text-xs"
                          >
                            {review.action === "REVISION"
                              ? "Revision Requested"
                              : review.action === "APPROVE"
                                ? "Approved"
                                : review.action === "REJECT"
                                  ? "Rejected"
                                  : review.action}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(review.at).toLocaleString()}
                          </span>
                        </div>
                        {review.remark && (
                          <p className="text-sm text-muted-foreground italic mb-1 bg-muted/30 p-2 rounded">
                            "{review.remark}"
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Reviewed by: {review.by}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* KPI Form */}
      {isEditable ? (
        <TableFormRenderer
          id={id}
          description={description}
          name={kpi}
          elements={elements}
          existingData={existingData}
          customSaveHook={useSaveHodKpiData}
          secondaryAction={{
            label: "Submit to QC",
            variant: "default",
            onAction: handleSubmitToQc,
            loading: submitToQc.isPending,
            disabled: submitToQc.isPending,
          }}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{kpi}</CardTitle>
            <p className="text-sm text-muted-foreground">{description}</p>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-700 text-center">
                This KPI is locked and cannot be edited.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
