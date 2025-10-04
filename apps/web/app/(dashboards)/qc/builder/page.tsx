"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PillarTemplateModal } from "@/components/qc/pillar/PillarTemplateModal";
import { PillarGrid } from "@/components/qc/pillar/PillarGrid";
import { SelectedPillarKpis } from "@/components/qc/pillar/SelectedPillarKpis";
import { useGetPillars, useDeletePillar } from "@/queries/qc/pillar";
import { PillarInstance } from "@workspace/types/types";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorDisplay } from "@/components/common/ErrorDisplay";

export default function KpiBuilderPage() {
  const router = useRouter();

  // Fetch pillars from backend
  const { data: pillarTemplates = [], isLoading, error } = useGetPillars();
  const deletePillarMutation = useDeletePillar();

  const [creatingPillar, setCreatingPillar] = useState(false);
  const [selectedPillarTemplate, setSelectedPillarTemplate] =
    useState<PillarInstance | null>(null);
  const [editingPillar, setEditingPillar] = useState<PillarInstance | null>(
    null,
  );

  const handleDelete = (id: string | number) => {
    deletePillarMutation.mutate(String(id), {
      onSuccess: () => {
        // If the deleted pillar was selected, clear the selection
        if (selectedPillarTemplate?.id === String(id)) {
          setSelectedPillarTemplate(null);
        }
      },
    });
  };

  const handleEditPillar = (pillar: PillarInstance) => {
    setEditingPillar(pillar);
    setCreatingPillar(true);
  };

  const handleCreateKpi = (pillar: PillarInstance) => {
    const params = new URLSearchParams({
      pillarId: String(pillar.id),
      pillarName: pillar.pillar_name,
    }).toString();
    router.push(`/qc/builder/create?${params}`);
  };

  return (
    <main className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2">KPI Builder</h1>
        <p className="text-muted-foreground text-lg">
          Create and manage your Key Performance Indicators across different
          pillars
        </p>
      </div>

      <PillarTemplateModal
        open={creatingPillar}
        onOpenChange={(open) => {
          setCreatingPillar(open);
          if (!open) {
            setEditingPillar(null);
          }
        }}
        editingPillar={editingPillar}
        existingPillars={pillarTemplates}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner message="Loading pillars..." size="lg" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-12">
          <ErrorDisplay
            title="Error loading pillars"
            message="Failed to load pillar data"
            error={error}
            onRetry={() => window.location.reload()}
          />
        </div>
      ) : selectedPillarTemplate ? (
        <SelectedPillarKpis
          pillar={selectedPillarTemplate}
          onBack={() => setSelectedPillarTemplate(null)}
          onEditPillar={handleEditPillar}
          onDeletePillar={handleDelete}
          onCreateKpi={handleCreateKpi}
          router={router}
        />
      ) : (
        <PillarGrid
          pillars={pillarTemplates}
          selectedPillar={selectedPillarTemplate}
          onSelectPillar={setSelectedPillarTemplate}
          onEditPillar={handleEditPillar}
          onDeletePillar={handleDelete}
          onCreateKpi={handleCreateKpi}
          onCreatePillar={() => setCreatingPillar(true)}
          deletingPillarId={
            deletePillarMutation.isPending && deletePillarMutation.variables
              ? deletePillarMutation.variables
              : null
          }
        />
      )}
    </main>
  );
}
