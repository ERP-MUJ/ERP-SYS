"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { useAssignKpiToPillar, useFetchDepartments } from "@/hooks/dept";
import { useFetchForms } from "@/hooks/forms";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { useState, useRef } from "react";
import { Button } from "@workspace/ui/components/button";
import { toast } from "sonner";
import type { AssignKpiPayload } from "@/lib/types";
import { useFetchAssignedKpis } from "@/hooks/dept";
import { Badge } from "@workspace/ui/components/badge";
import { Eye } from "lucide-react";
import { PillarCard } from "@/components/qoc/pillar-card";
import { KpiCard } from "@/components/qoc/kpi-card";

// TODO: Implement these hooks and APIs
// import { useFetchDepartments } from "@/hooks/departments";
// import { useFetchPillarTemplates } from "@/hooks/pillarTemplates";
// import { useAssignPillarToDepartment, useFetchDepartmentPillars } from "@/hooks/departmentPillars";
// import { useFetchDepartmentKpis } from "@/hooks/departmentKpis";

export default function AssignKpiToDepartmentPage() {
  // TODO: Replace with GET /api/departments
  const [departments] = useState<any[]>([
    { id: "dept-1", dept_name: "Computer Science and Engineering" },
    { id: "dept-2", dept_name: "Mechanical Engineering" },
  ]);
  // TODO: Replace with GET /api/pillar-templates
  const [allPillars] = useState<any[]>([
    { id: "pillar-1", pillar_name: "Academic Excellence" },
    { id: "pillar-2", pillar_name: "Research & Innovation" },
    { id: "pillar-3", pillar_name: "Industry Connect" },
  ]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    string | null
  >(null);
  const [assignedPillars, setAssignedPillars] = useState<any[]>([]); // TODO: Replace with GET /api/department-pillars?dept_id=...
  const [unassignedPillars, setUnassignedPillars] = useState<any[]>([]); // TODO: Filter allPillars - assignedPillars
  const [selectedPillarId, setSelectedPillarId] = useState<string | null>(null);
  const [assignedKpis, setAssignedKpis] = useState<any[]>([]); // TODO: Replace with GET /api/department-kpis?dept_pillar_id=...
  const [unassignedKpis, setUnassignedKpis] = useState<any[]>([]); // TODO: Filter all KPI templates - assignedKpis
  const kpiSectionRef = useRef<HTMLDivElement>(null);

  // Simulate fetching pillars when department changes
  const handleDepartmentChange = (deptId: string) => {
    setSelectedDepartmentId(deptId);
    setSelectedPillarId(null);
    // TODO: Fetch assigned pillars for department (GET /api/department-pillars?dept_id=...)
    // Dummy: Assign first two pillars to department
    setAssignedPillars(allPillars.slice(0, 2));
    setUnassignedPillars(allPillars.slice(2));
    setAssignedKpis([]);
    setUnassignedKpis([]);
  };

  // Simulate fetching KPIs when pillar changes
  const handlePillarSelect = (pillarId: string) => {
    setSelectedPillarId(pillarId);
    // TODO: Fetch assigned KPIs for department pillar (GET /api/department-kpis?dept_pillar_id=...)
    // Dummy: Assign one KPI to pillar
    setAssignedKpis([
      {
        id: "kpi-1",
        title: "KPI 1",
        description: "Awards received by the students",
        elements: [1, 2, 3],
        value: 10,
      },
    ]);
    setUnassignedKpis([
      {
        id: "kpi-2",
        title: "KPI 2",
        description: "Research papers published",
        elements: [1, 2],
        value: 5,
      },
      {
        id: "kpi-3",
        title: "KPI 3",
        description: "Industry projects",
        elements: [1],
        value: 2,
      },
    ]);
    // Scroll to KPIs section
    setTimeout(() => {
      kpiSectionRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Simulate assigning a pillar to a department
  const handleAssignPillar = (pillar: any) => {
    setAssignedPillars((prev) => [...prev, pillar]);
    setUnassignedPillars((prev) => prev.filter((p) => p.id !== pillar.id));
    toast.success("Pillar assigned to department (dummy)");
    // TODO: POST /api/department-pillars
  };

  // Simulate assigning a KPI to a pillar
  const handleAssignKpi = (kpi: any) => {
    setAssignedKpis((prev) => [...prev, kpi]);
    setUnassignedKpis((prev) => prev.filter((k) => k.id !== kpi.id));
    toast.success("KPI assigned to pillar (dummy)");
    // TODO: POST /api/department-kpis
  };

  // Simulate unassigning a KPI from a pillar
  const handleUnassignKpi = (kpi: any) => {
    setUnassignedKpis((prev) => [...prev, kpi]);
    setAssignedKpis((prev) => prev.filter((k) => k.id !== kpi.id));
    toast.success("KPI unassigned from pillar (dummy)");
    // TODO: DELETE /api/department-kpis/:id
  };

  return (
    <main className="container mx-auto py-8 px-4">
      {/* Department Dropdown */}
      <div className="mb-8 flex gap-4 items-center">
        <label htmlFor="department-select" className="font-medium mr-2">
          Department:
        </label>
        <div className="relative">
          <select
            id="department-select"
            className="border border-gray-300 rounded px-3 py-2 bg-white text-gray-900 shadow focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary min-w-[250px]"
            value={selectedDepartmentId ?? ""}
            onChange={(e) => handleDepartmentChange(e.target.value)}
          >
            <option value="" disabled>
              Select Department
            </option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.dept_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Assigned Pillars Section */}
      {false && selectedDepartmentId && (
        <>
          <h2 className="text-xl font-semibold mb-2">Assigned Pillars</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
            {assignedPillars.length === 0 ? (
              <p>No pillars assigned to this department.</p>
            ) : (
              assignedPillars.map((pillar) => (
                <PillarCard
                  key={pillar.id}
                  pillarName={pillar.pillar_name}
                  selected={selectedPillarId === pillar.id}
                  onView={() => handlePillarSelect(pillar.id)}
                  assigned
                />
              ))
            )}
          </div>
        </>
      )}

      {/* Assign Pillar Section */}
      {selectedDepartmentId && (
        <>
          <h2 className="text-xl font-semibold mb-2">Assign Pillar</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {unassignedPillars.length === 0 ? (
              <p>All pillars assigned to this department.</p>
            ) : (
              unassignedPillars.map((pillar) => (
                <PillarCard
                  key={pillar.id}
                  pillarName={pillar.pillar_name}
                  onAssign={() => handleAssignPillar(pillar)}
                  onView={() => handlePillarSelect(pillar.id)}
                />
              ))
            )}
          </div>
        </>
      )}

      {/* KPIs for Selected Pillar */}
      {selectedDepartmentId && (
        <>
          {/* Pillar Dropdown for viewing/assigning KPIs */}
          {assignedPillars.length > 0 && (
            <div className="mb-6 flex gap-4 items-center">
              <label htmlFor="pillar-select" className="font-medium mr-2">
                Pillar:
              </label>
              <div className="relative">
                <select
                  id="pillar-select"
                  className="border border-gray-300 rounded px-3 py-2 bg-white text-gray-900 shadow focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary min-w-[250px]"
                  value={selectedPillarId ?? ""}
                  onChange={(e) => handlePillarSelect(e.target.value)}
                >
                  <option value="" disabled>
                    Select Pillar
                  </option>
                  {assignedPillars.map((pillar) => (
                    <option key={pillar.id} value={pillar.id}>
                      {pillar.pillar_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          {/* KPIs for Selected Pillar */}
          {selectedPillarId && (
            <div ref={kpiSectionRef}>
              <h2 className="text-xl font-semibold mb-2">Assigned KPIs</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                {assignedKpis.length === 0 ? (
                  <p>No KPIs assigned to this pillar.</p>
                ) : (
                  assignedKpis.map((kpi) => (
                    <KpiCard
                      key={kpi.id}
                      kpiName={kpi.title}
                      description={kpi.description}
                      fieldsCount={kpi.elements.length}
                      value={kpi.value}
                      assigned
                      onView={() => {
                        /* TODO: View KPI */
                      }}
                      onEdit={() => {
                        /* TODO: Edit KPI */
                      }}
                      onDelete={() => {
                        /* TODO: Delete KPI */
                      }}
                      onUnassign={() => handleUnassignKpi(kpi)}
                    />
                  ))
                )}
              </div>
              <h2 className="text-xl font-semibold mb-2">Assign KPI</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {unassignedKpis.length === 0 ? (
                  <p>All KPIs assigned to this pillar.</p>
                ) : (
                  unassignedKpis.map((kpi) => (
                    <KpiCard
                      key={kpi.id}
                      kpiName={kpi.title}
                      description={kpi.description}
                      fieldsCount={kpi.elements.length}
                      value={kpi.value}
                      onView={() => {
                        /* TODO: View KPI */
                      }}
                      onEdit={() => {
                        /* TODO: Edit KPI */
                      }}
                      onDelete={() => {
                        /* TODO: Delete KPI */
                      }}
                      onAssign={() => handleAssignKpi(kpi)}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}
