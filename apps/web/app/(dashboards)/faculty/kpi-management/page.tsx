"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { TrendingUp, BarChart3 } from "lucide-react";
import { useSession } from "next-auth/react";

import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
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
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@workspace/ui/components/table";
import { Badge } from "@workspace/ui/components/badge";
import { useGetDepartmentPillars } from "@/queries/hod/kpi";
import { useGetAssignedKpis } from "@/queries/coordinator/kpi";
import { type DerivedDisplayStatus } from "@/lib/qc-status";
import { StatusBadge } from "@/components/common/StatusBadge";

export default function KpiManagementPage() {
  const { data: session } = useSession();
  const [selectedPillarId, setSelectedPillarId] = useState<string>("");

  const isCoordinator = session?.user?.role === "KPI_COORDINATOR";
  const isFaculty = session?.user?.role === "FACULTY";

  // Fetch data based on user role
  // Coordinators: Only see assigned KPIs
  // Faculty: No access to KPIs
  // HOD: See all department KPIs (but HODs use different dashboard)
  const {
    data: assignedKpis,
    isLoading: isAssignedKpisLoading,
    error: assignedKpisError,
  } = useGetAssignedKpis();

  const {
    data: pillarsData,
    isLoading: isPillarsLoading,
    error: pillarsError,
  } = useGetDepartmentPillars();

  // For coordinators, transform assigned KPIs to pillar format
  const pillars = useMemo(() => {
    if (isCoordinator && assignedKpis) {
      // Group assigned KPIs by pillar
      const pillarMap = new Map();

      assignedKpis.forEach((kpi: any) => {
        const pillarName =
          kpi.department_pillar?.pillar_name || "Unknown Pillar";
        const pillarkId = kpi.dept_pillar_id;

        if (!pillarMap.has(pillarkId)) {
          pillarMap.set(pillarkId, {
            id: pillarkId,
            pillar_name: pillarName,
            kpis: [],
          });
        }

        pillarMap.get(pillarkId).kpis.push(kpi);
      });

      return Array.from(pillarMap.values());
    }

    return Array.isArray(pillarsData) ? pillarsData : [];
  }, [isCoordinator, assignedKpis, pillarsData]);

  const isLoading = isCoordinator ? isAssignedKpisLoading : isPillarsLoading;
  const error = isCoordinator ? assignedKpisError : pillarsError;

  const selectedPillar = useMemo(() => {
    return pillars.find((pillar: any) => pillar.id === selectedPillarId);
  }, [pillars, selectedPillarId]);

  // Faculty access control - only coordinators can access KPIs
  if (isFaculty) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              Access Restricted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <BarChart3 className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                KPI Management Access Required
              </h3>
              <p className="text-gray-600 mb-4">
                You need to be assigned as a KPI Coordinator by your HOD to
                access KPI management features.
              </p>
              <p className="text-sm text-gray-500">
                Contact your Head of Department to request coordinator access
                for specific KPIs.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Transform KPI data for the table
  const transformedKpis = useMemo(() => {
    // Handle different data structures based on user role
    const kpiList = isCoordinator
      ? selectedPillar?.kpis || [] // Coordinators use assigned KPIs
      : selectedPillar?.department_kpis || []; // Others use department KPIs

    if (kpiList.length === 0) return [];

    const mapDisplayToStatusType = (
      display: string,
    ): { type: string; label: string } => {
      switch (display) {
        case "Pending":
          return { type: "pending", label: "Pending" };
        case "Awaiting HOD":
          return { type: "waiting", label: "Awaiting HOD" };
        case "HOD Approved":
          return { type: "approved", label: "HOD Approved" };
        case "Approved (QC)":
          return { type: "approved", label: "Approved (QC)" };
        case "HOD Rejected":
        case "Rejected":
          return { type: "rejected", label: display };
        case "Needs Revision":
          return { type: "revision", label: "Needs Revision" };
        case "Overdue":
          return { type: "overdue", label: "Overdue" };
        default:
          return { type: "pending", label: display };
      }
    };

    return kpiList.map((kpi: any, idx: number) => {
      const cw = kpi.form_responses?.coordinator_workflow;
      const baseStatus: string = kpi.kpi_status || "PENDING";

      let display: string;
      if (isCoordinator) {
        // If QC has finalized, override with QC status (except REVISION which is handled via HOD revision request to coordinator)
        if (baseStatus === "REJECTED") {
          display = "Rejected";
        } else if (baseStatus === "APPROVED") {
          display = "Approved (QC)";
        } else {
          const coordState = cw?.coordinator_status;
          switch (coordState) {
            case "SUBMITTED":
              display = "Awaiting HOD";
              break;
            case "APPROVED_BY_HOD":
              // HOD approved but QC not yet acted (kpi_status still PENDING)
              display = "HOD Approved";
              break;
            case "REJECTED_BY_HOD":
              display = "HOD Rejected";
              break;
            case "REVISION_REQUESTED":
              display = "Needs Revision";
              break;
            default:
              display = "Pending";
          }
        }
      } else {
        // Non-coordinator (HOD/faculty) view retains previous logic
        if (baseStatus === "PENDING") {
          display = kpi.form_responses?.entries?.length
            ? "Awaiting Approval"
            : "Pending";
        } else if (baseStatus === "APPROVED") display = "Approved";
        else if (baseStatus === "REJECTED") display = "Rejected";
        else if (baseStatus === "REVISION") display = "Revision Requested";
        else if (baseStatus === "OVERDUE") display = "Overdue";
        else display = baseStatus;
      }

      const { type: statusType, label } = mapDisplayToStatusType(display);

      return {
        id: kpi.id,
        kpi_no: idx + 1,
        metric: kpi.kpi_metric_name,
        target: kpi.kpi_value?.toString() || "0",
        actual: kpi.percentage_target_achieved?.toString() || "0",
        targetAchieved:
          kpi.percentage_target_achieved && kpi.kpi_value
            ? `${((kpi.percentage_target_achieved / kpi.kpi_value) * 100).toFixed(0)}%`
            : "0%",
        dataProvider: kpi.data_provided_by || "Department",
        statusDisplay: display,
        statusType,
        statusLabel: label,
        hodRemark: isCoordinator
          ? cw?.latest_hod_remark ||
            (display.includes("Rejected") || display.includes("Needs Revision")
              ? kpi.comments
              : undefined)
          : undefined,
        coordinatorStatusRaw: cw?.coordinator_status,
      };
    });
  }, [selectedPillar, session]);

  // Get status badge variant
  // Not needed with StatusBadge mapping, placeholder retained for future
  const getStatusBadgeVariant = (_status: string) => "pending";

  if (isLoading) {
    return (
      <main className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading KPI data...</p>
          </div>
        </div>
      </main>
    );
  }

  // Show error state
  if (error) {
    return (
      <main className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <TrendingUp className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Failed to load KPI data
              </h3>
              <p className="text-gray-600">
                {error.message || "An error occurred while loading your KPIs."}
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Show message if coordinator has no assigned KPIs
  if (isCoordinator && pillars.length === 0) {
    return (
      <main className="container mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              KPI Coordinator Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <BarChart3 className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No KPIs Assigned
              </h3>
              <p className="text-gray-600 mb-4">
                You haven't been assigned to any KPIs yet.
              </p>
              <p className="text-sm text-gray-500">
                Contact your Head of Department to get assigned to specific KPIs
                you'll be responsible for managing.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            {session?.user?.role === "KPI_COORDINATOR"
              ? "KPI Coordinator Dashboard"
              : "KPI Management"}
          </h1>
          <p className="text-gray-600 mt-2">
            {session?.user?.role === "KPI_COORDINATOR"
              ? "View and manage your assigned KPIs"
              : "Select a pillar to view and manage your KPIs"}
          </p>
        </div>
      </div>

      {/* Pillar Selection */}
      <div className="mb-8">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-4">
            <label htmlFor="pillar-select" className="text-sm font-medium">
              Select Pillar:
            </label>
            <Select
              value={selectedPillarId}
              onValueChange={setSelectedPillarId}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Choose a pillar to view KPIs" />
              </SelectTrigger>
              <SelectContent>
                {pillars.map((pillar: any) => (
                  <SelectItem key={pillar.id} value={pillar.id}>
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4" />
                      <span>{pillar.pillar_name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* KPI Table */}
      {!selectedPillarId ? (
        <div className="text-center py-12">
          <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Select a Pillar to Get Started
          </h3>
          <p className="text-gray-500">
            Choose a pillar from the dropdown above to view and manage your KPIs
          </p>
        </div>
      ) : transformedKpis.length === 0 ? (
        <div className="text-center py-12">
          <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No KPIs Found
          </h3>
          <p className="text-gray-500">
            No KPIs are available for the selected pillar
          </p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedPillar?.pillar_name} - KPI List
              {session?.user?.role === "KPI_COORDINATOR" && (
                <Badge variant="outline" className="ml-2">
                  Coordinator View
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>KPI No</TableHead>
                  <TableHead>Metric</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Actual</TableHead>
                  <TableHead>Target Achieved</TableHead>
                  <TableHead>Data Provided By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transformedKpis.map((kpi: any) => {
                  // Coordinators now can view all KPIs in department (no per-KPI assignment filtering)

                  return (
                    <TableRow key={kpi.id}>
                      <TableCell>{kpi.kpi_no}</TableCell>
                      <TableCell>{kpi.metric}</TableCell>
                      <TableCell>{kpi.target}</TableCell>
                      <TableCell>{kpi.actual}</TableCell>
                      <TableCell>{kpi.targetAchieved}</TableCell>
                      <TableCell>{kpi.dataProvider}</TableCell>
                      <TableCell>
                        <StatusBadge
                          status={kpi.statusType}
                          label={kpi.statusLabel}
                          className="cursor-default"
                        />
                      </TableCell>
                      <TableCell>
                        <Link href={`/faculty/kpi-management/${kpi.id}`}>
                          <Button size="sm">
                            {session?.user?.role === "KPI_COORDINATOR"
                              ? kpi.coordinatorStatus === "PENDING"
                                ? "Fill KPI"
                                : "View KPI"
                              : "Open KPI"}
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Removed per-KPI assignment message per new global coordinator access */}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
