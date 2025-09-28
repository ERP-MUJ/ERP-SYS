/**
 * Department Assignment Sections Component
 * Manages the three main sections: Current Assigned, Available Templates, and Archived
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { AssignPillarTable } from "./AssignPillarTable";
import { DepartmentBulkActions } from "./DepartmentBulkActions";
import { EmptyState } from "@/components/common/EmptyState";
import { PillarData } from "@/lib/types/qc-assignment";

interface Department {
  id: string;
  dept_name: string;
}

interface DepartmentAssignmentSectionsProps {
  selectedDepartment: Department;
  assignedPillars: PillarData[];
  unassignedPillars: PillarData[];
  archivedPillars: any[];
  onAssign: (pillar: any) => void;
  onUnassign: (pillar: PillarData) => void;
  onUpdate: (pillar: PillarData, weight?: number, target?: number) => void;
  onView: (pillarId: string) => void;
  onDelete: (pillar: PillarData) => void;
  onRestore: (pillar: PillarData) => void;
  onBulkAssignAll: (pillars: PillarData[]) => void;
  onBulkUnassignAll: (pillars: PillarData[]) => void;
  mutations: {
    assignPillarMutation: any;
    unassignPillarMutation: any;
  };
}

export function DepartmentAssignmentSections({
  selectedDepartment,
  assignedPillars,
  unassignedPillars,
  archivedPillars,
  onAssign,
  onUnassign,
  onUpdate,
  onView,
  onDelete,
  onRestore,
  onBulkAssignAll,
  onBulkUnassignAll,
  mutations,
}: DepartmentAssignmentSectionsProps) {
  return (
    <div className="space-y-6">
      {/* Currently Assigned Pillars Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Currently Assigned Pillars</CardTitle>
            {assignedPillars.length > 0 && (
              <DepartmentBulkActions
                departmentId={selectedDepartment.id}
                departmentName={selectedDepartment.dept_name}
                assignedPillars={assignedPillars}
                unassignedPillars={[]}
                onAssignAll={() => {}}
                onUnassignAll={onBulkUnassignAll}
                isUnassigning={mutations.unassignPillarMutation.isPending}
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {assignedPillars.length > 0 ? (
            <AssignPillarTable
              assignedPillars={assignedPillars}
              unassignedPillars={[]}
              onAssign={onAssign}
              onUnassign={onUnassign}
              onUpdate={onUpdate}
              onView={onView}
              onDelete={onDelete}
              mode="assigned"
            />
          ) : (
            <EmptyState
              title="No pillars currently assigned to this department."
              description="Assign pillars from the available templates below."
            />
          )}
        </CardContent>
      </Card>

      {/* Available Templates Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Available Pillar Templates</CardTitle>
            {unassignedPillars.length > 0 && (
              <DepartmentBulkActions
                departmentId={selectedDepartment.id}
                departmentName={selectedDepartment.dept_name}
                assignedPillars={[]}
                unassignedPillars={unassignedPillars}
                onAssignAll={onBulkAssignAll}
                onUnassignAll={() => {}}
                isAssigning={mutations.assignPillarMutation.isPending}
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {unassignedPillars.length > 0 ? (
            <AssignPillarTable
              assignedPillars={[]}
              unassignedPillars={unassignedPillars}
              onAssign={onAssign}
              onUnassign={onUnassign}
              onUpdate={onUpdate}
              onView={onView}
              mode="available"
            />
          ) : (
            <EmptyState
              title="All available pillar templates have been assigned."
              description="You can manage assigned pillars in the section above."
            />
          )}
        </CardContent>
      </Card>

      {/* Archived Pillars Section */}
      {archivedPillars.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>Archived Pillars</span>
              <Badge
                variant="secondary"
                className="bg-orange-100 text-orange-700"
              >
                {archivedPillars.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">
                    <strong>✓ Database-Preserved Data:</strong> These pillars
                    are safely archived in the database with all historical data
                    intact. No data loss on page refresh. All KPI responses and
                    performance metrics are permanently stored and can be
                    restored anytime.
                  </p>
                </div>
              </div>
            </div>
            <AssignPillarTable
              assignedPillars={archivedPillars.map((dp) => ({
                id: dp.id,
                pillar_name: dp.pillar_name,
                description: dp.description,
                pillar_value: null,
                percentage_target_achieved: dp.percentage_target_achieved,
                performance: dp.performance,
                academic_year: dp.academic_year,
                created_at: dp.assigned_date,
                updated_at: dp.assigned_date,
                kpi_templates: [],
                departmentPillarId: dp.id,
                pillar_weight: dp.pillar_weight,
                pillar_target: dp.pillar_target,
                isOrphaned: true,
              }))}
              unassignedPillars={[]}
              onAssign={onAssign}
              onUnassign={onRestore}
              onUpdate={onUpdate}
              onView={onView}
              mode="archived"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
