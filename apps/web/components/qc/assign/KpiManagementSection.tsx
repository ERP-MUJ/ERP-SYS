/**
 * KPI Management Section Component
 * Handles KPI assignment and management for selected pillar
 */

import { forwardRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { AssignKpiTable } from "./AssignKpiTable";
import { KpiData, PillarData } from "@/lib/types/qc-assignment";

interface KpiManagementSectionProps {
  selectedPillarId: string;
  selectedPillar: PillarData | null;
  assignedKpis: KpiData[];
  unassignedKpis: KpiData[];
  isOrphanedPillar: boolean;
  kpisLoading: boolean;
  shouldFetchDepartmentKPIs: boolean;
  onAssignKpi: (kpi: KpiData, weightage: number, target?: number) => void;
  onUnassignKpi: (kpi: KpiData) => void;
  onUpdateKpi: (kpi: KpiData, weightage?: number, target?: number) => void;
}

export const KpiManagementSection = forwardRef<
  HTMLDivElement,
  KpiManagementSectionProps
>(
  (
    {
      selectedPillarId,
      selectedPillar,
      assignedKpis,
      unassignedKpis,
      isOrphanedPillar,
      kpisLoading,
      shouldFetchDepartmentKPIs,
      onAssignKpi,
      onUnassignKpi,
      onUpdateKpi,
    },
    ref,
  ) => {
    if (!selectedPillarId) return null;

    return (
      <Card ref={ref}>
        <CardHeader>
          <CardTitle>
            {selectedPillar?.pillar_name || "KPIs for Pillar"}
          </CardTitle>
          {isOrphanedPillar && (
            <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mt-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-orange-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-orange-700">
                    <strong>Template Deleted:</strong> This pillar's original
                    template has been deleted. You can only manage existing KPIs
                    and unassign this pillar. New KPIs cannot be added.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {/* Show loading only when fetching department KPIs for assigned pillars */}
          {kpisLoading && shouldFetchDepartmentKPIs ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading KPIs...</p>
              </div>
            </div>
          ) : isOrphanedPillar ? (
            <div className="space-y-4">
              {assignedKpis.length > 0 ? (
                <>
                  <p className="text-sm text-gray-600 mb-4">
                    Existing KPIs from this pillar (template deleted):
                  </p>
                  <AssignKpiTable
                    assignedKpis={assignedKpis}
                    unassignedKpis={[]}
                    onAssign={onAssignKpi}
                    onUnassign={onUnassignKpi}
                    onUpdate={onUpdateKpi}
                    hideUnassignedSection={true}
                  />
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    No KPIs found for this orphaned pillar.
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    You can unassign this pillar to remove it from the
                    department.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <AssignKpiTable
              assignedKpis={assignedKpis}
              unassignedKpis={unassignedKpis}
              onAssign={onAssignKpi}
              onUnassign={onUnassignKpi}
              onUpdate={onUpdateKpi}
            />
          )}
        </CardContent>
      </Card>
    );
  },
);

KpiManagementSection.displayName = "KpiManagementSection";
