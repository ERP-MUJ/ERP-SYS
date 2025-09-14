import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { ScrollArea } from "@workspace/ui/components/scroll-area";

/**
 * Interface for faculty selection option
 */
interface Faculty {
  value: string;
  label: string;
}

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
 * Props for the AssignDialog component
 */
interface AssignDialogProps {
  isOpen: boolean;
  onClose: () => void;
  faculties: Faculty[];
  kpis: KPI[];
  onSubmit: (data: { facultyId: string; selectedKpis: string[] }) => void;
}

/**
 * Dialog component for assigning faculty as KPI coordinators to specific KPIs
 * Provides a clean interface for HODs to select faculty and assign them to specific KPIs
 */
const AssignDialog: React.FC<AssignDialogProps> = ({
  isOpen,
  onClose,
  faculties,
  kpis,
  onSubmit,
}) => {
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);
  const [selectedKpis, setSelectedKpis] = useState<string[]>([]);

  // Debug logging to check if component is receiving props
  console.log("AssignDialog props:", {
    isOpen,
    faculties: faculties.length,
    kpis: kpis.length,
  });

  /**
   * Handles KPI selection/deselection
   */
  const handleKpiChange = (kpiId: string, checked: boolean) => {
    setSelectedKpis((prev) =>
      checked ? [...prev, kpiId] : prev.filter((id) => id !== kpiId),
    );
  };

  /**
   * Handles form submission when faculty and KPIs are selected
   */
  const handleSubmit = () => {
    if (selectedFaculty && selectedKpis.length > 0) {
      onSubmit({
        facultyId: selectedFaculty,
        selectedKpis: selectedKpis,
      });
      // Reset form state
      setSelectedFaculty(null);
      setSelectedKpis([]);
      onClose();
    }
  };

  /**
   * Handles dialog close and resets form state
   */
  const handleClose = () => {
    setSelectedFaculty(null);
    setSelectedKpis([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign KPI Coordinator</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Select Faculty */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Choose Faculty to Assign:
            </label>
            <Select onValueChange={setSelectedFaculty}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a faculty" />
              </SelectTrigger>
              <SelectContent>
                {faculties.map((faculty) => (
                  <SelectItem key={faculty.value} value={faculty.value}>
                    {faculty.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Select KPIs */}
          {selectedFaculty && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Select KPIs to assign ({selectedKpis.length} selected):
              </label>
              <ScrollArea className="h-60 border rounded-md p-4">
                <div className="space-y-3">
                  {kpis.map((kpi) => (
                    <div key={kpi.id} className="flex items-start space-x-3">
                      <Checkbox
                        id={kpi.id}
                        checked={selectedKpis.includes(kpi.id)}
                        onCheckedChange={(checked) =>
                          handleKpiChange(kpi.id, checked as boolean)
                        }
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={kpi.id}
                          className="text-sm font-medium cursor-pointer"
                        >
                          KPI #{kpi.kpi_number}: {kpi.kpi_metric_name}
                        </label>
                        {kpi.kpi_description && (
                          <p className="text-xs text-gray-600 mt-1">
                            {kpi.kpi_description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              {selectedKpis.length === 0 && selectedFaculty && (
                <p className="text-sm text-gray-500 mt-2">
                  Please select at least one KPI to assign to the coordinator.
                </p>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedFaculty || selectedKpis.length === 0}
          >
            Assign to {selectedKpis.length} KPI
            {selectedKpis.length !== 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignDialog;
