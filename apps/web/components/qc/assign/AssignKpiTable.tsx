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

export interface KpiData {
  id: string;
  departmentKpiId?: string; // ID of the DepartmentKpi record for updates
  kpiNo?: number;
  kpi_number?: number;
  kpi_no?: number;
  metric?: string;
  kpi_metric_name: string;
  dataProvidedBy?: string | null;
  data_provided_by?: string | null;
  kpi_description?: string | null;
  kpi_value?: number | null;
  kpi_data?: any;
  kpi_calculated_metrics?: any;
  academic_year?: number;
  percentage_target_achieved?: number | null;
  performance?: number | null;
  kpi_status?: string;
  assigned_date?: string;
  due_date?: string | null;
  completed_date?: string | null;
  comments?: string | null;
  form_responses?: any | null;
  user_ids?: string[];
  assigned_users?: any[];
  isAssigned?: boolean;
}

interface KpiValue {
  weightage: string;
  value: string;
}

interface AssignKpiTableProps {
  assignedKpis: KpiData[];
  unassignedKpis: KpiData[];
  onAssign: (kpi: KpiData, weightage: number) => void;
  onUnassign: (kpi: KpiData) => void;
  onUpdate: (kpi: KpiData, weightage: number) => void;
}

export function AssignKpiTable({
  assignedKpis,
  unassignedKpis,
  onAssign,
  onUnassign,
  onUpdate,
}: AssignKpiTableProps) {
  // Combine all KPIs into one list and track their states
  const allKpis = React.useMemo(() => {
    const assignedIds = new Set(assignedKpis.map((kpi) => kpi.id));
    return [...assignedKpis, ...unassignedKpis]
      .sort((a, b) => {
        const aNum = a.kpiNo ?? a.kpi_number ?? 0;
        const bNum = b.kpiNo ?? b.kpi_number ?? 0;
        return aNum - bNum;
      })
      .map((kpi) => ({
        ...kpi,
        isAssigned: assignedIds.has(kpi.id),
      }));
  }, [assignedKpis, unassignedKpis]);

  const [kpiValues, setKpiValues] = React.useState<Record<string, KpiValue>>(
    {},
  );
  const [totalWeightError, setTotalWeightError] = React.useState(false);

  React.useEffect(() => {
    // Initialize or update values from props
    const newValues: Record<string, KpiValue> = {};
    allKpis.forEach((kpi) => {
      newValues[kpi.id] = {
        weightage: kpi.kpi_value?.toString() ?? "0", // Use existing kpi_value for weightage
        value: "",
      };
    });
    setKpiValues(newValues);
  }, [allKpis]);

  const calculateTotalWeight = (values: Record<string, KpiValue>): number => {
    return Object.values(values).reduce((sum, kpiValue) => {
      const weight = parseFloat(kpiValue.weightage) || 0;
      return sum + weight;
    }, 0);
  };

  const handleValueChange = (kpiId: string, newValue: KpiValue) => {
    setKpiValues((prev) => {
      const updated = {
        ...prev,
        [kpiId]: newValue,
      };

      // Check if total weight exceeds 1
      const totalWeight = calculateTotalWeight(updated);
      setTotalWeightError(totalWeight > 1);

      return updated;
    });
  };

  return (
    <Card className="p-4">
      <Table className="min-w-full table-fixed border-separate border-spacing-0">
        <TableHeader>
          <TableRow>
            <TableHead className="text-center align-middle w-24">
              KPI Number
            </TableHead>
            <TableHead className="text-left align-middle w-96">
              Metric
            </TableHead>
            <TableHead className="text-center align-middle w-40">
              Data Provided By
            </TableHead>
            <TableHead className="text-center align-middle w-32">
              Weightage
            </TableHead>
            <TableHead className="text-center align-middle w-32">
              Target
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
                <div
                  className="truncate max-w-[24rem]"
                  title={kpi.metric ?? kpi.kpi_metric_name ?? "-"}
                >
                  {kpi.metric ?? kpi.kpi_metric_name ?? "-"}
                </div>
              </TableCell>
              <TableCell className="text-center align-middle">
                {kpi.dataProvidedBy ?? kpi.data_provided_by ?? "-"}
              </TableCell>
              <TableCell className="text-center align-middle">
                <div className="flex flex-col items-center">
                  <Input
                    type="number"
                    className="w-24 text-center"
                    value={kpiValues[kpi.id]?.weightage ?? "0"}
                    onChange={(e) => {
                      const value = e.target.value;
                      const numValue = parseFloat(value);
                      if (
                        (value === "" || (numValue >= 0 && numValue <= 1)) &&
                        /^\d*\.?\d*$/.test(value)
                      ) {
                        const currentValue = kpiValues[kpi.id]?.value ?? "";
                        handleValueChange(kpi.id, {
                          weightage: value,
                          value: currentValue,
                        });
                      }
                    }}
                    onBlur={(e) => {
                      // Only trigger update for KPIs that are already assigned
                      if (kpi.isAssigned) {
                        const newWeightage = parseFloat(e.target.value);
                        const originalWeightage = kpi.kpi_value;

                        // Check if the value is a valid number and has actually changed
                        if (
                          !isNaN(newWeightage) &&
                          newWeightage !== originalWeightage
                        ) {
                          onUpdate(kpi, newWeightage);
                        }
                      }
                    }}
                    min="0"
                    max="1"
                    step="0.01"
                  />
                  {kpiValues[kpi.id]?.weightage &&
                    (parseFloat(kpiValues[kpi.id]?.weightage ?? "0") < 0 ||
                      parseFloat(kpiValues[kpi.id]?.weightage ?? "0") > 1) && (
                      <span className="text-red-500 text-xs mt-1">
                        Must be between 0-1
                      </span>
                    )}
                </div>
              </TableCell>
              <TableCell className="text-center align-middle">
                <Input
                  className="w-24 text-center"
                  value={kpiValues[kpi.id]?.value ?? ""}
                  onChange={(e) => {
                    const currentWeightage =
                      kpiValues[kpi.id]?.weightage ?? "0";
                    handleValueChange(kpi.id, {
                      weightage: currentWeightage,
                      value: e.target.value,
                    });
                  }}
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
                    onClick={() => {
                      const weightageValue = parseFloat(
                        kpiValues[kpi.id]?.weightage ?? "0",
                      );
                      if (!isNaN(weightageValue) && !totalWeightError) {
                        onAssign(kpi, weightageValue);
                      }
                    }}
                    disabled={totalWeightError}
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
            <td />
            <td />
            <td className="font-bold text-right">Total Weightage:</td>
            <td className="font-bold text-center">
              {calculateTotalWeight(kpiValues).toFixed(2)}
              {totalWeightError && (
                <div className="text-red-500 text-xs">
                  Total weight cannot exceed 1
                </div>
              )}
            </td>
            <td />
            <td />
          </tr>
        </tfoot>
      </Table>
    </Card>
  );
}
