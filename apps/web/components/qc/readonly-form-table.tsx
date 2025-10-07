"use client";
import React, { useState } from "react";
import { FormElementInstance } from "@/lib/types";
import { Button } from "@workspace/ui/components/button";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  Table as ReactTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Save, MessageSquare } from "lucide-react";
import { renderTextWithLinks } from "@/utils/string";

export interface EntryComment {
  comment: string;
  reviewed_by: string;
  reviewed_by_id: string;
  reviewed_at: string;
}

interface ReadOnlyFormTableProps {
  elements: FormElementInstance[];
  entries: Record<string, any>[];
  className?: string;
  rowNumbers?: boolean;
  compact?: boolean;
  // Row comments functionality
  enableRowComments?: boolean;
  qcComments?: Record<string, EntryComment>;
  hodComments?: Record<string, EntryComment>;
  // Backward compatibility
  entryComments?: Record<string, EntryComment>;
  canEditQcComments?: boolean;
  canEditHodComments?: boolean;
  onSaveQcComment?: (entryIndex: number, comment: string) => void;
  onSaveHodComment?: (entryIndex: number, comment: string) => void;
  isSavingQcComment?: Record<number, boolean>;
  isSavingHodComment?: Record<number, boolean>;
  // Legacy props for backward compatibility
  canEditComments?: boolean;
  onSaveComment?: (entryIndex: number, comment: string) => void;
  isSavingComment?: Record<number, boolean>;
}

export function ReadOnlyFormTable({
  elements,
  entries,
  className,
  rowNumbers = true,
  compact = true,
  enableRowComments = false,
  qcComments = {},
  hodComments = {},
  entryComments = {},
  canEditQcComments = false,
  canEditHodComments = false,
  onSaveQcComment,
  onSaveHodComment,
  isSavingQcComment = {},
  isSavingHodComment = {},
  // Legacy props for backward compatibility
  canEditComments = false,
  onSaveComment,
  isSavingComment = {},
}: ReadOnlyFormTableProps) {
  const [qcCommentValues, setQcCommentValues] = useState<
    Record<number, string>
  >({});
  const [hodCommentValues, setHodCommentValues] = useState<
    Record<number, string>
  >({});
  const [editingQcComment, setEditingQcComment] = useState<number | null>(null);
  const [editingHodComment, setEditingHodComment] = useState<number | null>(
    null,
  );

  const cols = React.useMemo(() => elements, [elements]);
  const cellPad = compact ? "px-3 py-2" : "px-4 py-2.5";

  // Handle backward compatibility
  const effectiveQcComments =
    Object.keys(qcComments).length > 0 ? qcComments : entryComments;
  const effectiveCanEditQc = canEditQcComments || canEditComments;
  const effectiveOnSaveQc = onSaveQcComment || onSaveComment;
  const effectiveIsSavingQc =
    Object.keys(isSavingQcComment).length > 0
      ? isSavingQcComment
      : isSavingComment;

  const handleQcCommentChange = (rowIndex: number, value: string) => {
    setQcCommentValues((prev) => ({
      ...prev,
      [rowIndex]: value,
    }));
  };

  const handleHodCommentChange = (rowIndex: number, value: string) => {
    setHodCommentValues((prev) => ({
      ...prev,
      [rowIndex]: value,
    }));
  };

  const handleSaveQcComment = (rowIndex: number) => {
    const comment = qcCommentValues[rowIndex] || "";
    effectiveOnSaveQc?.(rowIndex, comment);
    setEditingQcComment(null);
  };

  const handleSaveHodComment = (rowIndex: number) => {
    const comment = hodCommentValues[rowIndex] || "";
    onSaveHodComment?.(rowIndex, comment);
    setEditingHodComment(null);
  };

  const startEditingQcComment = (rowIndex: number) => {
    const existingComment =
      effectiveQcComments[rowIndex.toString()]?.comment || "";
    setQcCommentValues((prev) => ({
      ...prev,
      [rowIndex]: existingComment,
    }));
    setEditingQcComment(rowIndex);
  };

  const startEditingHodComment = (rowIndex: number) => {
    const existingComment = hodComments[rowIndex.toString()]?.comment || "";
    setHodCommentValues((prev) => ({
      ...prev,
      [rowIndex]: existingComment,
    }));
    setEditingHodComment(rowIndex);
  };

  const cancelEditingQcComment = () => {
    setEditingQcComment(null);
    setQcCommentValues({});
  };

  const cancelEditingHodComment = () => {
    setEditingHodComment(null);
    setHodCommentValues({});
  };

  if (!entries || entries.length === 0)
    return (
      <div className={className + " text-sm text-muted-foreground"}>
        No submission yet.
      </div>
    );

  return (
    <div
      className={
        "overflow-x-auto rounded-md border border-border/70 bg-background/70 backdrop-blur-sm shadow-sm " +
        (className || "")
      }
    >
      <ReactTable className="min-w-full text-xs border-collapse">
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/70">
            {rowNumbers && (
              <TableHead
                className={
                  "w-10 text-center font-medium bg-muted/30 z-10 border-r border-border/60 select-none " +
                  cellPad
                }
              >
                #
              </TableHead>
            )}
            {cols.map((c) => (
              <TableHead
                key={c.id}
                className={
                  "whitespace-nowrap font-semibold text-[11px] tracking-wide uppercase border-r border-border/60 last:border-r-0 select-none " +
                  cellPad
                }
              >
                {c.attributes.label || c.attributes.name || c.id}
                {c.attributes.required && (
                  <span className="text-rose-500 ml-0.5">*</span>
                )}
              </TableHead>
            ))}
            {enableRowComments && (
              <>
                <TableHead
                  className={
                    "whitespace-nowrap font-semibold text-[11px] tracking-wide uppercase w-64 select-none " +
                    cellPad
                  }
                >
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    QC Comments
                  </div>
                </TableHead>
                <TableHead
                  className={
                    "whitespace-nowrap font-semibold text-[11px] tracking-wide uppercase w-64 select-none " +
                    cellPad
                  }
                >
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    Department Comments
                  </div>
                </TableHead>
              </>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((row, rI) => (
            <TableRow
              key={rI}
              className="odd:bg-background even:bg-muted/5 hover:bg-muted/25 transition-colors border-b border-border/50"
            >
              {rowNumbers && (
                <TableCell
                  className={
                    "text-center font-medium bg-background/80 border-r border-border/60 select-none " +
                    cellPad
                  }
                >
                  {rI + 1}
                </TableCell>
              )}
              {cols.map((c) => (
                <TableCell
                  key={c.id}
                  className={
                    cellPad +
                    " align-top border-r border-border/50 last:border-r-0 " +
                    (c.type === "number"
                      ? "text-right tabular-nums"
                      : c.type === "checkbox"
                        ? "text-center"
                        : "text-left")
                  }
                >
                  <Value value={row[c.id]} type={c.type} />
                </TableCell>
              ))}
              {enableRowComments && (
                <>
                  {/* QC Comments Column */}
                  <TableCell className={cellPad + " align-top w-64"}>
                    <div className="space-y-2">
                      {editingQcComment === rI ? (
                        <div className="space-y-2">
                          <Textarea
                            value={qcCommentValues[rI] || ""}
                            onChange={(e) =>
                              handleQcCommentChange(rI, e.target.value)
                            }
                            placeholder="Add QC comment for this entry..."
                            className="text-xs resize-none"
                            rows={3}
                          />
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() => handleSaveQcComment(rI)}
                              disabled={effectiveIsSavingQc[rI]}
                              className="h-6 px-2 text-xs"
                            >
                              {effectiveIsSavingQc[rI] ? (
                                "Saving..."
                              ) : (
                                <>
                                  <Save className="w-3 h-3 mr-1" />
                                  Save
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEditingQcComment}
                              className="h-6 px-2 text-xs"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          {(() => {
                            const comment = effectiveQcComments[rI.toString()];
                            return comment ? (
                              <div className="space-y-1">
                                <div className="text-xs bg-muted/50 rounded p-2 border">
                                  {comment.comment}
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                  By {comment.reviewed_by} •{" "}
                                  {new Date(
                                    comment.reviewed_at,
                                  ).toLocaleDateString()}
                                </div>
                                {effectiveCanEditQc && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => startEditingQcComment(rI)}
                                    className="h-6 px-2 text-xs"
                                  >
                                    Edit
                                  </Button>
                                )}
                              </div>
                            ) : (
                              effectiveCanEditQc && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEditingQcComment(rI)}
                                  className="h-6 px-2 text-xs"
                                >
                                  <MessageSquare className="w-3 h-3 mr-1" />
                                  Add Comment
                                </Button>
                              )
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* HOD Comments Column */}
                  <TableCell className={cellPad + " align-top w-64"}>
                    <div className="space-y-2">
                      {editingHodComment === rI ? (
                        <div className="space-y-2">
                          <Textarea
                            value={hodCommentValues[rI] || ""}
                            onChange={(e) =>
                              handleHodCommentChange(rI, e.target.value)
                            }
                            placeholder="Add department comment for this entry..."
                            className="text-xs resize-none"
                            rows={3}
                          />
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() => handleSaveHodComment(rI)}
                              disabled={isSavingHodComment[rI]}
                              className="h-6 px-2 text-xs"
                            >
                              {isSavingHodComment[rI] ? (
                                "Saving..."
                              ) : (
                                <>
                                  <Save className="w-3 h-3 mr-1" />
                                  Save
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEditingHodComment}
                              className="h-6 px-2 text-xs"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          {(() => {
                            const comment = hodComments[rI.toString()];
                            return comment ? (
                              <div className="space-y-1">
                                <div className="text-xs bg-muted/50 rounded p-2 border">
                                  {comment.comment}
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                  By {comment.reviewed_by} •{" "}
                                  {new Date(
                                    comment.reviewed_at,
                                  ).toLocaleDateString()}
                                </div>
                                {canEditHodComments && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => startEditingHodComment(rI)}
                                    className="h-6 px-2 text-xs"
                                  >
                                    Edit
                                  </Button>
                                )}
                              </div>
                            ) : (
                              canEditHodComments && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEditingHodComment(rI)}
                                  className="h-6 px-2 text-xs"
                                >
                                  <MessageSquare className="w-3 h-3 mr-1" />
                                  Add Comment
                                </Button>
                              )
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </TableCell>
                </>
              )}
            </TableRow>
          ))}
        </TableBody>
      </ReactTable>
    </div>
  );
}

function Value({ value, type }: { value: any; type: string }) {
  if (value == null || value === "")
    return <span className="text-muted-foreground">—</span>;
  switch (type) {
    case "checkbox":
      return (
        <span
          className={
            "inline-flex items-center justify-center rounded-sm border px-1.5 py-0.5 text-[10px] font-medium " +
            (value
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              : "bg-muted text-muted-foreground border-border/40")
          }
        >
          {value ? "Yes" : "No"}
        </span>
      );
    case "date": {
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString();
    }
    case "number": {
      if (typeof value === "number") return value;
      const n = Number(value);
      return Number.isFinite(n) ? n : String(value);
    }
    case "file":
      if (Array.isArray(value)) return value.join(", ");
      return String(value);
    default: {
      if (typeof value === "object") return JSON.stringify(value);
      // Handle text content with proper word breaking for links
      const s = String(value);
      return (
        <div className="break-words overflow-wrap-anywhere max-w-xs">
          {renderTextWithLinks(s)}
        </div>
      );
    }
  }
}
export default ReadOnlyFormTable;
