"use client";
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
import {
  AssignKpiTable,
  type KpiData,
} from "@/components/qc/assign/AssignKpiTable";
import { AssignAllButton } from "@/components/qc/assign-all-button";
import {
  useGetDepartments,
  useGetPillarTemplates,
  useGetDepartmentPillars,
  useGetAllDepartmentPillars,
  useGetDepartmentPillarKPIs,
  useAssignPillarToDepartment,
  useUnassignPillarFromDepartment,
  useUpdateDepartmentPillar,
  useAssignKpiToDepartmentPillar,
  useUnassignKpiFromDepartmentPillar,
  useUpdateDepartmentKpi,
} from "@/queries/qc/department-assignment";

interface PillarData {
  id: string;
  pillar_name: string;
  pillar_weight?: number | null;
  pillar_target?: number | null;
  departmentPillarId?: string;
}

export default function AssignKpiToDepartmentPage() {
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    string | null
  >(null);
  const [selectedPillarId, setSelectedPillarId] = useState<string | null>(null);
  const kpiSectionRef = useRef<HTMLDivElement>(null);

  const { data: departments = [], isLoading: departmentsLoading } =
    useGetDepartments();
  const { data: pillarTemplates = [], isLoading: pillarTemplatesLoading } =
    useGetPillarTemplates();
  const {
    data: selectedDepartmentPillars = [],
    isLoading: departmentPillarsLoading,
  } = useGetDepartmentPillars(selectedDepartmentId);
  const {
    data: allDepartmentPillars = [],
    isLoading: allDepartmentPillarsLoading,
  } = useGetAllDepartmentPillars();

  const selectedDepartmentPillar = selectedDepartmentPillars.find(
    (dp) => dp.template_id === selectedPillarId,
  );
  const { data: departmentPillarKPIs = [], isLoading: kpisLoading } =
    useGetDepartmentPillarKPIs(selectedDepartmentPillar?.id || null);

  const assignPillarMutation = useAssignPillarToDepartment();
  const unassignPillarMutation = useUnassignPillarFromDepartment();
  const updatePillarMutation = useUpdateDepartmentPillar();
  const assignKpiMutation = useAssignKpiToDepartmentPillar();
  const unassignKpiMutation = useUnassignKpiFromDepartmentPillar();
  const updateKpiMutation = useUpdateDepartmentKpi();

  const { assignedPillars, unassignedPillars } = useMemo(() => {
    if (!selectedDepartmentId || !pillarTemplates.length) {
      return { assignedPillars: [], unassignedPillars: [] };
    }

    const assignedPillarMap = new Map(
      selectedDepartmentPillars.map((dp) => [dp.template_id, dp]),
    );

    const assigned = pillarTemplates
      .filter((pt) => assignedPillarMap.has(pt.id))
      .map((pt) => {
        const departmentPillar = assignedPillarMap.get(pt.id);
        return {
          ...pt,
          departmentPillarId: departmentPillar?.id,
          pillar_weight: departmentPillar?.pillar_weight,
          pillar_target: departmentPillar?.pillar_target,
        };
      });

    const unassigned = pillarTemplates.filter(
      (pt) => !assignedPillarMap.has(pt.id),
    );

    return { assignedPillars: assigned, unassignedPillars: unassigned };
  }, [selectedDepartmentId, pillarTemplates, selectedDepartmentPillars]);

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
    if (!selectedDepartmentPillar) {
      return {
        assignedKpis: [],
        unassignedKpis: selectedPillar.kpi_templates,
      };
    }
    const assigned = departmentPillarKPIs.map((dk) => ({
      id: dk.template_id,
      departmentKpiId: dk.id,
      kpiNo: dk.kpi_number,
      kpi_number: dk.kpi_number,
      metric: dk.kpi_metric_name,
      kpi_metric_name: dk.kpi_metric_name,
      kpi_description: dk.kpi_description,
      dataProvidedBy: dk.data_provided_by,
      data_provided_by: dk.data_provided_by,
      kpi_value: dk.kpi_value,
      kpi_target: dk.kpi_target,
      kpi_data: dk.kpi_data,
      kpi_calculated_metrics: dk.kpi_calculated_metrics,
      academic_year: dk.academic_year,
      created_at: dk.assigned_date,
      updated_at: dk.assigned_date,
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

  const handleAssignPillar = (pillar: {
    id: string;
    weight?: number;
    weightA?: number;
    target?: number;
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
        pillarTarget: pillar.target,
      },
    });
  };

  const handleUnassignPillar = (pillar: PillarData) => {
    if (!selectedDepartmentId) {
      toast.error("Please select a department first");
      return;
    }
    if (!pillar.departmentPillarId) {
      toast.error("Pillar not found in department");
      return;
    }
    unassignPillarMutation.mutate({
      departmentPillarId: pillar.departmentPillarId,
      departmentId: selectedDepartmentId,
    });
  };

  const handleUpdatePillar = (
    pillar: PillarData,
    weight?: number,
    target?: number,
  ) => {
    if (!selectedDepartmentId) {
      toast.error("Please select a department");
      return;
    }
    if (!pillar.departmentPillarId) {
      toast.error("Cannot find the assigned pillar to update.");
      return;
    }
    const updateData: any = {
      departmentPillarId: pillar.departmentPillarId,
      departmentId: selectedDepartmentId,
    };
    if (weight !== undefined) {
      updateData.pillarWeight = weight;
    }
    if (target !== undefined) {
      updateData.pillarTarget = target;
    }
    updatePillarMutation.mutate(updateData);
  };

  const handleAssignKpi = (
    kpi: KpiData,
    weightage: number,
    target?: number,
  ) => {
    if (!selectedDepartmentPillar) {
      toast.error("No department pillar selected");
      return;
    }
    assignKpiMutation.mutate({
      departmentPillarId: selectedDepartmentPillar.id,
      kpiTemplateId: kpi.id,
      kpiValue: weightage,
      kpiTarget: target,
    });
  };

  const handleUnassignKpi = (kpi: KpiData) => {
    if (!selectedDepartmentPillar) {
      toast.error("No department pillar selected");
      return;
    }
    const departmentKpi = departmentPillarKPIs.find(
      (dk) => dk.template_id === kpi.id,
    );
    if (!departmentKpi) {
      toast.error("KPI not found in department pillar");
      return;
    }
    unassignKpiMutation.mutate({
      departmentKpiId: departmentKpi.id,
      departmentPillarId: selectedDepartmentPillar.id,
    });
  };

  const handleUpdateKpi = (
    kpi: KpiData,
    weightage?: number,
    target?: number,
  ) => {
    if (!selectedDepartmentPillar) {
      toast.error("No department pillar selected");
      return;
    }
    if (!kpi.departmentKpiId) {
      toast.error("Cannot find the assigned KPI to update.");
      return;
    }
    const updateData: any = {
      departmentKpiId: kpi.departmentKpiId,
      departmentPillarId: selectedDepartmentPillar.id,
    };
    if (weightage !== undefined) {
      updateData.kpiValue = weightage;
    }
    if (target !== undefined) {
      updateData.kpiTarget = target;
    }
    updateKpiMutation.mutate(updateData);
  };

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">
          Assign Pillar and KPI to Department
        </h1>

        <AssignAllButton />
      </div>

      {!selectedDepartmentId ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => {
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
                  <Button className="w-full" variant="default">
                    Manage Pillars & KPIs
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="space-y-6">
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
                onUpdate={handleUpdatePillar}
                onView={handlePillarSelect}
              />
            </CardContent>
          </Card>

          {selectedPillarId && (
            <Card ref={kpiSectionRef}>
              <CardHeader>
                <CardTitle>
                  {pillarTemplates.find((p) => p.id === selectedPillarId)
                    ?.pillar_name || "KPIs for Pillar"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AssignKpiTable
                  assignedKpis={assignedKpis}
                  unassignedKpis={unassignedKpis}
                  onAssign={handleAssignKpi}
                  onUnassign={handleUnassignKpi}
                  onUpdate={handleUpdateKpi}
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </main>
  );
}
