import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@workspace/ui/components/table";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import React, { useState } from "react";
import { DeleteConfirmationModal } from "@/components/qc/delete-confirmation";
import { Trash2 } from "lucide-react";
import { PillarData } from "@/lib/types/qc-assignment";

interface AssignPillarTableProps {
  assignedPillars: PillarData[];
  unassignedPillars: PillarData[];
  onAssign: (pillar: any) => void;
  onUnassign: (pillar: PillarData) => void;
  onUpdate: (pillar: PillarData, weight?: number, target?: number) => void;
  onView: (pillarId: string) => void;
  onDelete?: (pillar: PillarData) => void;
  mode?: "assigned" | "available" | "combined" | "archived";
}

export function AssignPillarTable({
  assignedPillars,
  unassignedPillars,
  onAssign,
  onUnassign,
  onUpdate,
  onView,
  onDelete,
  mode = "combined",
}: AssignPillarTableProps) {
  const [pillarWeights, setPillarWeights] = React.useState<
    Record<string, string>
  >({});
  const [pillarTargets, setPillarTargets] = React.useState<
    Record<string, string>
  >({});
  const [totalWeightError, setTotalWeightError] = React.useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    pillar: PillarData | null;
  }>({
    isOpen: false,
    pillar: null,
  });

  React.useEffect(() => {
    const initialWeights: Record<string, string> = {};
    const initialTargets: Record<string, string> = {};
    [...assignedPillars, ...unassignedPillars].forEach((p) => {
      // For assigned pillars, use pillar_weight; for unassigned (templates), use pillar_value
      const weight = p.departmentPillarId ? p.pillar_weight : p.pillar_value;
      initialWeights[p.id] = weight?.toString() ?? "0";
      initialTargets[p.id] = p.pillar_target?.toString() ?? "";
    });
    setPillarWeights(initialWeights);
    setPillarTargets(initialTargets);
  }, [assignedPillars, unassignedPillars]);

  const handleWeightChange = (pillarId: string, newValue: string) => {
    setPillarWeights((prev) => {
      const updated = { ...prev, [pillarId]: newValue };
      const totalWeight = [...assignedPillars, ...unassignedPillars].reduce(
        (sum, pillar) => {
          const currentWeight = updated[pillar.id];
          const fallbackWeight = pillar.departmentPillarId
            ? pillar.pillar_weight
            : pillar.pillar_value;
          return sum + Number(currentWeight || fallbackWeight || 0);
        },
        0,
      );
      setTotalWeightError(totalWeight > 1);
      return updated;
    });
  };

  const handleTargetChange = (pillarId: string, newValue: string) => {
    setPillarTargets((prev) => ({
      ...prev,
      [pillarId]: newValue,
    }));
  };

  const totalAssignedWeight = assignedPillars.reduce((sum, pillar) => {
    const currentWeight = pillarWeights[pillar.id];
    const fallbackWeight = pillar.departmentPillarId
      ? pillar.pillar_weight
      : pillar.pillar_value;
    return sum + Number(currentWeight ?? fallbackWeight ?? 0);
  }, 0);

  const handleDeleteClick = (pillar: PillarData) => {
    setDeleteConfirmation({
      isOpen: true,
      pillar,
    });
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmation.pillar && onDelete) {
      onDelete(deleteConfirmation.pillar);
      setDeleteConfirmation({ isOpen: false, pillar: null });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmation({ isOpen: false, pillar: null });
  };

  return (
    <Card className="p-4">
      <Table className="min-w-full table-fixed border-separate border-spacing-0">
        <TableHeader>
          <TableRow>
            <TableHead className="text-left align-middle w-1/2">
              Pillar Name
            </TableHead>
            <TableHead className="text-left align-middle pl-10 w-32">
              Weight
            </TableHead>
            <TableHead className="text-left align-middle pl-10 w-32">
              Target
            </TableHead>
            <TableHead className="text-center align-middle w-40">
              Actions
            </TableHead>
            <TableHead className="text-center align-middle w-32">
              View
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(mode === "assigned" ||
            mode === "combined" ||
            mode === "archived") &&
            assignedPillars.map((pillar) => (
              <TableRow key={pillar.id}>
                <TableCell className="text-left align-middle">
                  <div className="flex items-center gap-2">
                    {pillar.pillar_name}
                    {pillar.isOrphaned && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                        Template Deleted
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-left align-middle pl-4">
                  <Input
                    type="number"
                    className="w-24 text-cent"
                    value={pillarWeights[pillar.id] ?? ""}
                    onChange={(e) =>
                      handleWeightChange(pillar.id, e.target.value)
                    }
                    onBlur={(e) => {
                      const newWeight = parseFloat(e.target.value);
                      const originalWeight = pillar.departmentPillarId
                        ? pillar.pillar_weight
                        : pillar.pillar_value;
                      if (!isNaN(newWeight) && newWeight !== originalWeight) {
                        onUpdate(pillar, newWeight, undefined);
                      }
                    }}
                    min="0"
                    max="1"
                    step="0.01"
                  />
                </TableCell>
                <TableCell className="text-left align-middle pl-4">
                  <Input
                    type="number"
                    className="w-24 text-cent"
                    value={pillarTargets[pillar.id] ?? ""}
                    onChange={(e) =>
                      handleTargetChange(pillar.id, e.target.value)
                    }
                    onBlur={(e) => {
                      if (pillar.departmentPillarId) {
                        const newTarget = parseFloat(e.target.value);
                        const currentTarget = pillar.pillar_target;
                        if (!isNaN(newTarget) && newTarget !== currentTarget) {
                          onUpdate(pillar, undefined, newTarget);
                        }
                      }
                    }}
                    min="0"
                    step="1"
                  />
                </TableCell>
                <TableCell className="text-center align-middle">
                  <div className="flex gap-1 justify-center">
                    {mode === "archived" ? (
                      <Button
                        size="sm"
                        variant="default"
                        className="text-xs px-2 py-1 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => onUnassign(pillar)}
                        title="Restore this archived pillar"
                      >
                        Restore
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="text-xs px-2 py-1"
                          onClick={() => onUnassign(pillar)}
                        >
                          Unassign
                        </Button>
                        {pillar.isOrphaned &&
                          onDelete &&
                          (mode === "assigned" || mode === "combined") && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs px-2 py-1 border-red-300 text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteClick(pillar)}
                              title="Archive this orphaned pillar"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center align-middle">
                  <Button
                    size="sm"
                    variant="default"
                    className="text-xs px-2 py-1"
                    onClick={() => onView(pillar.id)}
                    title="View KPIs"
                  >
                    View KPIs
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          {(mode === "available" || mode === "combined") &&
            unassignedPillars.map((pillar) => (
              <TableRow key={pillar.id}>
                <TableCell className="text-left align-middle">
                  {pillar.pillar_name}
                </TableCell>
                <TableCell className="text-left align-middle pl-4">
                  <Input
                    type="number"
                    className="w-24"
                    value={pillarWeights[pillar.id] ?? ""}
                    onChange={(e) =>
                      handleWeightChange(pillar.id, e.target.value)
                    }
                  />
                </TableCell>
                <TableCell className="text-left align-middle pl-4">
                  <Input
                    type="number"
                    className="w-24"
                    value={pillarTargets[pillar.id] ?? ""}
                    onChange={(e) =>
                      handleTargetChange(pillar.id, e.target.value)
                    }
                    min="0"
                    step="1"
                  />
                </TableCell>
                <TableCell className="text-center align-middle">
                  <Button
                    size="sm"
                    variant="default"
                    className="text-xs px-2 py-1"
                    onClick={() => {
                      const currentWeight =
                        pillarWeights[pillar.id] ??
                        (pillar.pillar_value?.toString() || "0");
                      const currentTarget = pillarTargets[pillar.id] ?? "0";
                      onAssign({
                        ...pillar,
                        weightA: parseFloat(currentWeight),
                        target: parseFloat(currentTarget),
                      });
                    }}
                  >
                    Assign
                  </Button>
                </TableCell>
                <TableCell className="text-center align-middle">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs px-2 py-1"
                    onClick={() => onView(pillar.id)}
                    title="Preview KPIs in this template"
                  >
                    View KPIs
                  </Button>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
        <tfoot>
          {assignedPillars.length > 0 &&
            (mode === "assigned" || mode === "combined") && (
              <tr>
                <td className="font-bold text-right pr-4" colSpan={1}>
                  Total Weight:
                </td>
                <td className="font-bold text-left pl-10">
                  {totalAssignedWeight.toFixed(2)}
                  {totalWeightError && (
                    <div className="text-red-500 text-xs">
                      Total weight cannot exceed 1
                    </div>
                  )}
                </td>
                <td />
                <td />
                <td />
              </tr>
            )}
        </tfoot>
      </Table>

      <DeleteConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        itemName={deleteConfirmation.pillar?.pillar_name || ""}
        itemType="Pillar"
        title={
          deleteConfirmation.pillar?.isOrphaned
            ? "Archive Orphaned Pillar"
            : "Delete Pillar"
        }
        description={
          deleteConfirmation.pillar?.isOrphaned
            ? "This will archive the orphaned pillar and preserve all historical data. You can restore it later if needed. The pillar will be hidden from the active view but data will remain safe."
            : "This will permanently remove the pillar and all its associated KPI data from the department. This action cannot be undone."
        }
      />
    </Card>
  );
}
