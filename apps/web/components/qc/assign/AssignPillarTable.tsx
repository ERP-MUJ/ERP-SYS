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
import React from "react";

interface PillarData {
  id: string;
  pillar_name: string;
  pillar_weight?: number | null;
  pillar_target?: number | null;
  departmentPillarId?: string;
}

interface AssignPillarTableProps {
  assignedPillars: PillarData[];
  unassignedPillars: PillarData[];
  onAssign: (pillar: any) => void;
  onUnassign: (pillar: PillarData) => void;
  onUpdate: (pillar: PillarData, weight?: number, target?: number) => void;
  onView: (pillarId: string) => void;
}

export function AssignPillarTable({
  assignedPillars,
  unassignedPillars,
  onAssign,
  onUnassign,
  onUpdate,
  onView,
}: AssignPillarTableProps) {
  const [pillarWeights, setPillarWeights] = React.useState<
    Record<string, string>
  >({});
  const [pillarTargets, setPillarTargets] = React.useState<
    Record<string, string>
  >({});
  const [totalWeightError, setTotalWeightError] = React.useState(false);

  React.useEffect(() => {
    const initialWeights: Record<string, string> = {};
    const initialTargets: Record<string, string> = {};
    [...assignedPillars, ...unassignedPillars].forEach((p) => {
      initialWeights[p.id] = p.pillar_weight?.toString() ?? "0";
      initialTargets[p.id] = p.pillar_target?.toString() ?? "";
    });
    setPillarWeights(initialWeights);
    setPillarTargets(initialTargets);
  }, [assignedPillars, unassignedPillars]);

  const handleWeightChange = (pillarId: string, newValue: string) => {
    setPillarWeights((prev) => {
      const updated = { ...prev, [pillarId]: newValue };
      const totalWeight = [...assignedPillars, ...unassignedPillars].reduce(
        (sum, pillar) =>
          sum + Number(updated[pillar.id] || pillar.pillar_weight || 0),
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

  const totalAssignedWeight = assignedPillars.reduce(
    (sum, pillar) =>
      sum + Number(pillarWeights[pillar.id] ?? pillar.pillar_weight ?? 0),
    0,
  );

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
            <TableHead className="text-center align-middle w-32">
              Action
            </TableHead>
            <TableHead className="text-center align-middle w-32">
              View
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignedPillars.map((pillar) => (
            <TableRow key={pillar.id}>
              <TableCell className="text-left align-middle">
                {pillar.pillar_name}
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
                    if (
                      !isNaN(newWeight) &&
                      newWeight !== pillar.pillar_weight
                    ) {
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
                  onChange={(e) => handleTargetChange(pillar.id, e.target.value)}
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
                <Button
                  size="sm"
                  variant="destructive"
                  className="text-xs px-2 py-1"
                  onClick={() => onUnassign(pillar)}
                >
                  Unassign
                </Button>
              </TableCell>
              <TableCell className="text-center align-middle">
                <Button
                  size="sm"
                  variant="default"
                  className="text-xs px-2 py-1"
                  onClick={() => onView(pillar.id)}
                >
                  View KPIs
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {unassignedPillars.map((pillar) => (
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
                  onChange={(e) => handleTargetChange(pillar.id, e.target.value)}
                  min="0"
                  step="1"
                />
              </TableCell>
              <TableCell className="text-center align-middle">
                <Button
                  size="sm"
                  variant="default"
                  className="text-xs px-2 py-1"
                  onClick={() =>
                    onAssign({
                      ...pillar,
                      weightA: parseFloat(pillarWeights[pillar.id] ?? "0"),
                      target: parseFloat(pillarTargets[pillar.id] ?? "0"),
                    })
                  }
                >
                  Assign
                </Button>
              </TableCell>
              <TableCell className="text-center align-middle">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs px-2 py-1"
                  disabled
                >
                  View KPIs
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <tfoot>
          {assignedPillars.length > 0 && (
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
    </Card>
  );
}
