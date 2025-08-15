import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableFooter,
} from "@workspace/ui/components/table";
import { Button } from "@workspace/ui/components/button";
import { StatusBadge } from "@/components/common/StatusBadge";

export type ReadOnlyKpi = {
  kpi_no: number;
  metric: string;
  dataProvidedBy: string;
  target: string;
  actual: string | number;
  percentAchieved: string | number;
  value?: string | number;
  status?: string;
  kpiId?: string;
};

export interface ReadOnlyKpiTableProps {
  kpis: ReadOnlyKpi[];
  onOpenKpi?: (kpiId: string) => void;
  showStatusColumn?: boolean;
  title?: string;
}

// Helper function to map KPI status to StatusBadge status type
const mapKpiStatusToStatusBadgeType = (
  kpiStatus?: string,
):
  | "pending"
  | "approved"
  | "rejected"
  | "active"
  | "inactive"
  | "revision"
  | "overdue"
  | "waiting"
  | "draft" => {
  if (!kpiStatus) return "inactive";
  const normalized = kpiStatus.toLowerCase();
  if (normalized === "approved") return "approved";
  if (
    normalized === "revision requested" ||
    normalized === "needs revision" ||
    normalized === "redo"
  )
    return "revision";
  if (normalized === "rejected") return "rejected";
  if (normalized === "overdue") return "overdue";
  if (
    normalized === "awaiting approval" ||
    normalized === "waiting for qc" ||
    normalized === "waiting" ||
    normalized === "pending review"
  )
    return "waiting";
  if (
    normalized === "draft" ||
    normalized === "draft (not submitted)" ||
    normalized === "to be submitted"
  )
    return "draft";
  if (normalized === "active") return "active";
  if (normalized === "pending") return "pending";
  return "pending";
};

export const ReadOnlyKpiTable: React.FC<ReadOnlyKpiTableProps> = ({
  kpis = [],
  onOpenKpi,
  showStatusColumn = true,
  title = "KPI Overview",
}) => {
  // Helper to sum the value field (read-only display)
  const totalValue = kpis.reduce((sum, row) => sum + Number(row.value ?? 0), 0);

  return (
    <Card className="shadow-md px-2 border rounded-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="bg-muted/50 text-xs font-semibold uppercase">
                KPI No
              </TableHead>
              <TableHead className="bg-muted/50 text-xs font-semibold uppercase">
                Metric
              </TableHead>
              <TableHead className="bg-muted/50 text-xs font-semibold uppercase">
                Data Provided By
              </TableHead>
              <TableHead className="bg-muted/50 text-xs font-semibold uppercase">
                Target
              </TableHead>
              <TableHead className="bg-muted/50 text-xs font-semibold uppercase">
                Actual
              </TableHead>
              <TableHead className="bg-muted/50 text-xs font-semibold uppercase">
                % Target Achieved
              </TableHead>
              <TableHead className="bg-muted/50 text-xs font-semibold uppercase">
                Value
              </TableHead>
              {showStatusColumn && (
                <TableHead className="bg-muted/50 text-xs font-semibold uppercase">
                  Status
                </TableHead>
              )}
              <TableHead className="bg-muted/50 text-xs font-semibold uppercase">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {kpis.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={showStatusColumn ? 9 : 8}
                  className="text-center py-8 text-muted-foreground"
                >
                  No KPIs found for this pillar
                </TableCell>
              </TableRow>
            ) : (
              kpis.map((row, rowIndex) => (
                <TableRow
                  key={row.kpiId ?? row.kpi_no}
                  className={rowIndex % 2 === 1 ? "bg-muted/20" : ""}
                >
                  <TableCell className="text-center font-medium">
                    {row.kpi_no}
                  </TableCell>
                  <TableCell className="font-medium">{row.metric}</TableCell>
                  <TableCell className="text-center">
                    {row.dataProvidedBy}
                  </TableCell>
                  <TableCell className="text-center">{row.target}</TableCell>
                  <TableCell className="text-center">{row.actual}</TableCell>
                  <TableCell className="text-center">
                    {row.percentAchieved}
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {row.value ?? "0"}
                  </TableCell>
                  {showStatusColumn && (
                    <TableCell className="text-center">
                      {row.status ? (
                        <StatusBadge
                          status={mapKpiStatusToStatusBadgeType(row.status)}
                          label={row.status.replace(/\b\w/g, (c) =>
                            c.toUpperCase(),
                          )}
                        />
                      ) : (
                        <StatusBadge status="inactive" label="Unknown" />
                      )}
                    </TableCell>
                  )}
                  <TableCell className="text-center">
                    {onOpenKpi && row.kpiId ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOpenKpi(row.kpiId!)}
                        className="text-xs"
                      >
                        Open KPI
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-xs">N/A</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              {/* Empty cells before Value column */}
              <TableCell colSpan={6} className="font-bold text-right">
                Total Value:
              </TableCell>
              <TableCell className="font-bold text-center">
                {totalValue}
              </TableCell>
              {showStatusColumn && <TableCell />}
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
};
