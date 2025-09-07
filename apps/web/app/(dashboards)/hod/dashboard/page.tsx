"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { HodPerformanceSheetTable } from "@/components/hod/performance-sheet-table";
import { PillarAnalytics } from "@/types/analytics";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Progress } from "@workspace/ui/components/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Badge } from "@workspace/ui/components/badge";
import { ReadOnlyFormTable } from "@/components/qc/readonly-form-table";
import {
  useGetScoreSheet,
  useGetDepartmentPillars,
} from "@/queries/hod/dashboard";

// Loading spinner component for loading state
const LoadingSpinner = () => (
  <div className="flex h-[50vh] items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

// Score Sheet Component
const ScoreSheet = ({
  selectedPillar,
  setSelectedPillar,
}: {
  selectedPillar: string;
  setSelectedPillar: (value: string) => void;
}) => {
  const { data: scoreSheetData, isLoading: isScoreSheetLoading } =
    useGetScoreSheet(selectedPillar);

  return (
    <div className="space-y-4">
      {isScoreSheetLoading ? (
        <LoadingSpinner />
      ) : scoreSheetData && scoreSheetData.length > 0 ? (
        <ReadOnlyFormTable
          elements={[
            {
              id: "kpi_number",
              type: "text",
              attributes: { label: "KPI Number", width: 100 },
            },
            {
              id: "kpi_metric_name",
              type: "text",
              attributes: { label: "KPI Metric", width: 250 },
            },
            {
              id: "kpi_value",
              type: "number",
              attributes: { label: "Weightage", width: 100 },
            },
            {
              id: "data_provided_by",
              type: "text",
              attributes: { label: "Stakeholder", width: 120 },
            },
            {
              id: "kpi_target",
              type: "text",
              attributes: { label: "Target", width: 100 },
            },
            {
              id: "hod_percentage_target_achieved",
              type: "number",
              attributes: { label: "% Achieved", width: 150 },
            },
          ]}
          entries={scoreSheetData}
          className="w-full"
          rowNumbers={true}
          compact={true}
        />
      ) : (
        <div className="flex h-[200px] items-center justify-center">
          <p className="text-muted-foreground">
            No KPIs found for this department
          </p>
        </div>
      )}
    </div>
  );
};

export function DashboardContent() {
  //const [openAssignDialog, setOpenAssignDialog] = useState(false)
  const [selectedPillarForTable, setSelectedPillarForTable] = useState("");
  const [selectedPillar, setSelectedPillar] = useState<PillarAnalytics | null>(
    null,
  );
  const { data: pillarsData } = useGetDepartmentPillars();
  const { data: scoreSheetData, isLoading: isScoreSheetLoading } =
    useGetScoreSheet(selectedPillarForTable);

  // Transform the pillars data to performance sheet format
  const transformPillarsToPerformance = (pillarsData: any[] = []) => {
    return pillarsData.map((pillar, index) => ({
      slNo: index + 1,
      parameter: pillar.pillar_name,
      weight: pillar.pillar_weight,
      hod_percentage_target_achieved: pillar.hod_percentage_target_achieved,
      hod_performance: pillar.hod_performance,
    }));
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">HoD Dashboard</h1>
      </div>

      <div className="space-y-6">
        {/* Performance Sheet */}
        <HodPerformanceSheetTable
          data={transformPillarsToPerformance(pillarsData)}
          totalKpis={scoreSheetData?.length ?? 0}
        />

        {/* Score Sheet */}
        <Card>
          <CardHeader>
            <CardTitle>Department Score Sheet</CardTitle>
            <CardDescription>
              View detailed KPI scores and achievements for your department by
              pillar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <Select
                value={selectedPillarForTable}
                onValueChange={setSelectedPillarForTable}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select Pillar" />
                </SelectTrigger>
                <SelectContent>
                  {pillarsData?.map((pillar) => (
                    <SelectItem key={pillar.id} value={pillar.id}>
                      {pillar.pillar_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ScoreSheet
              selectedPillar={selectedPillarForTable}
              setSelectedPillar={setSelectedPillarForTable}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
