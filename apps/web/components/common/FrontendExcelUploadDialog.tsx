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
import { FileUp, Loader2, CheckCircle } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

interface TableHeader {
  id: string;
  label: string;
}

interface ParsedData {
  data: Record<string, any>[];
  headers: string[];
  totalRows: number;
  validRows: number;
}

interface FrontendExcelUploadDialogProps {
  trigger?: React.ReactNode;
  onDataParsed: (data: Record<string, any>[]) => void;
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
        console.warn(`Extra column found: "${excelHeader}" - will be ignored`);
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

      const [headers, ...dataRows] = jsonData as [string[], ...any[][]];

      const headerValidation = validateHeaders(headers);
      if (!headerValidation.isValid) {
        toast.error("Header validation failed", {
          description: headerValidation.errors.join("; "),
        });
        return;
      }

      const processedData: Record<string, any>[] = [];

      dataRows.forEach((row) => {
        if (
          row.every(
            (cell) => cell === undefined || cell === null || cell === "",
          )
        ) {
          return;
        }

        const rowData: Record<string, any> = {};
        headers.forEach((header, index) => {
          const tableHeader = tableHeaders.find(
            (h) => h.label.toLowerCase() === header.toLowerCase(),
          );
          if (tableHeader) {
            rowData[tableHeader.id] = row[index] || "";
          }
        });

        processedData.push(rowData);
      });

      if (processedData.length === 0) {
        toast.warning("No valid data rows found in Excel file");
        setParsedResult({
          data: [],
          headers,
          totalRows: dataRows.length,
          validRows: 0,
        });
        return;
      }

      setParsedResult({
        data: processedData,
        headers,
        totalRows: dataRows.length,
        validRows: processedData.length,
      });

      toast.success(
        `Successfully parsed ${processedData.length} rows from Excel file`,
      );
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
                                    {row[header.id] || ""}
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
