"use client";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { useFetchForms, useDeleteKpi } from "@/hooks/forms";
import { useState } from "react";
import { Badge } from "@workspace/ui/components/badge";
import {
  useFetchPillars,
  useCreatePillar,
  useFetchDepartments,
  useAssignKpiToPillar,
  useFetchAssignedKpis,
} from "@/hooks/dept";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { FormConfig } from "@/lib/types";

export default function KpiBuilderPage() {
  const { data: departments } = useFetchDepartments();
  const { mutate: createPillar } = useCreatePillar();
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    string | null
  >(null);
  const [selectedPillarId, setSelectedPillarId] = useState<string | null>(null);
  const [creatingPillar, setCreatingPillar] = useState(false);
  const [newPillarName, setNewPillarName] = useState("");
  const { mutate: deleteKpi } = useDeleteKpi();
  const router = useRouter();
  const [deletingFormId, setDeletingFormId] = useState<string | null>(null);
  const [formToDelete, setFormToDelete] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const assignKpiMutation = useAssignKpiToPillar();
  const [assigningKpiId, setAssigningKpiId] = useState<string | null>(null);

  // Get pillars for selected department
  const pillars =
    departments?.find((d) => d.id.toString() === selectedDepartmentId)
      ?.pillars || [];

  // Fetch assigned KPIs for the selected pillar
  const { data: assignedKpisData, isLoading: isLoadingAssigned } =
    useFetchAssignedKpis(
      selectedDepartmentId ?? undefined,
      selectedPillarId ?? undefined,
    );
  const assignedKpis: any[] = assignedKpisData?.assignedKpis || [];

  // Fetch all KPIs
  type KpiWithId = FormConfig & { kpi_id?: number };
  const { data: allKpisRaw, isLoading: isLoadingAllKpis } = useFetchForms();
  const allKpis: KpiWithId[] = allKpisRaw || [];

  // Filter available KPIs (not already assigned)
  const assignedKpiIds = new Set(
    assignedKpis.map(
      (kpi: any) => kpi.kpi_id?.toString() || kpi.id?.toString(),
    ),
  );
  const availableKpis = allKpis.filter(
    (kpi: KpiWithId) => !assignedKpiIds.has(kpi.id?.toString()),
  );

  const handleCreatePillar = () => {
    if (!newPillarName.trim()) {
      toast.error("Pillar name cannot be empty");
      return;
    }
    if (!selectedDepartmentId) {
      toast.error("Please select a department first");
      return;
    }
    createPillar(
      { pillar_name: newPillarName, department_id: selectedDepartmentId },
      {
        onSuccess: () => {
          toast.success("Pillar created");
          setCreatingPillar(false);
          setNewPillarName("");
          queryClient.invalidateQueries({ queryKey: ["depts"] });
        },
        onError: () => {
          toast.error("Failed to create pillar");
        },
      },
    );
  };

  const handleDelete = (formId: string) => {
    const numericId = formId.startsWith("form-")
      ? formId.split("-")[1]!
      : formId;
    setDeletingFormId(formId);
    deleteKpi(numericId, {
      onSuccess: () => setDeletingFormId(null),
      onError: () => setDeletingFormId(null),
    });
  };

  const openDeleteDialog = (formId: string) => {
    setFormToDelete(formId);
    setOpen(true);
  };

  const handleConfirmDelete = () => {
    if (formToDelete) {
      handleDelete(formToDelete);
      setOpen(false);
      setFormToDelete(null);
    }
  };

  const handleAssignKpi = (kpiId: string) => {
    if (!selectedDepartmentId || !selectedPillarId) return;
    const kpi = allKpis.find((k: KpiWithId) => k.id === kpiId);
    if (!kpi || typeof kpi.kpi_id !== "number") {
      toast.error("KPI ID not found. Cannot assign.");
      return;
    }
    setAssigningKpiId(kpiId);
    assignKpiMutation.mutate(
      {
        departmentId: selectedDepartmentId,
        pillarId: selectedPillarId,
        kpiIds: [kpi.kpi_id],
      },
      {
        onSettled: () => setAssigningKpiId(null),
      },
    );
  };

  return (
    <main className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Your KPI&apos;s</h1>
          <p className="text-gray-600 mt-2">
            Manage and edit your created KPI&apos;s
          </p>
        </div>
        <Link href="/qoc/builder/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create KPI
          </Button>
        )}
        {creatingPillar && (
          <div className="flex items-center gap-2">
            <input
              className="border rounded px-2 py-1"
              placeholder="New pillar name"
              value={newPillarName}
              onChange={(e) => setNewPillarName(e.target.value)}
            />
            <Button size="sm" onClick={handleCreatePillar}>
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCreatingPillar(false)}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* KPI Section (only after pillar is selected) */}
      {selectedPillarId && (
        <>
          {/* Assigned KPIs */}
          <h2 className="text-xl font-semibold mb-2">Assigned KPIs</h2>
          <div className="flex justify-end mb-4">
            <Button
              onClick={() =>
                router.push(
                  `/qoc/builder/create?departmentId=${selectedDepartmentId}&pillarId=${selectedPillarId}`,
                )
              }
              disabled={!selectedDepartmentId || !selectedPillarId}
            >
              + Create KPI
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {isLoadingAssigned ? (
              <p>Loading...</p>
            ) : assignedKpis.length === 0 ? (
              <p>No KPIs assigned to this pillar.</p>
            ) : (
              assignedKpis.map((kpi: any) => (
                <Card key={kpi.kpi_id ? kpi.kpi_id.toString() : kpi.id}>
                  <CardHeader>
                    <CardTitle>{kpi.kpi_name || kpi.title}</CardTitle>
                    <CardDescription>
                      Created on{" "}
                      {kpi.createdAt
                        ? new Date(kpi.createdAt).toLocaleDateString()
                        : "-"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      {kpi.elements?.length || 0} Fields
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {kpi.description || kpi.kpi_description}
                    </p>
                    <p className="text-sm">
                      Value: {kpi.value ?? kpi.kpi_value ?? "-"}
                    </p>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        router.push(`/qoc/builder/form/${kpi.kpi_id || kpi.id}`)
                      }
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        router.push(`/qoc/builder/form/${kpi.kpi_id || kpi.id}`)
                      }
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => openDeleteDialog(kpi.kpi_id || kpi.id)}
                    >
                      Delete
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>

          {/* Assignable KPIs */}
          <h2 className="text-xl font-semibold mt-8 mb-2">Assign New KPI</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {isLoadingAllKpis ? (
              <p>Loading...</p>
            ) : availableKpis.length === 0 ? (
              <p>No available KPIs to assign.</p>
            ) : (
              availableKpis.map((kpi: KpiWithId) => (
                <Card
                  key={
                    typeof kpi.id === "string"
                      ? kpi.id
                      : kpi.kpi_id
                        ? kpi.kpi_id.toString()
                        : ""
                  }
                >
                  <CardHeader>
                    <CardTitle>{kpi.title}</CardTitle>
                    <CardDescription>
                      Created on {new Date(kpi.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{kpi.elements.length} Fields</p>
                    <p className="text-sm text-gray-500 truncate">
                      {kpi.description}
                    </p>
                    <p className="text-sm">Value: {kpi.value ?? "-"}</p>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/qoc/builder/form/${kpi.id}`)}
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/qoc/builder/form/${kpi.id}`)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => openDeleteDialog(kpi.id)}
                    >
                      Delete
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleAssignKpi(kpi.id)}
                      disabled={assigningKpiId === kpi.id}
                    >
                      {assigningKpiId === kpi.id ? "Assigning..." : "Assign"}
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </>
      )}

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              created KPI.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              {formToDelete && deletingFormId === formToDelete
                ? "Deleting..."
                : "Confirm"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
