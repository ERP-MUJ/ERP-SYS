import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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

export interface HodPerformanceParameter {
  slNo: number;
  parameter: string;
  weight: number | null;
  hod_percentage_target_achieved: number | null;
  hod_performance: number | null;
}

export const HodPerformanceSheetTable: React.FC<{
  data: HodPerformanceParameter[];
  totalKpis?: number;
}> = ({ data, totalKpis }) => {
  // Helper function to format numbers with 2 decimal places
  const formatNumber = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "-";
    return Number(value).toFixed(2);
  };

  // Calculate totals
  const totalWeight = data.reduce((sum, row) => sum + (row.weight || 0), 0);
  const totalPerformance = data.reduce(
    (sum, row) => sum + (row.hod_performance || 0),
    0,
  );

  return (
    <Card className="shadow-md px-2 border rounded-lg">
      <CardHeader className="bg-muted/50 rounded-t-lg">
        <CardTitle className="text-lg font-bold tracking-tight">
          Department Performance Sheet
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          KPI performance summary for your department in the current goal period
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
                    {formatNumber(row.hod_percentage_target_achieved)} %
                  </TableCell>
                  <TableCell className="text-center w-[150px]">
                    {formatNumber(row.hod_performance)} %
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
