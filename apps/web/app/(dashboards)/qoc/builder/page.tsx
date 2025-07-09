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
import { PillarCard } from "@/components/qoc/pillar-card";
import { KpiCard } from "@/components/qoc/kpi-card";

// TODO: Implement these hooks and APIs
// import { useFetchPillarTemplates, useCreatePillarTemplate } from "@/hooks/pillarTemplates";
// import { useFetchKpiTemplates, useCreateKpiTemplate } from "@/hooks/kpiTemplates";

export default function KpiBuilderPage() {
  const router = useRouter();
  // TODO: Remove dummy data when API is implemented.
  const [pillarTemplates, setPillarTemplates] = useState<any[]>([
    {
      id: "pillar-1",
      pillar_name: "Academic Excellence",
      description: "Focus on academic achievements",
    },
    {
      id: "pillar-2",
      pillar_name: "Research & Innovation",
      description: "Promote research culture",
    },
  ]);
  const [selectedPillarTemplate, setSelectedPillarTemplate] = useState<
    any | null
  >(null);
  const [creatingPillar, setCreatingPillar] = useState(false);
  const [newPillarName, setNewPillarName] = useState("");
  // TODO: Remove dummy data when API is implemented.
  const [kpiTemplates, setKpiTemplates] = useState<any[]>([
    {
      id: "kpi-1",
      kpi_name: "Student Awards",
      kpi_description: "Number of awards won by students",
      pillarId: "pillar-1",
    },
    {
      id: "kpi-2",
      kpi_name: "Research Papers",
      kpi_description: "Number of research papers published",
      pillarId: "pillar-2",
    },
  ]);

  // TODO: Remove dummy handler when API is implemented.
  const handleCreatePillar = () => {
    if (!newPillarName.trim()) {
      toast.error("Pillar name cannot be empty");
      return;
    }
    setPillarTemplates((prev) => [
      ...prev,
      {
        id: `pillar-${Date.now()}`,
        pillar_name: newPillarName,
        description: "Newly created pillar (dummy)",
      },
    ]);
    toast.success("Pillar template created (dummy)");
    setCreatingPillar(false);
    setNewPillarName("");
  };

  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">KPI Builder</h1>
      {/* Pillar Template List and Create */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <h2 className="text-xl font-semibold">Pillar Templates</h2>
          <Button variant="outline" onClick={() => setCreatingPillar(true)}>
            + Create Pillar Template
          </Button>
        </div>
        {creatingPillar && (
          <div className="flex items-center gap-2 mb-4">
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
        {/* List of pillar templates (replace with real data) */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pillarTemplates.length === 0 ? (
            <p>No pillar templates found. Create one to get started.</p>
          ) : (
            pillarTemplates.map((pillar) => (
              <PillarCard
                key={pillar.id}
                pillarName={pillar.pillar_name}
                description={pillar.description}
                selected={selectedPillarTemplate?.id === pillar.id}
                onView={() => setSelectedPillarTemplate(pillar)}
              />
            ))
          )}
        </div>
      </div>

      {/* KPI Templates for Selected Pillar */}
      {selectedPillarTemplate && (
        <div>
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-xl font-semibold">
              KPI Templates for "{selectedPillarTemplate.pillar_name}"
            </h2>
            {/* Route to the KPI template creation page using FormBuilder */}
            <Button
              onClick={() =>
                router.push(
                  `/qoc/builder/create?kpiPillarTemplateId=${selectedPillarTemplate.id}`,
                )
              }
            >
              + Create KPI Template
            </Button>
          </div>
          {/* List of KPI templates (replace with real data) */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {kpiTemplates.filter(
              (k) => k.pillarId === selectedPillarTemplate.id,
            ).length === 0 ? (
              <p>
                No KPI templates found for this pillar. Create one to get
                started.
              </p>
            ) : (
              kpiTemplates
                .filter((k) => k.pillarId === selectedPillarTemplate.id)
                .map((kpi) => (
                  <KpiCard
                    key={kpi.id}
                    kpiName={kpi.kpi_name}
                    description={kpi.kpi_description}
                    onView={() => router.push(`/qoc/builder/form/${kpi.id}`)}
                    onEdit={() => router.push(`/qoc/builder/form/${kpi.id}`)}
                    onDelete={() => {
                      /* TODO: Delete KPI template API */
                    }}
                  />
                ))
            )}
          </div>
        </div>
      )}
    </main>
  );
}
