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
import { useUploadHodExcel } from "@/queries/hod/excel";

interface ExcelUploadDialogProps {
  kpiId: string;
  trigger?: React.ReactNode;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
  value: string;
}

interface UploadResult {
  success: boolean;
  processedRows: number;
  errorRows: number;
  totalRows: number;
  validationErrors?: ValidationError[];
  message: string;
  dataSaved: boolean;
}

/**
 * HOD Excel Upload Dialog Component
 * Provides a user-friendly interface for uploading Excel files with KPI data
 * Includes validation, error reporting, and success feedback
 */
export function HodExcelUploadDialog({
  kpiId,
  trigger,
}: ExcelUploadDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadExcelMutation = useUploadHodExcel();

  /**
   * Handle file selection from input
   * Automatically triggers upload when file is selected
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  /**
   * Handle Excel file upload
   * Processes the file and shows validation results
   */
  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const result = await uploadExcelMutation.mutateAsync({ kpiId, formData });
      setUploadResult(result);

      // Keep dialog open to show results
      if (result.success && result.errorRows === 0) {
        // Auto-close on complete success after 3 seconds
        setTimeout(() => {
          setIsOpen(false);
          setUploadResult(null);
        }, 3000);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadResult({
        success: false,
        processedRows: 0,
        errorRows: 0,
        totalRows: 0,
        message: error instanceof Error ? error.message : "Upload failed",
        dataSaved: false,
      });
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Retry upload with new file
   */
  const handleRetry = () => {
    setUploadResult(null);
    fileInputRef.current?.click();
  };

  /**
   * Close dialog and reset state
   */
  const handleClose = () => {
    setIsOpen(false);
    setUploadResult(null);
    setIsUploading(false);
  };

  /**
   * Get status icon based on current state
   */
  const getStatusIcon = () => {
    if (isUploading)
      return <Loader2 className="h-5 w-5 animate-spin text-gray-600" />;
    if (!uploadResult) return <FileUp className="h-5 w-5 text-gray-600" />;

    if (uploadResult.success && uploadResult.errorRows === 0) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    } else if (uploadResult.success && uploadResult.errorRows > 0) {
      return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    } else {
      return <XCircle className="h-5 w-5 text-red-600" />;
    }
  };

  /**
   * Get status text based on current state
   */
  const getStatusText = () => {
    if (isUploading) return "Uploading...";
    if (!uploadResult) return "Upload Excel File";

    if (uploadResult.success && uploadResult.errorRows === 0) {
      return "Upload Successful";
    } else if (uploadResult.success && uploadResult.errorRows > 0) {
      return "Upload with Errors";
    } else {
      return "Upload Failed";
    }
  };

  /**
   * Get status badge color based on current state
   */
  const getStatusColor = () => {
    if (isUploading) return "bg-blue-100 text-blue-700";
    if (!uploadResult) return "bg-gray-100 text-gray-700";

    if (uploadResult.success && uploadResult.errorRows === 0) {
      return "bg-green-100 text-green-700";
    } else if (uploadResult.success && uploadResult.errorRows > 0) {
      return "bg-yellow-100 text-yellow-700";
    } else {
      return "bg-red-100 text-red-700";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <FileUp className="mr-2 h-4 w-4" />
            Upload Excel
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon()}
            {getStatusText()}
          </DialogTitle>
          <DialogDescription>
            Upload an Excel file with KPI data. The file will be validated
            against the form structure.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload Area */}
          {!uploadResult && !isUploading && (
            <Card>
              <CardContent className="pt-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <FileUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Upload Excel File
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Drag and drop your Excel file here, or click to browse
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    Choose File
                  </Button>
                  <p className="text-xs text-gray-400 mt-2">
                    Supported formats: .xlsx, .xls
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Processing Excel File
                    </h3>
                    <p className="text-sm text-gray-500">
                      Please wait while we validate your data...
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {uploadResult && (
            <div className="space-y-4">
              {/* Summary Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge className={getStatusColor()}>
                      {uploadResult.success ? "Success" : "Failed"}
                    </Badge>
                    Upload Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {uploadResult.totalRows}
                      </div>
                      <div className="text-sm text-gray-500">Total Rows</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {uploadResult.processedRows}
                      </div>
                      <div className="text-sm text-gray-500">Processed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {uploadResult.errorRows}
                      </div>
                      <div className="text-sm text-gray-500">Errors</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {uploadResult.dataSaved ? "Yes" : "No"}
                      </div>
                      <div className="text-sm text-gray-500">Saved</div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-700">
                      {uploadResult.message}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Validation Errors */}
              {uploadResult.validationErrors &&
                uploadResult.validationErrors.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-700">
                        <XCircle className="h-5 w-5" />
                        Validation Errors (
                        {uploadResult.validationErrors.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-600 mb-4">
                        Please fix the following errors in your Excel file and
                        try uploading again.
                      </div>
                      <div className="border rounded-md overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-16">Row</TableHead>
                              <TableHead>Field</TableHead>
                              <TableHead>Error</TableHead>
                              <TableHead className="w-32">Value</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {uploadResult.validationErrors.map(
                              (error, index) => (
                                <TableRow
                                  key={index}
                                  className="hover:bg-gray-50"
                                >
                                  <TableCell className="font-medium">
                                    {error.row}
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {error.field}
                                  </TableCell>
                                  <TableCell className="text-red-600">
                                    {error.message}
                                  </TableCell>
                                  <TableCell className="text-gray-500 text-xs">
                                    {error.value || "(empty)"}
                                  </TableCell>
                                </TableRow>
                              ),
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* Instructions */}
              {uploadResult.validationErrors &&
                uploadResult.validationErrors.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-gray-700">
                        How to Fix Errors
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <p>
                          1. <strong>Required Fields:</strong> Fill in all
                          required fields marked with *
                        </p>
                        <p>
                          2. <strong>Data Types:</strong> Ensure data matches
                          the expected format (text, number, date, etc.)
                        </p>
                        <p>
                          3. <strong>Select Options:</strong> Use only the
                          provided options for dropdown/radio fields
                        </p>
                        <p>
                          4. <strong>Date Format:</strong> Use DD/MM/YYYY format
                          for dates
                        </p>
                        <p>
                          5. <strong>Email Format:</strong> Ensure email
                          addresses are valid
                        </p>
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
          {uploadResult &&
            uploadResult.validationErrors &&
            uploadResult.validationErrors.length > 0 && (
              <Button variant="outline" onClick={handleRetry}>
                <FileUp className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            )}
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
