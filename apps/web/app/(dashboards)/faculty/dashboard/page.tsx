"use client";

import {
  AlertCircle,
  BarChart3,
  BookOpen,
  CalendarIcon,
  CheckCircle,
  FileText,
  LineChart,
  PieChart,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useGetAssignedKpis } from "@/queries/coordinator/kpi";
import { Badge } from "@workspace/ui/components/badge";
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

export function DashboardContent() {
  const router = useRouter();
  const { data: session } = useSession();
  const { data: kpis } = useGetAssignedKpis();

  const pendingKpis =
    kpis?.filter(
      (kpi) => kpi.kpi_status === "PENDING" || kpi.kpi_status === "REVISION",
    ) || [];

  // Only show coordinator info if user is a KPI coordinator
  if (session?.user?.role !== "KPI_COORDINATOR") {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Faculty Dashboard</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            <CardTitle>KPI Coordinator Assignment</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>
                You are assigned as a KPI Coordinator for your department
              </span>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Your Responsibilities:</p>
              <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                <li>Fill KPI forms for your department</li>
                <li>Submit completed forms for HOD review</li>
                <li>Respond to revision requests promptly</li>
                <li>Monitor KPI status and deadlines</li>
              </ul>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-3">Pending KPIs</h3>
              <div className="space-y-3">
                {pendingKpis.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No pending KPIs to fill
                  </div>
                ) : (
                  pendingKpis.map((kpi) => (
                    <div
                      key={kpi.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <FileText
                          className={`h-4 w-4 ${
                            kpi.kpi_status === "REVISION"
                              ? "text-red-500"
                              : "text-orange-500"
                          }`}
                        />
                        <span className="text-sm">
                          {`KPI ${kpi.kpi_number} - ${kpi.kpi_metric_name}`}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          kpi.kpi_status === "REVISION"
                            ? "text-red-500"
                            : "text-orange-500"
                        }
                      >
                        {kpi.kpi_status === "REVISION"
                          ? "Revision Required"
                          : "Pending"}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
              <Button
                className="w-full mt-4"
                onClick={() => router.push("/faculty/kpi-management")}
              >
                <FileText className="h-4 w-4 mr-2" />
                Go to KPI Management
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
