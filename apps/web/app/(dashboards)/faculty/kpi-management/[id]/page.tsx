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

// Reuse HOD KPI detail fetching so coordinator/faculty see same structure
// Next.js passes params synchronously; typing it as a Promise and using React.use()
// was causing build-time streaming serialization errors. Accept params directly.
export default function FacultyKpiPage(props: any) {
  // Next 15 app router occasionally widens `params` to a Promise in its generic PageProps.
  // Using a loose type here avoids the mismatch (object vs Promise) seen in the build error.
  const id = props?.params?.id as string;
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
    kpiData.existingData || kpiData.form_responses?.entries || [];

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
    return (
      <TableFormRenderer
        id={id}
        description={description}
        name={kpi}
        elements={elements}
        existingData={existingData}
        customSaveHook={customSaveHook}
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
    />
  );
}
