"use client";
import { HodPerformanceSheetTable } from "@/components/hod/performance-sheet-table";
import { HodScoreSheet } from "@/components/hod/hod-score-sheet";
import { PillarAnalytics } from "@/types/analytics";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  useGetScoreSheet,
  useGetDepartmentPillars,
} from "@/queries/hod/dashboard";

export function DashboardContent() {
  const { data: pillarsData = [], isLoading: isPillarsLoading } =
    useGetDepartmentPillars();
  const { data: scoreSheetData = [], isLoading: isScoreSheetLoading } =
    useGetScoreSheet();
  console.log("Pillars Data:", pillarsData);
  console.log("Score Sheet Data:", scoreSheetData);

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
          totalKpis={0}
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
            <HodScoreSheet
              pillarsData={pillarsData || []}
              scoreSheetData={scoreSheetData || []}
              isLoading={isPillarsLoading || isScoreSheetLoading}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
