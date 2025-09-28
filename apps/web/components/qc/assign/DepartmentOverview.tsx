/**
 * Department Overview Component
 * Shows grid of departments with statistics for QC assignment selection
 * Matches the exact original UI design
 */

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Separator } from "@workspace/ui/components/separator";

interface Department {
  id: string;
  dept_name: string;
  hod_name: string | null;
  dept_creation: string | null;
}

interface DepartmentOverviewProps {
  departments: Department[];
  allDepartmentPillars: any[];
  onDepartmentSelect: (departmentId: string) => void;
}

export function DepartmentOverview({
  departments,
  allDepartmentPillars,
  onDepartmentSelect,
}: DepartmentOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {departments.map((dept) => {
        const deptPillars = allDepartmentPillars.filter(
          (dp: { dept_id: string }) => dp.dept_id === dept.id,
        );
        const totalKPIs = deptPillars.reduce(
          (sum: number, pillar: { department_kpis?: any[] }) =>
            sum + (pillar.department_kpis?.length || 0),
          0,
        );

        return (
          <Card
            key={dept.id}
            className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
            onClick={() => onDepartmentSelect(dept.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg mb-1">
                    {dept.dept_name}
                  </CardTitle>
                  {dept.hod_name && (
                    <p className="text-sm text-muted-foreground">
                      HOD: {dept.hod_name}
                    </p>
                  )}
                </div>
                <Badge variant="secondary">{deptPillars.length} Pillars</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Assigned Pillars:
                  </span>
                  <span className="text-sm font-medium">
                    {deptPillars.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total KPIs:
                  </span>
                  <span className="text-sm font-medium">{totalKPIs}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge
                    variant={deptPillars.length > 0 ? "default" : "secondary"}
                  >
                    {deptPillars.length > 0 ? "Active" : "Pending"}
                  </Badge>
                </div>
              </div>
              <Separator />
              <Button className="w-full" variant="default">
                Manage Pillars & KPIs
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
