"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { MessageSquare, AlertCircle } from "lucide-react";

export interface ReviewStatusDisplayProps {
  status?: string;
  reviewHistory?: Array<{
    action: string;
    at: string | Date;
    comments?: string;
    remark?: string;
    by?: string;
  }>;
  title?: string;
  latestReviewComments?: string;
}

function getStatusBadgeVariant(status?: string) {
  switch (status) {
    case "APPROVED":
    case "APPROVE":
      return "approved";
    case "REJECTED":
    case "REJECT":
      return "rejected";
    case "REVISION":
    case "REQUEST_REVISION":
      return "revision";
    case "PENDING":
      return "pending";
    default:
      return "secondary";
  }
}

function getStatusDisplayText(status?: string) {
  switch (status) {
    case "APPROVED":
    case "APPROVE":
      return "Approved";
    case "REJECTED":
    case "REJECT":
      return "Rejected";
    case "REVISION":
    case "REQUEST_REVISION":
      return "Revision Required";
    case "PENDING":
      return "Pending Review";
    default:
      return status || "Unknown";
  }
}

export function ReviewStatusDisplay({
  status,
  reviewHistory = [],
  title = "Review Status",
  latestReviewComments,
}: ReviewStatusDisplayProps) {
  const latestReview = reviewHistory.length > 0 ? reviewHistory[reviewHistory.length - 1] : null;
  const displayStatus = latestReview?.action || status;
  const comments = latestReview?.comments || latestReview?.remark || latestReviewComments;

  if (!displayStatus && reviewHistory.length === 0) {
    return null;
  }

  return (
    <Card className="border-l-4 border-l-amber-400">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {title}
          </CardTitle>
          {displayStatus && (
            <Badge variant={getStatusBadgeVariant(displayStatus) as any}>
              {getStatusDisplayText(displayStatus)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Latest Review Comments */}
        {comments && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Latest Review Comments</h4>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-amber-800 italic">"{comments}"</p>
                  {latestReview?.by && (
                    <p className="text-xs text-amber-600 mt-2">
                      Reviewed by: {latestReview.by}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Review History */}
        {reviewHistory.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-3">Review History</h4>
            <div className="space-y-2 max-h-64 overflow-auto">
              {reviewHistory
                .slice()
                .reverse()
                .map((review, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-3 bg-background/50 hover:bg-background/80 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <Badge
                        variant={getStatusBadgeVariant(review.action) as any}
                        className="text-xs"
                      >
                        {getStatusDisplayText(review.action)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.at).toLocaleString()}
                      </span>
                    </div>
                    {(review.remark || review.comments) && (
                      <p className="text-sm text-muted-foreground italic mb-1 bg-muted/30 p-2 rounded">
                        "{review.remark || review.comments}"
                      </p>
                    )}
                    {review.by && (
                      <p className="text-xs text-muted-foreground">
                        Reviewed by: {review.by}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
