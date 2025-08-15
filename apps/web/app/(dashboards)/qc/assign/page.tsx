"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Label } from "@workspace/ui/components/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Separator } from "@workspace/ui/components/separator";
import { useState, useRef, useMemo } from "react";
import { toast } from "sonner";
import { AssignPillarTable } from "@/components/qc/assign/AssignPillarTable";
import { AssignKpiTable } from "@/components/qc/assign/AssignKpiTable";
import {
  useGetDepartments,
  useGetPillarTemplates,
  useGetDepartmentPillars,
  useGetAllDepartmentPillars,
  useGetDepartmentPillarKPIs,
  useAssignPillarToDepartment,
  useUnassignPillarFromDepartment,
} from "@/queries/qc/department-assignment";

export default function AssignKpiToDepartmentPage() {
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    string | null
  >(null);
  const [selectedPillarId, setSelectedPillarId] = useState<string | null>(null);
  const kpiSectionRef = useRef<HTMLDivElement>(null);

  // Fetch real data from APIs
  const { data: departments = [], isLoading: departmentsLoading } =
    useGetDepartments();
  const { data: pillarTemplates = [], isLoading: pillarTemplatesLoading } =
    useGetPillarTemplates();

  // Fetch department pillars for selected department (for detailed view)
  const {
    data: selectedDepartmentPillars = [],
    isLoading: departmentPillarsLoading,
  } = useGetDepartmentPillars(selectedDepartmentId);

  // Fetch ALL department pillars for cards view (we need this for all departments)
  const {
    data: allDepartmentPillars = [],
    isLoading: allDepartmentPillarsLoading,
  } = useGetAllDepartmentPillars();

  // Get the department pillar ID for the selected pillar
  const selectedDepartmentPillar = selectedDepartmentPillars.find(
    (dp) => dp.template_id === selectedPillarId,
  );
  const { data: departmentPillarKPIs = [], isLoading: kpisLoading } =
    useGetDepartmentPillarKPIs(selectedDepartmentPillar?.id || null);

  // Mutations
  const assignPillarMutation = useAssignPillarToDepartment();
  const unassignPillarMutation = useUnassignPillarFromDepartment();

  // Compute assigned and unassigned pillars
  const { assignedPillars, unassignedPillars } = useMemo(() => {
    if (!selectedDepartmentId || !pillarTemplates.length) {
      return { assignedPillars: [], unassignedPillars: [] };
    }

    const assignedTemplateIds = selectedDepartmentPillars.map(
      (dp: any) => dp.template_id,
    );

    const assigned = pillarTemplates.filter((pt) =>
      assignedTemplateIds.includes(pt.id),
    );
    const unassigned = pillarTemplates.filter(
      (pt) => !assignedTemplateIds.includes(pt.id),
    );

    return { assignedPillars: assigned, unassignedPillars: unassigned };
  }, [selectedDepartmentId, pillarTemplates, selectedDepartmentPillars]);

  // Compute assigned and unassigned KPIs for selected pillar
  const { assignedKpis, unassignedKpis } = useMemo(() => {
    if (!selectedPillarId || !pillarTemplates.length) {
      return { assignedKpis: [], unassignedKpis: [] };
    }

    const selectedPillar = pillarTemplates.find(
      (pt) => pt.id === selectedPillarId,
    );
    if (!selectedPillar) {
      return { assignedKpis: [], unassignedKpis: [] };
    }

    // If no department pillar exists, all KPIs are unassigned
    if (!selectedDepartmentPillar) {
      return {
        assignedKpis: [],
        unassignedKpis: selectedPillar.kpi_templates,
      };
    }

    // Map department KPIs to template KPI format for display
    const assigned = departmentPillarKPIs.map((dk) => ({
      id: dk.template_id,
      // Map to the field names expected by AssignKpiTable component
      kpiNo: dk.kpi_number,
      kpi_number: dk.kpi_number,
      metric: dk.kpi_metric_name,
      kpi_metric_name: dk.kpi_metric_name,
      kpi_description: dk.kpi_description,
      dataProvidedBy: dk.data_provided_by,
      data_provided_by: dk.data_provided_by,
      target: dk.kpi_value,
      target2025: dk.kpi_value,
      kpi_value: dk.kpi_value,
      value: dk.kpi_value,
      kpi_data: dk.kpi_data,
      kpi_calculated_metrics: dk.kpi_calculated_metrics,
      academic_year: dk.academic_year,
      created_at: dk.assigned_date,
      updated_at: dk.assigned_date,
      // Add additional fields that might be needed for display
      percentage_target_achieved: dk.percentage_target_achieved,
      performance: dk.performance,
      kpi_status: dk.kpi_status,
      assigned_date: dk.assigned_date,
      due_date: dk.due_date,
      completed_date: dk.completed_date,
      comments: dk.comments,
      form_responses: dk.form_responses,
      user_ids: dk.user_ids,
      assigned_users: dk.assigned_users,
    }));

    // Find unassigned KPIs (template KPIs not in assigned list)
    const assignedTemplateIds = assigned.map((k) => k.id);
    const unassigned = selectedPillar.kpi_templates.filter(
      (kt) => !assignedTemplateIds.includes(kt.id),
    );

    return { assignedKpis: assigned, unassignedKpis: unassigned };
  }, [
    selectedPillarId,
    pillarTemplates,
    selectedDepartmentPillar,
    departmentPillarKPIs,
  ]);

  // Handle department change
  const handleDepartmentChange = (deptId: string) => {
    setSelectedDepartmentId(deptId);
    setSelectedPillarId(null);
  };

  // Handle pillar selection
  const handlePillarSelect = (pillarId: string) => {
    setSelectedPillarId(pillarId);
    // Scroll to KPIs section
    setTimeout(() => {
      kpiSectionRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Handle assigning a pillar to a department
  const handleAssignPillar = (pillar: {
    id: string;
    weight?: number;
    weightA?: number;
  }) => {
    if (!selectedDepartmentId) {
      toast.error("Please select a department first");
      return;
    }

    assignPillarMutation.mutate({
      departmentId: selectedDepartmentId,
      payload: {
        pillarTemplateId: pillar.id,
        pillarWeight: pillar.weightA || pillar.weight || 0,
      },
    });
  };

  // Handle unassigning a pillar from a department
  const handleUnassignPillar = (pillar: { id: string }) => {
    if (!selectedDepartmentId) {
      toast.error("Please select a department first");
      return;
    }

    // Find the department pillar ID
    const departmentPillar = selectedDepartmentPillars.find(
      (dp: any) => dp.template_id === pillar.id,
    );
    if (!departmentPillar) {
      toast.error("Pillar not found in department");
      return;
    }

    unassignPillarMutation.mutate({
      departmentPillarId: departmentPillar.id,
      departmentId: selectedDepartmentId,
    });
  };

  // Handle assigning a KPI to a pillar (placeholder for future implementation)
  const handleAssignKpi = (kpi: { id: string; kpi_metric_name: string }) => {
    toast.info(
      "KPI assignment functionality will be implemented in the next phase",
    );
  };

  // Handle unassigning a KPI from a pillar (placeholder for future implementation)
  const handleUnassignKpi = (kpi: { id: string; kpi_metric_name: string }) => {
    toast.info(
      "KPI unassignment functionality will be implemented in the next phase",
    );
  };

  // Loading states
  const isLoading =
    departmentsLoading ||
    pillarTemplatesLoading ||
    departmentPillarsLoading ||
    allDepartmentPillarsLoading ||
    kpisLoading;

  if (isLoading) {
    return (
      <main className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading data...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">
        Assign Pillar and KPI to Department
      </h1>

      {/* Department Cards View */}
      {!selectedDepartmentId ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => {
            // Get department pillars for this department
            const deptPillars = allDepartmentPillars.filter(
              (dp: { dept_id: string }) => dp.dept_id === dept.id,
            );
            const totalKPIs = deptPillars.reduce(
              (sum: number, pillar: { department_kpis?: any[] }) =>
                sum + (pillar.department_kpis?.length || 0),
              0,
            );

            return (
              <Card
                key={dept.id}
                className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
                onClick={() => handleDepartmentChange(dept.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg mb-1">
                        {dept.dept_name}
                      </CardTitle>
                      {dept.hod_name && (
                        <p className="text-sm text-muted-foreground">
                          HOD: {dept.hod_name}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary">
                      {deptPillars.length} Pillars
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Metadata Stats */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Assigned Pillars:
                      </span>
                      <span className="text-sm font-medium">
                        {deptPillars.length}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Total KPIs:
                      </span>
                      <span className="text-sm font-medium">{totalKPIs}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Status:
                      </span>
                      <Badge
                        variant={
                          deptPillars.length > 0 ? "default" : "secondary"
                        }
                      >
                        {deptPillars.length > 0 ? "Active" : "Pending"}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  {/* Action Button */}
                  <Button className="w-full" variant="default">
                    Manage Pillars & KPIs
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Detailed View for Selected Department */
        <div className="space-y-6">
          {/* Back Button */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedDepartmentId(null);
                setSelectedPillarId(null);
              }}
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

          {/* Department Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">
                    {
                      departments.find((d) => d.id === selectedDepartmentId)
                        ?.dept_name
                    }
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

          {/* Assign Pillar Section */}
          <Card>
            <CardHeader>
              <CardTitle>Assign Pillar</CardTitle>
            </CardHeader>
            <CardContent>
              <AssignPillarTable
                assignedPillars={assignedPillars}
                unassignedPillars={unassignedPillars}
                onAssign={handleAssignPillar}
                onUnassign={handleUnassignPillar}
                onView={handlePillarSelect}
              />
            </CardContent>
          </Card>

          {/* KPIs for Selected Pillar */}
          {selectedPillarId && (
            <Card ref={kpiSectionRef}>
              <CardHeader>
                <CardTitle>
                  {pillarTemplates.find((p) => p.id === selectedPillarId)
                    ?.pillar_name || "KPIs for Pillar"}
                </CardTitle>
              </CardHeader>

              {/* Debug Info */}
              <CardContent className="bg-muted/50">
                <div className="text-sm space-y-1">
                  <p>
                    <strong>Debug Info:</strong>
                  </p>
                  <p>Selected Pillar ID: {selectedPillarId}</p>
                  <p>
                    Department Pillar ID:{" "}
                    {selectedDepartmentPillar?.id || "Not found"}
                  </p>
                  <p>
                    Department Pillar KPIs Count: {departmentPillarKPIs.length}
                  </p>
                  <p>Assigned KPIs Count: {assignedKpis.length}</p>
                  <p>Unassigned KPIs Count: {unassignedKpis.length}</p>
                  <p>
                    Template KPIs Count:{" "}
                    {pillarTemplates.find((p) => p.id === selectedPillarId)
                      ?.kpi_templates.length || 0}
                  </p>
                </div>
              </CardContent>

              <CardContent>
                <AssignKpiTable
                  assignedKpis={assignedKpis}
                  unassignedKpis={unassignedKpis}
                  onAssign={handleAssignKpi}
                  onUnassign={handleUnassignKpi}
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </main>
  );
}
