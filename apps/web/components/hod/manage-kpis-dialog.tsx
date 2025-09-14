import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { Badge } from "@workspace/ui/components/badge";

/**
 * Interface for KPI selection option
 */
interface KPI {
  id: string;
  kpi_metric_name: string;
  kpi_number: number;
  kpi_description?: string;
}

/**
 * Props for the ManageKpisDialog component
 */
interface ManageKpisDialogProps {
  isOpen: boolean;
  onClose: () => void;
  coordinatorName: string;
  kpis: KPI[];
  currentAssignedKpis: string[];
  onSubmit: (data: { selectedKpis: string[] }) => void;
  isLoading?: boolean;
}

/**
 * Dialog component for managing KPI assignments for existing coordinators
 * Allows HOD to add/remove KPIs from coordinators
 */
const ManageKpisDialog: React.FC<ManageKpisDialogProps> = ({
  isOpen,
  onClose,
  coordinatorName,
  kpis,
  currentAssignedKpis,
  onSubmit,
  isLoading = false,
}) => {
  const [selectedKpis, setSelectedKpis] = useState<string[]>([]);

  // Initialize with current assignments when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedKpis([...currentAssignedKpis]);
    }
  }, [isOpen, currentAssignedKpis]);

  /**
   * Handles KPI selection/deselection
   */
  const handleKpiChange = (kpiId: string, checked: boolean) => {
    setSelectedKpis((prev) =>
      checked ? [...prev, kpiId] : prev.filter((id) => id !== kpiId),
    );
  };

  /**
   * Handles form submission
   */
  const handleSubmit = () => {
    onSubmit({ selectedKpis });
  };

  /**
   * Handles dialog close and resets form state
   */
  const handleClose = () => {
    setSelectedKpis([]);
    onClose();
  };

  /**
   * Calculate changes for preview
   */
  const getChanges = () => {
    const toAdd = selectedKpis.filter(
      (kpiId) => !currentAssignedKpis.includes(kpiId),
    );
    const toRemove = currentAssignedKpis.filter(
      (kpiId) => !selectedKpis.includes(kpiId),
    );
    return { toAdd, toRemove };
  };

  const changes = getChanges();
  const hasChanges = changes.toAdd.length > 0 || changes.toRemove.length > 0;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Manage KPI Assignments - {coordinatorName}</DialogTitle>
          <p className="text-sm text-gray-600">
            Select which KPIs this coordinator should have access to.
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Changes Preview */}
          {hasChanges && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                Pending Changes:
              </h4>
              <div className="space-y-2">
                {changes.toAdd.length > 0 && (
                  <div>
                    <span className="text-xs text-green-700 dark:text-green-300 font-medium">
                      Adding ({changes.toAdd.length}):
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {changes.toAdd.map((kpiId) => {
                        const kpi = kpis.find((k) => k.id === kpiId);
                        return kpi ? (
                          <Badge
                            key={kpiId}
                            variant="outline"
                            className="text-xs bg-green-50 text-green-700"
                          >
                            KPI #{kpi.kpi_number}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
                {changes.toRemove.length > 0 && (
                  <div>
                    <span className="text-xs text-red-700 dark:text-red-300 font-medium">
                      Removing ({changes.toRemove.length}):
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {changes.toRemove.map((kpiId) => {
                        const kpi = kpis.find((k) => k.id === kpiId);
                        return kpi ? (
                          <Badge
                            key={kpiId}
                            variant="outline"
                            className="text-xs bg-red-50 text-red-700"
                          >
                            KPI #{kpi.kpi_number}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* KPI Selection */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-medium">
                Select KPIs ({selectedKpis.length} of {kpis.length} selected):
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedKpis(kpis.map((kpi) => kpi.id))}
                  disabled={isLoading}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedKpis([])}
                  disabled={isLoading}
                >
                  Clear All
                </Button>
              </div>
            </div>

            <ScrollArea className="h-80 border rounded-md p-4">
              <div className="space-y-3">
                {kpis.map((kpi) => {
                  const isCurrentlyAssigned = currentAssignedKpis.includes(
                    kpi.id,
                  );
                  const isSelected = selectedKpis.includes(kpi.id);

                  return (
                    <div key={kpi.id} className="flex items-start space-x-3">
                      <Checkbox
                        id={kpi.id}
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          handleKpiChange(kpi.id, checked as boolean)
                        }
                        disabled={isLoading}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <label
                            htmlFor={kpi.id}
                            className="text-sm font-medium cursor-pointer"
                          >
                            KPI #{kpi.kpi_number}: {kpi.kpi_metric_name}
                          </label>
                          {isCurrentlyAssigned && (
                            <Badge variant="secondary" className="text-xs">
                              Currently Assigned
                            </Badge>
                          )}
                        </div>
                        {kpi.kpi_description && (
                          <p className="text-xs text-gray-600 mt-1">
                            {kpi.kpi_description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Summary */}
          <div className="text-sm text-gray-600">
            <p>
              <strong>Current:</strong> {currentAssignedKpis.length} KPIs
              assigned
            </p>
            <p>
              <strong>After update:</strong> {selectedKpis.length} KPIs will be
              assigned
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!hasChanges || isLoading}>
            {isLoading
              ? "Updating..."
              : `Update Assignments${hasChanges ? ` (${changes.toAdd.length + changes.toRemove.length} changes)` : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageKpisDialog;
