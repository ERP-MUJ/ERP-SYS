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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Check,
  X,
  MessageSquare,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import type { KpiEntryWithReview } from "@workspace/types/types";
import { KpiStatus } from "@workspace/types/enums";

interface IndividualEntryReviewTableProps {
  kpiName: string;
  kpiDescription: string;
  entries: KpiEntryWithReview[];
  onEntryReview: (entryId: string, status: KpiStatus, review: string) => void;
  isReviewing?: boolean;
}

export default function IndividualEntryReviewTable({
  kpiName,
  kpiDescription,
  entries,
  onEntryReview,
  isReviewing = false,
}: IndividualEntryReviewTableProps) {
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewStatus, setReviewStatus] = useState<KpiStatus>(
    KpiStatus.PENDING,
  );

  // Get all unique keys from the entries to create table headers
  const tableHeaders =
    entries.length > 0 && entries[0]?.data ? Object.keys(entries[0].data) : [];

  const handleOpenReviewDialog = (entryId: string) => {
    const entry = entries.find((e) => e.entry_id === entryId);
    setSelectedEntryId(entryId);
    setReviewComment(entry?.review || "");
    setReviewStatus(entry?.status || KpiStatus.PENDING);
    setDialogOpen(true);
  };

  const handleSubmitReview = () => {
    if (!reviewComment.trim()) {
      toast.error("Please provide a review comment");
      return;
    }

    if (selectedEntryId) {
      onEntryReview(selectedEntryId, reviewStatus, reviewComment);
      setDialogOpen(false);
      setSelectedEntryId(null);
      setReviewComment("");
      setReviewStatus(KpiStatus.PENDING);
    }
  };

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

  const getStatusIcon = (status: KpiStatus) => {
    switch (status) {
      case KpiStatus.APPROVED:
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case KpiStatus.REJECTED:
        return <X className="w-4 h-4 text-red-600" />;
      case KpiStatus.REVISION:
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case KpiStatus.OVERDUE:
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Individual Entry Review - {kpiName}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{kpiDescription}</p>
        </CardHeader>
        <CardContent>
          {/* Review Summary */}
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
                  <TableHead className="w-20">Actions</TableHead>
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
                          <span className="text-xs text-muted-foreground truncate max-w-20">
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenReviewDialog(entry.entry_id)}
                        disabled={isReviewing}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </ReactTable>
          </div>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Review Entry #
              {entries.findIndex((e) => e.entry_id === selectedEntryId) + 1}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Entry Data Preview */}
            {selectedEntryId && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium mb-2">Entry Data:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {entries.find((e) => e.entry_id === selectedEntryId)?.data &&
                    Object.entries(
                      entries.find((e) => e.entry_id === selectedEntryId)!.data,
                    ).map(([key, value]) => (
                      <div key={key}>
                        <span className="font-medium capitalize">
                          {key.replace(/_/g, " ")}:
                        </span>
                        <span className="ml-2">{String(value)}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Review Status */}
            <div>
              <label className="text-sm font-medium">Review Status</label>
              <Select
                value={reviewStatus}
                onValueChange={(value: KpiStatus) => setReviewStatus(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={KpiStatus.APPROVED}>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Approved
                    </div>
                  </SelectItem>
                  <SelectItem value={KpiStatus.REJECTED}>
                    <div className="flex items-center gap-2">
                      <X className="w-4 h-4 text-red-600" />
                      Rejected
                    </div>
                  </SelectItem>
                  <SelectItem value={KpiStatus.REVISION}>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      Revision Required
                    </div>
                  </SelectItem>
                  <SelectItem value={KpiStatus.PENDING}>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-600" />
                      Pending
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Review Comment */}
            <div>
              <label className="text-sm font-medium">Review Comment</label>
              <Textarea
                placeholder="Enter your review comment..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitReview} disabled={isReviewing}>
              {isReviewing ? "Reviewing..." : "Submit Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
