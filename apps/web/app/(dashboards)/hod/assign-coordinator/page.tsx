"use client";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar";
import { Button } from "@workspace/ui/components/button";
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
import { Badge } from "@workspace/ui/components/badge";
import { AlertCircle, Loader2, UserPlus, Plus, Settings } from "lucide-react";
import { toast } from "sonner";
import AssignDialog from "@/components/hod/assign-dialog";
import ManageKpisDialog from "@/components/hod/manage-kpis-dialog";
import {
  useGetDepartmentFaculty,
  useAssignCoordinator,
  useGetDepartmentKpis,
  useAssignCoordinatorToKpi,
  useRemoveCoordinatorFromKpi,
} from "@/queries/hod/coordinator";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";

/**
 * HOD page for managing KPI coordinators with specific KPI assignments
 * Allows HOD to assign faculty as coordinators to specific KPIs using assigned_users relationship
 */
export default function KPICoordinatorsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUnassignDialogOpen, setIsUnassignDialogOpen] = useState(false);
  const [isManageKpisDialogOpen, setIsManageKpisDialogOpen] = useState(false);
  const [selectedCoordinator, setSelectedCoordinator] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [coordinatorForKpiManagement, setCoordinatorForKpiManagement] =
    useState<{
      id: string;
      name: string;
      assignedKpis: string[];
    } | null>(null);

  // Fetch data from APIs
  const {
    data: facultyData = [],
    isLoading: facultyLoading,
    error: facultyError,
  } = useGetDepartmentFaculty();

  const {
    data: kpisData = [],
    isLoading: kpisLoading,
    error: kpisError,
  } = useGetDepartmentKpis();

  const assignCoordinatorMutation = useAssignCoordinator();
  const assignCoordinatorToKpiMutation = useAssignCoordinatorToKpi();
  const removeCoordinatorFromKpiMutation = useRemoveCoordinatorFromKpi();

  // Separate coordinators and regular faculty
  const coordinators = facultyData.filter(
    (faculty) => faculty.user_role === "KPI_COORDINATOR",
  );
  const regularFaculty = facultyData.filter(
    (faculty) => faculty.user_role === "FACULTY",
  );

  // Handle assigning faculty as coordinator with specific KPIs
  const handleAssignSubmit = (data: {
    facultyId: string;
    selectedKpis: string[];
  }) => {
    // First assign the faculty as coordinator role
    assignCoordinatorMutation.mutate(
      {
        faculty_id: data.facultyId,
        new_role: "KPI_COORDINATOR",
      },
      {
        onSuccess: () => {
          // Then assign coordinator to specific KPIs
          const assignPromises = data.selectedKpis.map((kpiId) =>
            assignCoordinatorToKpiMutation.mutateAsync({
              kpiId,
              coordinatorId: data.facultyId,
            }),
          );

          Promise.all(assignPromises)
            .then(() => {
              setIsDialogOpen(false);
              toast.success(
                `Coordinator assigned to ${data.selectedKpis.length} KPI(s) successfully`,
              );
            })
            .catch((error) => {
              toast.error("Failed to assign coordinator to some KPIs", {
                description: error.message,
              });
            });
        },
        onError: (error) => {
          toast.error("Failed to assign coordinator role", {
            description: error.message,
          });
        },
      },
    );
  };

  // Handle unassigning coordinator role (removes from all KPIs)
  const handleUnassign = () => {
    if (!selectedCoordinator) return;

    assignCoordinatorMutation.mutate(
      {
        faculty_id: selectedCoordinator.id,
        new_role: "FACULTY",
      },
      {
        onSuccess: () => {
          setIsUnassignDialogOpen(false);
          setSelectedCoordinator(null);
          toast.success("Coordinator role unassigned successfully");
        },
        onError: (error) => {
          toast.error("Failed to unassign coordinator", {
            description: error.message,
          });
        },
      },
    );
  };

  // Open KPI management dialog for existing coordinator
  const openManageKpisDialog = (coordinator: {
    id: string;
    user_name: string;
  }) => {
    const assignedKpis = kpisData
      .filter((kpi) =>
        kpi.assigned_users?.some((user) => user.id === coordinator.id),
      )
      .map((kpi) => kpi.id);

    setCoordinatorForKpiManagement({
      id: coordinator.id,
      name: coordinator.user_name,
      assignedKpis: assignedKpis,
    });
    setIsManageKpisDialogOpen(true);
  };

  // Handle KPI assignment updates for existing coordinator
  const handleKpiAssignmentUpdate = (data: { selectedKpis: string[] }) => {
    if (!coordinatorForKpiManagement) return;

    const currentKpis = coordinatorForKpiManagement.assignedKpis;
    const newKpis = data.selectedKpis;

    // Find KPIs to add and remove
    const kpisToAdd = newKpis.filter((kpiId) => !currentKpis.includes(kpiId));
    const kpisToRemove = currentKpis.filter(
      (kpiId) => !newKpis.includes(kpiId),
    );

    const promises: Promise<any>[] = [];

    // Add new KPI assignments
    kpisToAdd.forEach((kpiId) => {
      promises.push(
        assignCoordinatorToKpiMutation.mutateAsync({
          kpiId,
          coordinatorId: coordinatorForKpiManagement.id,
        }),
      );
    });

    // Remove KPI assignments
    kpisToRemove.forEach((kpiId) => {
      promises.push(
        removeCoordinatorFromKpiMutation.mutateAsync({
          kpiId,
          coordinatorId: coordinatorForKpiManagement.id,
        }),
      );
    });

    Promise.all(promises)
      .then(() => {
        setIsManageKpisDialogOpen(false);
        setCoordinatorForKpiManagement(null);
        toast.success(
          `KPI assignments updated for ${coordinatorForKpiManagement.name}`,
        );
      })
      .catch((error) => {
        toast.error("Failed to update KPI assignments", {
          description: error.message,
        });
      });
  };

  // Open unassign confirmation dialog
  const openUnassignDialog = (coordinator: {
    id: string;
    user_name: string;
  }) => {
    setSelectedCoordinator({ id: coordinator.id, name: coordinator.user_name });
    setIsUnassignDialogOpen(true);
  };

  // Loading state
  if (facultyLoading || kpisLoading) {
    return (
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (facultyError || kpisError) {
    return (
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
              <p className="text-red-600 mt-2">Failed to load data</p>
              <p className="text-sm text-gray-600 mt-1">
                {facultyError?.message || kpisError?.message}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>KPI Coordinators</CardTitle>
            <CardDescription>
              Assign faculty as KPI coordinators and manage their specific KPI
              assignments.
            </CardDescription>
          </div>
          <Button
            onClick={() => setIsDialogOpen(true)}
            disabled={
              regularFaculty.length === 0 ||
              kpisData.length === 0 ||
              assignCoordinatorMutation.isPending ||
              assignCoordinatorToKpiMutation.isPending
            }
          >
            {assignCoordinatorMutation.isPending ||
            assignCoordinatorToKpiMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="mr-2 h-4 w-4" />
            )}
            Assign Coordinator
          </Button>
        </CardHeader>
        <CardContent>
          {/* Assign Dialog with KPI Selection */}
          <AssignDialog
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            faculties={regularFaculty.map((faculty) => ({
              value: faculty.id,
              label: faculty.user_name,
            }))}
            kpis={kpisData.map((kpi) => ({
              id: kpi.id,
              kpi_metric_name: kpi.kpi_metric_name,
              kpi_number: kpi.kpi_number,
              kpi_description: kpi.kpi_description,
            }))}
            onSubmit={handleAssignSubmit}
          />

          {/* Manage KPIs Dialog */}
          <ManageKpisDialog
            isOpen={isManageKpisDialogOpen}
            onClose={() => {
              setIsManageKpisDialogOpen(false);
              setCoordinatorForKpiManagement(null);
            }}
            coordinatorName={coordinatorForKpiManagement?.name || ""}
            kpis={kpisData.map((kpi) => ({
              id: kpi.id,
              kpi_metric_name: kpi.kpi_metric_name,
              kpi_number: kpi.kpi_number,
              kpi_description: kpi.kpi_description,
            }))}
            currentAssignedKpis={
              coordinatorForKpiManagement?.assignedKpis || []
            }
            onSubmit={handleKpiAssignmentUpdate}
            isLoading={
              assignCoordinatorToKpiMutation.isPending ||
              removeCoordinatorFromKpiMutation.isPending
            }
          />

          {/* Unassign Confirmation Dialog */}
          <AlertDialog
            open={isUnassignDialogOpen}
            onOpenChange={setIsUnassignDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Unassign KPI Coordinator</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to unassign {selectedCoordinator?.name}{" "}
                  as a KPI Coordinator? This will remove them from all assigned
                  KPIs and return them to regular faculty status.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  disabled={assignCoordinatorMutation.isPending}
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleUnassign}
                  disabled={assignCoordinatorMutation.isPending}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {assignCoordinatorMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Unassigning...
                    </>
                  ) : (
                    "Unassign Role"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Coordinators Table with KPI Assignments */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Coordinator</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Assigned KPIs</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coordinators.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-gray-500"
                  >
                    No KPI coordinators assigned yet. Click "Assign Coordinator"
                    to get started.
                  </TableCell>
                </TableRow>
              ) : (
                coordinators.map((coordinator) => {
                  // Find KPIs assigned to this coordinator
                  const assignedKpis = kpisData.filter((kpi) =>
                    kpi.assigned_users?.some(
                      (user) => user.id === coordinator.id,
                    ),
                  );

                  return (
                    <TableRow key={coordinator.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback>
                              {coordinator.user_name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {coordinator.user_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{coordinator.user_email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-md">
                          {assignedKpis.length > 0 ? (
                            <>
                              {assignedKpis.map((kpi) => (
                                <div
                                  key={kpi.id}
                                  className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md"
                                >
                                  <span className="text-xs font-medium">
                                    KPI #{kpi.kpi_number}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
                                    onClick={() => {
                                      removeCoordinatorFromKpiMutation.mutate(
                                        {
                                          kpiId: kpi.id,
                                          coordinatorId: coordinator.id,
                                        },
                                        {
                                          onSuccess: () => {
                                            toast.success(
                                              `Removed coordinator from KPI #${kpi.kpi_number}`,
                                            );
                                          },
                                          onError: (error) => {
                                            toast.error(
                                              "Failed to remove coordinator from KPI",
                                              {
                                                description: error.message,
                                              },
                                            );
                                          },
                                        },
                                      );
                                    }}
                                    disabled={
                                      removeCoordinatorFromKpiMutation.isPending
                                    }
                                    title={`Remove from KPI #${kpi.kpi_number}: ${kpi.kpi_metric_name}`}
                                  >
                                    ×
                                  </Button>
                                </div>
                              ))}
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-xs text-green-600 hover:bg-green-50 hover:text-green-700 border-green-200"
                                onClick={() =>
                                  openManageKpisDialog(coordinator)
                                }
                                disabled={
                                  assignCoordinatorToKpiMutation.isPending ||
                                  removeCoordinatorFromKpiMutation.isPending
                                }
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add KPI
                              </Button>
                            </>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                No KPIs assigned
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-xs text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                onClick={() =>
                                  openManageKpisDialog(coordinator)
                                }
                                disabled={
                                  assignCoordinatorToKpiMutation.isPending ||
                                  removeCoordinatorFromKpiMutation.isPending
                                }
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Assign KPIs
                              </Button>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={
                            assignedKpis.length > 0 ? "active" : "inactive"
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                            onClick={() => openManageKpisDialog(coordinator)}
                            disabled={
                              assignCoordinatorMutation.isPending ||
                              assignCoordinatorToKpiMutation.isPending ||
                              removeCoordinatorFromKpiMutation.isPending
                            }
                          >
                            <Settings className="mr-1 h-3 w-3" />
                            Manage KPIs
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => openUnassignDialog(coordinator)}
                            disabled={assignCoordinatorMutation.isPending}
                          >
                            {assignCoordinatorMutation.isPending &&
                            assignCoordinatorMutation.variables?.faculty_id ===
                              coordinator.id ? (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : null}
                            Unassign Role
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Warning Messages */}
          {kpisData.length === 0 && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm font-medium">No KPIs available</p>
              </div>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                There are no KPIs in your department to assign coordinators to.
                KPIs need to be created first.
              </p>
            </div>
          )}

          {regularFaculty.length === 0 && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm font-medium">No faculty available</p>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                All faculty members in your department are already assigned as
                coordinators.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
