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
import { AlertCircle, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import AssignDialog from "@/components/hod/assign-dialog";
import {
  useGetDepartmentFaculty,
  useAssignCoordinator,
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
 * HOD page for managing KPI coordinators
 * Allows HOD to assign/unassign faculty as KPI coordinators
 */
export default function KPICoordinatorsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUnassignDialogOpen, setIsUnassignDialogOpen] = useState(false);
  const [selectedCoordinator, setSelectedCoordinator] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Fetch real data from APIs
  const {
    data: facultyData = [],
    isLoading,
    error,
  } = useGetDepartmentFaculty();
  const assignCoordinatorMutation = useAssignCoordinator();

  // Separate coordinators and regular faculty
  const coordinators = facultyData.filter(
    (faculty) => faculty.user_role === "KPI_COORDINATOR",
  );
  const regularFaculty = facultyData.filter(
    (faculty) => faculty.user_role === "FACULTY",
  );

  // Handle assigning a faculty as KPI coordinator
  const handleAssignSubmit = (data: { facultyId: string }) => {
    assignCoordinatorMutation.mutate(
      {
        faculty_id: data.facultyId,
        new_role: "KPI_COORDINATOR",
      },
      {
        onSuccess: () => {
          setIsDialogOpen(false);
        },
        onError: (error) => {
          toast.error("Failed to assign coordinator", {
            description: error.message,
          });
        },
      },
    );
  };

  // Open confirmation dialog for unassigning
  const openUnassignDialog = (coordinator: {
    id: string;
    user_name: string;
  }) => {
    setSelectedCoordinator({ id: coordinator.id, name: coordinator.user_name });
    setIsUnassignDialogOpen(true);
  };

  // Handle unassigning a coordinator back to faculty
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
        },
        onError: (error) => {
          toast.error("Failed to unassign coordinator", {
            description: error.message,
          });
        },
      },
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">
                Loading faculty data...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
              <p className="text-red-600 mt-2">Failed to load faculty data</p>
              <p className="text-sm text-gray-600 mt-1">{error.message}</p>
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
              Manage and assign KPI coordinators for your department.
            </CardDescription>
          </div>
          <Button
            onClick={() => setIsDialogOpen(true)}
            disabled={
              regularFaculty.length === 0 || assignCoordinatorMutation.isPending
            }
          >
            {assignCoordinatorMutation.isPending &&
            assignCoordinatorMutation.variables?.new_role ===
              "KPI_COORDINATOR" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="mr-2 h-4 w-4" />
            )}
            Assign Coordinator
          </Button>
        </CardHeader>
        <CardContent>
          <AssignDialog
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            faculties={regularFaculty.map((faculty) => ({
              value: faculty.id,
              label: faculty.user_name,
            }))}
            onSubmit={handleAssignSubmit}
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
                  as a KPI Coordinator? They will be returned to regular faculty
                  status.
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
                  {assignCoordinatorMutation.isPending &&
                  assignCoordinatorMutation.variables?.new_role ===
                    "FACULTY" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Unassigning...
                    </>
                  ) : (
                    "Unassign"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Coordinators Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Coordinator</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
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
                    No KPI coordinators assigned yet. Click &quot;Assign
                    Coordinator&quot; to get started.
                  </TableCell>
                </TableRow>
              ) : (
                coordinators.map((coordinator) => (
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
                      <Badge variant="secondary">KPI Coordinator</Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status="active" />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/50 dark:hover:text-red-300"
                          onClick={() => openUnassignDialog(coordinator)}
                          disabled={assignCoordinatorMutation.isPending}
                        >
                          {assignCoordinatorMutation.isPending &&
                          assignCoordinatorMutation.variables?.faculty_id ===
                            coordinator.id ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : null}
                          Unassign
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
