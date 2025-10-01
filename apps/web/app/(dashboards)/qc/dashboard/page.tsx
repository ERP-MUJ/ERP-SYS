"use client";

import { Badge } from "@workspace/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { useGetSubmissionSummary } from "@/queries/qc/submission-summary";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import {
  CheckCircle2,
  XCircle,
  Building,
  Target,
  Columns,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { useState } from "react";
import {
  useGetScoreSheet,
  useGetDepartmentPillars,
} from "@/queries/qc/score-sheet";
import {
  QacDashboardData,
  DepartmentStatus,
} from "@workspace/types/types/qc-dashboard.type";
import { ElementType } from "react";
import { useGetDashboardData } from "@/queries/qc/dashboard";
import { ReadOnlyFormTable } from "@/components/qc/readonly-form-table";

// Local type for the StatCard props, as it's a UI-specific component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: ElementType;
  description: string;
}

// Loading spinner component for loading state
const LoadingSpinner = () => (
  <div className="flex h-[50vh] items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

// A reusable component for the overview cards
const StatCard = ({ title, value, icon: Icon, description }: StatCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

export default function QACDashboard() {
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [selectedPillar, setSelectedPillar] = useState<string>("");

  // Fetch real data using React Query
  const { data: dashboardData, isLoading, error } = useGetDashboardData();
  const { data: summaryData, isLoading: isSummaryLoading } =
    useGetSubmissionSummary();
  const { data: pillarsData } = useGetDepartmentPillars(selectedDept);

  if (isLoading) return <LoadingSpinner />;

  if (error || !dashboardData) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-destructive">Failed to load dashboard data</p>
      </div>
    );
  }

  const { submissionStats, departmentStatus } = dashboardData;

  interface ScoreSheetProps {
    selectedDept: string;
    selectedPillar: string;
    setSelectedPillar: (value: string) => void;
  }

  // Score Sheet Component
  const ScoreSheet = ({
    selectedDept,
    selectedPillar,
    setSelectedPillar,
  }: ScoreSheetProps) => {
    const { data: scoreSheetData, isLoading: isScoreSheetLoading } =
      useGetScoreSheet(selectedDept, selectedPillar);
    const { data: pillarsData } = useGetDepartmentPillars(selectedDept);

    if (!selectedDept) {
      return (
        <div className="flex h-[200px] items-center justify-center">
          <p className="text-muted-foreground">
            Please select a department to view the score sheet
          </p>
        </div>
      );
    }

    if (isScoreSheetLoading || !pillarsData) {
      return <LoadingSpinner />;
    }

    return (
      <div className="space-y-4">
        {pillarsData.map((pillar) => {
          const pillarScores =
            scoreSheetData?.filter(
              (score) => score.dept_pillar_id === pillar.id,
            ) || [];

          return (
            <div key={pillar.id} className="space-y-2">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableCell colSpan={7} className="font-medium text-lg py-4">
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
                    <TableCell className="w-[100px] text-center font-medium">
                      Total Entries
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
                          {kpi.percentage_target_achieved !== null
                            ? `${kpi.percentage_target_achieved}%`
                            : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          {kpi.total_entries || 0}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={7}
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
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">QC Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Monitor department configuration and submission status across the
          organization.
        </p>
      </div>

      {/* Overview Cards Section - now using submissionStats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Submissions"
          value={submissionStats.totalSubmissions}
          icon={Target}
          description="Total KPIs submitted across all departments."
        />
        <StatCard
          title="Pending Review"
          value={submissionStats.pendingReview}
          icon={AlertTriangle}
          description="KPIs currently awaiting review and approval."
        />
        <StatCard
          title="Departments Configured"
          value={submissionStats.departmentsConfigured}
          icon={CheckCircle2}
          description="Departments with both Pillars and KPIs assigned."
        />
        <StatCard
          title="Departments Pending"
          value={submissionStats.departmentsPending}
          icon={Building}
          description="Departments missing Pillar or KPI assignments."
        />
      </div>

      {/* Tabbed Interface */}
      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList>
          <TabsTrigger value="summary">Submission Summary</TabsTrigger>
          <TabsTrigger value="scoresheet">Score Sheet</TabsTrigger>
          <TabsTrigger value="status">Dept. Status</TabsTrigger>
        </TabsList>

        <TabsContent value="scoresheet">
          <Card>
            <CardHeader>
              <CardTitle>Department Score Sheet</CardTitle>
              <CardDescription>
                View detailed KPI scores and achievements by department and
                pillar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <Select
                  value={selectedDept}
                  onValueChange={(value) => {
                    setSelectedDept(value);
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departmentStatus.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <ScoreSheet
                selectedDept={selectedDept}
                selectedPillar={selectedPillar}
                setSelectedPillar={setSelectedPillar}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>Department Status Details</CardTitle>
              <CardDescription>
                Detailed overview of each department's configuration and
                submission activity.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Department</TableHead>
                    <TableHead>HOD</TableHead>
                    <TableHead className="text-center">Pillars Set</TableHead>
                    <TableHead className="text-center">KPIs Set</TableHead>
                    <TableHead className="text-center">Submissions</TableHead>
                    <TableHead>Last Submission</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departmentStatus.map((dept: DepartmentStatus) => (
                    <TableRow key={dept.id}>
                      <TableCell className="font-medium">{dept.name}</TableCell>
                      <TableCell>{dept.hod ?? "N/A"}</TableCell>
                      <TableCell className="text-center">
                        {dept.pillarsSet ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Set
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="mr-1 h-3 w-3" />
                            Not Set
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {dept.kpisSet ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Set
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="mr-1 h-3 w-3" />
                            Not Set
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        {dept.totalSubmissions}
                      </TableCell>
                      <TableCell>
                        {dept.lastSubmission
                          ? new Date(dept.lastSubmission).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Department Submission Summary</CardTitle>
              <CardDescription>
                Overview of KPI submissions and data entries by department.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell className="font-medium">Department</TableCell>
                    <TableCell className="text-center font-medium">
                      Submitted KPIs
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      Verified Entries
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isSummaryLoading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : (
                    summaryData?.map((dept) => (
                      <TableRow key={dept.id}>
                        <TableCell>{dept.name}</TableCell>
                        <TableCell className="text-center">
                          {dept.submittedKpis}
                        </TableCell>
                        <TableCell className="text-center">
                          {dept.totalEntries}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
