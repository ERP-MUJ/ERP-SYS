"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, TrendingUp } from "lucide-react";
import { ReadOnlyKpiTable } from "@/components/hod/ReadOnlyKpiTable";
import { useGetDepartmentPillars } from "@/queries/hod/kpi";
import {
  useGetKpisForReview,
  useReviewCoordinatorSubmission,
} from "@/queries/hod/coordinator-workflow";
import { Button } from "@workspace/ui/components/button";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorDisplay } from "@/components/common/ErrorDisplay";
import {
  DepartmentKpi,
  DepartmentPillar,
} from "@/services/qc/department-assignment.service";

export default function KpiManagementPage() {
  const router = useRouter();
  const [selectedPillarId, setSelectedPillarId] = useState<string>("");

  // Fetch department pillars from backend
  const {
    data: pillarsData,
    isLoading: isPillarsLoading,
    error: pillarsError,
  } = useGetDepartmentPillars();

  // Ensure pillars is always an array
  const pillars = Array.isArray(pillarsData) ? pillarsData : [];

  // Coordinator submissions awaiting HOD review
  const {
    data: reviewKpis = [],
    isLoading: isReviewLoading,
    error: reviewError,
  } = useGetKpisForReview();
  const reviewMutation = useReviewCoordinatorSubmission();

  const handleReviewAction = async (
    kpiId: string,
    action: "APPROVE" | "REJECT" | "REQUEST_REVISION",
  ) => {
    let comments = "";
    if (action !== "APPROVE") {
      comments =
        window.prompt(
          `Enter comments for ${action.toLowerCase()} (required)`,
          "",
        ) || "";
      if (!comments.trim()) {
        toast.error("Comments required for this action");
        return;
      }
    }
    try {
      await reviewMutation.mutateAsync({ kpiId, action, comments });
    } catch (e: any) {
      // toast handled in hook
      console.error(e);
    }
  };

  // Get the selected pillar data
  const selectedPillar = useMemo(() => {
    return pillars.find(
      (pillar: DepartmentPillar) => pillar.id === selectedPillarId,
    );
  }, [pillars, selectedPillarId]);

  // Transform KPI data to match the read-only table format
  const transformedKpis = useMemo(() => {
    if (!selectedPillar?.department_kpis) return [];

    return selectedPillar.department_kpis.map((kpi: DepartmentKpi) => ({
      kpi_no: kpi.kpi_number,
      metric: kpi.kpi_metric_name,
      dataProvidedBy: kpi.data_provided_by || "N/A",
      target: kpi.kpi_value?.toString() || "0",
      actual: kpi.percentage_target_achieved?.toString() || "0",
      percentAchieved: kpi.percentage_target_achieved?.toString() || "0%",
      value: kpi.kpi_value?.toString() || "0",
      status: kpi.kpi_status?.toLowerCase() || "pending",
      kpiId: kpi.id,
      kpi_calculated_metrics: kpi.kpi_calculated_metrics, // Include metrics for status determination
    }));
  }, [selectedPillar]);

  // Handle opening individual KPI
  const handleOpenKpi = (kpiId: string) => {
    router.push(`/hod/kpi-management/${kpiId}`);
  };

  // Show loading state
  if (isPillarsLoading) {
    return (
      <main className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner message="Loading pillars..." size="lg" />
        </div>
      </main>
    );
  }

  // Show error state
  if (pillarsError) {
    return (
      <main className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <ErrorDisplay
            title="Error Loading Pillars"
            message="Failed to load department pillars"
            error={pillarsError}
            onRetry={() => window.location.reload()}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">KPI Management</h1>
          <p className="text-gray-600 mt-2">
            View KPIs assigned to your department (Read-Only)
          </p>
        </div>
      </div>

      {/* Pillar Selection */}
      <div className="mb-8">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-4">
            <label htmlFor="pillar-select" className="text-sm font-medium">
              Select Pillar:
            </label>
            <Select
              value={selectedPillarId}
              onValueChange={setSelectedPillarId}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Choose a pillar to view KPIs" />
              </SelectTrigger>
              <SelectContent>
                {pillars.map((pillar: DepartmentPillar) => (
                  <SelectItem key={pillar.id} value={pillar.id}>
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4" />
                      <span>{pillar.pillar_name}</span>
                      <span className="text-xs text-gray-500">
                        ({pillar.department_kpis?.length || 0} KPIs)
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {!selectedPillarId ? (
        <div className="text-center py-12">
          <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Select a Pillar to Get Started
          </h3>
          <p className="text-gray-500">
            Choose a pillar from the dropdown above to view your KPIs
          </p>
        </div>
      ) : transformedKpis.length === 0 ? (
        <div className="text-center py-12">
          <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No KPIs Found
          </h3>
          <p className="text-gray-500">
            No KPIs are assigned to the selected pillar
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pillar Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {selectedPillar?.pillar_name}
              </CardTitle>
              <CardDescription>
                {selectedPillar?.description || "View KPIs for this pillar"}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Read-Only KPI Table */}
          <ReadOnlyKpiTable
            title="Department KPIs (Read-Only)"
            kpis={transformedKpis}
            onOpenKpi={handleOpenKpi}
            showStatusColumn={true}
          />
        </div>
      )}
    </main>
  );
}
