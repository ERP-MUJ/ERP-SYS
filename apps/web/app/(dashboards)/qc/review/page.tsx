"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@workspace/ui/components/accordion";
import { Building, X } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { useRouter } from "next/navigation";
import {
  useGetDepartments,
  useGetDepartmentPillars,
  useGetAllDepartmentPillars,
} from "@/queries/qc/department-assignment";
import type {
  Department,
  DepartmentPillar,
  DepartmentKpi,
} from "@/services/qc/department-assignment.service";
import {
  PillarKpiTable,
  PerformanceSheetTable,
} from "@/components/qc/performance-sheet-table";

export default function QACSubmissionReview() {
  const router = useRouter();
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    string | null
  >(null);

  // Fetch departments dynamically
  const {
    data: departments = [],
    isLoading: isLoadingDepartments,
    error: departmentsError,
  } = useGetDepartments();
  const { data: allDepartmentPillars = [] } = useGetAllDepartmentPillars();

  // When a department name is selected, resolve its id
  React.useEffect(() => {
    if (selectedDepartment === "all") {
      setSelectedDepartmentId(null);
      return;
    }
    const dept = departments.find((d) => d.dept_name === selectedDepartment);
    setSelectedDepartmentId(dept ? dept.id : null);
  }, [selectedDepartment, departments]);

  // Fetch pillars (and KPIs) for selected department
  const { data: departmentPillars = [], isLoading: isLoadingPillars } =
    useGetDepartmentPillars(selectedDepartmentId);

  const pillarCountsByDept = React.useMemo(() => {
    const counts: Record<string, number> = {};
    allDepartmentPillars.forEach((p: any) => {
      counts[p.dept_id] = (counts[p.dept_id] || 0) + 1;
    });
    return counts;
  }, [allDepartmentPillars]);

  // Map department pillars & KPIs to structures required by existing tables
  const dynamicPillarKpis: Record<
    string,
    import("@/components/qc/performance-sheet-table").PillarKpi[]
  > = React.useMemo(() => {
    const acc: Record<
      string,
      import("@/components/qc/performance-sheet-table").PillarKpi[]
    > = {};
    departmentPillars.forEach((pillar: DepartmentPillar) => {
      pillar.department_kpis.forEach((kpi: DepartmentKpi) => {
        const key = pillar.pillar_name;
        if (!acc[key]) acc[key] = [];

        // Check if KPI has been submitted to QC from metadata
        const metadata =
          (kpi.kpi_calculated_metrics as Record<string, unknown>) || {};
        const isSubmittedToQc = metadata.is_submitted_to_qc === true;

        acc[key].push({
          kpi_no: kpi.kpi_number,
          metric: kpi.kpi_metric_name,
          dataProvidedBy: kpi.data_provided_by || "HoD",
          target: kpi.kpi_value?.toString() ?? "-",
          actual: kpi.kpi_data?.actual ?? "-",
          percentAchieved: kpi.percentage_target_achieved ?? "-",
          value: kpi.performance ?? "",
          status: kpi.kpi_status?.toLowerCase() ?? "pending",
          kpiId: kpi.id,
          isSubmittedToQc, // Pass submission status to the component
          totalEntries: kpi.total_entries ?? 0,
        });
      });
    });
    return acc;
  }, [departmentPillars]);

  // Build performance sheet rows from pillars
  const performanceData = React.useMemo(() => {
    if (!departmentPillars.length) return [] as any[];
    return departmentPillars.map((pillar, idx) => ({
      slNo: idx + 1,
      parameter: pillar.pillar_name,
      weight: Number(pillar.pillar_weight ?? 0),
      targetAchieved: Number(pillar.percentage_target_achieved ?? 0),
      performance: Number(pillar.performance ?? 0),
    }));
  }, [departmentPillars]);

  // KPI counts & pending counts derived directly from fetched data
  const totalKpis = React.useMemo(
    () =>
      departmentPillars.reduce((sum, p) => sum + p.department_kpis.length, 0),
    [departmentPillars],
  );
  const pendingKpis = React.useMemo(
    () =>
      departmentPillars.reduce(
        (sum, p) =>
          sum +
          p.department_kpis.filter((k) => {
            const status = (k.kpi_status || "").toLowerCase();
            const metadata =
              (k.kpi_calculated_metrics as Record<string, unknown>) || {};
            const isSubmittedToQc = metadata.is_submitted_to_qc === true;
            // Count as pending only if status is pending AND not submitted to QC
            return status === "pending" && !isSubmittedToQc;
          }).length,
        0,
      ),
    [departmentPillars],
  );

  const awaitingApprovalKpis = React.useMemo(
    () =>
      departmentPillars.reduce(
        (sum, p) =>
          sum +
          p.department_kpis.filter((k) => {
            const status = (k.kpi_status || "").toLowerCase();
            const metadata =
              (k.kpi_calculated_metrics as Record<string, unknown>) || {};
            const isSubmittedToQc = metadata.is_submitted_to_qc === true;
            // Count as awaiting approval if status is pending AND submitted to QC
            return status === "pending" && isSubmittedToQc;
          }).length,
        0,
      ),
    [departmentPillars],
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">KPI Submission Review</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Review and evaluate department KPI submissions
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {selectedDepartment === "all"
              ? "Select a department"
              : isLoadingPillars
                ? "Loading KPIs..."
                : `Showing ${totalKpis} KPIs`}
          </div>
          {selectedDepartment !== "all" &&
            !isLoadingPillars &&
            (pendingKpis > 0 || awaitingApprovalKpis > 0) && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {pendingKpis > 0 && `${pendingKpis} pending, `}
                {awaitingApprovalKpis > 0 &&
                  `${awaitingApprovalKpis} awaiting review`}
              </div>
            )}
        </div>
      </div>

      {/* Filters Section */}
      <Card className="mb-4 p-2 shadow-none border border-muted-foreground/20">
        <CardContent className="py-2 px-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {/* Department Filter ONLY */}
            <div className="space-y-1">
              <label className="text-xs my-2 font-medium flex items-center gap-2">
                <Building className="h-3 w-3" />
                Department
              </label>
              <Select
                value={selectedDepartment}
                onValueChange={setSelectedDepartment}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    {isLoadingDepartments
                      ? "Loading departments..."
                      : departmentsError
                        ? "Error loading departments"
                        : `Select Department (${departments.length})`}
                  </SelectItem>
                  {!isLoadingDepartments &&
                    !departmentsError &&
                    (departments as Department[]).map((dept) => (
                      <SelectItem
                        key={dept.id}
                        value={dept.dept_name}
                        className="text-xs"
                      >
                        {dept.dept_name} ({pillarCountsByDept[dept.id] || 0})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {/* Additional filters can be added here later */}
          </div>
          {/* Active Filters Display */}
          {selectedDepartment !== "all" && (
            <div className="mt-2 pt-2 border-t">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500 dark:text-gray-400">
                  Active filters:
                </span>
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 text-xs"
                >
                  <Building className="h-3 w-3" />
                  {selectedDepartment}
                  <button
                    onClick={() => setSelectedDepartment("all")}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Only render the rest if department is selected */}
      {selectedDepartment !== "all" ? (
        <>
          {/* Performance Sheet Table (new) */}
          <div className="mb-8">
            {isLoadingPillars ? (
              <div className="p-6 text-center text-muted-foreground border rounded">
                Loading performance data...
              </div>
            ) : performanceData.length ? (
              <PerformanceSheetTable
                data={performanceData as any}
                totalKpis={departmentPillars.reduce(
                  (sum, p) => sum + p.department_kpis.length,
                  0,
                )}
              />
            ) : (
              <div className="p-6 text-center text-muted-foreground border rounded">
                No pillars assigned to this department.
              </div>
            )}
          </div>
          {/* KPI Cards */}
          <Card className="shadow-md border rounded-lg mb-8 p-4">
            {isLoadingPillars ? (
              <div className="p-4 text-center text-muted-foreground">
                Loading KPIs...
              </div>
            ) : Object.keys(dynamicPillarKpis).length ? (
              <Accordion
                type="multiple"
                defaultValue={Object.keys(dynamicPillarKpis)}
              >
                {Object.entries(dynamicPillarKpis).map(([pillar, kpis]) => (
                  <AccordionItem key={pillar} value={pillar}>
                    <AccordionTrigger>{pillar}</AccordionTrigger>
                    <AccordionContent>
                      <PillarKpiTable
                        kpis={Array.isArray(kpis) ? kpis : []}
                        onReviewKpi={(kpiId) => {
                          // Navigate to dedicated KPI review page using actual KPI id from pillar table
                          router.push(`/qc/review/${kpiId}`);
                        }}
                      />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                No KPIs found for assigned pillars.
              </div>
            )}
          </Card>

          {/* Legacy dialog removed: review happens on dedicated KPI page */}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground font-semibold">
            Please select a department to view KPI submissions and performance
            data.
          </p>
        </div>
      )}
    </div>
  );
}
