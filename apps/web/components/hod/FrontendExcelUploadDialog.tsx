"use client";

import { useState, useRef } from "react";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Badge } from "@workspace/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  FileUp,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

interface FrontendExcelUploadDialogProps {
  kpiId: string;
  trigger?: React.ReactNode;
  onDataParsed: (data: Record<string, any>[]) => void;
  tableHeaders: string[];
}

interface ParsedData {
  success: boolean;
  data: Record<string, any>[];
  errors: string[];
  totalRows: number;
  processedRows: number;
}

/**
 * Frontend Excel Upload Dialog Component
 * Parses Excel files directly in the browser and appends data to the table
 * First row should contain column headers that match the frontend table headers
 */
export function FrontendExcelUploadDialog({
  kpiId,
  trigger,
  onDataParsed,
  tableHeaders,
}: FrontendExcelUploadDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handle file selection from input
   * Automatically triggers parsing when file is selected
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log("File selected:", file.name, file.type);
      handleFileParse(file);
    }
  };

  /**
   * Handle drag and drop file upload
   */
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      console.log("File dropped:", file.name, file.type);
      handleFileParse(file);
    }
  };

  /**
   * Handle drag over event
   */
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  /**
   * Parse Excel file and extract data
   * First row should contain headers that match tableHeaders
   */
  const handleFileParse = async (file: File) => {
    setIsProcessing(true);
    setParsedResult(null);

    try {
      // Read the Excel file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });

      // Get the first worksheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // Convert to JSON (first row as headers)
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        throw new Error(
          "Excel file must contain at least a header row and one data row",
        );
      }

      // First row should be headers
      const excelHeaders = jsonData[0] as string[];
      const dataRows = jsonData.slice(1) as any[][];

      // Validate headers match table headers
      const headerValidation = validateHeaders(excelHeaders, tableHeaders);
      if (!headerValidation.isValid) {
        setParsedResult({
          success: false,
          data: [],
          errors: headerValidation.errors,
          totalRows: dataRows.length,
          processedRows: 0,
        });

        // Show validation error toast
        toast.error("Excel file validation failed", {
          description: headerValidation.errors.join("; "),
        });
        return;
      }

      // Convert data rows to objects
      const processedData: Record<string, any>[] = [];
      const errors: string[] = [];

      dataRows.forEach((row, index) => {
        if (
          row.every(
            (cell) => cell === undefined || cell === null || cell === "",
          )
        ) {
          // Skip empty rows
          return;
        }

        const rowData: Record<string, any> = {};
        let hasData = false;

        excelHeaders.forEach((header, colIndex) => {
          const value = row[colIndex];
          if (value !== undefined && value !== null && value !== "") {
            rowData[header] = value;
            hasData = true;
          }
        });

        if (hasData) {
          processedData.push(rowData);
        }
      });

      const result: ParsedData = {
        success: true,
        data: processedData,
        errors: [],
        totalRows: dataRows.length,
        processedRows: processedData.length,
      };

      setParsedResult(result);

      // Show success toast
      if (result.success && result.processedRows > 0) {
        toast.success("Excel file parsed successfully!", {
          description: `Found ${result.processedRows} valid rows. Review the data and click "Add to Table" to append them.`,
        });
      } else if (result.success && result.processedRows === 0) {
        toast.warning("Excel file parsed but no valid data found", {
          description:
            "The file was processed but no rows with data were found.",
        });
      }
    } catch (error) {
      console.error("Excel parsing failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to parse Excel file";

      setParsedResult({
        success: false,
        data: [],
        errors: [errorMessage],
        totalRows: 0,
        processedRows: 0,
      });

      // Show error toast
      toast.error("Excel parsing failed", {
        description: errorMessage,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Validate that Excel headers match table headers
   */
  const validateHeaders = (excelHeaders: string[], tableHeaders: string[]) => {
    const errors: string[] = [];

    // Check if all table headers are present in Excel
    const missingHeaders = tableHeaders.filter(
      (tableHeader) =>
        !excelHeaders.some(
          (excelHeader) =>
            excelHeader.toLowerCase().trim() ===
            tableHeader.toLowerCase().trim(),
        ),
    );

    if (missingHeaders.length > 0) {
      errors.push(`Missing required columns: ${missingHeaders.join(", ")}`);
    }

    // Check for extra columns (warn but don't fail)
    const extraHeaders = excelHeaders.filter(
      (excelHeader) =>
        !tableHeaders.some(
          (tableHeader) =>
            tableHeader.toLowerCase().trim() ===
            excelHeader.toLowerCase().trim(),
        ),
    );

    if (extraHeaders.length > 0) {
      errors.push(
        `Extra columns found (will be ignored): ${extraHeaders.join(", ")}`,
      );
    }

    return {
      isValid: missingHeaders.length === 0,
      errors,
    };
  };

  /**
   * Handle adding parsed data to the table
   */
  const handleAddToTable = () => {
    if (parsedResult?.success && parsedResult.data.length > 0) {
      onDataParsed(parsedResult.data);
      toast.success(`Added ${parsedResult.processedRows} rows to the table`);
      handleCloseDialog();
    }
  };

  /**
   * Handle closing the dialog and resetting state
   */
  const handleCloseDialog = () => {
    setIsOpen(false);
    setParsedResult(null);
    setIsProcessing(false);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /**
   * Get status icon based on current state
   */
  const getStatusIcon = () => {
    if (isProcessing)
      return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />;
    if (!parsedResult) return <FileUp className="h-5 w-5 text-gray-600" />;

    if (parsedResult.success && parsedResult.processedRows > 0) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    } else {
      return <XCircle className="h-5 w-5 text-red-600" />;
    }
  };

  /**
   * Get status text based on current state
   */
  const getStatusText = () => {
    if (isProcessing) return "Processing Excel File...";
    if (!parsedResult) return "Upload Excel File";

    if (parsedResult.success && parsedResult.processedRows > 0) {
      return "Excel File Processed Successfully";
    } else {
      return "Excel Processing Failed";
    }
  };

  /**
   * Get status badge color based on current state
   */
  const getStatusColor = () => {
    if (isProcessing) return "bg-blue-100 text-blue-700";
    if (!parsedResult) return "bg-gray-100 text-gray-700";

    if (parsedResult.success && parsedResult.processedRows > 0) {
      return "bg-green-100 text-green-700";
    } else {
      return "bg-red-100 text-red-700";
    }
  };

  return (
    <>
      {trigger || (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            console.log("Upload Excel button clicked");
            setIsOpen(true);
          }}
        >
          <FileUp className="mr-2 h-4 w-4" />
          Upload Excel
        </Button>
      )}

      <Dialog
        open={isOpen}
        onOpenChange={(open) => !open && handleCloseDialog()}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getStatusIcon()}
              {getStatusText()}
            </DialogTitle>
            <DialogDescription>
              Upload an Excel file with KPI data. The first row should contain
              column headers that match the table headers.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Upload Area */}
            {!parsedResult && !isProcessing && (
              <Card>
                <CardContent className="pt-6">
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FileUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Upload Excel File
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Drag and drop your Excel file here, or click to browse
                    </p>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      disabled={isProcessing}
                    >
                      Choose File
                    </Button>
                    <p className="text-xs text-gray-400 mt-2">
                      Supported formats: .xlsx, .xls
                    </p>
                    <div className="mt-4 p-3 bg-blue-50 rounded-md">
                      <p className="text-sm text-blue-700">
                        <strong>Required columns:</strong>{" "}
                        {tableHeaders.join(", ")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Processing */}
            {isProcessing && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Processing Excel File
                      </h3>
                      <p className="text-sm text-gray-500">
                        Please wait while we parse your data...
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results */}
            {parsedResult && (
              <div className="space-y-4">
                {/* Summary Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Badge className={getStatusColor()}>
                        {parsedResult.success ? "Success" : "Failed"}
                      </Badge>
                      Processing Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {parsedResult.totalRows}
                        </div>
                        <div className="text-sm text-gray-500">Total Rows</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {parsedResult.processedRows}
                        </div>
                        <div className="text-sm text-gray-500">Valid Rows</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {parsedResult.errors.length}
                        </div>
                        <div className="text-sm text-gray-500">Errors</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Errors */}
                {parsedResult.errors.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-700">
                        <XCircle className="h-5 w-5" />
                        Processing Errors
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {parsedResult.errors.map((error, index) => (
                          <div
                            key={index}
                            className="p-3 bg-red-50 border border-red-200 rounded-md"
                          >
                            <p className="text-sm text-red-700">{error}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Preview Data */}
                {parsedResult.success && parsedResult.data.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="h-5 w-5" />
                        Data Preview (First 3 rows)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded-md overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {tableHeaders.map((header) => (
                                <TableHead key={header}>{header}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {parsedResult.data.slice(0, 3).map((row, index) => (
                              <TableRow key={index}>
                                {tableHeaders.map((header) => (
                                  <TableCell key={header}>
                                    {row[header] || "-"}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
          </div>

          {/* Dialog Footer */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            {parsedResult?.success && parsedResult.processedRows > 0 && (
              <Button onClick={handleAddToTable}>
                <FileUp className="mr-2 h-4 w-4" />
                Add {parsedResult.processedRows} Rows to Table
              </Button>
            )}
            <Button variant="outline" onClick={handleCloseDialog}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
