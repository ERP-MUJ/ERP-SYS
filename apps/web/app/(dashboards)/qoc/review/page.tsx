'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { useFetchKPISubmisson } from '@/hooks/faculty';
import { Alert, AlertDescription, AlertTitle } from '@workspace/ui/components/alert';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@workspace/ui/components/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { Textarea } from '@workspace/ui/components/textarea';
import { DialogClose } from '@workspace/ui/components/dialog';
import { Check, Eye, X, AlertCircle } from 'lucide-react';
import { Badge } from '@workspace/ui/components/badge';

type KpiData = {
  assigned_kpi_id: number;
  kpi_name: string;
  kpi_description: string;
  kpi_status: string;
  form_input: Record<string, string | number>[] | null;
};

const getStatusBadge = status => {
  switch (status) {
    case 'approved':
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
          <Check className="mr-1 h-3 w-3" />
          Approved
        </Badge>
      );
    case 'redo':
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
          <X className="mr-1 h-3 w-3" />
          Needs Revision
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          <AlertCircle className="mr-1 h-3 w-3" />
          Pending Review
        </Badge>
      );
  }
};

export default function QOCSubmissionReview() {
  const id_i = 7;
  const { data, isLoading, error } = useFetchKPISubmisson(id_i.toString());
  const [selectedKpi, setSelectedKpi] = useState<KpiData | null>(null);
  console.log('data', data);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [qocRemark, setQocRemark] = useState('');

  const handleReviewSubmit = action => {
    // Update the KPI status in the data
    const updatedKpis = data.assignedKpis.map(kpi => {
      if (kpi.assigned_kpi_id === selectedKpi.assigned_kpi_id) {
        return {
          ...kpi,
          kpi_status: action,
          qoc_remark: qocRemark,
        };
      }
      return kpi;
    });

    setData({ ...data, assignedKpis: updatedKpis });
    setQocRemark('');
    setDialogOpen(false);
  };

  if (isLoading) return <div>Loading KPIs...</div>;
  if (error instanceof Error) return <div>Error: {error.message}</div>;

  return (
    <div className="mx-auto max-w-7xl p-6">
      <h1 className="mb-6 text-3xl font-bold">KPI Performance Review</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data.assignedKpis && data.assignedKpis.length > 0 ? (
          data.assignedKpis.map(kpi => (
            <Card key={kpi.assigned_kpi_id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{kpi.kpi_name}</CardTitle>
                  {getStatusBadge(kpi.kpi_status)}
                </div>
                <CardDescription>{kpi.kpi_description}</CardDescription>
              </CardHeader>
              <CardContent>
                {kpi.qoc_remark && (
                  <Alert className="mb-4">
                    <AlertTitle>Review Feedback</AlertTitle>
                    <AlertDescription className="text-sm">{kpi.qoc_remark}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => {
                    setSelectedKpi(kpi);
                    setDialogOpen(true);
                  }}
                  className="w-full"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Review Details
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full">
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">No KPIs available.</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* KPI Review Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedKpi?.kpi_name}</DialogTitle>
            <DialogDescription>{selectedKpi?.kpi_description}</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Tabs defaultValue="data" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="data">Submitted Data</TabsTrigger>
                <TabsTrigger value="review">Review & Feedback</TabsTrigger>
              </TabsList>

              <TabsContent value="data" className="space-y-4">
                <div className="mt-4">
                  <h3 className="mb-2 text-lg font-medium">Submitted Information</h3>
                  {selectedKpi && selectedKpi.form_input && selectedKpi.form_input.length > 0 ? (
                    <div className="grid gap-4">
                      {selectedKpi.form_input.map((entry, idx) => (
                        <Card key={idx}>
                          <CardContent className="pt-6">
                            {Object.entries(entry).map(([key, value]) => (
                              <div
                                key={key}
                                className="flex justify-between border-b border-gray-100 py-1 last:border-0"
                              >
                                <span className="font-medium capitalize">{key}:</span>
                                <span>{value}</span>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No data submitted yet.</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="review">
                <div className="mt-4 space-y-4">
                  <div>
                    <h3 className="mb-2 text-lg font-medium">Quality of Completion Remarks</h3>
                    <Textarea
                      placeholder="Enter your feedback about this KPI submission..."
                      value={qocRemark}
                      onChange={e => setQocRemark(e.target.value)}
                      rows={5}
                      className="w-full"
                    />
                  </div>

                  <div className="pt-2">
                    <h3 className="mb-2 text-lg font-medium">Decision</h3>
                    <div className="flex gap-4">
                      <Button
                        onClick={() => handleReviewSubmit('approved')}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleReviewSubmit('redo')}
                        variant="destructive"
                        className="flex-1"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Needs Revision
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
