"use client";
import React, { useState } from "react";
import { format } from "date-fns";
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
import { renderTextWithCompactLinks } from "@/utils/string";

/**
 * Smart column name breaking utility
 * Breaks long column names at special characters and numbered lists
 */
function smartBreakColumnName(label: string): React.ReactNode {
  if (!label || label.length <= 30) {
    return (
      <span className="break-words overflow-wrap-anywhere whitespace-normal">
        {label}
      </span>
    ); // Keep short labels on one line but allow wrapping
  }

  let result = label;

  // Break BEFORE numbered lists (1., 2., 3., etc.) - not after
  result = result.replace(/\s+(\d+\.)/g, "\n$1");

  // Break before special characters if preceded by text
  result = result.replace(/\s+([,;:])/g, "\n$1");

  // Break before opening parenthesis if preceded by text
  result = result.replace(/\s+(\()/g, "\n$1");

  // Break after closing parenthesis if followed by text
  result = result.replace(/(\))\s+/g, "$1\n");

  // Now handle word wrapping for lines that are still too long
  const lines = result.split("\n");
  const finalLines: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    if (trimmedLine.length <= 35) {
      finalLines.push(trimmedLine);
    } else {
      // Break long lines at word boundaries - more generous
      const words = trimmedLine.split(/\s+/);
      let currentLine = "";

      for (const word of words) {
        if (currentLine.length === 0) {
          currentLine = word;
        } else if ((currentLine + " " + word).length <= 35) {
          currentLine += " " + word;
        } else {
          // Push current line and start new one
          if (currentLine) {
            finalLines.push(currentLine);
          }
          currentLine = word;
        }
      }

      // Don't forget the last line
      if (currentLine) {
        finalLines.push(currentLine);
      }
    }
  }

  // Remove empty lines but don't limit to 3 lines - show all content
  const cleanLines = finalLines.filter((line) => line.trim().length > 0);

  if (cleanLines.length === 0) {
    return (
      <span className="break-words overflow-wrap-anywhere whitespace-normal">
        {label}
      </span>
    );
  }

  if (cleanLines.length === 1) {
    return (
      <span className="break-words overflow-wrap-anywhere leading-tight whitespace-normal">
        {cleanLines[0]}
      </span>
    );
  }

  // Return JSX with controlled line breaks and proper containment - ensure no mid-word cuts
  return (
    <span className="leading-tight block overflow-hidden break-words overflow-wrap-anywhere text-left whitespace-normal">
      {cleanLines.map((line, index) => (
        <span
          key={index}
          className="block overflow-hidden break-words overflow-wrap-anywhere text-left whitespace-normal"
        >
          {line}
        </span>
      ))}
    </span>
  );
}

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
            {cols.map((c) => {
              const fieldLabel =
                c.attributes.label || c.attributes.name || c.id;
              // Calculate dynamic width based on field name length
              const getDynamicWidth = (text: string) => {
                const baseWidth = 100; // Minimum base width
                const charWidth = 7; // Slightly more generous pixels per character
                const calculatedWidth = Math.min(
                  baseWidth + text.length * charWidth,
                  220,
                );
                return Math.max(calculatedWidth, 100); // Ensure minimum of 100px
              };

              const dynamicWidth = getDynamicWidth(fieldLabel);

              // Get appropriate Tailwind class for width - more granular steps
              const getWidthClass = (width: number) => {
                if (width <= 100) return "w-[100px]";
                if (width <= 120) return "w-[120px]";
                if (width <= 140) return "w-[140px]";
                if (width <= 160) return "w-[160px]";
                if (width <= 180) return "w-[180px]";
                if (width <= 200) return "w-[200px]";
                return "w-[220px]"; // Increased maximum for very long names
              };

              const widthClass = getWidthClass(dynamicWidth);

              return (
                <TableHead
                  key={c.id}
                  className={
                    `${widthClass} max-w-[220px] min-w-[100px] font-semibold text-[11px] tracking-wide uppercase border-r border-border/60 last:border-r-0 select-none text-left align-middle ` +
                    cellPad
                  }
                >
                  <div className="w-full h-full overflow-hidden break-words hyphens-auto leading-tight flex items-center">
                    <span className="overflow-wrap-anywhere word-break-break-word text-left">
                      {smartBreakColumnName(fieldLabel)}
                      {c.attributes.required && (
                        <span className="text-rose-500 ml-0.5">*</span>
                      )}
                    </span>
                  </div>
                </TableHead>
              );
            })}
            {enableRowComments && (
              <>
                <TableHead
                  className={
                    "w-64 font-semibold text-[11px] tracking-wide uppercase select-none text-left align-middle border-r border-border/60 " +
                    cellPad
                  }
                >
                  <div className="w-full h-full overflow-hidden break-words leading-tight flex items-center">
                    <span>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {smartBreakColumnName("QC Comments")}
                      </div>
                    </span>
                  </div>
                </TableHead>
                <TableHead
                  className={
                    "w-64 font-semibold text-[11px] tracking-wide uppercase select-none text-left align-middle " +
                    cellPad
                  }
                >
                  <div className="w-full h-full overflow-hidden break-words leading-tight flex items-center">
                    <span>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {smartBreakColumnName("Department Comments")}
                      </div>
                    </span>
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
                                  {format(
                                    new Date(comment.reviewed_at),
                                    "dd/MM/yyyy",
                                  )}
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
                                  {format(
                                    new Date(comment.reviewed_at),
                                    "dd/MM/yyyy",
                                  )}
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
      return Number.isNaN(d.getTime())
        ? String(value)
        : format(d, "dd/MM/yyyy");
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
      // Handle text content with compact links to prevent cell overflow
      const s = String(value);
      return (
        <div className="break-words overflow-wrap-anywhere max-w-xs">
          {renderTextWithCompactLinks(s)}
        </div>
      );
    }
  }
}
export default ReadOnlyFormTable;
