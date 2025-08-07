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

/**
 * Interface for faculty selection option
 */
interface Faculty {
  value: string;
  label: string;
}

/**
 * Props for the AssignDialog component
 */
interface AssignDialogProps {
  isOpen: boolean;
  onClose: () => void;
  faculties: Faculty[];
  onSubmit: (data: { facultyId: string }) => void;
}

/**
 * Dialog component for assigning faculty as KPI coordinators
 * Provides a clean interface for HODs to select faculty and assign them as coordinators
 */
const AssignDialog: React.FC<AssignDialogProps> = ({
  isOpen,
  onClose,
  faculties,
  onSubmit,
}) => {
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);

  /**
   * Handles form submission when faculty is selected
   */
  const handleSubmit = () => {
    if (selectedFaculty) {
      onSubmit({
        facultyId: selectedFaculty,
      });
      onClose(); // Close the dialog after submission
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign KPI Coordinator</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
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
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedFaculty}
          >
            Assign as KPI Coordinator
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignDialog;
