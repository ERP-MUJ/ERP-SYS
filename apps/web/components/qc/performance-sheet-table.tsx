import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { deriveDisplayStatus } from "@/lib/qc-status";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableFooter,
} from "@workspace/ui/components/table";
import { Input } from "@workspace/ui/components/input";

export type PillarKpi = {
  kpi_no: number;
  metric: string;
  dataProvidedBy: string;
  target: string;
  actual: string | number;
  percentAchieved: string | number;
  value?: string | number;
  status?: string;
  kpiId?: string;
  isSubmittedToQc?: boolean;
  totalEntries?: number;
};

export interface PillarTableProps {
  pillar: string;
  kpis: PillarKpi[];
  onReviewKpi?: (kpiId: string) => void;
  showStatusColumn?: boolean;
}

export const dummyKpiData: PillarKpi[] = [
  {
    kpi_no: 1,
    metric: "Student Awards",
    dataProvidedBy: "HoD",
    target: "25%",
    actual: "20%",
    percentAchieved: "80%",
    value: "80",
    status: "pending review",
    kpiId: "1",
    totalEntries: 12,
  },
  {
    kpi_no: 2,
    metric: "Research Papers",
    dataProvidedBy: "HoD",
    target: "10",
    actual: "8",
    percentAchieved: "80%",
    value: "80",
    status: "approved",
    kpiId: "2",
    totalEntries: 8,
  },
  {
    kpi_no: 3,
    metric: "Industry Projects",
    dataProvidedBy: "HoD",
    target: "5",
    actual: "2",
    percentAchieved: "40%",
    value: "40",
    status: "needs revision",
    kpiId: "3",
    totalEntries: 3,
  },
];

export const PillarKpiTable: React.FC<
  Omit<Partial<PillarTableProps>, "pillar">
> = ({ kpis = dummyKpiData, onReviewKpi, showStatusColumn = true }) => {
  const [data, setData] = React.useState(kpis);

  const handleValueChange = (rowIndex: number, newValue: string) => {
    setData((prev) =>
      prev.map((row, idx) =>
        idx === rowIndex ? { ...row, value: newValue } : row,
      ),
    );
  };

  // Helper to sum the weightage field (target field) in the current data
  const totalWeightage = data.reduce(
    (sum, row) => sum + Number(row.target ?? 0),
    0,
  );

  return (
    <Card className="shadow-md px-2 border rounded-lg">
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
                Weightage
              </TableHead>
              <TableHead className="bg-muted/50 text-xs font-semibold uppercase">
                Target
              </TableHead>
              <TableHead className="bg-muted/50 text-xs font-semibold uppercase">
                Total Entries
              </TableHead>
              <TableHead className="bg-muted/50 text-xs font-semibold uppercase">
                % Target Achieved
              </TableHead>
              {showStatusColumn && (
                <TableHead className="bg-muted/50 text-xs font-semibold uppercase">
                  Status
                </TableHead>
              )}
              <TableHead className="bg-muted/50 text-xs font-semibold uppercase">
                Review
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, rowIndex) => (
              <TableRow
                key={row.kpiId ?? row.kpi_no}
                className={rowIndex % 2 === 1 ? "bg-muted/20" : ""}
              >
                <TableCell className="text-center">{row.kpi_no}</TableCell>
                <TableCell>{row.metric}</TableCell>
                <TableCell className="text-center">
                  {row.dataProvidedBy}
                </TableCell>
                <TableCell className="text-center">{row.target}</TableCell>
                <TableCell className="text-center">
                  {row.value ?? "-"}
                </TableCell>
                <TableCell className="text-center">
                  {row.totalEntries ?? 0}
                </TableCell>
                <TableCell className="text-center">
                  {row.percentAchieved}
                </TableCell>
                {showStatusColumn && (
                  <TableCell className="text-center">
                    {row.status &&
                      (() => {
                        const raw = row.status.toLowerCase();
                        // Normalize to backend enum
                        let backendStatus: any = "PENDING";
                        if (raw === "approved") backendStatus = "APPROVED";
                        else if (raw === "rejected") backendStatus = "REJECTED";
                        else if (
                          [
                            "revision",
                            "revision requested",
                            "needs revision",
                            "redo",
                          ].includes(raw)
                        )
                          backendStatus = "REVISION";
                        else if (raw === "overdue") backendStatus = "OVERDUE";
                        else if (raw === "draft" || raw === "to be submitted")
                          backendStatus = "PENDING";
                        const display = deriveDisplayStatus({
                          status: backendStatus,
                          hasFormResponses:
                            raw !== "draft" && raw !== "to be submitted",
                          isSubmittedToQc: row.isSubmittedToQc || false,
                        });
                        const variantMap: Record<string, any> = {
                          Approved: "approved",
                          Rejected: "rejected",
                          "Revision Requested": "revision",
                          "Awaiting Approval": "awaiting",
                          Pending: "pending",
                          Overdue: "overdue",
                        };
                        const mappedVariant = (variantMap[display] ||
                          "pending") as any;
                        return (
                          <StatusBadge status={mappedVariant} label={display} />
                        );
                      })()}
                  </TableCell>
                )}
                <TableCell className="text-center">
                  {onReviewKpi && row.kpiId && (
                    <button
                      className="px-2 py-0.5 rounded text-xs font-medium transition-colors text-amber-300 border border-amber-400/40 hover:bg-amber-500/10 bg-transparent"
                      onClick={() => onReviewKpi(row.kpiId!)}
                    >
                      Review
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              {/* Empty cells before Weightage column */}
              <TableCell colSpan={3} className="font-bold text-right">
                Total Weightage
              </TableCell>
              <TableCell className="font-bold text-center">
                {totalWeightage.toFixed(2)}
              </TableCell>
              <TableCell colSpan={3} />
              {showStatusColumn && <TableCell />}
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
};

// Add back the original performance sheet table and dummy data exports
export interface PerformanceParameter {
  slNo: number;
  parameter: string;
  weight: number | null;
  targetAchieved: number | null;
  performance: number | null;
}

export const PerformanceSheetTable: React.FC<{
  data: PerformanceParameter[];
  totalKpis?: number;
}> = ({ data, totalKpis }) => {
  // Helper function to format numbers with 2 decimal places
  const formatNumber = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "-";
    return Number(value).toFixed(2);
  };

  // Calculate totals
  const totalWeight = data.reduce((sum, row) => sum + (row.weight || 0), 0);
  const totalTargetAchieved = data.reduce(
    (sum, row) => sum + (row.targetAchieved || 0),
    0,
  );
  const totalPerformance = data.reduce(
    (sum, row) => sum + (row.performance || 0),
    0,
  );

  return (
    <Card className="shadow-md px-2 border rounded-lg">
      <CardHeader className="bg-muted/50 rounded-t-lg">
        <CardTitle className="text-lg font-bold tracking-tight">
          Performance Sheet
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Departmental KPI performance summary for the current goal period
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="bg-muted/50 text-xs font-semibold uppercase text-center w-[80px]">
                  Sl. No.
                </TableHead>
                <TableHead className="bg-muted/50 text-xs font-semibold uppercase">
                  {`Parameter (${typeof totalKpis === "number" ? totalKpis : 0} KPIs)`}
                </TableHead>
                <TableHead className="bg-muted/50 text-xs font-semibold uppercase text-center w-[120px]">
                  Weight (A)
                </TableHead>
                <TableHead className="bg-muted/50 text-xs font-semibold uppercase text-center w-[150px]">
                  % of Target Achieved (B)
                </TableHead>
                <TableHead className="bg-muted/50 text-xs font-semibold uppercase text-center w-[150px]">
                  Performance (A × B)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, idx) => (
                <TableRow
                  key={row.slNo}
                  className={idx % 2 === 1 ? "bg-muted/20" : ""}
                >
                  <TableCell className="font-medium text-center w-[80px]">
                    {row.slNo}
                  </TableCell>
                  <TableCell className="font-medium">{row.parameter}</TableCell>
                  <TableCell className="text-center w-[120px]">
                    {formatNumber(row.weight)}
                  </TableCell>
                  <TableCell className="text-center w-[150px]">
                    {formatNumber(row.targetAchieved)} %
                  </TableCell>
                  <TableCell className="text-center w-[150px]">
                    {formatNumber(row.performance)} %
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-bold text-right" colSpan={2}>
                  Overall Performance
                </TableCell>
                <TableCell className="font-bold text-center w-[120px]">
                  {formatNumber(totalWeight)}
                </TableCell>
                <TableCell className="font-bold text-center w-[150px]"></TableCell>
                <TableCell className="font-bold text-center w-[150px]">
                  {formatNumber(totalPerformance)} %
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
