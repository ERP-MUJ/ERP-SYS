"use client";
import React, { useState } from "react";
import { format } from "date-fns";
import { Button } from "@workspace/ui/components/button";
import { Textarea } from "@workspace/ui/components/textarea";
import { toast } from "sonner";

export interface ReviewAction {
  value: string;
  label: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
  requiresRemark?: boolean; // Whether this action requires a remark
}

export interface ReviewHistoryItem {
  action: string;
  at: string | Date;
  remark?: string;
  comments?: string; // Support both remark and comments fields
  by?: string;
}

export interface ReviewPanelProps {
  // Core props
  isOpen: boolean;
  onToggle: () => void;
  onReview: (action: string, remark: string) => void;
  isUpdating?: boolean;

  // Customization
  actions?: ReviewAction[];
  remarkPlaceholder?: string;
  remarkRequired?: boolean;
  remarkLabel?: string;

  // Lock/Preview mode
  locked?: boolean;
  lockReason?: string;

  // Review history
  reviewHistory?: ReviewHistoryItem[];
  historyTitle?: string;
}

const defaultActions: ReviewAction[] = [
  { value: "APPROVE", label: "Approve", variant: "default" },
  { value: "REVISION", label: "Ask Revision", variant: "secondary" },
  { value: "REJECT", label: "Reject", variant: "destructive" },
];

export function ReviewPanel({
  isOpen,
  onToggle,
  onReview,
  isUpdating = false,
  actions = defaultActions,
  remarkPlaceholder = "Remark (required)",
  remarkRequired = true,
  remarkLabel = "Remark",
  locked = false,
  lockReason,
  reviewHistory = [],
  historyTitle = "Review History",
}: ReviewPanelProps) {
  const [remark, setRemark] = useState("");

  const handleAction = (action: ReviewAction) => {
    const trimmedRemark = remark.trim();

    // Check if this specific action requires a remark
    const actionRequiresRemark =
      action.requiresRemark !== undefined
        ? action.requiresRemark
        : remarkRequired;

    if (actionRequiresRemark && !trimmedRemark) {
      toast.error(
        `Please provide a ${remarkLabel.toLowerCase()} before submitting your review`,
      );
      return;
    }

    onReview(action.value, trimmedRemark);
    setRemark(""); // Clear remark after successful submission
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-medium">Review</h2>
        <Button size="sm" variant="outline" onClick={onToggle}>
          {isOpen ? "Hide Review Panel" : "Open Review Panel"}
        </Button>
      </div>

      {isOpen && (
        <div className="border rounded-md p-4 space-y-5 bg-background/60">
          {locked ? (
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-amber-500 rounded-full" />
                  <span className="text-sm font-medium text-amber-800">
                    Preview Mode
                  </span>
                </div>
                <p className="text-sm text-amber-700 mt-1">
                  {lockReason || "This KPI cannot be reviewed at this time."}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                You can view the current form responses below, but review
                actions are disabled.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <Textarea
                placeholder={remarkPlaceholder}
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                disabled={isUpdating}
              />
              <div className="flex flex-wrap gap-2">
                {actions.map((action) => (
                  <Button
                    key={action.value}
                    variant={action.variant}
                    onClick={() => handleAction(action)}
                    disabled={
                      isUpdating ||
                      ((action.requiresRemark !== undefined
                        ? action.requiresRemark
                        : remarkRequired) &&
                        remark.trim().length === 0)
                    }
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Review History Section */}
          <div>
            <h3 className="font-medium mb-2 text-sm">{historyTitle}</h3>
            {reviewHistory.length > 0 ? (
              <ul className="space-y-2 text-xs max-h-56 overflow-auto pr-1">
                {reviewHistory
                  .slice()
                  .reverse()
                  .map((review, index) => (
                    <li
                      key={index}
                      className="p-2 rounded border bg-background/50"
                    >
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">{review.action}</span>
                        <span className="text-muted-foreground">
                          {format(new Date(review.at), "dd/MM/yyyy HH:mm:ss")}
                        </span>
                      </div>
                      {(review.remark || review.comments) && (
                        <div className="italic">
                          {review.remark || review.comments}
                        </div>
                      )}
                      {review.by && (
                        <div className="text-muted-foreground">
                          By: {review.by}
                        </div>
                      )}
                    </li>
                  ))}
              </ul>
            ) : (
              <div className="text-sm text-muted-foreground">
                No review actions yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
