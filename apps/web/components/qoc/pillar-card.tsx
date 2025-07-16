import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import type { ReactNode } from "react";

export interface PillarCardProps {
  pillarName: string;
  description?: string;
  assigned?: boolean;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onAssign?: () => void;
  actions?: ReactNode;
  selected?: boolean;
  className?: string;
}

export function PillarCard({
  pillarName,
  description,
  assigned,
  onView,
  onEdit,
  onDelete,
  onAssign,
  actions,
  selected,
  className,
}: PillarCardProps) {
  return (
    <Card
      className={`transition-shadow ${selected ? "border-primary ring-2 ring-primary/30" : ""} ${className ?? ""}`.trim()}
    >
      <CardHeader>
        <CardTitle>{pillarName}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      {actions ? (
        <CardFooter className="flex gap-2">{actions}</CardFooter>
      ) : (
        <CardFooter className="flex gap-2">
          {onView && (
            <Button size="sm" variant="outline" onClick={onView}>
              View Pillar
            </Button>
          )}
          {onEdit && (
            <Button size="sm" variant="outline" onClick={onView}>
              Edit Pillar
            </Button>
          )}
          {onDelete && (
            <Button size="sm" variant="outline" onClick={onView}>
              Delete
            </Button>
          )}
          {onAssign && !assigned && (
            <Button size="sm" onClick={onAssign}>
              Assign to Department
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
