"use client";

import { Badge } from "@workspace/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
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
  QacDashboardData,
  DepartmentStatus,
} from "@workspace/types/types/qc-dashboard.type";
import { ElementType } from "react";
import { useGetDashboardData } from "@/queries/qc/dashboard";

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
  // Fetch real data using React Query
  const { data, isLoading, error } = useGetDashboardData();

  if (isLoading) return <LoadingSpinner />;
  
  if (error) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-destructive">Failed to load dashboard data</p>
      </div>
    );
  }

  if (!data) return null;

  const { submissionStats, departmentStatus } = data;

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

      {/* Enhanced Table Section - now using departmentStatus */}
      <Card>
        <CardHeader>
          <CardTitle>Department Status Details</CardTitle>
          <CardDescription>
            Detailed overview of each department's configuration and submission
            activity.
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
    </div>
  );
}
