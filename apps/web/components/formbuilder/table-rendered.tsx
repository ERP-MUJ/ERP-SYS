"use client";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import type { FormElementInstance } from "@/lib/types";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Trash2,
  Save,
  FileUp,
  FileDown,
  FileText,
  MessageSquare,
} from "lucide-react";
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
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { LineChartIcon as ChartLine } from "lucide-react";
import { useSaveKpiData } from "@/hooks/faculty";
import { useDownloadExcelTemplate } from "@/queries/excel";
import type { UseMutationResult } from "@tanstack/react-query";
import { ExcelUploadDialog } from "./ExcelUploadDialog";
import { FrontendExcelUploadDialog } from "../common/FrontendExcelUploadDialog";
import {
  useGetEntryComments,
  useSaveEntryComment,
  useSaveHodEntryComment,
} from "@/queries/qc/review";

/**
 * Smart column name breaking utility
 * Breaks long column names at special characters and numbered lists
 */
function smartBreakColumnName(label: string): React.ReactNode {
  if (!label || label.length <= 20) {
    return <span className="whitespace-nowrap">{label}</span>; // Keep short labels on one line
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

    if (trimmedLine.length <= 25) {
      finalLines.push(trimmedLine);
    } else {
      // Break long lines at word boundaries
      const words = trimmedLine.split(/\s+/);
      let currentLine = "";

      for (const word of words) {
        if (currentLine.length === 0) {
          currentLine = word;
        } else if ((currentLine + " " + word).length <= 25) {
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
    return <span className="break-words overflow-hidden">{label}</span>;
  }

  if (cleanLines.length === 1) {
    return (
      <span className="break-words overflow-hidden leading-tight">
        {cleanLines[0]}
      </span>
    );
  }

  // Return JSX with controlled line breaks and proper containment
  return (
    <span className="leading-tight block overflow-hidden break-words text-left">
      {cleanLines.map((line, index) => (
        <span key={index} className="block overflow-hidden text-left">
          {line}
        </span>
      ))}
    </span>
  );
}

interface TableFormRendererProps {
  name: string;
  elements: FormElementInstance[];
  description?: string;
  onSuccess?: () => void;
  className?: string;
  id: string;
  existingData?: Record<string, unknown>[];
  customSaveHook?: () => UseMutationResult<
    unknown,
    Error,
    { id: string; formData: { entries: Record<string, unknown>[] } },
    unknown
  >;
  customExcelHooks?: {
    downloadHook: () => unknown;
    uploadComponent: React.ComponentType<{
      kpiId: string;
      trigger?: React.ReactNode;
    }>;
  };
  useFrontendExcelUpload?: boolean;
  secondaryAction?: {
    label: string;
    onClick: () => void;
    onAction: (entries: Record<string, unknown>[]) => Promise<void> | void;
    disabled?: boolean;
    loading?: boolean;
    variant?:
      | "default"
      | "destructive"
      | "outline"
      | "secondary"
      | "ghost"
      | "link";
  };
  // QC Comments props
  kpiId?: string;
  enableQcComments?: boolean;
  userRole?: string;
}
type FormEntry = Record<string, unknown>;
export default function TableFormRenderer({
  name,
  elements,
  id,
  description,
  className = "",
  existingData = [],
  customSaveHook,
  customExcelHooks,
  useFrontendExcelUpload = false,
  secondaryAction,
  kpiId,
  enableQcComments = false,
  userRole,
}: TableFormRendererProps) {
  const [entries, setEntries] = useState<FormEntry[]>([{}]);
  const defaultSaveHook = useSaveKpiData();
  const { mutate: saveKpiData } = customSaveHook
    ? customSaveHook()
    : defaultSaveHook;
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Comments functionality
  const { data: entryCommentsData } = useGetEntryComments(
    enableQcComments && kpiId ? kpiId : null,
  );
  const { mutate: saveEntryComment } = useSaveEntryComment();
  const { mutate: saveHodEntryComment } = useSaveHodEntryComment();

  const [editingQcComment, setEditingQcComment] = useState<number | null>(null);
  const [editingHodComment, setEditingHodComment] = useState<number | null>(
    null,
  );
  const [qcCommentValues, setQcCommentValues] = useState<
    Record<number, string>
  >({});
  const [hodCommentValues, setHodCommentValues] = useState<
    Record<number, string>
  >({});
  const [savingQcCommentForRow, setSavingQcCommentForRow] = useState<
    Record<number, boolean>
  >({});
  const [savingHodCommentForRow, setSavingHodCommentForRow] = useState<
    Record<number, boolean>
  >({});

  const canEditQcComments = userRole === "QAC";
  const canEditHodComments = userRole === "HOD";
  const showComments =
    enableQcComments && ["QAC", "HOD", "FACULTY"].includes(userRole || "");

  // Backward compatibility
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [commentValues, setCommentValues] = useState<Record<number, string>>(
    {},
  );
  const [savingCommentForRow, setSavingCommentForRow] = useState<
    Record<number, boolean>
  >({});
  const canEditComments = userRole === "QAC";

  // Excel operations
  const defaultDownloadHook = useDownloadExcelTemplate();
  const downloadExcelMutation =
    customExcelHooks?.downloadHook() || defaultDownloadHook;
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
  const [activeElement, setActiveElement] =
    useState<FormElementInstance | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [complexValue, setComplexValue] = useState<unknown>(null);
  // Local storage key for draft data
  const localStorageKey = `kpi-form-draft-${id}`;

  // QC Comments handlers
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
    if (!kpiId) return;

    const comment = qcCommentValues[rowIndex] || "";
    setSavingQcCommentForRow((prev) => ({ ...prev, [rowIndex]: true }));

    saveEntryComment(
      { kpiId, entryIndex: rowIndex, comment },
      {
        onSuccess: () => {
          setSavingQcCommentForRow((prev) => ({ ...prev, [rowIndex]: false }));
          setEditingQcComment(null);
        },
        onError: () => {
          setSavingQcCommentForRow((prev) => ({ ...prev, [rowIndex]: false }));
        },
      },
    );
  };

  const handleSaveHodComment = (rowIndex: number) => {
    if (!kpiId) return;

    const comment = hodCommentValues[rowIndex] || "";
    setSavingHodCommentForRow((prev) => ({ ...prev, [rowIndex]: true }));

    saveHodEntryComment(
      { kpiId, entryIndex: rowIndex, comment },
      {
        onSuccess: () => {
          setSavingHodCommentForRow((prev) => ({ ...prev, [rowIndex]: false }));
          setEditingHodComment(null);
        },
        onError: () => {
          setSavingHodCommentForRow((prev) => ({ ...prev, [rowIndex]: false }));
        },
      },
    );
  };

  const startEditingQcComment = (rowIndex: number) => {
    const existingComment =
      entryCommentsData?.qcComments?.[rowIndex.toString()]?.comment ||
      entryCommentsData?.entryComments?.[rowIndex.toString()]?.comment ||
      "";
    setQcCommentValues((prev) => ({
      ...prev,
      [rowIndex]: existingComment,
    }));
    setEditingQcComment(rowIndex);
  };

  const startEditingHodComment = (rowIndex: number) => {
    const existingComment =
      entryCommentsData?.hodComments?.[rowIndex.toString()]?.comment || "";
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

  // Backward compatibility functions
  const handleCommentChange = (rowIndex: number, value: string) => {
    setCommentValues((prev) => ({
      ...prev,
      [rowIndex]: value,
    }));
  };

  const handleSaveComment = (rowIndex: number) => {
    if (!kpiId) return;

    const comment = commentValues[rowIndex] || "";
    setSavingCommentForRow((prev) => ({ ...prev, [rowIndex]: true }));

    saveEntryComment(
      { kpiId, entryIndex: rowIndex, comment },
      {
        onSuccess: () => {
          setSavingCommentForRow((prev) => ({ ...prev, [rowIndex]: false }));
          setEditingComment(null);
        },
        onError: () => {
          setSavingCommentForRow((prev) => ({ ...prev, [rowIndex]: false }));
        },
      },
    );
  };

  const startEditingComment = (rowIndex: number) => {
    const existingComment =
      entryCommentsData?.entryComments?.[rowIndex.toString()]?.comment || "";
    setCommentValues((prev) => ({
      ...prev,
      [rowIndex]: existingComment,
    }));
    setEditingComment(rowIndex);
  };

  const cancelEditingComment = () => {
    setEditingComment(null);
    setCommentValues({});
  };

  // Load existing data or draft data on component mount
  useEffect(() => {
    // First try to load from props (server data)
    if (existingData && existingData.length > 0) {
      setEntries(existingData);
      return;
    }
    // If no server data, try to load from local storage
    try {
      const savedDraft = localStorage.getItem(localStorageKey);
      if (savedDraft) {
        const parsedDraft = JSON.parse(savedDraft);
        if (Array.isArray(parsedDraft) && parsedDraft.length > 0) {
          setEntries(parsedDraft);
          toast.info("Loaded your saved draft", { duration: 3000 });
        }
      }
    } catch (error) {
      console.error("Error loading draft data:", error);
    }
  }, [existingData, id, localStorageKey]);
  // Save to local storage when entries change (debounced)
  useEffect(() => {
    // Only save non-empty entries
    const filledEntries = entries.filter(
      (entry) => Object.keys(entry).length > 0,
    );
    if (filledEntries.length > 0) {
      const saveTimeout = setTimeout(() => {
        try {
          localStorage.setItem(localStorageKey, JSON.stringify(filledEntries));
        } catch (error) {
          console.error("Error saving draft data:", error);
        }
      }, 1000); // 1 second debounce
      return () => clearTimeout(saveTimeout);
    }
  }, [entries, localStorageKey]);
  // Autosave to server periodically (every 30 seconds) if there are changes
  const [lastSavedEntries, setLastSavedEntries] = useState<string>("");
  useEffect(() => {
    // Only consider filled entries
    const filledEntries = entries.filter(
      (entry) => Object.keys(entry).length > 0,
    );
    // If we have data and it's different from last saved data
    const currentEntriesString = JSON.stringify(filledEntries);
    if (filledEntries.length > 0 && currentEntriesString !== lastSavedEntries) {
      const autoSaveTimeout = setTimeout(() => {
        // Don't autosave if actively submitting
        if (!isSubmitting && filledEntries.length > 0) {
          const formDataToSubmit = {
            id: id,
            formData: {
              entries: filledEntries,
            },
          };
          // Silent autosave with no UI feedback unless it fails
          saveKpiData(formDataToSubmit, {
            onSuccess: () => {
              setLastSavedEntries(currentEntriesString);
            },
            onError: (error) => {
              console.error("Auto-save failed:", error);
              // Only notify on error
              toast.error("Auto-save failed. Your data is saved locally.", {
                duration: 3000,
              });
            },
          });
        }
      }, 30000); // 30 seconds
      return () => clearTimeout(autoSaveTimeout);
    }
  }, [entries, id, saveKpiData, isSubmitting, lastSavedEntries]);
  // Filter elements that can be displayed in a table (simple inputs)
  const tableElements = elements.filter((element) =>
    [
      "text",
      "number",
      "email",
      "date",
      "date-range",
      "select",
      "checkbox",
    ].includes(element.type),
  );
  // Complex elements that need a dialog (but can still be populated from Excel)
  const complexElements = elements.filter((element) =>
    ["textarea", "radio", "file"].includes(element.type),
  );
  // All elements for Excel mapping (includes both simple and complex elements)
  const allElementsForExcel = elements;
  const addNewRow = () => {
    setEntries([...entries, {}]);
  };
  const removeRow = (index: number) => {
    if (entries.length === 1) {
      // If it's the last row, just clear it instead of removing
      setEntries([{}]);
    } else {
      const newEntries = [...entries];
      newEntries.splice(index, 1);
      setEntries(newEntries);
    }
  };
  const updateEntry = (rowIndex: number, elementId: string, value: unknown) => {
    const newEntries = [...entries];
    newEntries[rowIndex] = {
      ...newEntries[rowIndex],
      [elementId]: value,
    };
    setEntries(newEntries);
  };

  /**
   * Handle appending data from Excel upload
   * Maps Excel column headers to element IDs and appends to existing entries
   */
  const handleExcelDataAppend = (excelData: Record<string, unknown>[]) => {
    // Transform Excel data to match element structure
    const transformedData = excelData.map((row) => {
      const transformedRow: Record<string, unknown> = {};

      // Map each Excel column to the corresponding element ID
      // Use all elements for Excel mapping (includes radio, textarea, etc.)
      allElementsForExcel.forEach((element) => {
        const elementLabel = element.attributes.label;
        let matchingKey: string | undefined;
        let value: unknown;

        // Try exact label match first (case-insensitive)
        matchingKey = Object.keys(row).find(
          (key) =>
            key.toLowerCase().trim() === elementLabel.toLowerCase().trim(),
        );

        // If no label match, try element ID match (for cases where Excel has element IDs as headers)
        // Also try case-insensitive partial matching for common field variations
        if (!matchingKey) {
          // Try exact element ID match
          matchingKey = Object.keys(row).find((key) => key === element.id);
        }

        // If still no match, try case-insensitive partial matching
        if (!matchingKey) {
          const elementLabelLower = elementLabel.toLowerCase();
          matchingKey = Object.keys(row).find((key) => {
            const keyLower = key.toLowerCase();
            // Check if the Excel header contains the element label or vice versa
            return (
              keyLower.includes(elementLabelLower) ||
              elementLabelLower.includes(keyLower) ||
              // Handle common variations
              keyLower.replace(/[_\s-]/g, "") ===
                elementLabelLower.replace(/[_\s-]/g, "")
            );
          });
        }

        // If we found a matching key, get the value
        if (
          matchingKey &&
          row[matchingKey] !== undefined &&
          row[matchingKey] !== null &&
          row[matchingKey] !== ""
        ) {
          value = row[matchingKey];
          transformedRow[element.id] = value;
        }
      });

      return transformedRow;
    });

    // Append to existing entries (remove empty first entry if it exists)
    const currentEntries =
      entries.length === 1 && entries[0] && Object.keys(entries[0]).length === 0
        ? []
        : entries;

    setEntries([...currentEntries, ...transformedData]);
  };
  const openComplexEditor = (
    rowIndex: number,
    element: FormElementInstance,
  ) => {
    setActiveRowIndex(rowIndex);
    setActiveElement(element);
    setComplexValue(entries[rowIndex]?.[element.id] || null);
    setDialogOpen(true);
  };
  const saveComplexValue = () => {
    if (activeRowIndex !== null && activeElement) {
      updateEntry(activeRowIndex, activeElement.id, complexValue);
    }
    setDialogOpen(false);
  };
  const validateEntries = () => {
    const invalidRows: number[] = [];
    entries.forEach((entry, index) => {
      // Skip validation for empty rows (except if it's the only row)
      if (Object.keys(entry).length === 0 && entries.length > 1) {
        return;
      }
      elements.forEach((element) => {
        const value = entry[element.id];

        // Required check
        if (element.attributes.required) {
          if (!value) {
            invalidRows.push(index + 1);
          } else if (element.type === "date-range") {
            const [start, end] = String(value).split("|");
            if (!start || !end) {
              if (!invalidRows.includes(index + 1)) invalidRows.push(index + 1);
            }
          }
        }

        // we are checking Date range specific validation
        if (element.type === "date-range" && value) {
          const [start, end] = String(value).split("|");

          // Logic check: Start <= End
          if (start && end && start > end) {
            if (!invalidRows.includes(index + 1)) invalidRows.push(index + 1);
          }

          // Min date check
          if (element.attributes.minDate) {
            if (
              (start && start < element.attributes.minDate) ||
              (end && end < element.attributes.minDate)
            ) {
              if (!invalidRows.includes(index + 1)) invalidRows.push(index + 1);
            }
          }

          // Max date check
          if (element.attributes.maxDate) {
            if (
              (start && start > element.attributes.maxDate) ||
              (end && end > element.attributes.maxDate)
            ) {
              if (!invalidRows.includes(index + 1)) invalidRows.push(index + 1);
            }
          }
        }
      });
    });
    return invalidRows;
  };
  const handleSubmit = async () => {
    const filledEntries = entries.filter(
      (entry) => Object.keys(entry).length > 0,
    );
    if (filledEntries.length === 0) {
      toast.warning("No data to submit", {
        description: "Please add at least one entry to the table",
      });
      return;
    }
    const invalidRows = validateEntries();
    if (invalidRows.length > 0) {
      toast.error("Missing required fields", {
        description: `Please complete all required fields in rows: ${invalidRows.join(", ")}`,
      });
      return;
    }
    setIsSubmitting(true);
    const formDataToSubmit = {
      id: id,
      formData: {
        entries: filledEntries,
      },
    };
    // Perform save without persistent loading toast (only spinner on button)
    saveKpiData(formDataToSubmit, {
      onSuccess: () => {
        setIsSubmitting(false);
        toast.success("Data saved successfully!");
        // Clear draft from local storage after successful save
        try {
          localStorage.removeItem(`kpi-form-draft-${id}`);
        } catch (error) {
          console.error("Error clearing draft data:", error);
        }
      },
      onError: (error) => {
        setIsSubmitting(false);
        toast.error("Failed to save data. Retrying in 3 seconds...", {
          description:
            error.message || "Please check your connection and try again",
          duration: 5000,
        });
        // Implement retry logic
        setTimeout(() => {
          if (!document.hidden) {
            // Only retry if page is visible
            toast.loading("Retrying save...");
            saveKpiData(formDataToSubmit, {
              onSuccess: () => {
                toast.success("Data saved successfully on retry!");
                try {
                  localStorage.removeItem(`kpi-form-draft-${id}`);
                } catch (error) {
                  console.error("Error clearing draft data:", error);
                }
              },
              onError: () => {
                toast.error("Save failed. Please try manually saving again.", {
                  action: {
                    label: "Try Again",
                    onClick: () => handleSubmit(),
                  },
                });
              },
            });
          }
        }, 3000);
      },
    });
  };
  const handleSecondaryAction = async () => {
    if (!secondaryAction) return;
    const filledEntries = entries.filter(
      (entry) => Object.keys(entry).length > 0,
    );
    if (filledEntries.length === 0) {
      toast.warning("No data to submit", {
        description: "Please add at least one entry to the table",
      });
      return;
    }
    const invalidRows = validateEntries();
    if (invalidRows.length > 0) {
      toast.error("Missing required fields", {
        description: `Please complete all required fields in rows: ${invalidRows.join(", ")}`,
      });
      return;
    }
    try {
      await secondaryAction.onAction(filledEntries);
    } catch (e: unknown) {
      toast.error("Action failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    }
  };
  const downloadExcel = () => {
    if (
      downloadExcelMutation &&
      typeof downloadExcelMutation === "object" &&
      downloadExcelMutation !== null &&
      "mutate" in downloadExcelMutation
    ) {
      (downloadExcelMutation as { mutate: (id: string) => void }).mutate(id);
    }
  };
  const renderComplexElementEditor = () => {
    if (!activeElement) return null;
    const { id: elementId, type, attributes } = activeElement;
    switch (type) {
      case "textarea":
        return (
          <div className="space-y-2">
            <Label htmlFor={elementId}>
              {attributes.label}
              {attributes.required && " *"}
            </Label>
            <Textarea
              id={elementId}
              placeholder={attributes.placeholder}
              rows={attributes.rows}
              value={String(complexValue || "")}
              onChange={(e) => setComplexValue(e.target.value)}
            />
          </div>
        );
      case "radio":
        return (
          <div className="space-y-2">
            <Label>
              {attributes.label}
              {attributes.required && " *"}
            </Label>
            <RadioGroup
              value={String(complexValue || "")}
              onValueChange={setComplexValue}
            >
              {attributes.options?.map(
                (option: { label: string; value: string }, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={option.value}
                      id={`${elementId}-${index}`}
                    />
                    <Label htmlFor={`${elementId}-${index}`}>
                      {option.label}
                    </Label>
                  </div>
                ),
              )}
            </RadioGroup>
          </div>
        );
      case "file":
        return (
          <div className="space-y-2">
            <Label htmlFor={elementId}>
              {attributes.label}
              {attributes.required && " *"}
            </Label>
            <div className="border-2 border-dashed rounded-md p-6 text-center">
              <FileUp className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">
                {complexValue
                  ? `File selected: ${complexValue}`
                  : "No file selected"}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 bg-transparent"
                onClick={() => setComplexValue(`file-${Date.now()}.pdf`)}
              >
                Select File
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              {attributes.multiple
                ? "Multiple files allowed"
                : "Single file only"}{" "}
              • Accepted formats: {attributes.acceptedFileTypes || "All files"}
            </p>
          </div>
        );
      default:
        return <div>Unsupported element type</div>;
    }
  };
  const hasComplexElements = complexElements.length > 0;
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center">
              <ChartLine className="mr-2" />
              {name}
            </CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={downloadExcel}
              disabled={
                downloadExcelMutation &&
                typeof downloadExcelMutation === "object" &&
                downloadExcelMutation !== null &&
                "isPending" in downloadExcelMutation
                  ? (downloadExcelMutation as { isPending: boolean }).isPending
                  : false
              }
            >
              {downloadExcelMutation &&
              typeof downloadExcelMutation === "object" &&
              downloadExcelMutation !== null &&
              "isPending" in downloadExcelMutation &&
              (downloadExcelMutation as { isPending: boolean }).isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="mr-2 h-4 w-4" />
              )}
              Download Excel Template
            </Button>
            {useFrontendExcelUpload ? (
              <FrontendExcelUploadDialog
                onDataParsed={handleExcelDataAppend}
                tableHeaders={allElementsForExcel.map((element) => ({
                  id: element.id,
                  label: element.attributes.label || "Field",
                  type: element.type as
                    | "text"
                    | "number"
                    | "date"
                    | "select"
                    | "radio"
                    | "textarea"
                    | "checkbox"
                    | "email"
                    | undefined,
                  options: element.attributes.options as
                    | Array<{ label: string; value: string | number }>
                    | undefined,
                  required: element.attributes.required as boolean | undefined,
                  validation: {
                    min: element.attributes.min as number | undefined,
                    max: element.attributes.max as number | undefined,
                    pattern: element.attributes.pattern as string | undefined,
                    format: element.attributes.format as string | undefined,
                  },
                }))}
                title="Upload Excel File"
                description="Upload an Excel file to add data to the table. The first row should contain column headers that match the table headers."
              />
            ) : customExcelHooks?.uploadComponent ? (
              <customExcelHooks.uploadComponent kpiId={id} />
            ) : (
              <ExcelUploadDialog kpiId={id} />
            )}
            {/*<Button
              variant="outline"
              onClick={() => {
                toast.success("PDF download functionality will be implemented");
              }}
            >
              <FileText className="mr-2 h-4 w-4" />
              Download PDF
            </Button>*/}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <ReactTable>
            <TableHeader>
              <TableRow>
                {tableElements.map((element) => {
                  const fieldLabel = element.attributes.label;
                  // Calculate dynamic width based on field name length
                  const getDynamicWidth = (text: string) => {
                    const baseWidth = 100; // Minimum base width
                    const charWidth = 6; // Approximate pixels per character (more conservative)
                    const calculatedWidth = Math.min(
                      baseWidth + text.length * charWidth,
                      160,
                    );
                    return Math.max(calculatedWidth, 100); // Ensure minimum of 100px
                  };

                  const dynamicWidth = getDynamicWidth(fieldLabel);

                  // Get appropriate Tailwind class for width
                  const getWidthClass = (width: number) => {
                    if (width <= 80) return "w-[80px]";
                    if (width <= 90) return "w-[90px]";
                    if (width <= 100) return "w-[100px]";
                    if (width <= 110) return "w-[110px]";
                    if (width <= 120) return "w-[120px]";
                    if (width <= 130) return "w-[130px]";
                    if (width <= 140) return "w-[140px]";
                    if (width <= 150) return "w-[150px]";
                    return "w-[160px]"; // Maximum
                  };

                  const widthClass = getWidthClass(dynamicWidth);
                  const isDateRange = element.type === "date-range";
                  const finalWidthClass = isDateRange
                    ? "w-[300px]"
                    : widthClass;
                  const maxWidthClass = isDateRange
                    ? "max-w-[300px]"
                    : "max-w-[160px]";

                  return (
                    <TableHead
                      key={element.id}
                      className={`${finalWidthClass} ${maxWidthClass} min-w-[100px] p-2 text-left align-middle border-r`}
                    >
                      <div className="w-full h-full overflow-hidden break-words leading-tight text-xs font-medium flex items-center">
                        <span>
                          {smartBreakColumnName(fieldLabel)}
                          {element.attributes.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </span>
                      </div>
                    </TableHead>
                  );
                })}
                {hasComplexElements && (
                  <TableHead className="w-[130px] max-w-[160px] min-w-[100px] p-2 text-left align-middle border-r">
                    <div className="w-full h-full overflow-hidden break-words leading-tight text-xs font-medium flex items-center">
                      <span>{smartBreakColumnName("Additional Fields")}</span>
                    </div>
                  </TableHead>
                )}
                {showComments && (
                  <>
                    <TableHead className="w-[250px]">
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        QC Comments
                      </div>
                    </TableHead>
                    <TableHead className="w-[250px]">
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        Department Comments
                      </div>
                    </TableHead>
                  </>
                )}
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry, rowIndex) => (
                <TableRow key={rowIndex}>
                  {tableElements.map((element) => (
                    <TableCell key={element.id}>
                      {renderTableCellInput(
                        element,
                        entry,
                        rowIndex,
                        updateEntry,
                      )}
                    </TableCell>
                  ))}
                  {hasComplexElements && (
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {complexElements.map((element) => {
                          const hasValue =
                            entry[element.id] !== undefined &&
                            entry[element.id] !== null &&
                            entry[element.id] !== "";

                          // Create a shortened button label
                          const getShortLabel = (label: string) => {
                            if (!label || label.length <= 20) return label;

                            // Try to break at special characters and take first part
                            const parts = label.split(/[,;:]/);
                            if (parts[0] && parts[0].trim().length <= 25) {
                              return (
                                parts[0].trim() +
                                (parts.length > 1 ? "..." : "")
                              );
                            }

                            // Try numbered lists
                            const numberMatch = label.match(
                              /^(\d+\.\s*[^,;:]{1,20})/,
                            );
                            if (numberMatch) {
                              return numberMatch[1] + "...";
                            }

                            // Fallback to word boundary
                            const words = label.split(" ");
                            let result = words[0] || "";
                            for (let i = 1; i < words.length; i++) {
                              if ((result + " " + words[i]).length <= 20) {
                                result += " " + words[i];
                              } else {
                                break;
                              }
                            }
                            return (
                              result +
                              (result.length < label.length ? "..." : "")
                            );
                          };

                          return (
                            <Button
                              key={element.id}
                              variant={hasValue ? "default" : "outline"}
                              size="sm"
                              onClick={() =>
                                openComplexEditor(rowIndex, element)
                              }
                              className="text-xs h-7 max-w-[120px]"
                              title={element.attributes.label} // Full label on hover
                            >
                              <span className="truncate">
                                {getShortLabel(element.attributes.label)}
                                {hasValue && " ✓"}
                              </span>
                            </Button>
                          );
                        })}
                      </div>
                    </TableCell>
                  )}
                  {showComments && (
                    <>
                      {/* QC Comments Column */}
                      <TableCell className="w-[250px]">
                        <div className="space-y-2">
                          {editingQcComment === rowIndex ? (
                            <div className="space-y-2">
                              <Textarea
                                value={qcCommentValues[rowIndex] || ""}
                                onChange={(e) =>
                                  handleQcCommentChange(
                                    rowIndex,
                                    e.target.value,
                                  )
                                }
                                placeholder="Add QC comment for this entry..."
                                className="text-xs resize-none"
                                rows={3}
                              />
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveQcComment(rowIndex)}
                                  disabled={savingQcCommentForRow[rowIndex]}
                                  className="h-6 px-2 text-xs"
                                >
                                  {savingQcCommentForRow[rowIndex] ? (
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
                                const qcComments =
                                  entryCommentsData?.qcComments ||
                                  entryCommentsData?.entryComments ||
                                  {};
                                const comment = qcComments[rowIndex.toString()];
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
                                    {canEditQcComments && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          startEditingQcComment(rowIndex)
                                        }
                                        className="h-6 px-2 text-xs"
                                      >
                                        Edit
                                      </Button>
                                    )}
                                  </div>
                                ) : (
                                  canEditQcComments && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        startEditingQcComment(rowIndex)
                                      }
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
                      <TableCell className="w-[250px]">
                        <div className="space-y-2">
                          {editingHodComment === rowIndex ? (
                            <div className="space-y-2">
                              <Textarea
                                value={hodCommentValues[rowIndex] || ""}
                                onChange={(e) =>
                                  handleHodCommentChange(
                                    rowIndex,
                                    e.target.value,
                                  )
                                }
                                placeholder="Add department comment for this entry..."
                                className="text-xs resize-none"
                                rows={3}
                              />
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveHodComment(rowIndex)}
                                  disabled={savingHodCommentForRow[rowIndex]}
                                  className="h-6 px-2 text-xs"
                                >
                                  {savingHodCommentForRow[rowIndex] ? (
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
                                const comment =
                                  entryCommentsData?.hodComments?.[
                                    rowIndex.toString()
                                  ];
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
                                        onClick={() =>
                                          startEditingHodComment(rowIndex)
                                        }
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
                                      onClick={() =>
                                        startEditingHodComment(rowIndex)
                                      }
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
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRow(rowIndex)}
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </ReactTable>
        </div>
        {entries.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            No entries yet. Add your first entry.
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          <Button variant="outline" onClick={addNewRow} disabled={isSubmitting}>
            <Plus className="mr-2 h-4 w-4" />
            Add Row
          </Button>
        </div>
        <div className="flex gap-2">
          {secondaryAction && (
            <Button
              variant={secondaryAction.variant || "default"}
              onClick={handleSecondaryAction}
              disabled={secondaryAction.disabled || secondaryAction.loading}
            >
              {secondaryAction.loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {secondaryAction.label}
                </>
              ) : (
                <>
                  <FileUp className="mr-2 h-4 w-4" />
                  {secondaryAction.label}
                </>
              )}
            </Button>
          )}
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Draft
              </>
            )}
          </Button>
        </div>
      </CardFooter>
      {/* Dialog for complex elements */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{activeElement?.attributes.label}</DialogTitle>
          </DialogHeader>
          <div className="py-4">{renderComplexElementEditor()}</div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveComplexValue}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
function renderTableCellInput(
  element: FormElementInstance,
  entry: Record<string, unknown>,
  rowIndex: number,
  updateEntry: (rowIndex: number, elementId: string, value: unknown) => void,
) {
  const { id, type, attributes } = element;
  const value = entry[id];
  switch (type) {
    case "text":
    case "email":
      return (
        <Input
          type={type}
          value={String(value || "")}
          onChange={(e) => updateEntry(rowIndex, id, e.target.value)}
          placeholder={attributes.placeholder}
          className="h-8 w-full"
        />
      );
    case "number":
      return (
        <Input
          type="number"
          value={String(value || "")}
          onChange={(e) =>
            updateEntry(
              rowIndex,
              id,
              e.target.value ? Number(e.target.value) : "",
            )
          }
          placeholder={attributes.placeholder}
          min={attributes.min}
          max={attributes.max}
          className="h-8 w-full"
        />
      );
    case "date":
      return (
        <Input
          type="date"
          value={String(value || "")}
          onChange={(e) => updateEntry(rowIndex, id, e.target.value)}
          className="h-8 w-full"
        />
      );
    case "date-range": {
      const parts = String(value || "").split("|");
      const start = parts[0] || "";
      const end = parts[1] || "";

      // Simple validation for UI feedback
      const isStartInvalid =
        start &&
        ((attributes.minDate && start < attributes.minDate) ||
          (attributes.maxDate && start > attributes.maxDate));
      const isEndInvalid =
        end &&
        ((attributes.minDate && end < attributes.minDate) ||
          (attributes.maxDate && end > attributes.maxDate));

      const isRangeInvalid = start && end && start > end;

      return (
        <div className="flex flex-col gap-1 min-w-[150px] py-1">
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-gray-500 w-6">From</span>
            <Input
              type="date"
              value={start}
              onChange={(e) =>
                updateEntry(rowIndex, id, `${e.target.value}|${end}`)
              }
              min={attributes.minDate}
              max={attributes.maxDate}
              className={`h-7 text-xs px-1 w-full ${isStartInvalid ? "border-red-500 bg-red-50" : ""}`}
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-gray-500 w-6">To</span>
            <Input
              type="date"
              value={end}
              onChange={(e) =>
                updateEntry(rowIndex, id, `${start}|${e.target.value}`)
              }
              min={attributes.minDate}
              max={attributes.maxDate}
              className={`h-7 text-xs px-1 w-full ${isEndInvalid ? "border-red-500 bg-red-50" : ""}`}
            />
          </div>
          {isRangeInvalid && (
            <div className="text-[9px] text-red-500">Invalid range</div>
          )}
        </div>
      );
    }
    case "select":
      return (
        <Select
          value={String(value || "")}
          onValueChange={(value) => updateEntry(rowIndex, id, value)}
        >
          <SelectTrigger className="h-8 w-full">
            <SelectValue placeholder={attributes.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {attributes.options?.map(
              (option: { label: string; value: string }, index: number) => (
                <SelectItem key={index} value={option.value}>
                  {option.label}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      );
    case "checkbox":
      return (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={Boolean(value)}
            onCheckedChange={(checked) => updateEntry(rowIndex, id, checked)}
          />
        </div>
      );
    default:
      return <div>Unsupported in table</div>;
  }
}
