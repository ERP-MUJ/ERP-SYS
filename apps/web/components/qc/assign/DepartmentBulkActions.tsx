"use client";

import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";
import { Loader2, UserPlus, UserMinus } from "lucide-react";

interface PillarData {
  id: string;
  pillar_name: string;
  description?: string | null;
  pillar_value?: number | null;
  percentage_target_achieved?: number | null;
  performance?: number | null;
  academic_year?: number;
  created_at?: string;
  updated_at?: string;
  kpi_templates?: any[];
  pillar_weight?: number | null;
  pillar_target?: number | null;
  departmentPillarId?: string;
  isOrphaned?: boolean;
}

interface DepartmentBulkActionsProps {
  departmentId: string;
  departmentName: string;
  assignedPillars: PillarData[];
  unassignedPillars: PillarData[];
  onAssignAll: (pillars: PillarData[]) => void;
  onUnassignAll: (pillars: PillarData[]) => void;
  isAssigning?: boolean;
  isUnassigning?: boolean;
  className?: string;
}

export function DepartmentBulkActions({
  departmentId,
  departmentName,
  assignedPillars,
  unassignedPillars,
  onAssignAll,
  onUnassignAll,
  isAssigning = false,
  isUnassigning = false,
  className,
}: DepartmentBulkActionsProps) {
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [unassignDialogOpen, setUnassignDialogOpen] = useState(false);

  const handleAssignAll = async () => {
    onAssignAll(unassignedPillars);
    setAssignDialogOpen(false);
  };

  const handleUnassignAll = async () => {
    // Only include regular assigned pillars (not orphaned ones)
    const regularPillars = assignedPillars.filter((p) => !p.isOrphaned);
    onUnassignAll(regularPillars);
    setUnassignDialogOpen(false);
  };

  const regularAssignedCount = assignedPillars.filter(
    (p) => !p.isOrphaned,
  ).length;
  const orphanedCount = assignedPillars.filter((p) => p.isOrphaned).length;

  return (
    <div className={`flex gap-2 ${className}`}>
      {/* Assign All Available Button */}
      {unassignedPillars.length > 0 && (
        <AlertDialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Assign All Available
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Assign All Available Pillars?</AlertDialogTitle>
              <AlertDialogDescription>
                This will assign all available pillar templates to{" "}
                <strong>{departmentName}</strong>.
                <br />
                <br />
                <strong>Assignment Preview:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>
                    {unassignedPillars.length} pillar templates will be assigned
                  </li>
                  <li>Default weights and targets will be applied</li>
                  <li>All KPIs within these pillars will also be assigned</li>
                </ul>
                <br />
                You can adjust individual pillar weights and targets after
                assignment.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isAssigning}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleAssignAll}
                disabled={isAssigning}
                className="bg-green-600 hover:bg-green-700"
              >
                {isAssigning && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Assign All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Unassign All Button */}
      {regularAssignedCount > 0 && (
        <AlertDialog
          open={unassignDialogOpen}
          onOpenChange={setUnassignDialogOpen}
        >
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm">
              <UserMinus className="h-4 w-4 mr-2" />
              Unassign All
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unassign All Pillars?</AlertDialogTitle>
              <AlertDialogDescription>
                This will unassign all regular pillar assignments from{" "}
                <strong>{departmentName}</strong>.
                <br />
                <br />
                <strong>Unassignment Preview:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>
                    {regularAssignedCount} regular pillar assignments will be
                    removed
                  </li>
                  <li>All associated KPI assignments will also be removed</li>
                  <li>
                    Historical data and form responses will be permanently
                    deleted
                  </li>
                  {orphanedCount > 0 && (
                    <li className="text-orange-600">
                      {orphanedCount} orphaned pillar(s) will remain (to
                      preserve historical data)
                    </li>
                  )}
                </ul>
                <br />
                <span className="text-red-600 font-medium">
                  This action cannot be undone!
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isUnassigning}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleUnassignAll}
                disabled={isUnassigning}
                className="bg-red-600 hover:bg-red-700"
              >
                {isUnassigning && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Unassign All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
