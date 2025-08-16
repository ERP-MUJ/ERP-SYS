"use client";
import React from "react";
import { FormElementInstance } from "@/lib/types";
import {
  Table as ReactTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";

interface ReadOnlyFormTableProps {
  elements: FormElementInstance[];
  entries: Record<string, any>[];
  className?: string;
  rowNumbers?: boolean;
  compact?: boolean;
}

export function ReadOnlyFormTable({
  elements,
  entries,
  className,
  rowNumbers = true,
  compact = true,
}: ReadOnlyFormTableProps) {
  const cols = React.useMemo(() => elements, [elements]);
  const cellPad = compact ? "px-3 py-2" : "px-4 py-2.5"; // unify header/body height

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
      // Truncate long textareas
      const s = String(value);
      return s.length > 120 ? s.slice(0, 117) + "…" : s;
    }
  }
}
export default ReadOnlyFormTable;
