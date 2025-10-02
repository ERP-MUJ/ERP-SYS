"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardTitle } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Separator } from "@workspace/ui/components/separator";
import { AssignAllButton } from "@/components/qc/assign-all-button";
import { DepartmentOverview } from "@/components/qc/assign/DepartmentOverview";
import { DepartmentAssignmentSections } from "@/components/qc/assign/DepartmentAssignmentSections";
import { KpiManagementSection } from "@/components/qc/assign/KpiManagementSection";
import { usePillarAssignments, useKpiAssignments } from "@/hooks/qc-assignment";
import {
  usePillarHandlers,
  useKpiHandlers,
} from "@/hooks/qc-assignment-handlers";
import {
  useGetDepartments,
  useGetPillarTemplates,
  useGetDepartmentPillars,
  useGetAllDepartmentPillars,
  useGetArchivedDepartmentPillars,
  useGetDepartmentPillarKPIs,
} from "@/queries/qc/department-assignment";
import PageContainer from "@/components/common/PageContainer";

export default function AssignKpiToDepartmentPage() {
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    string | null
  >(null);
  const [selectedPillarId, setSelectedPillarId] = useState<string | null>(null);
  const kpiSectionRef = useRef<HTMLDivElement>(null);

  // Queries
  const { data: departments = [], isLoading: departmentsLoading } =
    useGetDepartments();
  const { data: pillarTemplates = [], isLoading: pillarTemplatesLoading } =
    useGetPillarTemplates();
  const {
    data: selectedDepartmentPillars = [],
    isLoading: departmentPillarsLoading,
  } = useGetDepartmentPillars(selectedDepartmentId);
  const { data: archivedDepartmentPillars = [] } =
    useGetArchivedDepartmentPillars(selectedDepartmentId);
  const {
    data: allDepartmentPillars = [],
    isLoading: allDepartmentPillarsLoading,
  } = useGetAllDepartmentPillars();

  const { assignedPillars, unassignedPillars } = usePillarAssignments(
    selectedDepartmentId,
    pillarTemplates,
    selectedDepartmentPillars,
  );

  const selectedDepartmentPillar = selectedDepartmentPillars.find(
    (dp) => dp.template_id === selectedPillarId,
  );

  const shouldFetchDepartmentKPIs =
    selectedPillarId && selectedDepartmentPillar;
  const { data: departmentPillarKPIs = [], isLoading: kpisLoading } =
    useGetDepartmentPillarKPIs(
      shouldFetchDepartmentKPIs ? selectedDepartmentPillar.id : null,
    );

  const { assignedKpis, unassignedKpis, isOrphanedPillar } = useKpiAssignments(
    selectedPillarId,
    pillarTemplates,
    assignedPillars,
    selectedDepartmentPillar,
    departmentPillarKPIs,
  );

  const pillarHandlers = usePillarHandlers(selectedDepartmentId);
  const kpiHandlers = useKpiHandlers(
    selectedDepartmentPillar,
    departmentPillarKPIs,
  );

  const handleDepartmentChange = (deptId: string) => {
    setSelectedDepartmentId(deptId);
    setSelectedPillarId(null);
  };

  const handlePillarSelect = (pillarId: string) => {
    setSelectedPillarId(pillarId);
    setTimeout(() => {
      kpiSectionRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleBackToDepartments = () => {
    setSelectedDepartmentId(null);
    setSelectedPillarId(null);
  };

  const isLoading =
    departmentsLoading ||
    pillarTemplatesLoading ||
    departmentPillarsLoading ||
    allDepartmentPillarsLoading;

  if (isLoading) {
    return (
      <PageContainer
        title="Assign Pillar and KPI to Department"
        subtitle="Loading data..."
      >
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading data...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  const selectedDepartment = departments.find(
    (d) => d.id === selectedDepartmentId,
  );
  const selectedAssignedPillar = assignedPillars.find(
    (p) => p.id === selectedPillarId,
  );
  const selectedTemplatePillar = pillarTemplates.find(
    (p) => p.id === selectedPillarId,
  );
  const selectedPillar =
    selectedAssignedPillar || selectedTemplatePillar || null;

  return (
    <PageContainer
      title="Assign Pillar and KPI to Department"
      subtitle="Manage assignments across departments"
      actions={<AssignAllButton />}
    >
      {!selectedDepartmentId ? (
        <DepartmentOverview
          departments={departments}
          allDepartmentPillars={allDepartmentPillars}
          onDepartmentSelect={handleDepartmentChange}
        />
      ) : (
        <div className="space-y-8">
          {/* Back Navigation */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={handleBackToDepartments}
              className="flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Departments
            </Button>
            <Separator className="flex-1" />
          </div>

          {/* Department Info */}
          <Card className="shadow-sm rounded-2xl">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">
                    {selectedDepartment?.dept_name}
                  </CardTitle>
                  <p className="text-muted-foreground mt-1">
                    Manage pillar assignments and KPI configurations
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    Assigned Pillars
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {assignedPillars.length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignment Sections */}
          <DepartmentAssignmentSections
            selectedDepartment={selectedDepartment!}
            assignedPillars={assignedPillars}
            unassignedPillars={unassignedPillars}
            archivedPillars={archivedDepartmentPillars}
            onAssign={pillarHandlers.handleAssignPillar}
            onUnassign={pillarHandlers.handleUnassignPillar}
            onUpdate={pillarHandlers.handleUpdatePillar}
            onView={handlePillarSelect}
            onDelete={pillarHandlers.handleDeletePillar}
            onRestore={pillarHandlers.handleRestorePillar}
            onBulkAssignAll={pillarHandlers.handleBulkAssignAll}
            onBulkUnassignAll={pillarHandlers.handleBulkUnassignAll}
            mutations={pillarHandlers.mutations}
          />

          {/* KPI Management Section */}
          <KpiManagementSection
            ref={kpiSectionRef}
            selectedPillarId={selectedPillarId!}
            selectedPillar={selectedPillar}
            assignedKpis={assignedKpis}
            unassignedKpis={unassignedKpis}
            isOrphanedPillar={isOrphanedPillar}
            kpisLoading={kpisLoading}
            shouldFetchDepartmentKPIs={!!shouldFetchDepartmentKPIs}
            onAssignKpi={kpiHandlers.handleAssignKpi}
            onUnassignKpi={kpiHandlers.handleUnassignKpi}
            onUpdateKpi={kpiHandlers.handleUpdateKpi}
          />
        </div>
      )}
    </PageContainer>
  );
}
