"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Textarea } from "@workspace/ui/components/textarea";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Check, X, MessageSquare, Eye, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { renderTextWithCompactLinks } from "@/utils/string";

interface KpiReviewTableProps {
  kpiName: string;
  kpiDescription: string;
  formData: Record<string, any>[];
  onRowReview: (
    rowIndex: number,
    status: "approved" | "rejected",
    comment: string,
  ) => void;
  existingComments?: Record<number, { status: string; comment: string }>;
}

export default function KpiReviewTable({
  kpiName,
  kpiDescription,
  formData,
  onRowReview,
  existingComments = {},
}: KpiReviewTableProps) {
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewStatus, setReviewStatus] = useState<
    "approved" | "rejected" | null
  >(null);

  // Fix: Safely access formData and ensure it exists before using Object.keys
  // Get all unique keys from the form data to create table headers
  const tableHeaders =
    formData && formData.length > 0 && formData[0]
      ? Object.keys(formData[0])
      : [];

  const handleOpenReviewDialog = (rowIndex: number) => {
    setSelectedRow(rowIndex);
    const existingReview = existingComments[rowIndex];
    setReviewComment(existingReview?.comment || "");
    setReviewStatus(
      (existingReview?.status as "approved" | "rejected") || null,
    );
    setDialogOpen(true);
  };

  const handleSubmitReview = (status: "approved" | "rejected") => {
    if (!reviewComment.trim()) {
      toast.error("Please provide a comment for your review");
      return;
    }

    if (selectedRow !== null) {
      onRowReview(selectedRow, status, reviewComment);
      toast.success(`Row ${selectedRow + 1} ${status} successfully`);
      setDialogOpen(false);
      setSelectedRow(null);
      setReviewComment("");
      setReviewStatus(null);
    }
  };

  const getRowStatusBadge = (rowIndex: number) => {
    const review = existingComments[rowIndex];
    if (!review) {
      return (
        <Badge
          variant="outline"
          className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
        >
          <AlertCircle className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    }

    if (review.status === "approved") {
      return (
        <Badge
          variant="outline"
          className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
        >
          <Check className="w-3 h-3 mr-1" />
          Approved
        </Badge>
      );
    }

    return (
      <Badge
        variant="outline"
        className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      >
        <X className="w-3 h-3 mr-1" />
        Rejected
      </Badge>
    );
  };

  if (!formData || formData.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No data submitted for this KPI
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            {kpiName}
          </CardTitle>
          {kpiDescription && (
            <p className="text-sm text-muted-foreground">{kpiDescription}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="w-full">
            <ReactTable>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  {tableHeaders.map((header) => (
                    <TableHead key={header} className="whitespace-nowrap">
                      {header
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </TableHead>
                  ))}
                  <TableHead className="w-32">Status</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formData.map((row, rowIndex) => (
                  <TableRow key={rowIndex} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {rowIndex + 1}
                    </TableCell>
                    {tableHeaders.map((header) => (
                      <TableCell
                        key={header}
                        className="min-w-[120px] max-w-[300px]"
                      >
                        <div
                          className="break-words overflow-wrap-anywhere"
                          title={String(row[header] || "N/A")}
                        >
                          {row[header] === null || row[header] === undefined
                            ? "N/A"
                            : typeof row[header] === "boolean"
                              ? row[header]
                                ? "Yes"
                                : "No"
                              : renderTextWithCompactLinks(String(row[header]))}
                        </div>
                      </TableCell>
                    ))}
                    <TableCell>{getRowStatusBadge(rowIndex)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenReviewDialog(rowIndex)}
                        className="flex items-center gap-1"
                      >
                        <MessageSquare className="w-3 h-3" />
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </ReactTable>
          </div>

          <div className="mt-4 flex justify-between items-center text-sm text-muted-foreground">
            <span>Total entries: {formData.length}</span>
            <div className="flex gap-4">
              <span>
                Approved:{" "}
                {
                  Object.values(existingComments).filter(
                    (c) => c.status === "approved",
                  ).length
                }
              </span>
              <span>
                Rejected:{" "}
                {
                  Object.values(existingComments).filter(
                    (c) => c.status === "rejected",
                  ).length
                }
              </span>
              <span>
                Pending:{" "}
                {formData.length - Object.keys(existingComments).length}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Review Entry {selectedRow !== null ? selectedRow + 1 : ""} -{" "}
              {kpiName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Show the data for the selected row */}
            {selectedRow !== null && formData[selectedRow] && (
              <div className="space-y-3">
                <h4 className="font-medium">Entry Data:</h4>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  {Object.entries(formData[selectedRow]).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="font-medium capitalize text-muted-foreground">
                        {key.replace(/_/g, " ")}:
                      </span>
                      <span className="text-right max-w-xs break-words">
                        {value === null || value === undefined
                          ? "N/A"
                          : typeof value === "boolean"
                            ? value
                              ? "Yes"
                              : "No"
                            : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Review Comment */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Review Comment *</label>
              <Textarea
                placeholder="Enter your review comment for this entry..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={4}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Provide specific feedback about this data entry
              </p>
            </div>

            {/* Current Status */}
            {reviewStatus && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm">
                  <strong>Current Status:</strong> {reviewStatus}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleSubmitReview("rejected")}
              variant="destructive"
              disabled={!reviewComment.trim()}
            >
              <X className="w-4 h-4 mr-2" />
              Reject Entry
            </Button>
            <Button
              onClick={() => handleSubmitReview("approved")}
              className="bg-green-600 hover:bg-green-700"
              disabled={!reviewComment.trim()}
            >
              <Check className="w-4 h-4 mr-2" />
              Approve Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
