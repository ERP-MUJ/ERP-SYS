"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { ArrowLeft, Edit, Save, X, Trash2 } from "lucide-react";
import FormPreview from "@/components/formbuilder/form-preview";
import FormBuilder from "@/components/formbuilder/form-builder";
import type { FormElementInstance } from "@/lib/types";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import React from "react";
import { useGetKpiById, useUpdateKpi, useDeleteKpi } from "@/queries/qc/kpi";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorDisplay } from "@/components/common/ErrorDisplay";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";

// This interface defines the props our component will receive
interface KpiDetailPageProps {
  params: any; // Loosened to avoid Next 15 Promise constraint mismatch
}

export default function KpiDetailPage(props: KpiDetailPageProps) {
  // Next 15 app router occasionally widens `params` to a Promise in its generic PageProps.
  // Using a loose type here avoids the mismatch (object vs Promise) seen in the build error.
  const kpiId = props?.params?.kpiId as string;
  const searchParams = useSearchParams();
  const pillarId = searchParams.get("pillarId") || "";
  const mode = searchParams.get("mode");
  const [isEditMode, setIsEditMode] = useState(mode === "edit");

  // Get the router for navigation
  const router = useRouter();

  // Fetch real KPI data
  const { data: kpi, isLoading, error } = useGetKpiById(pillarId, kpiId);
  const updateKpiMutation = useUpdateKpi();
  const deleteKpiMutation = useDeleteKpi();

  // Handle going back to KPI list
  const handleGoBack = () => {
    router.push("/qc/builder");
  };

  // Handle switching to edit mode
  const handleEditMode = () => {
    setIsEditMode(true);
  };

  // Handle canceling edit mode
  const handleCancelEdit = () => {
    setIsEditMode(false);
  };

  // Handle saving changes
  const handleSave = () => {
    setIsEditMode(false);
    toast.success("KPI updated successfully", {
      description: "Your changes have been saved.",
    });
  };

  // Handle deleting KPI
  const handleDelete = () => {
    deleteKpiMutation.mutate(
      { pillarId, kpiId },
      {
        onSuccess: () => {
          toast.success("KPI deleted successfully");
          router.push("/qc/builder");
        },
        onError: () => {
          toast.error("Failed to delete KPI");
        },
      },
    );
  };

  // Show loading state while data is being fetched
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner message="Loading KPI details..." size="lg" />
        </div>
      </div>
    );
  }

  // Show error state if data fetching failed
  if (error || !kpi) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <ErrorDisplay
            title="Error Loading KPI"
            message="Failed to load KPI details"
            error={error}
            onRetry={() => window.location.reload()}
          />
        </div>
      </div>
    );
  }

  // Extract KPI data from real API response
  const kpiName = kpi.kpi_metric_name || "Untitled KPI";
  const kpiDescription = kpi.kpi_description || "No description available";
  const elements = kpi.kpi_data?.elements || [];
  const value = kpi.kpi_value;

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header Section */}
      <div className="mb-6">
        {/* Navigation and Action Buttons */}
        <div className="flex justify-between items-center mb-4">
          <Button onClick={handleGoBack} variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {/* Edit/Save/Cancel/Delete Buttons */}
          <div className="flex gap-2">
            {!isEditMode ? (
              <>
                <Button onClick={handleEditMode} size="sm">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit KPI
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete KPI
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete KPI</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this KPI? This action
                        cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            ) : (
              <>
                <Button onClick={handleSave} size="sm">
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
                <Button onClick={handleCancelEdit} variant="outline" size="sm">
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>

        {/* KPI Title and Description */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{kpiName}</h1>
          <p className="text-muted-foreground">{kpiDescription}</p>
          {typeof value !== "undefined" && (
            <p className="text-sm text-muted-foreground">Value: {value}</p>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">
          {isEditMode ? "Edit KPI Template" : "KPI Template"}
        </h2>

        {/* Form Content */}
        {!isEditMode ? (
          // View Mode - Show Form Preview
          <div className="max-w-3xl mx-auto">
            <FormPreview
              formTitle={kpiName}
              elements={elements}
              description={kpiDescription}
              readOnly={true}
            />
          </div>
        ) : (
          // Edit Mode - Show Form Builder
          <div>
            <FormBuilder
              pillarId={pillarId}
              kpiId={kpiId}
              existingKpis={[]} // For edit mode, we don't need to validate against existing KPIs
              initialForm={{
                kpi_number: kpi.kpi_number,
                kpi_metric_name: kpi.kpi_metric_name,
                data_provided_by: kpi.data_provided_by,
                kpi_value: kpi.kpi_value,
                elements: elements,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
