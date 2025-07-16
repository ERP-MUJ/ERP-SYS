"use client";
import { useState } from "react";
import { QOCReview } from "@/components/qoc/qoc-review";
import {
  CalendarIcon,
  FileText,
  TrendingUp,
  CheckCircle,
  Clock,
  RefreshCw,
  ChevronRight,
  Users,
  Building,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Badge } from "@workspace/ui/components/badge";

// Dummy analytics data for QOC
const QOC_ANALYTICS_DATA = {
  submissionStats: {
    totalSubmissions: 156,
    pendingReview: 23,
    approvedThisMonth: 89,
    rejectedThisMonth: 12,
    averageReviewTime: "2.3 days",
  },
  departmentPerformance: [
    {

      id: "Research",
      name: "Research Papers",
      submissionRate: 92.5,
      totalSubmissions: 24,
      approved: 22,
      rejected: 1,
      pending: 1,
      averageScore: 4.6,
      onTimeRate: 95.8,
      lastSubmission: "2024-01-15",
      recentActivity: [
        {

          kpi: "Acceptance Rate",
          status: "approved",
          date: "2024-01-15",
          score: 4.8,
        },
        {

          kpi: "Research Outcomes",

          status: "approved",
          date: "2024-01-14",
          score: 4.5,
        },
        {
          kpi: "Student Performance",
          status: "pending",
          date: "2024-01-13",
          score: null,
        },
      ],
      qualityMetrics: {
        dataAccuracy: 96.2,
        completeness: 98.5,
        timeliness: 94.1,
      },
    },
    {
      id: "sports",
      name: "Sports and Extracurriculars",

      submissionRate: 87.3,
      totalSubmissions: 18,
      approved: 15,
      rejected: 2,
      pending: 1,
      averageScore: 4.2,
      onTimeRate: 88.9,
      lastSubmission: "2024-01-12",
      recentActivity: [
        {
          kpi: "New Initiatives",

          status: "approved",
          date: "2024-01-12",
          score: 4.3,
        },
        {
          kpi: "Participation Rates",
          status: "rejected",
          date: "2024-01-10",
          score: 2.8,
        },
        {
          kpi: "Winners and Achievements",
          status: "approved",
          date: "2024-01-09",
          score: 4.7,
        },
      ],
      qualityMetrics: {
        dataAccuracy: 89.5,
        completeness: 92.1,
        timeliness: 85.3,
      },
    },
    {

      id: "academics",
      name: "Academic Standards",
      submissionRate: 79.2,
      totalSubmissions: 15,
      approved: 11,
      rejected: 3,
      pending: 1,
      averageScore: 3.9,
      onTimeRate: 73.3,
      lastSubmission: "2024-01-10",
      recentActivity: [
        {
          kpi: "Passing Rates",
          status: "approved",
          date: "2024-01-10",
          score: 4.1,
        },
        {

          kpi: "Outreach Programs",
          status: "rejected",
          date: "2024-01-08",
          score: 3.2,
        },
        {
          kpi: "Student Satisfaction",
          status: "approved",
          date: "2024-01-07",
          score: 4.4,
        },
      ],
      qualityMetrics: {
        dataAccuracy: 82.7,
        completeness: 88.9,
        timeliness: 76.5,
      },
    },

    {
      id: "Dept. of IT",
      name: "Dept. of IT",
      submissionRate: 94.1,
      totalSubmissions: 21,
      approved: 19,
      rejected: 1,
      pending: 1,
      averageScore: 4.4,
      onTimeRate: 90.5,
      lastSubmission: "2024-01-14",
      recentActivity: [
        {
          kpi: "Quaterly Assessments",
          status: "approved",
          date: "2024-01-14",
          score: 4.6,
        },
        {
          kpi: "Student Satisfaction",
          status: "approved",
          date: "2024-01-13",
          score: 4.3,
        },
        {
          kpi: "Course Outcomes",
          status: "pending",
          date: "2024-01-12",
          score: null,
        },
      ],
      qualityMetrics: {
        dataAccuracy: 94.8,
        completeness: 96.3,
        timeliness: 91.7,
      },
    },

  ],
  reviewMetrics: {
    averageReviewTime: 2.3,
    reviewBacklog: 23,
    reviewerWorkload: [

      { reviewer: "Dr. Arjun Singh", pending: 1, completed: 45 },
      { reviewer: "Dr. Arpit Singh", pending: 6, completed: 38 },
      { reviewer: "Dr. Somya Goyal", pending: 9, completed: 42 },

    ],
  },
  qualityTrends: {
    monthlyApprovalRate: [
      { month: "Sep", rate: 82 },
      { month: "Oct", rate: 85 },
      { month: "Nov", rate: 88 },
      { month: "Dec", rate: 91 },
      { month: "Jan", rate: 89 },
    ],
    qualityScores: [
      { month: "Sep", score: 4.1 },
      { month: "Oct", score: 4.2 },
      { month: "Nov", score: 4.3 },
      { month: "Dec", score: 4.5 },
      { month: "Jan", score: 4.4 },
    ],
  },
};

export function QOCDashboard() {
  const [selectedDepartment, setSelectedDepartment] = useState(
    QOC_ANALYTICS_DATA.departmentPerformance[0],
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">QOC Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Monitor department submissions and quality metrics across the
            organization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <FileText className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Button size="sm">
            <CalendarIcon className="mr-2 h-4 w-4" />
            Current Period
          </Button>
        </div>
      </div>

      <Tabs defaultValue="analytics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="submissions">Review Submissions</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-4">
          {/* Overview Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-card text-card-foreground">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Submissions
                </CardTitle>
                <FileText className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {QOC_ANALYTICS_DATA.submissionStats.totalSubmissions}
                </div>
                <p className="text-xs text-muted-foreground">
                  +12 from last month
                </p>
                <Progress className="mt-2" value={78} />
              </CardContent>
            </Card>

            <Card className="bg-card text-card-foreground">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Review
                </CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {QOC_ANALYTICS_DATA.submissionStats.pendingReview}
                </div>
                <p className="text-xs text-muted-foreground">
                  -5 from last week
                </p>
                <Progress className="mt-2" value={35} />
              </CardContent>
            </Card>

            <Card className="bg-card text-card-foreground">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Approval Rate
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">89%</div>
                <p className="text-xs text-muted-foreground">
                  +3% from last month
                </p>
                <Progress className="mt-2" value={89} />
              </CardContent>
            </Card>

            <Card className="bg-card text-card-foreground">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Review Time
                </CardTitle>
                <RefreshCw className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {QOC_ANALYTICS_DATA.submissionStats.averageReviewTime}
                </div>
                <p className="text-xs text-muted-foreground">
                  -0.5 days improvement
                </p>
                <Progress className="mt-2" value={65} />
              </CardContent>
            </Card>
          </div>

          {/* Interactive Department Analytics */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-card text-card-foreground">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-blue-500" />
                  Pillar Performance
                </CardTitle>
                <CardDescription>
                  Click on a department to view detailed metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {QOC_ANALYTICS_DATA.departmentPerformance.map(
                    (dept, index) => (
                      <Button
                        key={dept.id}
                        variant={
                          selectedDepartment.id === dept.id
                            ? "default"
                            : "outline"
                        }
                        className="w-full justify-between h-auto p-4"
                        onClick={() => setSelectedDepartment(dept)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-left">
                            <div className="font-medium">{dept.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {dept.approved}/{dept.totalSubmissions} approved
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold">
                            {dept.submissionRate}%
                          </span>
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </Button>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card text-card-foreground">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="relative w-6 h-6">
                    <svg
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
                        strokeDasharray={`${selectedDepartment.submissionRate}, 100`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold">
                        {selectedDepartment.submissionRate}%
                      </span>
                    </div>
                  </div>
                  {selectedDepartment.name} Details
                </CardTitle>
                <CardDescription>
                  Comprehensive department metrics and quality indicators
                  <Badge variant="outline" className="ml-2">
                    Score: {selectedDepartment.averageScore}/5
                  </Badge>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Quality Metrics */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3">
                      Quality Metrics
                    </h4>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">
                            Data Accuracy
                          </span>
                          <span className="text-sm font-bold">
                            {selectedDepartment.qualityMetrics.dataAccuracy}%
                          </span>
                        </div>
                        <Progress
                          value={selectedDepartment.qualityMetrics.dataAccuracy}
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">
                            Completeness
                          </span>
                          <span className="text-sm font-bold">
                            {selectedDepartment.qualityMetrics.completeness}%
                          </span>
                        </div>
                        <Progress
                          value={selectedDepartment.qualityMetrics.completeness}
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">
                            Timeliness
                          </span>
                          <span className="text-sm font-bold">
                            {selectedDepartment.qualityMetrics.timeliness}%
                          </span>
                        </div>
                        <Progress
                          value={selectedDepartment.qualityMetrics.timeliness}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3">
                      Recent Submissions
                    </h4>
                    <div className="space-y-2">
                      {selectedDepartment.recentActivity.map(
                        (activity, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                          >
                            <div>
                              <div className="text-sm font-medium">
                                {activity.kpi}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {activity.date}
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge
                                variant={
                                  activity.status === "approved"
                                    ? "default"
                                    : activity.status === "rejected"
                                      ? "destructive"
                                      : "secondary"
                                }
                                className={
                                  activity.status === "approved"
                                    ? "bg-green-500"
                                    : ""
                                }
                              >
                                {activity.status}
                              </Badge>
                              {activity.score && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  Score: {activity.score}/5
                                </div>
                              )}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        {selectedDepartment.approved}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Approved
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600">
                        {selectedDepartment.pending}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Pending
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">
                        {selectedDepartment.rejected}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Rejected
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quality Trends */}
          <Card className="bg-card text-card-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Quality & Approval Trends
              </CardTitle>
              <CardDescription>
                Monthly trends in approval rates and quality scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold">
                    Monthly Approval Rate
                  </h4>
                  <div className="space-y-3">
                    {QOC_ANALYTICS_DATA.qualityTrends.monthlyApprovalRate.map(
                      (month, index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">
                              {month.month} 2024
                            </span>
                            <span className="text-sm font-bold text-green-600">
                              {month.rate}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${month.rate}%` }}
                            ></div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-semibold">
                    Average Quality Score
                  </h4>
                  <div className="space-y-3">
                    {QOC_ANALYTICS_DATA.qualityTrends.qualityScores.map(
                      (month, index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">
                              {month.month} 2024
                            </span>
                            <span className="text-sm font-bold text-blue-600">
                              {month.score}/5
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(month.score / 5) * 100}%` }}
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

          {/* Review Workload */}
          <Card className="bg-card text-card-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                Review Team Workload
              </CardTitle>
              <CardDescription>
                Current workload distribution among reviewers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reviewer</TableHead>
                    <TableHead>Pending Reviews</TableHead>
                    <TableHead>Completed This Month</TableHead>
                    <TableHead>Workload Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {QOC_ANALYTICS_DATA.reviewMetrics.reviewerWorkload.map(
                    (reviewer, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {reviewer.reviewer}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{reviewer.pending}</Badge>
                        </TableCell>
                        <TableCell>{reviewer.completed}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              reviewer.pending > 8
                                ? "destructive"
                                : reviewer.pending > 5
                                  ? "secondary"
                                  : "default"
                            }
                            className={
                              reviewer.pending <= 5 ? "bg-green-500" : ""
                            }
                          >
                            {reviewer.pending > 8
                              ? "High"
                              : reviewer.pending > 5
                                ? "Medium"
                                : "Normal"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            View Queue
                          </Button>
                        </TableCell>
                      </TableRow>
                    ),
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submissions" className="space-y-4">
          <QOCReview />
        </TabsContent>
      </Tabs>
    </div>
  );
}
