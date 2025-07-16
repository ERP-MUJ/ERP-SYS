"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { Eye, Edit, Trash2, Plus, Minus } from "lucide-react";

interface KpiCardProps {
  kpiName: string;
  description: string;
  fieldsCount: number;
  value: number;
  assigned?: boolean;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onAssign?: () => void;
  onUnassign?: () => void;
}

export function KpiCard({
  kpiName,
  description,
  fieldsCount,
  value,
  assigned = false,
  onView,
  onEdit,
  onDelete,
  onAssign,
  onUnassign,
}: KpiCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow relative">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1 pr-2">
            <CardTitle className="text-lg">{kpiName}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          <Badge
            variant={assigned ? "default" : "secondary"}
            className="ml-2 flex-shrink-0"
          >
            {assigned ? "Assigned" : "Available"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Fields:</span>
            <span className="text-sm text-gray-600">{fieldsCount}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Value:</span>
            <span className="text-lg font-bold text-blue-600">{value}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onView}
          className="flex-1 bg-transparent"
        >
          <Eye className="w-4 h-4 mr-1" />
          View
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="flex-1 bg-transparent"
        >
          <Edit className="w-4 h-4 mr-1" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          className="flex-1 bg-transparent"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Delete
        </Button>
        {assigned ? (
          <Button
            variant="destructive"
            size="sm"
            onClick={onUnassign}
            className="flex-1"
          >
            <Minus className="w-4 h-4 mr-1" />
            Unassign
          </Button>
        ) : (
          <Button
            variant="default"
            size="sm"
            onClick={onAssign}
            className="flex-1"
          >
            <Plus className="w-4 h-4 mr-1" />
            Assign
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
