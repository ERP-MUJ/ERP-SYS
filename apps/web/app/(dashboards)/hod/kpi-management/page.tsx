"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";

// 🔧 Commented unused AlertDialog components to fix ESLint warnings
// import {
//   AlertDialog,
//   AlertDialogContent,
//   AlertDialogFooter,
//   AlertDialogDescription,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "@workspace/ui/components/alert-dialog";

import Link from "next/link";

// 🔧 Commented unused icon to fix ESLint warning
// import { PlusCircle } from "lucide-react";

import { useFetchForms } from "@/hooks/forms";
// import { useState } from "react";
import { Badge } from "@workspace/ui/components/badge";

export default function FormsPage() {
  const { data: forms, isLoading, error } = useFetchForms();
  // const deleteKpiMutation = useDeleteKpi();

  // 🔧 Commented unused state variables to fix ESLint warnings
  // const [deletingFormId, setDeletingFormId] = useState<string | null>(null);
  // const [formToDelete, setFormToDelete] = useState<string | null>(null);
  // const [open, setOpen] = useState(false);

  console.log("Forms:", forms);

  // 🔧 Commented unused delete handlers to fix ESLint warnings
  /*
  const handleDelete = (formId: string) => {
    const numericId = formId.startsWith("form-")
      ? formId.split("-")[1]!
      : formId;
    setDeletingFormId(formId);
    deleteKpiMutation.mutate(numericId, {
      onSuccess: () => setDeletingFormId(null),
      onError: () => setDeletingFormId(null),
    });
  };

  const openDeleteDialog = (formId: string) => {
    setFormToDelete(formId);
    setOpen(true);
  };

  const handleConfirmDelete = () => {
    if (formToDelete) {
      handleDelete(formToDelete);
      setOpen(false);
      setFormToDelete(null);
    }
  };
  */

  return (
    <main className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Your KPI&apos;s</h1>
          <p className="text-gray-600 mt-2">
            Manage and edit your created KPI&apos;s
          </p>
        </div>
      </div>

      {/* Pillar Selection */}
      <div className="mb-8">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-4">
            <label htmlFor="pillar-select" className="text-sm font-medium">
              Select Pillar:
            </label>
            <Select value={selectedPillar} onValueChange={setSelectedPillar}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Choose a pillar to view KPIs" />
              </SelectTrigger>
              <SelectContent>
                {PILLARS.map((pillar) => {
                  const Icon = pillar.icon
                  return (
                    <SelectItem key={pillar.id} value={pillar.id}>
                      <div className="flex items-center space-x-2">
                        <Icon className="h-4 w-4" />
                        <span>{pillar.name}</span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {!selectedPillar ? (
        <div className="text-center py-12">
          <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Select a Pillar to Get Started</h3>
          <p className="text-gray-500">Choose a pillar from the dropdown above to view and manage your KPIs</p>
        </div>
      ) : kpisForPillar.length === 0 ? (
        <div className="text-center py-12">
          <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No KPIs Found</h3>
          <p className="text-gray-500">No KPIs are available for the selected pillar</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {kpisForPillar.map((kpi) => (
            <Card key={kpi.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{kpi.title}</CardTitle>
                    <CardDescription className="mt-1">{kpi.description}</CardDescription>
                  </div>
                  <Badge variant={kpi.status === "active" ? "default" : "secondary"} className="ml-2">
                    {kpi.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pb-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Current Value:</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">
                    {kpi.value}
                    {kpi.id === "kpi-1" || kpi.id === "kpi-5" ? "%" : ""}
                    {kpi.id === "kpi-3" || kpi.id === "kpi-2" ? "/5" : ""}
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Calendar className="h-3 w-3" />
                  <span>Updated: {new Date(kpi.lastUpdated).toLocaleDateString()}</span>
                </div>

                <div className="mt-2 text-sm text-gray-600">
                  {kpi.elements.length} data field{kpi.elements.length !== 1 ? "s" : ""}
                </div>
              </CardContent>

              <CardFooter>
                <Link href={`/hod/kpi-management/${kpi.id}`} className="w-full">
                  <Button className="w-full">Open KPI</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}
