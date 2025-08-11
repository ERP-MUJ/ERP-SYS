"use client";
import React from "react";
import TableFormRenderer from "@/components/formbuilder/table-rendered";
import { useGetKpiDetails, useSaveHodKpiData } from "@/queries/hod/kpi";

export default function HodKpiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const { data, isLoading, error } = useGetKpiDetails(id);
  console.log("HOD KPI Data:", data);

  if (isLoading) {
    return <div className="text-center">Loading KPI details...</div>;
  }

  if (error) {
    return <div>Error: {String(error)}</div>;
  }

  if (!data) {
    return <div>No KPI data found</div>;
  }

  // Cast data to any to avoid TypeScript issues with dynamic API response
  const kpiData = data as any;
  const kpi = kpiData.kpi_name || kpiData.kpi_metric_name || "Untitled KPI";
  const description = kpiData.kpi_description || "No description available";
  const elements = (kpiData.elements || []).map((el: any) => ({
    ...el,
    type: el.type as import("@/lib/types").FormElementType,
  }));
  const existingData = kpiData.existingData || [];

  return (
    <TableFormRenderer
      id={id}
      description={description}
      name={kpi}
      elements={elements}
      existingData={existingData}
      customSaveHook={useSaveHodKpiData}
    />
  );
}
