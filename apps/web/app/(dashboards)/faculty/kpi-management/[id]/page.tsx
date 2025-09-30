"use client";
import React from "react";
import TableFormRenderer from "@/components/formbuilder/table-rendered";
import { useGetKpiDetails, useSaveHodKpiData } from "@/queries/hod/kpi";
import {
  useSaveCoordinatorDraft,
  useSubmitCoordinatorKpi,
  useResubmitCoordinatorKpi,
} from "@/queries/coordinator/kpi";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { AlertCircle, MessageSquare } from "lucide-react";

// Reuse HOD KPI detail fetching so coordinator/faculty see same structure
export default function FacultyKpiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const { data: session } = useSession();
  const { data, isLoading, error } = useGetKpiDetails(id);
  const isCoordinator = session?.user?.role === "KPI_COORDINATOR";

  // Coordinator mutations
  const saveDraftMutation = useSaveCoordinatorDraft();
  const submitMutation = useSubmitCoordinatorKpi();
  const resubmitMutation = useResubmitCoordinatorKpi();
  console.log("Faculty KPI Data:", data);

  if (isLoading) {
    return <div className="text-center">Loading...</div>;
  }

  if (error) {
    return <div>Error: {String(error)}</div>;
  }

  if (!data) {
    return <div>No KPI data found</div>;
  }

  // Match transformation used in HOD page
  const kpiData: any = data;
  const kpi = kpiData.kpi_name || kpiData.kpi_metric_name || "Untitled KPI";
  const description = kpiData.kpi_description || "No description available";
  const rawElements = kpiData.elements || kpiData.kpi_data?.elements || [];
  const elements = rawElements.map((el: any) => {
    if (el.attributes) {
      return { ...el, type: el.type };
    }
    const { id: elId, type, ...rest } = el;
    return { id: elId, type, attributes: { ...rest } };
  });
  const existingData =
    kpiData.existingData || (kpiData as any).form_responses?.entries || [];

  const coordinatorWorkflow = (kpiData as any).form_responses
    ?.coordinator_workflow;
  const coordinatorStatus = coordinatorWorkflow?.coordinator_status;

  // Provide a custom save interface for coordinator
  if (isCoordinator) {
    const customSaveHook = () => {
      // Adapt coordinator draft save to the mutation shape TableFormRenderer expects
      return {
        mutate: (vars: {
          id: string;
          formData: { entries: Record<string, any>[] };
        }) => {
          saveDraftMutation.mutate({
            kpiId: vars.id,
            formData: { entries: vars.formData.entries } as any,
          });
        },
        mutateAsync: async ({
          id: formId,
          formData,
        }: {
          id: string;
          formData: { entries: Record<string, any>[] };
        }) => {
          return saveDraftMutation.mutateAsync({
            kpiId: formId,
            formData: { entries: formData.entries } as any,
          });
        },
        isPending: saveDraftMutation.isPending,
        isLoading: saveDraftMutation.isPending,
        isError: false,
        isSuccess: false,
        data: undefined,
        error: null,
        reset: () => {},
        status: saveDraftMutation.isPending ? "pending" : "idle",
        variables: undefined,
        context: undefined,
        failureCount: 0,
        failureReason: null,
      } as any; // Cast to satisfy expected mutation type
    };

    const submitting = submitMutation.isPending || resubmitMutation.isPending;
    const isRevision = coordinatorStatus === "REVISION_REQUESTED";
    const hodReview = coordinatorWorkflow?.hod_review;

    return (
      <div className="space-y-6 p-6">
        {/* HOD Review Section for Coordinators */}
        {hodReview && (
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  HOD Review
                </CardTitle>
                <Badge
                  variant={
                    hodReview.action === "APPROVE"
                      ? "default"
                      : hodReview.action === "REJECT"
                        ? "destructive"
                        : hodReview.action === "REQUEST_REVISION"
                          ? "secondary"
                          : "outline"
                  }
                >
                  {hodReview.action === "APPROVE"
                    ? "Approved"
                    : hodReview.action === "REJECT"
                      ? "Rejected"
                      : hodReview.action === "REQUEST_REVISION"
                        ? "Revision Requested"
                        : hodReview.action}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-sm mb-1 text-blue-800">
                        HOD Feedback
                      </h4>
                      <p className="text-sm italic bg-background/60 p-3 rounded border">
                        "{hodReview.comments}"
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-xs text-muted-foreground">
                          Reviewed on{" "}
                          {new Date(hodReview.reviewed_at).toLocaleString()}
                        </p>
                        {hodReview.by && (
                          <p className="text-xs text-muted-foreground">
                            By: {hodReview.by}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPI Form */}
        <TableFormRenderer
          id={id}
          description={description}
          name={kpi}
          elements={elements}
          existingData={existingData}
          customSaveHook={customSaveHook}
          useFrontendExcelUpload={true}
          secondaryAction={{
            label: submitting
              ? isRevision
                ? "Resubmitting..."
                : "Submitting..."
              : isRevision
                ? "Resubmit to HOD"
                : "Submit to HOD",
            disabled:
              submitting ||
              coordinatorStatus === "SUBMITTED" ||
              coordinatorStatus === "APPROVED_BY_HOD",
            loading: submitting,
            onAction: async (entries) => {
              if (isRevision) {
                await resubmitMutation.mutateAsync({
                  kpiId: id,
                  formData: { entries },
                });
              } else {
                await submitMutation.mutateAsync({
                  kpiId: id,
                  formData: { entries },
                });
              }
            },
            variant: "default",
          }}
        />
      </div>
    );
  }

  return (
    <TableFormRenderer
      id={id}
      description={description}
      name={kpi}
      elements={elements}
      existingData={existingData}
      customSaveHook={useSaveHodKpiData}
      useFrontendExcelUpload={true}
    />
  );
}
