import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Loader2 } from "lucide-react";

// Loading spinner component for loading state
const LoadingSpinner = () => (
  <div className="flex h-[50vh] items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

interface HodScoreSheetProps {
  pillarsData: any[];
  scoreSheetData: any[];
  isLoading: boolean;
}

export function HodScoreSheet({
  pillarsData,
  scoreSheetData,
  isLoading,
}: HodScoreSheetProps) {
  if (isLoading) {
    return <LoadingSpinner />;
  }

  console.log("HodScoreSheet - Pillars:", pillarsData);
  console.log("HodScoreSheet - Scores:", scoreSheetData);

  return (
    <div className="space-y-4">
      {pillarsData.map((pillar) => {
        console.log("Rendering pillar:", pillar);
        const pillarScores =
          scoreSheetData?.filter(
            (score) => score.dept_pillar_id === pillar.id,
          ) || [];
        console.log("Pillar scores:", pillarScores);

        return (
          <div key={pillar.id} className="space-y-2">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableCell colSpan={6} className="font-medium text-lg py-4">
                    {pillar.pillar_name}{" "}
                    <span className="text-muted-foreground ml-2">
                      (Weight: {pillar.pillar_weight || 0})
                    </span>
                  </TableCell>
                </TableRow>
                <TableRow className="bg-muted/20 hover:bg-muted/20">
                  <TableCell className="w-[100px] text-center font-medium">
                    KPI Number
                  </TableCell>
                  <TableCell className="w-[250px] font-medium whitespace-normal">
                    KPI Metric
                  </TableCell>
                  <TableCell className="w-[100px] text-center font-medium">
                    Weightage
                  </TableCell>
                  <TableCell className="w-[120px] text-center font-medium">
                    Stakeholder
                  </TableCell>
                  <TableCell className="w-[100px] text-center font-medium">
                    Target
                  </TableCell>
                  <TableCell className="w-[150px] text-center font-medium">
                    % Target Achieved
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pillarScores.length > 0 ? (
                  pillarScores.map((kpi, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-center">
                        {kpi.kpi_number}
                      </TableCell>
                      <TableCell className="whitespace-pre-line">
                        {kpi.kpi_metric_name.length > 40
                          ? `${kpi.kpi_metric_name.slice(0, 40)}\n${kpi.kpi_metric_name.slice(40)}`
                          : kpi.kpi_metric_name}
                      </TableCell>
                      <TableCell className="text-center">
                        {kpi.kpi_value}
                      </TableCell>
                      <TableCell className="text-center">
                        {kpi.data_provided_by}
                      </TableCell>
                      <TableCell className="text-center">
                        {kpi.kpi_target}
                      </TableCell>
                      <TableCell className="text-center">
                        {kpi.hod_percentage_target_achieved !== null
                          ? `${kpi.hod_percentage_target_achieved}%`
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground"
                    >
                      No KPIs found for this pillar
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        );
      })}
    </div>
  );
}
