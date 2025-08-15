"use client";
import { useParams, useRouter } from "next/navigation";
import { useGetKpi, useUpdateKpiStatus } from "@/queries/qc/review";
import {
  deriveDisplayStatus,
  displayStatusToBadgeVariant,
} from "@/lib/qc-status";
import ReadOnlyFormTable from "@/components/qc/readonly-form-table";
import { FormElementInstance, FormElementType } from "@/lib/types";
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

export default function QcKpiReviewPage() {
  const params = useParams();
  const router = useRouter();
  const kpiId = params?.kpiId as string | undefined;
  const { data, isLoading, isError, error } = useGetKpi(kpiId || null);
  const { mutate: updateStatus, isPending: updating } = useUpdateKpiStatus();
  const [remark, setRemark] = useState("");
  const [showPanel, setShowPanel] = useState(false);

  const displayStatus = useMemo(() => {
    if (!data) return null;
    return deriveDisplayStatus({
      status: data.kpi_status,
      hasFormResponses: !!data.form_responses,
    });
  }, [data]);

  function act(action: "APPROVE" | "REVISION" | "REJECT") {
    if (!kpiId) return;
    updateStatus({ kpiId, payload: { action, remark } });
    setRemark("");
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          &larr; Back
        </Button>
        <h1 className="text-xl font-semibold flex-1">KPI Review</h1>
        {displayStatus && (
          <Badge variant={displayStatusToBadgeVariant(displayStatus) as any}>
            {displayStatus}
          </Badge>
        )}
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
                <div className="space-y-3">
                  <Textarea
                    placeholder="Remark (optional)"
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => act("APPROVE")} disabled={updating}>
                      Approve
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => act("REVISION")}
                      disabled={updating}
                    >
                      Ask Revision
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => act("REJECT")}
                      disabled={updating}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
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
                                {new Date(r.at).toLocaleString()}
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
              return (
                <ReadOnlyFormTable elements={elements} entries={entries} />
              );
            })()}
          </div>
          {/* Review history moved inside collapsible panel */}
        </CardContent>
      </Card>
    </div>
  );
}
