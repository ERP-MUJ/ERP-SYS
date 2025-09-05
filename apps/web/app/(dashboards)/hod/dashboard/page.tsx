"use client";
import { useState } from "react";
import {
  CalendarIcon,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { AnalyticsData, PillarAnalytics } from "@/types/analytics";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
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

// Dummy analytics data
const ANALYTICS_DATA: AnalyticsData = {
  kpiCompletionRate: {
    overall: 78.5,
    byPillar: [
      {
        id: "academic",
        name: "Academic Excellence",
        completion: 85.2,
        total: 12,
        completed: 10,
        departments: [
          { name: "Computer Science", completion: 90, kpis: 3 },
          { name: "Mathematics", completion: 85, kpis: 2 },
          { name: "Physics", completion: 80, kpis: 4 },
          { name: "Chemistry", completion: 88, kpis: 3 },
        ],
        recentActivity: [
          {
            kpi: "Student Pass Rate",
            department: "Computer Science",
            status: "completed",
            date: "2024-01-15",
          },
          {
            kpi: "Faculty Performance",
            department: "Mathematics",
            status: "pending",
            date: "2024-01-14",
          },
          {
            kpi: "Course Evaluation",
            department: "Physics",
            status: "completed",
            date: "2024-01-13",
          },
        ],
        trend: "+5.2%",
      },
      {
        id: "student",
        name: "Student Development",
        completion: 72.8,
        total: 8,
        completed: 6,
        departments: [
          { name: "Student Affairs", completion: 75, kpis: 2 },
          { name: "Counseling", completion: 70, kpis: 2 },
          { name: "Sports", completion: 80, kpis: 2 },
          { name: "Cultural", completion: 65, kpis: 2 },
        ],
        recentActivity: [
          {
            kpi: "Student Satisfaction",
            department: "Student Affairs",
            status: "completed",
            date: "2024-01-12",
          },
          {
            kpi: "Counseling Sessions",
            department: "Counseling",
            status: "pending",
            date: "2024-01-11",
          },
          {
            kpi: "Sports Participation",
            department: "Sports",
            status: "completed",
            date: "2024-01-10",
          },
        ],
        trend: "+2.1%",
      },
      {
        id: "research",
        name: "Research & Innovation",
        completion: 68.4,
        total: 15,
        completed: 10,
        departments: [
          { name: "Research Office", completion: 70, kpis: 5 },
          { name: "Innovation Hub", completion: 65, kpis: 4 },
          { name: "Publications", completion: 72, kpis: 3 },
          { name: "Patents", completion: 60, kpis: 3 },
        ],
        recentActivity: [
          {
            kpi: "Research Publications",
            department: "Research Office",
            status: "pending",
            date: "2024-01-09",
          },
          {
            kpi: "Innovation Projects",
            department: "Innovation Hub",
            status: "completed",
            date: "2024-01-08",
          },
          {
            kpi: "Patent Applications",
            department: "Patents",
            status: "pending",
            date: "2024-01-07",
          },
        ],
        trend: "-1.3%",
      },
      {
        id: "infrastructure",
        name: "Infrastructure",
        completion: 91.7,
        total: 6,
        completed: 5,
        departments: [
          { name: "Facilities", completion: 95, kpis: 2 },
          { name: "IT Services", completion: 90, kpis: 2 },
          { name: "Maintenance", completion: 88, kpis: 1 },
          { name: "Security", completion: 93, kpis: 1 },
        ],
        recentActivity: [
          {
            kpi: "Facility Utilization",
            department: "Facilities",
            status: "completed",
            date: "2024-01-14",
          },
          {
            kpi: "IT Infrastructure",
            department: "IT Services",
            status: "completed",
            date: "2024-01-13",
          },
          {
            kpi: "Security Systems",
            department: "Security",
            status: "completed",
            date: "2024-01-12",
          },
        ],
        trend: "+3.8%",
      },
    ],
  },
  onTimeSubmission: {
    rate: 82.3,
    trend: "up",
    monthlyData: [
      { month: "Jan", rate: 75 },
      { month: "Feb", rate: 78 },
      { month: "Mar", rate: 82 },
      { month: "Apr", rate: 85 },
      { month: "May", rate: 82 },
    ],
  },
  underperformingKpis: [
    {
      name: "Faculty Research Publications",
      pillar: "Research & Innovation",
      completion: 45.2,
      target: 80,
      department: "Computer Science",
      lastUpdated: "2024-01-10",
    },
    {
      name: "Student Satisfaction Survey",
      pillar: "Student Development",
      completion: 52.8,
      target: 75,
      department: "Mechanical Engineering",
      lastUpdated: "2024-01-08",
    },
    {
      name: "Infrastructure Utilization",
      pillar: "Infrastructure",
      completion: 38.9,
      target: 70,
      department: "Civil Engineering",
      lastUpdated: "2024-01-12",
    },
  ],
  recheckRate: {
    rate: 15.7,
    trend: "down",
    reasons: [
      { reason: "Data Validation Issues", count: 12, percentage: 35.3 },
      { reason: "Missing Documentation", count: 8, percentage: 23.5 },
      { reason: "Calculation Errors", count: 7, percentage: 20.6 },
      { reason: "Late Submissions", count: 5, percentage: 14.7 },
      { reason: "Other", count: 2, percentage: 5.9 },
    ],
  },
};

export function DashboardContent() {
  //const [openAssignDialog, setOpenAssignDialog] = useState(false)
  const [selectedPillarForTable, setSelectedPillarForTable] = useState("");
  const [selectedPillar, setSelectedPillar] = useState<PillarAnalytics | null>(
    null,
  );
  const { data: pillarsData } = useGetDepartmentPillars();

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">HoD Dashboard</h1>
      </div>

      <ScoreSheet
        selectedPillar={selectedPillarForTable}
        setSelectedPillar={setSelectedPillarForTable}
      />
    </div>
  );
}
