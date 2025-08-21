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

interface AssignKpiTableProps {
  assignedKpis: any[];
  unassignedKpis: any[];
  onAssign: (kpi: any) => void;
  onUnassign: (kpi: any) => void;
}

export function AssignKpiTable({
  assignedKpis,
  unassignedKpis,
  onAssign,
  onUnassign,
}: AssignKpiTableProps) {
  // Combine all KPIs into one list and track their states
  const allKpis = React.useMemo(() => {
    const assignedIds = new Set(assignedKpis.map((kpi) => kpi.id));
    return [...assignedKpis, ...unassignedKpis]
      .sort((a, b) => (a.kpiNo ?? a.kpi_number) - (b.kpiNo ?? b.kpi_number))
      .map((kpi) => ({
        ...kpi,
        isAssigned: assignedIds.has(kpi.id),
      }));
  }, [assignedKpis, unassignedKpis]);

  const [kpiValues, setKpiValues] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    // Initialize or update values from props
    const newValues: Record<string, string> = {};
    allKpis.forEach((kpi) => {
      newValues[kpi.id] = kpi.value ?? "";
    });
    setKpiValues(newValues);
  }, [allKpis]);

  const handleValueChange = (kpiId: string, newValue: string) => {
    setKpiValues((prev) => ({
      ...prev,
      [kpiId]: newValue,
    }));
  };

  return (
    <Card className="p-4">
      <Table className="min-w-full table-fixed border-separate border-spacing-0">
        <TableHeader>
          <TableRow>
            <TableHead className="text-center align-middle w-24">
              KPI Number
            </TableHead>
            <TableHead className="text-left align-middle w-56">
              Metric
            </TableHead>
            <TableHead className="text-center align-middle w-40">
              Data Provided By
            </TableHead>
            <TableHead className="text-center align-middle w-32">
              Target
            </TableHead>
            <TableHead className="text-center align-middle w-32">
              Value
            </TableHead>
            <TableHead className="text-center align-middle w-32">
              Status
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allKpis.map((kpi) => (
            <TableRow key={kpi.id}>
              <TableCell className="text-center align-middle">
                {kpi.kpiNo ?? kpi.kpi_number ?? kpi.kpi_no ?? "-"}
              </TableCell>
              <TableCell className="text-left align-middle">
                {kpi.metric ?? kpi.kpi_metric_name ?? "-"}
              </TableCell>
              <TableCell className="text-center align-middle">
                {kpi.dataProvidedBy ?? kpi.data_provided_by ?? "-"}
              </TableCell>
              <TableCell className="text-center align-middle">
                {kpi.target2025 ?? kpi.kpi_value ?? kpi.target ?? "-"}
              </TableCell>
              <TableCell className="text-center align-middle">
                <Input
                  className="w-24 text-center"
                  value={kpiValues[kpi.id] ?? ""}
                  onChange={(e) => handleValueChange(kpi.id, e.target.value)}
                />
              </TableCell>
              <TableCell className="text-center align-middle">
                {kpi.isAssigned ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="text-xs px-2 py-1"
                    onClick={() => onUnassign(kpi)}
                  >
                    Unassign
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="default"
                    className="text-xs px-2 py-1"
                    onClick={() => onAssign(kpi)}
                  >
                    Assign
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <tfoot>
          <tr>
            <td colSpan={4} className="font-bold text-right">
              Total Value
            </td>
            <td className="font-bold text-center">
              {Object.values(kpiValues).reduce(
                (sum, value) => sum + (Number(value) || 0),
                0,
              )}
            </td>
            <td />
          </tr>
        </tfoot>
      </Table>
    </Card>
  );
}
