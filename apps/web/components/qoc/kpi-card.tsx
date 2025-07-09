import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import type { ReactNode } from "react";

export interface KpiCardProps {
  kpiName: string;
  description?: string;
  fieldsCount?: number;
  value?: number | string;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onAssign?: () => void;
  onUnassign?: () => void;
  assigned?: boolean;
  actions?: ReactNode;
  className?: string;
}

export function KpiCard({
  kpiName,
  description,
  fieldsCount,
  value,
  onView,
  onEdit,
  onDelete,
  onAssign,
  onUnassign,
  assigned,
  actions,
  className,
}: KpiCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{kpiName}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {typeof fieldsCount === "number" && (
          <p className="text-sm text-muted-foreground">{fieldsCount} Fields</p>
        )}
        {typeof value !== "undefined" && (
          <p className="text-sm text-muted-foreground">Value: {value}</p>
        )}
      </CardContent>
      {actions ? (
        <CardFooter className="flex gap-2">{actions}</CardFooter>
      ) : (
        <CardFooter className="flex gap-2">
          {onView && (
            <Button size="sm" variant="outline" onClick={onView}>
              View
            </Button>
          )}
          {onEdit && (
            <Button size="sm" variant="outline" onClick={onEdit}>
              Edit
            </Button>
          )}
          {onDelete && (
            <Button size="sm" variant="destructive" onClick={onDelete}>
              Delete
            </Button>
          )}
          {onAssign && !assigned && (
            <Button size="sm" variant="default" onClick={onAssign}>
              Assign
            </Button>
          )}
          {onUnassign && assigned && (
            <Button size="sm" variant="secondary" onClick={onUnassign}>
              Unassign
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
