"use client";

import { useMemo, useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";
import { Separator } from "@workspace/ui/components/separator";
import { Loader2, Download, FileSpreadsheet, Building } from "lucide-react";
import {
  useGetReportKpiOptions,
  useDownloadKpiWorkbook,
  useDownloadDepartmentWorkbook,
} from "@/queries/qc/report";
import { useGetDepartments } from "@/queries/qc/department-assignment";

export default function QcReportGenerationPage() {
  const [selectedKpiTemplateId, setSelectedKpiTemplateId] = useState<
    string | null
  >(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    string | null
  >(null);

  const {
    data: kpiOptions = [],
    isLoading: loadingKpiOptions,
    isError: kpiOptionsError,
    error: kpiOptionsErrorDetails,
  } = useGetReportKpiOptions();

  const {
    data: departments = [],
    isLoading: loadingDepartments,
    isError: departmentsError,
    error: departmentsErrorDetails,
  } = useGetDepartments();

  const { mutate: downloadKpi, isPending: downloadingKpi } =
    useDownloadKpiWorkbook();
  const { mutate: downloadDepartment, isPending: downloadingDepartment } =
    useDownloadDepartmentWorkbook();

  const selectedKpi = useMemo(
    () =>
      kpiOptions.find((option) => option.id === selectedKpiTemplateId) ?? null,
    [kpiOptions, selectedKpiTemplateId],
  );

  const selectedDepartment = useMemo(
    () =>
      departments.find(
        (department) => department.id === selectedDepartmentId,
      ) ?? null,
    [departments, selectedDepartmentId],
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Report Generation</h1>
        <p className="text-muted-foreground text-sm">
          Export curated Excel workbooks for KPI and department-wide analytics
          directly from QC dashboard data.
        </p>
      </div>

      <Tabs defaultValue="kpi" className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full md:w-[480px]">
          <TabsTrigger value="kpi">KPI Report</TabsTrigger>
          <TabsTrigger value="department">Department Report</TabsTrigger>
        </TabsList>

        <TabsContent value="kpi" className="space-y-6">
          <Card className="shadow-sm border border-muted-foreground/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileSpreadsheet className="h-5 w-5 text-primary" /> KPI Report
              </CardTitle>
              <CardDescription>
                Generate a consolidated workbook with one sheet per department
                for the selected KPI template.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[220px] space-y-2">
                  <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
                    KPI Template
                  </label>
                  <Select
                    value={selectedKpiTemplateId ?? undefined}
                    onValueChange={setSelectedKpiTemplateId}
                    disabled={loadingKpiOptions || kpiOptions.length === 0}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          loadingKpiOptions ? "Loading..." : "Select KPI number"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {kpiOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          KPI {option.kpi_number} — {option.kpi_metric_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-shrink-0 w-full sm:w-auto">
                  <Button
                    className="w-full sm:w-auto"
                    disabled={!selectedKpiTemplateId || downloadingKpi}
                    onClick={() =>
                      selectedKpiTemplateId &&
                      downloadKpi({
                        kpiTemplateId: selectedKpiTemplateId,
                        kpiNumber: selectedKpi?.kpi_number,
                        kpiMetricName: selectedKpi?.kpi_metric_name,
                      })
                    }
                  >
                    {downloadingKpi ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Download report
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Only KPIs designed by your QAC account are displayed.
              </p>

              {selectedKpi && (
                <div className="rounded-md border border-muted-foreground/30 p-4 text-xs bg-muted/30">
                  <p className="font-semibold text-sm text-foreground">
                    KPI {selectedKpi.kpi_number}
                  </p>
                  <Separator className="my-2" />
                  <p className="text-muted-foreground">
                    {selectedKpi.kpi_metric_name}
                  </p>
                </div>
              )}

              {(kpiOptionsError || departmentsError) && (
                <Alert variant="destructive">
                  <AlertTitle>Unable to load report metadata</AlertTitle>
                  <AlertDescription>
                    {(kpiOptionsErrorDetails as any)?.message ||
                      (departmentsErrorDetails as any)?.message ||
                      "Please refresh the page and try again."}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="department" className="space-y-6">
          <Card className="shadow-sm border border-muted-foreground/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Building className="h-5 w-5 text-primary" /> Department Report
              </CardTitle>
              <CardDescription>
                Export the complete departmental performance workbook including
                the overview sheet and each KPI sheet.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[220px] space-y-2">
                  <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
                    Department
                  </label>
                  <Select
                    value={selectedDepartmentId ?? undefined}
                    onValueChange={setSelectedDepartmentId}
                    disabled={loadingDepartments || departments.length === 0}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          loadingDepartments
                            ? "Loading..."
                            : "Select department"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((department) => (
                        <SelectItem key={department.id} value={department.id}>
                          {department.dept_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-shrink-0 w-full sm:w-auto">
                  <Button
                    className="w-full sm:w-auto"
                    disabled={!selectedDepartmentId || downloadingDepartment}
                    onClick={() =>
                      selectedDepartmentId &&
                      downloadDepartment({
                        departmentId: selectedDepartmentId,
                        departmentName: selectedDepartment?.dept_name,
                      })
                    }
                  >
                    {downloadingDepartment ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Download department report
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Includes active pillars, performance scores, and all assigned
                KPIs.
              </p>

              {selectedDepartment && (
                <div className="rounded-md border border-muted-foreground/30 p-4 text-xs bg-muted/30">
                  <p className="font-semibold text-sm text-foreground">
                    {selectedDepartment.dept_name}
                  </p>
                  <Separator className="my-2" />
                  <p className="text-muted-foreground">
                    {selectedDepartment.hod_name
                      ? `HoD: ${selectedDepartment.hod_name}`
                      : "HoD details pending"}
                  </p>
                </div>
              )}

              {departmentsError && (
                <Alert variant="destructive">
                  <AlertTitle>Unable to load departments</AlertTitle>
                  <AlertDescription>
                    {(departmentsErrorDetails as any)?.message ||
                      "Please refresh the page and try again."}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
