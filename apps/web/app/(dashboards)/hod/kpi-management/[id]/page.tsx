"use client";
import React from "react";
import { format } from "date-fns";
import TableFormRenderer from "@/components/formbuilder/table-rendered";
import {
  useGetKpiDetails,
  useSaveHodKpiData,
  useSubmitKpiToQc,
} from "@/queries/hod/kpi";
import { useReviewCoordinatorSubmission } from "@/queries/hod/coordinator-workflow";
import { useDownloadHodExcelTemplate } from "@/queries/hod/excel";
import {
  useGetEntryComments,
  useSaveHodEntryComment,
} from "@/queries/qc/review";
import { HodExcelUploadDialog } from "@/components/hod/ExcelUploadDialog";
import { FormElementType, FormElementInstance } from "@/lib/types";
import ReadOnlyFormTable from "@/components/qc/readonly-form-table";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { AlertCircle, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import { Textarea } from "@workspace/ui/components/textarea";
import { Button } from "@workspace/ui/components/button";
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
export default function HodKpiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const { user } = useAuth();

  // State for coordinator review - must be before early returns
  const [coordinatorRemark, setCoordinatorRemark] = useState("");
  const [showCoordinatorReviewPanel, setShowCoordinatorReviewPanel] =
    useState(false);

  const { data, isLoading, error } = useGetKpiDetails(id);
  const { data: entryCommentsData } = useGetEntryComments(id);
  const submitToQc = useSubmitKpiToQc();
  const reviewCoordinatorSubmission = useReviewCoordinatorSubmission();

  // All data processing and memoization must be before early returns
  const coordinatorReviewHistory = useMemo(() => {
    if (!data || typeof data !== "object" || !("form_responses" in data))
      return [];
    const formResponses = (data as any).form_responses;
    const coordinatorWorkflow = formResponses?.coordinator_workflow;
    if (!coordinatorWorkflow) return [];

    const history = [];

    // Add HOD review if exists
    if (coordinatorWorkflow.hod_review) {
      history.push({
        action: coordinatorWorkflow.hod_review.action,
        at: coordinatorWorkflow.hod_review.reviewed_at,
        remark: coordinatorWorkflow.hod_review.comments,
        by: "HOD",
      });
    }

    return history.sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
    );
  }, [data]);

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
    kpiData.existingData || (kpiData as any).form_responses?.entries || [];

  // Check for coordinator workflow data
  const formResponses = (kpiData as any).form_responses;
  const coordinatorWorkflow = formResponses?.coordinator_workflow;

  // Show coordinator section if there's any coordinator workflow data (not just SUBMITTED)
  const hasCoordinatorWorkflow =
    coordinatorWorkflow &&
    (coordinatorWorkflow.coordinator_status === "SUBMITTED" ||
      coordinatorWorkflow.hod_review ||
      coordinatorWorkflow.coordinator_submission);

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

  // Handle coordinator review action
  const handleCoordinatorReview = (action: string, remark: string) => {
    console.log("Submitting coordinator review:", {
      kpiId: id,
      action,
      comments: remark,
    });
    reviewCoordinatorSubmission.mutate(
      {
        kpiId: id,
        action: action as "APPROVE" | "REJECT" | "REQUEST_REVISION",
        comments: remark,
      },
      {
        onSuccess: (data) => {
          console.log("Review submitted successfully:", data);
        },
        onError: (error) => {
          console.error("Review submission failed:", error);
        },
      },
    );
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

      {/* Coordinator Review Section */}
      {hasCoordinatorWorkflow && (
        <Card className="border-l-4 border-l-purple-400">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Coordinator Workflow
              </CardTitle>
              <Badge
                variant={
                  coordinatorWorkflow?.coordinator_status === "SUBMITTED"
                    ? "secondary"
                    : coordinatorWorkflow?.coordinator_status ===
                        "APPROVED_BY_HOD"
                      ? "default"
                      : coordinatorWorkflow?.coordinator_status ===
                          "REJECTED_BY_HOD"
                        ? "destructive"
                        : coordinatorWorkflow?.coordinator_status ===
                            "REVISION_REQUESTED"
                          ? "secondary"
                          : "outline"
                }
              >
                {coordinatorWorkflow?.coordinator_status === "SUBMITTED"
                  ? "Awaiting HOD Review"
                  : coordinatorWorkflow?.coordinator_status ===
                      "APPROVED_BY_HOD"
                    ? "Approved by HOD"
                    : coordinatorWorkflow?.coordinator_status ===
                        "REJECTED_BY_HOD"
                      ? "Rejected by HOD"
                      : coordinatorWorkflow?.coordinator_status ===
                          "REVISION_REQUESTED"
                        ? "Revision Requested"
                        : "Unknown Status"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-sm mb-1 text-purple-800">
                      {coordinatorWorkflow?.coordinator_status === "SUBMITTED"
                        ? "Coordinator Submission Ready"
                        : "Coordinator Workflow Status"}
                    </h4>
                    <p className="text-sm text-purple-700">
                      {coordinatorWorkflow?.coordinator_status === "SUBMITTED"
                        ? "A coordinator has submitted KPI data for your review. Please review and approve/reject the submission."
                        : coordinatorWorkflow?.coordinator_status ===
                            "APPROVED_BY_HOD"
                          ? "You have approved this coordinator submission."
                          : coordinatorWorkflow?.coordinator_status ===
                              "REJECTED_BY_HOD"
                            ? "You have rejected this coordinator submission."
                            : coordinatorWorkflow?.coordinator_status ===
                                "REVISION_REQUESTED"
                              ? "You have requested revisions for this coordinator submission."
                              : "Coordinator workflow is active for this KPI."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {coordinatorWorkflow?.coordinator_status === "SUBMITTED" && (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">Review Actions</h3>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setShowCoordinatorReviewPanel(
                            !showCoordinatorReviewPanel,
                          )
                        }
                      >
                        {showCoordinatorReviewPanel
                          ? "Hide Review Panel"
                          : "Open Review Panel"}
                      </Button>
                    </div>

                    {showCoordinatorReviewPanel && (
                      <div className="border rounded-md p-4 space-y-4 bg-background/60">
                        <div className="space-y-3">
                          <Textarea
                            placeholder="Remark (required)"
                            value={coordinatorRemark}
                            onChange={(e) =>
                              setCoordinatorRemark(e.target.value)
                            }
                          />
                          <div className="flex flex-wrap gap-2">
                            <Button
                              onClick={() => {
                                if (!coordinatorRemark.trim()) {
                                  toast.error(
                                    "Please provide a remark before submitting your review",
                                  );
                                  return;
                                }
                                handleCoordinatorReview(
                                  "APPROVE",
                                  coordinatorRemark,
                                );
                                setCoordinatorRemark("");
                                setShowCoordinatorReviewPanel(false);
                              }}
                              disabled={
                                reviewCoordinatorSubmission.isPending ||
                                coordinatorRemark.trim().length === 0
                              }
                            >
                              Approve
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={() => {
                                if (!coordinatorRemark.trim()) {
                                  toast.error(
                                    "Please provide a remark before submitting your review",
                                  );
                                  return;
                                }
                                handleCoordinatorReview(
                                  "REQUEST_REVISION",
                                  coordinatorRemark,
                                );
                                setCoordinatorRemark("");
                                setShowCoordinatorReviewPanel(false);
                              }}
                              disabled={
                                reviewCoordinatorSubmission.isPending ||
                                coordinatorRemark.trim().length === 0
                              }
                            >
                              Request Revision
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => {
                                if (!coordinatorRemark.trim()) {
                                  toast.error(
                                    "Please provide a remark before submitting your review",
                                  );
                                  return;
                                }
                                handleCoordinatorReview(
                                  "REJECT",
                                  coordinatorRemark,
                                );
                                setCoordinatorRemark("");
                                setShowCoordinatorReviewPanel(false);
                              }}
                              disabled={
                                reviewCoordinatorSubmission.isPending ||
                                coordinatorRemark.trim().length === 0
                              }
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div>
                  <h4 className="font-medium mb-2 text-sm">
                    Coordinator Review History
                  </h4>
                  {coordinatorReviewHistory.length > 0 ? (
                    <ul className="space-y-2 text-xs max-h-56 overflow-auto pr-1">
                      {coordinatorReviewHistory.map(
                        (review: any, i: number) => (
                          <li
                            key={i}
                            className="p-2 rounded border bg-background/50"
                          >
                            <div className="flex justify-between mb-1">
                              <Badge
                                variant={
                                  review.action === "REVISION"
                                    ? "secondary"
                                    : review.action === "APPROVE"
                                      ? "default"
                                      : review.action === "REJECT"
                                        ? "destructive"
                                        : "outline"
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
                              <span className="text-muted-foreground">
                                {format(
                                  new Date(review.at),
                                  "dd/MM/yyyy HH:mm:ss",
                                )}
                              </span>
                            </div>
                            {review.remark && (
                              <div className="italic mb-1 bg-muted/30 p-2 rounded">
                                "{review.remark}"
                              </div>
                            )}
                            {review.by && (
                              <div className="text-muted-foreground">
                                By: {review.by}
                              </div>
                            )}
                          </li>
                        ),
                      )}
                    </ul>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No coordinator review actions yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
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
                            {format(new Date(review.at), "dd/MM/yyyy HH:mm:ss")}
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
          customExcelHooks={{
            downloadHook: useDownloadHodExcelTemplate,
            uploadComponent: HodExcelUploadDialog,
          }}
          useFrontendExcelUpload={true}
          kpiId={id}
          enableQcComments={true}
          userRole={user?.role}
          secondaryAction={{
            label: "Submit to QC",
            onClick: () => {}, // Required but onAction handles the logic
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
