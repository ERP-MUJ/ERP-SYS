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
import { Loader2, UserCheck } from "lucide-react";
import {
  useGetDepartments,
  useGetPillarTemplates,
  useAssignPillarAndKpiToAllDepartments,
} from "@/queries/qc/department-assignment";

interface AssignAllButtonProps {
  className?: string;
}

export function AssignAllButton({ className }: AssignAllButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: departments } = useGetDepartments();
  const { data: pillarTemplates } = useGetPillarTemplates();
  const { mutate: assignAll, isPending: isAssigning } =
    useAssignPillarAndKpiToAllDepartments();

  const handleAssignAll = async () => {
    assignAll(undefined, {
      onSuccess: () => {
        setDialogOpen(false);
      },
      // Error is handled by the mutation's onError callback
    });
  };

  const departmentCount = departments?.length || 0;
  const pillarCount = pillarTemplates?.length || 0;
  const totalAssignments = departmentCount * pillarCount;

  return (
    <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <UserCheck className="h-4 w-4 mr-2" />
          Assign All
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Assign All Pillars and KPIs?</AlertDialogTitle>
          <AlertDialogDescription>
            This will assign all your pillar templates and their KPIs to all
            departments.
            <br />
            <br />
            <strong>Assignment Preview:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>{departmentCount} departments will be processed</li>
              <li>{pillarCount} pillar templates will be assigned</li>
              <li>Up to {totalAssignments} total assignments may be created</li>
              <li>Existing assignments will be skipped automatically</li>
            </ul>
            <br />
            This operation may take a few moments to complete.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isAssigning}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleAssignAll}
            disabled={isAssigning}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign All
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
