"use client";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  useDownloadDepartmentKpiWorkbook,
  useGetKpi,
  useUpdateKpiStatus,
  useGetEntryComments,
  useSaveEntryComment,
  useSaveHodEntryComment,
} from "@/queries/qc/review";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  deriveDisplayStatus,
  displayStatusToBadgeVariant,
} from "@/lib/qc-status";
import ReadOnlyFormTable from "@/components/qc/readonly-form-table";
import { FormElementInstance, FormElementType } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Separator } from "@workspace/ui/components/separator";
import { Textarea } from "@workspace/ui/components/textarea";
import { Badge } from "@workspace/ui/components/badge";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { RejectKpiModal } from "@/components/qc/reject-kpi-modal";
import { Download, Loader2 } from "lucide-react";

export default function QcKpiReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const kpiId = params?.kpiId as string | undefined;
  const { data, isLoading, isError, error } = useGetKpi(kpiId || null);
  const { data: entryCommentsData } = useGetEntryComments(kpiId || null);
  const { mutate: updateStatus, isPending: updating } = useUpdateKpiStatus();
  const { mutate: saveEntryComment, isPending: savingComment } =
    useSaveEntryComment();
  const { mutate: saveHodEntryComment, isPending: savingHodComment } =
    useSaveHodEntryComment();
  const { mutate: downloadWorkbook, isPending: downloadingWorkbook } =
    useDownloadDepartmentKpiWorkbook();
  const [remark, setRemark] = useState("");
  const [showPanel, setShowPanel] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [savingCommentForRow, setSavingCommentForRow] = useState<
    Record<number, boolean>
  >({});
  const [savingHodCommentForRow, setSavingHodCommentForRow] = useState<
    Record<number, boolean>
  >({});

  const displayStatus = useMemo(() => {
    if (!data) return null;
    const metrics = data.kpi_calculated_metrics as any;
    const isSubmittedToQc = metrics?.is_submitted_to_qc === true;
    return deriveDisplayStatus({
      status: data.kpi_status,
      hasFormResponses: Boolean((data as any).form_responses?.entries?.length),
      isSubmittedToQc,
    });
  }, [data]);

  const handleSaveEntryComment = (entryIndex: number, comment: string) => {
    if (!kpiId) return;

    setSavingCommentForRow((prev) => ({ ...prev, [entryIndex]: true }));

    saveEntryComment(
      { kpiId, entryIndex, comment },
      {
        onSuccess: () => {
          setSavingCommentForRow((prev) => ({ ...prev, [entryIndex]: false }));
        },
        onError: () => {
          setSavingCommentForRow((prev) => ({ ...prev, [entryIndex]: false }));
        },
      },
    );
  };

  const handleSaveHodEntryComment = (entryIndex: number, comment: string) => {
    if (!kpiId) return;

    setSavingHodCommentForRow((prev) => ({ ...prev, [entryIndex]: true }));

    saveHodEntryComment(
      { kpiId, entryIndex, comment },
      {
        onSuccess: () => {
          setSavingHodCommentForRow((prev) => ({
            ...prev,
            [entryIndex]: false,
          }));
        },
        onError: () => {
          setSavingHodCommentForRow((prev) => ({
            ...prev,
            [entryIndex]: false,
          }));
        },
      },
    );
  };

  function act(action: "APPROVE" | "REVISION" | "REJECT") {
    if (!kpiId) return;

    const trimmedRemark = remark.trim();
    if (!trimmedRemark) {
      // Server requires non-empty remark
      toast.error("Please provide a remark before submitting your review");
      return;
    }

    updateStatus(
      { kpiId, payload: { action, remark: trimmedRemark } },
      {
        onSuccess: () => {
          setRemark("");
        },
      },
    );
  }

  if (isLoading) return <div className="p-6">Loading KPI...</div>;
  if (isError)
    return (
      <div className="p-6 text-destructive">
        Error: {(error as any)?.message}
      </div>
    );
  if (!data) return <div className="p-6">Not found</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" onClick={() => router.back()}>
          &larr; Back
        </Button>
        <h1 className="text-xl font-semibold grow">KPI Review</h1>
        {displayStatus && (
          <StatusBadge
            status={displayStatusToBadgeVariant(displayStatus) as any}
            label={displayStatus}
          />
        )}
        <Button
          size="sm"
          variant="outline"
          disabled={!kpiId || downloadingWorkbook}
          onClick={() => {
            if (kpiId) {
              downloadWorkbook({
                departmentKpiId: kpiId,
                departmentName: data?.department?.dept_name,
                kpiNumber: data?.kpi_number,
                kpiMetricName: data?.kpi_metric_name,
              });
            }
          }}
        >
          {downloadingWorkbook ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Download Excel
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{data.kpi_metric_name || "KPI"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">KPI Number:</span> {data.kpi_number}
            </div>
            <div>
              <span className="font-medium">Status:</span> {displayStatus}
            </div>
            <div>
              <span className="font-medium">Target Achieved:</span>{" "}
              {data.percentage_target_achieved ?? "-"}%
            </div>
          </div>
          <Separator />
          <div>
            <h2 className="font-medium mb-2">Description</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {data.kpi_description || "—"}
            </p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-medium">Review</h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowPanel((v) => !v)}
              >
                {showPanel ? "Hide Review Panel" : "Open Review Panel"}
              </Button>
            </div>
            {showPanel && (
              <div className="border rounded-md p-4 space-y-5 bg-background/60">
                {data.locked ? (
                  <div className="space-y-3">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 bg-amber-500 rounded-full" />
                        <span className="text-sm font-medium text-amber-800">
                          Preview Mode
                        </span>
                      </div>
                      <p className="text-sm text-amber-700 mt-1">
                        {data.lock_reason ||
                          "This KPI cannot be reviewed at this time."}
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
                      placeholder="Remark (required)"
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => act("APPROVE")}
                        disabled={updating || remark.trim().length === 0}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => act("REVISION")}
                        disabled={updating || remark.trim().length === 0}
                      >
                        Ask Revision
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => setIsRejectModalOpen(true)}
                        disabled={updating || remark.trim().length === 0}
                      >
                        Reject
                      </Button>
                      <RejectKpiModal
                        open={isRejectModalOpen}
                        onOpenChange={setIsRejectModalOpen}
                        onConfirm={() => {
                          act("REJECT");
                          setIsRejectModalOpen(false);
                        }}
                        isLoading={updating}
                      />
                    </div>
                  </div>
                )}
                <div>
                  <h3 className="font-medium mb-2 text-sm">Review History</h3>
                  {Array.isArray(data.kpi_calculated_metrics?.review_history) &&
                  data.kpi_calculated_metrics.review_history.length > 0 ? (
                    <ul className="space-y-2 text-xs max-h-56 overflow-auto pr-1">
                      {data.kpi_calculated_metrics.review_history
                        .slice()
                        .reverse()
                        .map((r: any, i: number) => (
                          <li
                            key={i}
                            className="p-2 rounded border bg-background/50"
                          >
                            <div className="flex justify-between mb-1">
                              <span className="font-medium">{r.action}</span>
                              <span className="text-muted-foreground">
                                {format(new Date(r.at), "dd/MM/yyyy HH:mm:ss")}
                              </span>
                            </div>
                            {r.remark && (
                              <div className="italic">{r.remark}</div>
                            )}
                            {r.by && (
                              <div className="text-muted-foreground">
                                By: {r.by}
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
          <div>
            <h2 className="font-medium mb-2">Submitted Data</h2>
            {(() => {
              const rawElements =
                (data as any).elements ||
                (data as any).kpi_data?.elements ||
                [];
              const elements: FormElementInstance[] = rawElements.map(
                (el: any) => {
                  if (el.attributes) {
                    return {
                      ...el,
                      type: el.type as FormElementType,
                    } as FormElementInstance;
                  } else {
                    const { id, type, ...rest } = el;
                    return {
                      id,
                      type: type as FormElementType,
                      attributes: { ...rest },
                    } as FormElementInstance;
                  }
                },
              );
              const entries = (data as any).form_responses?.entries || [];
              const canEditQcComments = user?.role === "QAC";
              const canEditHodComments = user?.role === "HOD";
              const showComments = ["QAC", "HOD", "FACULTY"].includes(
                user?.role || "",
              );

              return (
                <ReadOnlyFormTable
                  elements={elements}
                  entries={entries}
                  enableRowComments={showComments}
                  qcComments={entryCommentsData?.qcComments || {}}
                  hodComments={entryCommentsData?.hodComments || {}}
                  entryComments={entryCommentsData?.entryComments || {}}
                  canEditQcComments={canEditQcComments}
                  canEditHodComments={canEditHodComments}
                  onSaveQcComment={handleSaveEntryComment}
                  onSaveHodComment={handleSaveHodEntryComment}
                  isSavingQcComment={savingCommentForRow}
                  isSavingHodComment={savingHodCommentForRow}
                />
              );
            })()}
          </div>
          {/* Review history moved inside collapsible panel */}
        </CardContent>
      </Card>
    </div>
  );
}
