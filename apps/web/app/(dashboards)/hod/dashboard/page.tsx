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
} from "lucide-react";
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

// Dummy analytics data
const ANALYTICS_DATA = {
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
  const [selectedPillar, setSelectedPillar] = useState(
    ANALYTICS_DATA.kpiCompletionRate.byPillar[0],
  );

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">HoD Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <FileText className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Button size="sm">
            <CalendarIcon className="mr-2 h-4 w-4" />
            Current Session
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-card text-card-foreground">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  KPI Completion Rate
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {ANALYTICS_DATA.kpiCompletionRate.overall}%
                </div>
                <p className="text-xs text-muted-foreground">
                  +5.2% from last month
                </p>
                <Progress
                  className="mt-2"
                  value={ANALYTICS_DATA.kpiCompletionRate.overall}
                />
              </CardContent>
            </Card>

            <Card className="bg-card text-card-foreground">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  On-Time Submission
                </CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {ANALYTICS_DATA.onTimeSubmission.rate}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {ANALYTICS_DATA.onTimeSubmission.trend === "up" ? "+" : "-"}
                  3.1% from last month
                </p>
                <Progress
                  className="mt-2"
                  value={ANALYTICS_DATA.onTimeSubmission.rate}
                />
              </CardContent>
            </Card>

            <Card className="bg-card text-card-foreground">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Underperforming KPIs
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {ANALYTICS_DATA.underperformingKpis.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Need immediate attention
                </p>
                <Progress className="mt-2" value={25} />
              </CardContent>
            </Card>

            <Card className="bg-card text-card-foreground">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  KPI Recheck Rate
                </CardTitle>
                <RefreshCw className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {ANALYTICS_DATA.recheckRate.rate}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {ANALYTICS_DATA.recheckRate.trend === "down" ? "-" : "+"}2.3%
                  from last month
                </p>
                <Progress
                  className="mt-2"
                  value={ANALYTICS_DATA.recheckRate.rate}
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4 bg-card text-card-foreground">
              <CardHeader>
                <CardTitle>Recent Submissions</CardTitle>
                <CardDescription>
                  Latest KPI entries submitted across departments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableCaption>A list of recent KPI submissions.</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department</TableHead>
                      <TableHead>KPI Name</TableHead>
                      <TableHead>Pillar</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">
                        Computer Science
                      </TableCell>
                      <TableCell>Student Pass Rate</TableCell>
                      <TableCell>Academic Excellence</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="default" className="bg-green-500">
                          Approved
                        </Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">
                        Electrical Engineering
                      </TableCell>
                      <TableCell>Faculty Performance</TableCell>
                      <TableCell>Academic Excellence</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="destructive">Rejected</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">
                        Mechanical Engineering
                      </TableCell>
                      <TableCell>Student Satisfaction</TableCell>
                      <TableCell>Student Development</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="default" className="bg-green-500">
                          Approved
                        </Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">
                        Civil Engineering
                      </TableCell>
                      <TableCell>Research Publications</TableCell>
                      <TableCell>Research & Innovation</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">Pending</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">
                        Electronics & Communication
                      </TableCell>
                      <TableCell>Infrastructure Usage</TableCell>
                      <TableCell>Infrastructure</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="default" className="bg-green-500">
                          Approved
                        </Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </CardFooter>
            </Card>

            <Card className="col-span-3 bg-card text-card-foreground">
              <CardHeader>
                <CardTitle>KPI Status Overview</CardTitle>
                <CardDescription>
                  Current status distribution of all KPIs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  {/* Approved KPIs */}
                  <div className="flex flex-col items-center space-y-2">
                    <div className="relative w-20 h-20">
                      <svg
                        className="w-20 h-20 transform -rotate-90"
                        viewBox="0 0 36 36"
                      >
                        <path
                          d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="2"
                        />
                        <path
                          d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2"
                          strokeDasharray="75, 100"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold text-green-600">
                          75%
                        </span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">Approved</div>
                      <div className="text-xs text-muted-foreground">
                        89 KPIs
                      </div>
                    </div>
                  </div>

                  {/* Pending KPIs */}
                  <div className="flex flex-col items-center space-y-2">
                    <div className="relative w-20 h-20">
                      <svg
                        className="w-20 h-20 transform -rotate-90"
                        viewBox="0 0 36 36"
                      >
                        <path
                          d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="2"
                        />
                        <path
                          d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="2"
                          strokeDasharray="38, 100"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold text-yellow-600">
                          38%
                        </span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">Pending</div>
                      <div className="text-xs text-muted-foreground">
                        45 KPIs
                      </div>
                    </div>
                  </div>

                  {/* Rejected KPIs */}
                  <div className="flex flex-col items-center space-y-2">
                    <div className="relative w-20 h-20">
                      <svg
                        className="w-20 h-20 transform -rotate-90"
                        viewBox="0 0 36 36"
                      >
                        <path
                          d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="2"
                        />
                        <path
                          d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="2"
                          strokeDasharray="18, 100"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold text-red-600">
                          18%
                        </span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">Rejected</div>
                      <div className="text-xs text-muted-foreground">
                        22 KPIs
                      </div>
                    </div>
                  </div>

                  {/* Overdue KPIs */}
                  <div className="flex flex-col items-center space-y-2">
                    <div className="relative w-20 h-20">
                      <svg
                        className="w-20 h-20 transform -rotate-90"
                        viewBox="0 0 36 36"
                      >
                        <path
                          d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="2"
                        />
                        <path
                          d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#dc2626"
                          strokeWidth="2"
                          strokeDasharray="12, 100"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold text-red-700">
                          12%
                        </span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">Overdue</div>
                      <div className="text-xs text-muted-foreground">
                        14 KPIs
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Total KPIs</span>
                    <span className="font-semibold">170</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Interactive KPI Completion Analytics */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-card text-card-foreground">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  KPI Completion by Pillar
                </CardTitle>
                <CardDescription>
                  Click on a pillar to view detailed information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ANALYTICS_DATA.kpiCompletionRate.byPillar.map((pillar) => (
                    <Button
                      key={pillar.id}
                      variant={
                        selectedPillar.id === pillar.id ? "default" : "outline"
                      }
                      className="w-full justify-between h-auto p-4"
                      onClick={() => setSelectedPillar(pillar)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-left">
                          <div className="font-medium">{pillar.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {pillar.completed}/{pillar.total} KPIs completed
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">
                          {pillar.completion}%
                        </span>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card text-card-foreground">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="relative w-6 h-6">
                    {/* <svg
                      className="w-6 h-6 transform -rotate-90"
                      viewBox="0 0 36 36"
                    >
                      <path
                        d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="2"
                      />
                      <path
                        d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        strokeDasharray={`${selectedPillar.completion}, 100`}
                        strokeLinecap="round"
                      />
                    </svg> */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold">
                        {selectedPillar.completion}%
                      </span>
                    </div>
                  </div>
                  {selectedPillar.name} Details
                </CardTitle>
                <CardDescription>
                  Detailed breakdown and recent activity
                  <Badge variant="outline" className="ml-2">
                    {selectedPillar.trend}
                  </Badge>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Department Breakdown */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3">
                      Department Performance
                    </h4>
                    <div className="space-y-3">
                      {selectedPillar.departments.map((dept, index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">
                              {dept.name}
                            </span>
                            <span className="text-sm font-bold">
                              {dept.completion}%
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={dept.completion}
                              className="flex-1"
                            />
                            <span className="text-xs text-muted-foreground">
                              {dept.kpis} KPIs
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3">
                      Recent Activity
                    </h4>
                    <div className="space-y-2">
                      {selectedPillar.recentActivity.map((activity, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                        >
                          <div>
                            <div className="text-sm font-medium">
                              {activity.kpi}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {activity.department}
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant={
                                activity.status === "completed"
                                  ? "default"
                                  : "secondary"
                              }
                              className={
                                activity.status === "completed"
                                  ? "bg-green-500"
                                  : ""
                              }
                            >
                              {activity.status}
                            </Badge>
                            <div className="text-xs text-muted-foreground mt-1">
                              {activity.date}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {selectedPillar.completed}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Completed
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600">
                        {selectedPillar.total - selectedPillar.completed}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Pending
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        {selectedPillar.departments.length}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Departments
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* On-Time Submission Trends */}
          <Card className="bg-card text-card-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                On-Time Submission Trends
              </CardTitle>
              <CardDescription>
                Monthly submission timeliness tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-6">
                  {/* Current Rate Display */}
                  <div className="text-center">
                    <div className="relative w-24 h-24 mx-auto">
                      <svg
                        className="w-24 h-24 transform -rotate-90"
                        viewBox="0 0 36 36"
                      >
                        <path
                          d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="2"
                        />
                        <path
                          d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="2"
                          strokeDasharray={`${ANALYTICS_DATA.onTimeSubmission.rate}, 100`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-bold text-blue-600">
                          {ANALYTICS_DATA.onTimeSubmission.rate}%
                        </span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="text-sm font-medium">Current Rate</div>
                      <div className="text-xs text-green-600">
                        +3.1% from last month
                      </div>
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        156
                      </div>
                      <div className="text-xs text-muted-foreground">
                        On-Time
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600">
                        34
                      </div>
                      <div className="text-xs text-muted-foreground">Late</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Monthly Performance</h4>
                  <div className="space-y-3">
                    {ANALYTICS_DATA.onTimeSubmission.monthlyData.map(
                      (month, index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">
                              {month.month} 2024
                            </span>
                            <span className="text-sm font-bold text-blue-600">
                              {month.rate}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${month.rate}%` }}
                            ></div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Underperforming KPIs */}
          <Card className="bg-card text-card-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Underperforming KPIs
              </CardTitle>
              <CardDescription>
                KPIs that require immediate attention and improvement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>KPI Name</TableHead>
                    <TableHead>Pillar</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Completion</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ANALYTICS_DATA.underperformingKpis.map((kpi, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{kpi.name}</TableCell>
                      <TableCell>{kpi.pillar}</TableCell>
                      <TableCell>{kpi.department}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={kpi.completion} className="w-16" />
                          <span className="text-sm">{kpi.completion}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{kpi.target}%</TableCell>
                      <TableCell>{kpi.lastUpdated}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Recheck Rate Analysis */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-card text-card-foreground">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-purple-500" />
                  KPI Recheck Analysis
                </CardTitle>
                <CardDescription>
                  Analysis of KPI rejections and resubmissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {ANALYTICS_DATA.recheckRate.rate}%
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Recheck Rate
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold">
                      Top Recheck Reasons:
                    </h4>
                    {ANALYTICS_DATA.recheckRate.reasons.map((reason, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{reason.reason}</span>
                          <span>{reason.percentage}%</span>
                        </div>
                        <Progress value={reason.percentage} />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card text-card-foreground">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Performance Insights
                </CardTitle>
                <CardDescription>
                  Key insights and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-semibold text-green-800">
                        Positive Trend
                      </span>
                    </div>
                    <p className="text-sm text-green-700">
                      Overall KPI completion rate has improved by 5.2% this
                      month
                    </p>
                  </div>

                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-semibold text-orange-800">
                        Attention Needed
                      </span>
                    </div>
                    <p className="text-sm text-orange-700">
                      Research & Innovation pillar needs focus - 3 KPIs
                      underperforming
                    </p>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-800">
                        Recommendation
                      </span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Implement data validation training to reduce recheck rate
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
