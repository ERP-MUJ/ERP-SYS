"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import {
  Table as ReactTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import {
  CheckCircle,
  X,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import { useState } from "react";
import type { KpiEntryWithReview } from "@workspace/types/types";
import { KpiStatus } from "@workspace/types/enums/enums";

interface EntryReviewDisplayProps {
  entries: KpiEntryWithReview[];
  title?: string;
  showSummary?: boolean;
}

export default function EntryReviewDisplay({
  entries,
  title = "Entry Reviews",
  showSummary = true,
}: EntryReviewDisplayProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getStatusBadge = (status: KpiStatus) => {
    switch (status) {
      case KpiStatus.APPROVED:
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case KpiStatus.REJECTED:
        return (
          <Badge variant="destructive">
            <X className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      case KpiStatus.REVISION:
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Revision
          </Badge>
        );
      case KpiStatus.OVERDUE:
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Overdue
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const getReviewSummary = () => {
    const summary = entries.reduce(
      (acc, entry) => {
        acc[entry.status] = (acc[entry.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return summary;
  };

  const reviewSummary = getReviewSummary();

  const tableHeaders =
    entries.length > 0 && entries[0].data ? Object.keys(entries[0].data) : [];

  if (entries.length === 0) {
    return null;
  }

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                {title}
              </CardTitle>
              {isOpen ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent>
            {showSummary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Clock className="w-4 h-4 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium">Pending</p>
                    <p className="text-2xl font-bold">
                      {reviewSummary.PENDING || 0}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Approved</p>
                    <p className="text-2xl font-bold">
                      {reviewSummary.APPROVED || 0}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                  <X className="w-4 h-4 text-red-600" />
                  <div>
                    <p className="text-sm font-medium">Rejected</p>
                    <p className="text-2xl font-bold">
                      {reviewSummary.REJECTED || 0}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium">Revision</p>
                    <p className="text-2xl font-bold">
                      {reviewSummary.REVISION || 0}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Entries Table */}
            <div className="border rounded-lg">
              <ReactTable>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    {tableHeaders.map((header) => (
                      <TableHead key={header} className="capitalize">
                        {header.replace(/_/g, " ")}
                      </TableHead>
                    ))}
                    <TableHead className="w-32">Status</TableHead>
                    <TableHead className="w-32">Review</TableHead>
                    <TableHead className="w-32">Reviewed By</TableHead>
                    <TableHead className="w-32">Reviewed At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry, index) => (
                    <TableRow key={entry.entry_id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      {tableHeaders.map((header) => (
                        <TableCell key={header}>
                          {String(entry.data[header] || "-")}
                        </TableCell>
                      ))}
                      <TableCell>{getStatusBadge(entry.status)}</TableCell>
                      <TableCell>
                        {entry.review ? (
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3 text-blue-600" />
                            <span
                              className="text-xs text-muted-foreground truncate max-w-20"
                              title={entry.review}
                            >
                              {entry.review.length > 20
                                ? `${entry.review.substring(0, 20)}...`
                                : entry.review}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            No review
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {entry.reviewed_by ? "QAC" : "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {entry.reviewed_at
                            ? new Date(entry.reviewed_at).toLocaleDateString()
                            : "-"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </ReactTable>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
