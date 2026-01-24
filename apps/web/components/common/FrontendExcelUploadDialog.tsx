"use client";

import { useState, useRef } from "react";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  FileUp,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

interface TableHeader {
  id: string;
  label: string;
  type?:
    | "text"
    | "number"
    | "date"
    | "select"
    | "radio"
    | "textarea"
    | "checkbox"
    | "email";
  options?: Array<{ label: string; value: string | number }>;
  required?: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    format?: string;
  };
}

interface ParsedData {
  data: Record<string, unknown>[];
  headers: string[];
  totalRows: number;
  validRows: number;
  validationErrors?: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

interface ValidationResult {
  isValid: boolean;
  processedValue: unknown;
  error?: string;
}

interface FrontendExcelUploadDialogProps {
  trigger?: React.ReactNode;
  onDataParsed: (data: Record<string, unknown>[]) => void;
  tableHeaders: TableHeader[];
  title?: string;
  description?: string;
}

export function FrontendExcelUploadDialog({
  trigger,
  onDataParsed,
  tableHeaders,
  title = "Upload Excel File",
  description = "Upload an Excel file to add data to the table. The first row should contain column headers that match the table headers.",
}: FrontendExcelUploadDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const convertExcelDateToJSDate = (excelDateSerial: number): Date | null => {
    try {
      const jsDate = new Date((excelDateSerial - 25569) * 86400 * 1000);
      if (
        isNaN(jsDate.getTime()) ||
        jsDate.getFullYear() < 1900 ||
        jsDate.getFullYear() > 2100
      ) {
        return null;
      }

      return jsDate;
    } catch {
      return null;
    }
  };

  const parseDateValue = (
    value: unknown,
    fieldName: string,
  ): ValidationResult => {
    if (value === null || value === undefined || value === "") {
      return { isValid: true, processedValue: null };
    }

    if (value instanceof Date) {
      return {
        isValid: true,
        processedValue: value.toISOString().split("T")[0],
      };
    }

    if (typeof value === "string") {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return {
          isValid: true,
          processedValue: date.toISOString().split("T")[0],
        };
      }
    }

    if (typeof value === "number") {
      const jsDate = convertExcelDateToJSDate(value);
      if (jsDate) {
        return {
          isValid: true,
          processedValue: jsDate.toISOString().split("T")[0],
        };
      }
    }

    return {
      isValid: false,
      processedValue: value,
      error: `Invalid date format for field '${fieldName}'. Expected: DD/MM/YYYY or Excel date serial number`,
    };
  };

  const validateSelectValue = (
    value: unknown,
    options: Array<{ label: string; value: string | number }>,
    fieldName: string,
  ): ValidationResult => {
    if (value === null || value === undefined || value === "") {
      return { isValid: true, processedValue: null };
    }

    const stringValue = String(value).trim();

    const matchingOption = options.find(
      (option) =>
        String(option.value).toLowerCase() === stringValue.toLowerCase() ||
        option.label.toLowerCase() === stringValue.toLowerCase(),
    );

    if (matchingOption) {
      return { isValid: true, processedValue: matchingOption.value };
    }

    const validOptionsText = options
      .map((option) => `${option.label} (${option.value})`)
      .join(", ");
    return {
      isValid: false,
      processedValue: value,
      error: `Invalid value for field '${fieldName}'. Allowed options: ${validOptionsText}`,
    };
  };

  const validateFieldValue = (
    value: unknown,
    tableHeader: TableHeader,
  ): ValidationResult => {
    const { type, options, required, validation } = tableHeader;

    if (required && (value === null || value === undefined || value === "")) {
      return {
        isValid: false,
        processedValue: value,
        error: `Required field '${tableHeader.label}' cannot be empty`,
      };
    }

    if (!required && (value === null || value === undefined || value === "")) {
      return { isValid: true, processedValue: null };
    }

    switch (type) {
      case "date":
        return parseDateValue(value, tableHeader.label);

      case "select":
      case "radio":
        if (!options || options.length === 0) {
          return { isValid: true, processedValue: value };
        }
        return validateSelectValue(value, options, tableHeader.label);

      case "textarea":
        return { isValid: true, processedValue: String(value) };

      case "number": {
        const numValue = Number(value);
        if (isNaN(numValue)) {
          return {
            isValid: false,
            processedValue: value,
            error: `Invalid number format for field '${tableHeader.label}'`,
          };
        }

        if (validation?.min !== undefined && numValue < validation.min) {
          return {
            isValid: false,
            processedValue: value,
            error: `Value for field '${tableHeader.label}' must be at least ${validation.min}`,
          };
        }
        if (validation?.max !== undefined && numValue > validation.max) {
          return {
            isValid: false,
            processedValue: value,
            error: `Value for field '${tableHeader.label}' must be at most ${validation.max}`,
          };
        }

        return { isValid: true, processedValue: numValue };
      }

      case "text":
      default:
        return { isValid: true, processedValue: String(value) };
    }
  };

  const validateHeaders = (
    excelHeaders: string[],
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const expectedHeaders = tableHeaders.map((h) => h.label.toLowerCase());
    const excelHeadersLower = excelHeaders.map((h) => h.toLowerCase());

    for (const expectedHeader of expectedHeaders) {
      if (!excelHeadersLower.includes(expectedHeader)) {
        errors.push(`Missing required column: "${expectedHeader}"`);
      }
    }

    for (const excelHeader of excelHeadersLower) {
      if (!expectedHeaders.includes(excelHeader)) {
        // Don't warn for extra columns - just ignore them silently
        // console.warn(`Extra column found: "${excelHeader}" - will be ignored`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const handleFileParse = async (file: File) => {
    if (!file) return;

    setIsProcessing(true);
    setParsedResult(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });

      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        throw new Error("Excel file does not contain any worksheets");
      }
      const worksheet = workbook.Sheets[firstSheetName];
      if (!worksheet) {
        throw new Error(
          "Could not access the first worksheet in the Excel file",
        );
      }

      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        toast.warning("Excel file contains no data rows");
        setParsedResult({
          data: [],
          headers: [],
          totalRows: 0,
          validRows: 0,
        });
        return;
      }

      const [headers, ...dataRows] = jsonData as [string[], ...unknown[][]];

      const headerValidation = validateHeaders(headers);
      if (!headerValidation.isValid) {
        toast.error("Header validation failed", {
          description: headerValidation.errors.join("; "),
        });
        return;
      }

      const processedData: Record<string, unknown>[] = [];
      const validationErrors: Array<{
        row: number;
        field: string;
        message: string;
      }> = [];

      dataRows.forEach((row, rowIndex) => {
        if (
          row.every(
            (cell) => cell === undefined || cell === null || cell === "",
          )
        ) {
          return;
        }

        const rowData: Record<string, unknown> = {};
        let hasRowErrors = false;

        headers.forEach((header, colIndex) => {
          const tableHeader = tableHeaders.find(
            (h) => h.label.toLowerCase() === header.toLowerCase(),
          );

          if (tableHeader) {
            const rawValue = row[colIndex];
            const validationResult = validateFieldValue(rawValue, tableHeader);

            if (validationResult.isValid) {
              rowData[tableHeader.id] = validationResult.processedValue;
            } else {
              hasRowErrors = true;
              validationErrors.push({
                row: rowIndex + 2, // +2 because Excel rows start at 1 and we skip header
                field: tableHeader.label,
                message: validationResult.error || "Validation failed",
              });
              // Still add the raw value for display purposes
              rowData[tableHeader.id] = validationResult.processedValue;
            }
          }
        });

        // Only add rows that don't have validation errors or have at least some valid data
        if (!hasRowErrors || Object.keys(rowData).length > 0) {
          processedData.push(rowData);
        }
      });

      if (processedData.length === 0) {
        toast.warning("No valid data rows found in Excel file");
        setParsedResult({
          data: [],
          headers,
          totalRows: dataRows.length,
          validRows: 0,
          validationErrors,
        });
        return;
      }

      setParsedResult({
        data: processedData,
        headers,
        totalRows: dataRows.length,
        validRows: processedData.length,
        validationErrors:
          validationErrors.length > 0 ? validationErrors : undefined,
      });

      if (validationErrors.length > 0) {
        toast.warning(
          `Parsed ${processedData.length} rows with ${validationErrors.length} validation error(s). Please review the results.`,
        );
      } else {
        toast.success(
          `Successfully parsed ${processedData.length} rows from Excel file`,
        );
      }
    } catch (error) {
      console.error("Excel parsing error:", error);
      toast.error("Failed to parse Excel file", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileParse(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files && files[0]) {
      handleFileParse(files[0]);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleAddToTable = () => {
    if (parsedResult?.data) {
      onDataParsed(parsedResult.data);
      handleCloseDialog();
    }
  };

  const handleCloseDialog = () => {
    setIsOpen(false);
    setParsedResult(null);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setIsOpen(true)}>{trigger}</div>
      ) : (
        <Button
          variant="outline"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2"
        >
          <FileUp className="h-4 w-4" />
          Upload Excel
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select Excel File</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileUp className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">
                    Drop your Excel file here or click to browse
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports .xlsx, .xls files
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </CardContent>
            </Card>

            {isProcessing && (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Processing Excel file...</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {parsedResult && !isProcessing && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Parsing Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Total Rows:</span>{" "}
                      {parsedResult.totalRows}
                    </div>
                    <div>
                      <span className="font-medium">Valid Rows:</span>{" "}
                      {parsedResult.validRows}
                    </div>
                    <div>
                      <span className="font-medium">Headers:</span>{" "}
                      {parsedResult.headers.length}
                    </div>
                  </div>

                  {parsedResult.validationErrors &&
                    parsedResult.validationErrors.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-orange-600">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="font-medium">
                            Validation Errors (
                            {parsedResult.validationErrors.length})
                          </span>
                        </div>
                        <div className="max-h-32 overflow-y-auto space-y-1 text-sm">
                          {parsedResult.validationErrors.map((error, index) => (
                            <div
                              key={index}
                              className="text-orange-700 bg-orange-50 p-2 rounded"
                            >
                              <span className="font-medium">
                                Row {error.row}:
                              </span>{" "}
                              {error.field} - {error.message}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-blue-600">
                      <Info className="h-4 w-4" />
                      <span className="font-medium">Format Guidelines</span>
                    </div>
                    <div className="text-sm space-y-1">
                      {tableHeaders
                        .map((header) => {
                          if (header.type === "date") {
                            return (
                              <div
                                key={header.id}
                                className="text-blue-700 bg-blue-50 p-2 rounded"
                              >
                                <span className="font-medium">
                                  {header.label}:
                                </span>{" "}
                                Use date format (DD/MM/YYYY) or Excel serial
                                number (e.g., 4638 for 2024-01-01)
                              </div>
                            );
                          }
                          if (
                            header.type === "select" ||
                            header.type === "radio"
                          ) {
                            if (header.options && header.options.length > 0) {
                              const validOptions = header.options
                                .map((opt) => `${opt.label} (${opt.value})`)
                                .join(", ");
                              return (
                                <div
                                  key={header.id}
                                  className="text-blue-700 bg-blue-50 p-2 rounded"
                                >
                                  <span className="font-medium">
                                    {header.label}:
                                  </span>{" "}
                                  Allowed values: {validOptions}
                                </div>
                              );
                            }
                          }
                          if (header.type === "number" && header.validation) {
                            const constraints = [];
                            if (header.validation.min !== undefined)
                              constraints.push(`min: ${header.validation.min}`);
                            if (header.validation.max !== undefined)
                              constraints.push(`max: ${header.validation.max}`);
                            if (constraints.length > 0) {
                              return (
                                <div
                                  key={header.id}
                                  className="text-blue-700 bg-blue-50 p-2 rounded"
                                >
                                  <span className="font-medium">
                                    {header.label}:
                                  </span>{" "}
                                  Numeric value, {constraints.join(", ")}
                                </div>
                              );
                            }
                          }
                          return null;
                        })
                        .filter(
                          (item): item is NonNullable<typeof item> =>
                            item !== null,
                        )}
                    </div>
                  </div>

                  {parsedResult.data.length > 0 && (
                    <>
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {tableHeaders.map((header) => (
                                <TableHead key={header.id}>
                                  {header.label}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {parsedResult.data.slice(0, 5).map((row, index) => (
                              <TableRow key={index}>
                                {tableHeaders.map((header) => (
                                  <TableCell key={header.id}>
                                    {String(row[header.id] || "")}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      {parsedResult.data.length > 5 && (
                        <p className="text-sm text-gray-500 text-center">
                          Showing first 5 rows of {parsedResult.data.length}{" "}
                          total
                        </p>
                      )}
                    </>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleAddToTable}
                      disabled={parsedResult.data.length === 0}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Add to Table ({parsedResult.data.length} rows)
                    </Button>
                    <Button variant="outline" onClick={handleCloseDialog}>
                      Close
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
