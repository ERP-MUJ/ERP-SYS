"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  Clock,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useGetAssignedKpis } from "@/queries/coordinator/kpi";
import type { CoordinatorKpi } from "@/services/coordinator/kpi.service";

const CoordinatorKpisPage = () => {
  const [activeTab, setActiveTab] = useState<string>("assigned");
  const [assignedKpis, setAssignedKpis] = useState<KpiWithMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const session = useSession();
  const router = useRouter();

  // Fetch assigned KPIs for this coordinator
  useEffect(() => {
    const fetchAssignedKpis = async () => {
      if (!session?.data?.user?.id) return;

      setIsLoading(true);
      try {
        // This would be better with a direct coordinator API, but we'll work with what we have
        // We'll use the HOD API to get all pillars and filter for assignments to this coordinator
        const response = await HodKpiService.getDepartmentPillars();

        if (response.data) {
          const kpis: KpiWithMetadata[] = [];

          // Extract KPIs assigned to this coordinator from all pillars
          response.data.forEach((pillar: any) => {
            pillar.department_kpis.forEach((kpi: any) => {
              if (
                kpi.form_responses?.metadata?.coordinator_assignments?.some(
                  (assignment: any) =>
                    assignment.coordinator_id === session.data.user.id,
                )
              ) {
                // This KPI is assigned to the current coordinator
                kpis.push({
                  id: kpi.id,
                  kpi_number: kpi.kpi_number,
                  kpi_metric_name: kpi.kpi_metric_name,
                  kpi_description: kpi.kpi_description,
                  pillar_name: pillar.pillar_name,
                  kpi_status: kpi.kpi_status,
                  coordinator_status:
                    kpi.form_responses?.metadata?.coordinator_status,
                  hod_comments: kpi.form_responses?.metadata?.hod_comments,
                  due_date: kpi.due_date,
                });
              }
            });
          });

          setAssignedKpis(kpis);
        }
      } catch (error) {
        console.error("Error fetching assigned KPIs:", error);
        toast.error("Failed to load your assigned KPIs");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignedKpis();
  }, [session]);

  // Filter KPIs based on active tab
  const filteredKpis = assignedKpis.filter((kpi) => {
    if (activeTab === "assigned") {
      // Show KPIs that have no coordinator status yet, or need revision
      return (
        !kpi.coordinator_status ||
        kpi.coordinator_status === "REVISION_REQUESTED"
      );
    }
    if (activeTab === "submitted") {
      // Show KPIs that are submitted but not yet reviewed
      return kpi.coordinator_status === "PENDING_HOD";
    }
    if (activeTab === "reviewed") {
      // Show KPIs that have been reviewed by the HOD
      return (
        kpi.coordinator_status === "APPROVED_BY_HOD" ||
        kpi.coordinator_status === "REJECTED_BY_HOD"
      );
    }
    return true;
  });

  // Render status badge
  const getStatusBadge = (kpi: KpiWithMetadata) => {
    // First check coordinator status
    if (kpi.coordinator_status) {
      switch (kpi.coordinator_status) {
        case "PENDING_HOD":
          return (
            <Badge className="bg-blue-500">
              <Clock className="mr-1 h-3 w-3" /> Pending HOD Review
            </Badge>
          );
        case "APPROVED_BY_HOD":
          return (
            <Badge className="bg-green-500">
              <CheckCircle className="mr-1 h-3 w-3" /> Approved by HOD
            </Badge>
          );
        case "REJECTED_BY_HOD":
          return (
            <Badge className="bg-red-500">
              <XCircle className="mr-1 h-3 w-3" /> Rejected by HOD
            </Badge>
          );
        case "REVISION_REQUESTED":
          return (
            <Badge className="bg-amber-500">
              <AlertTriangle className="mr-1 h-3 w-3" /> Revision Requested
            </Badge>
          );
      }
    }

    // If no coordinator status, show KPI status
    return <Badge className="bg-gray-500">Not Started</Badge>;
  };

  return (
    <main className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Your Assigned KPIs</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-8">
          <TabsTrigger value="assigned">To Complete</TabsTrigger>
          <TabsTrigger value="submitted">Awaiting Review</TabsTrigger>
          <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          {isLoading ? (
            <Card>
              <CardContent className="pt-6">
                <p>Loading your assigned KPIs...</p>
              </CardContent>
            </Card>
          ) : filteredKpis.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p>No KPIs found in this category.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredKpis.map((kpi) => (
                <Card key={kpi.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between">
                      <CardTitle className="text-base">
                        {kpi.kpi_number}. {kpi.kpi_metric_name}
                      </CardTitle>
                      {getStatusBadge(kpi)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Pillar: {kpi.pillar_name}
                    </p>
                  </CardHeader>
                  <CardContent className="flex-1">
                    {kpi.kpi_description && (
                      <p
                        className="text-sm mb-2 text-muted-foreground line-clamp-2"
                        title={kpi.kpi_description}
                      >
                        {kpi.kpi_description}
                      </p>
                    )}

                    {kpi.hod_comments &&
                      kpi.coordinator_status !== "APPROVED_BY_HOD" && (
                        <div className="mt-2 p-3 bg-muted rounded-md">
                          <p className="text-xs font-semibold">HOD Comments:</p>
                          <p className="text-sm">{kpi.hod_comments}</p>
                        </div>
                      )}

                    {kpi.due_date && (
                      <div className="mt-2 flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-1" />
                        Due: {new Date(kpi.due_date).toLocaleDateString()}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      onClick={() => router.push(`/coordinator/kpi/${kpi.id}`)}
                    >
                      {!kpi.coordinator_status ||
                      kpi.coordinator_status === "REVISION_REQUESTED"
                        ? "Complete KPI"
                        : kpi.coordinator_status === "PENDING_HOD"
                          ? "View Submission"
                          : "View Details"}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default CoordinatorKpisPage;
