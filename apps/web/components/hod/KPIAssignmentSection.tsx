"use client";

import { useState, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";
import { Badge } from "@workspace/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { toast } from "sonner";
import { useHodDepartmentPillars } from "@/hooks/dept";
import { CheckCircle, XCircle, AlertCircle, Calendar } from "lucide-react";
import { HodKpiService } from "@/services";
import { AssignKpiToCoordinatorRequest } from "@/lib/types";

interface User {
  id: string;
  user_name: string;
  user_email: string;
  user_role: string;
}
interface DepartmentKpi {
  id: string;
  kpi_number: number;
  kpi_metric_name: string;
  kpi_description?: string;
  kpi_status: string;
  assigned_users: User[];
}
interface DepartmentPillar {
  id: string;
  pillar_name: string;
  description?: string;
  department_kpis: DepartmentKpi[];
}
interface Coordinator {
  id: string;
  user_name: string;
  user_email: string;
  assigned_kpis: string[];
}

const KPIAssignmentSection = () => {
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [selectedCoordinator, setSelectedCoordinator] = useState("");
  const [selectedPillars, setSelectedPillars] = useState<
    Record<string, boolean>
  >({});
  const [selectedKpis, setSelectedKpis] = useState<Record<string, boolean>>({});
  const [selectAllPillars, setSelectAllPillars] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: pillars = [], isLoading, error } = useHodDepartmentPillars();

  useEffect(() => {
    (async () => {
      try {
        const r = await HodKpiService.getDepartmentCoordinators();
        if (r.data) setCoordinators(r.data);
      } catch {
        toast.error("Failed to load coordinators");
      }
    })();
  }, []);

  const handleSelectAllPillars = (checked: boolean) => {
    setSelectAllPillars(checked);
    const newSelectedPillars: Record<string, boolean> = {};
    const newSelectedKpis: Record<string, boolean> = {};
    pillars.forEach((p) => {
      newSelectedPillars[p.id] = checked;
      p.department_kpis.forEach((k) => {
        newSelectedKpis[k.id] = checked;
      });
    });
    setSelectedPillars(newSelectedPillars);
    setSelectedKpis(newSelectedKpis);
  };
  const handlePillarSelect = (pillarId: string, checked: boolean) => {
    setSelectedPillars((prev) => ({ ...prev, [pillarId]: checked }));
    const pillar = pillars.find((p) => p.id === pillarId);
    if (pillar) {
      const newSelectedKpis = { ...selectedKpis };
      pillar.department_kpis.forEach((k) => {
        newSelectedKpis[k.id] = checked;
      });
      setSelectedKpis(newSelectedKpis);
    }
    const allPillarsSelected = pillars.every((p) =>
      p.id === pillarId ? checked : selectedPillars[p.id],
    );
    setSelectAllPillars(allPillarsSelected);
  };
  const handleKpiSelect = (
    kpiId: string,
    checked: boolean,
    pillarId: string,
  ) => {
    setSelectedKpis((prev) => ({ ...prev, [kpiId]: checked }));
    const pillar = pillars.find((p) => p.id === pillarId);
    if (pillar) {
      const allKpisSelected = pillar.department_kpis.every((k) =>
        k.id === kpiId ? checked : selectedKpis[k.id],
      );
      if (selectedPillars[pillarId] !== allKpisSelected)
        setSelectedPillars((prev) => ({
          ...prev,
          [pillarId]: allKpisSelected,
        }));
      const allPillarsSelected = pillars.every((p) =>
        p.department_kpis.every((k) =>
          k.id === kpiId ? checked : selectedKpis[k.id],
        ),
      );
      setSelectAllPillars(allPillarsSelected);
    }
  };
  const handleCoordinatorChange = (value: string) => {
    setSelectedCoordinator(value);
    const coordinator = coordinators.find((c) => c.id === value);
    if (coordinator && coordinator.assigned_kpis.length) {
      const newSelectedKpis: Record<string, boolean> = {};
      const newSelectedPillars: Record<string, boolean> = {};
      coordinator.assigned_kpis.forEach((kpiId) => {
        newSelectedKpis[kpiId] = true;
        pillars.forEach((p) => {
          if (p.department_kpis.some((k) => k.id === kpiId)) {
            const allAssigned = p.department_kpis.every((k) =>
              coordinator.assigned_kpis.includes(k.id),
            );
            newSelectedPillars[p.id] = allAssigned;
          }
        });
      });
      setSelectedKpis(newSelectedKpis);
      setSelectedPillars(newSelectedPillars);
      setSelectAllPillars(pillars.every((p) => newSelectedPillars[p.id]));
    } else {
      setSelectedPillars({});
      setSelectedKpis({});
      setSelectAllPillars(false);
    }
  };
  const handleAssignKpis = async () => {
    if (!selectedCoordinator) return toast.error("Please select a coordinator");
    const kpiIds = Object.entries(selectedKpis)
      .filter(([, v]) => v)
      .map(([id]) => id);
    if (!kpiIds.length)
      return toast.error("Please select at least one KPI to assign");
    setIsSubmitting(true);
    try {
      const request: AssignKpiToCoordinatorRequest = {
        coordinatorId: selectedCoordinator,
        kpiIds,
      };
      const response = await HodKpiService.assignKpisToCoordinator(request);
      if (response.data) {
        toast.success("KPIs assigned successfully");
        setCoordinators((prev) =>
          prev.map((c) =>
            c.id === selectedCoordinator ? { ...c, assigned_kpis: kpiIds } : c,
          ),
        );
      } else toast.error(response.error?.message || "Failed to assign KPIs");
    } catch {
      toast.error("An error occurred while assigning KPIs");
    } finally {
      setIsSubmitting(false);
      setIsDialogOpen(false);
    }
  };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="mr-1 h-3 w-3" /> Approved
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-red-500">
            <XCircle className="mr-1 h-3 w-3" /> Rejected
          </Badge>
        );
      case "OVERDUE":
        return (
          <Badge className="bg-orange-500">
            <Calendar className="mr-1 h-3 w-3" /> Overdue
          </Badge>
        );
      case "REVISION":
        return (
          <Badge className="bg-amber-500">
            <AlertCircle className="mr-1 h-3 w-3" /> Revision
          </Badge>
        );
      default:
        return <Badge className="bg-blue-500">Pending</Badge>;
    }
  };
  if (isLoading)
    return (
      <div className="flex justify-center p-8">Loading pillars and KPIs...</div>
    );
  if (error)
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load pillars and KPIs: {error.message}
        </AlertDescription>
      </Alert>
    );
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Assign KPIs to Coordinators</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <Label htmlFor="coordinator-select" className="mb-2 block">
            Select KPI Coordinator
          </Label>
          <Select
            value={selectedCoordinator}
            onValueChange={handleCoordinatorChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a coordinator" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {coordinators.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.user_name} ({c.user_email})
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        {selectedCoordinator && (
          <>
            <div className="mb-4 flex items-center space-x-2">
              <Checkbox
                id="select-all-pillars"
                checked={selectAllPillars}
                onCheckedChange={(c) => handleSelectAllPillars(!!c)}
              />
              <Label htmlFor="select-all-pillars">
                Select All Pillars and KPIs
              </Label>
            </div>
            <Accordion type="multiple" className="w-full">
              {pillars.map((pillar) => (
                <AccordionItem key={pillar.id} value={pillar.id}>
                  <div className="flex items-center">
                    <Checkbox
                      id={`pillar-${pillar.id}`}
                      className="mr-2"
                      checked={!!selectedPillars[pillar.id]}
                      onCheckedChange={(c) =>
                        handlePillarSelect(pillar.id, !!c)
                      }
                    />
                    <AccordionTrigger className="hover:no-underline">
                      {pillar.pillar_name}
                    </AccordionTrigger>
                  </div>
                  <AccordionContent>
                    <div className="ml-6 space-y-2">
                      {pillar.department_kpis.map((k) => (
                        <div
                          key={k.id}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`kpi-${k.id}`}
                              checked={!!selectedKpis[k.id]}
                              onCheckedChange={(c) =>
                                handleKpiSelect(k.id, !!c, pillar.id)
                              }
                            />
                            <Label
                              htmlFor={`kpi-${k.id}`}
                              className="font-medium"
                            >
                              {k.kpi_number}. {k.kpi_metric_name}
                            </Label>
                          </div>
                          {getStatusBadge(k.kpi_status)}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => setIsDialogOpen(true)}
                disabled={
                  !selectedCoordinator ||
                  Object.values(selectedKpis).every((v) => !v)
                }
              >
                Assign KPIs
              </Button>
            </div>
          </>
        )}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm KPI Assignment</DialogTitle>
              <DialogDescription>
                You are about to assign{" "}
                {Object.values(selectedKpis).filter((v) => v).length} KPIs to
                the selected coordinator. This updates access permissions.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-60 overflow-y-auto">
              {Object.entries(selectedKpis)
                .filter(([, v]) => v)
                .map(([kpiId]) => {
                  let kpiName = "";
                  let pillarName = "";
                  pillars.forEach((p) => {
                    const found = p.department_kpis.find((k) => k.id === kpiId);
                    if (found) {
                      kpiName = `${found.kpi_number}. ${found.kpi_metric_name}`;
                      pillarName = p.pillar_name;
                    }
                  });
                  return (
                    <div key={kpiId} className="mb-1 text-sm">
                      <span className="font-semibold">{pillarName}:</span>{" "}
                      {kpiName}
                    </div>
                  );
                })}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssignKpis} disabled={isSubmitting}>
                {isSubmitting ? "Assigning..." : "Confirm Assignment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default KPIAssignmentSection;
