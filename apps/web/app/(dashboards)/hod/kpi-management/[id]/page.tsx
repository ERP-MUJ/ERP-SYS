"use client";
import React from "react";
import TableFormRenderer from "@/components/formbuilder/table-rendered";
import { useGetKpiDetails, useSaveHodKpiData } from "@/queries/hod/kpi";
import { FormElementType, FormElementInstance } from "@/lib/types";

// Define type for API response
interface KpiData {
  kpi_name?: string;
  kpi_metric_name?: string;
  kpi_description?: string;
  elements?: {
    id: string;
    type: string;
    name: string;
    label: string;
    required: boolean;
    options?: string[];
    placeholder?: string;
    [key: string]: any;
  }[];
  existingData?: Record<string, any>[];
  // Additional properties from the API response
  kpi_data?: {
    elements?: any[];
    metadata?: Record<string, any>;
    layout?: Record<string, any>;
  };
  form_responses?: {
    entries: Record<string, any>[];
    submittedAt?: string;
  };
  kpi_status?: string;
}

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

  // Use proper typing for the API response
  const kpiData = data as KpiData;
  const kpi = kpiData.kpi_name || kpiData.kpi_metric_name || "Untitled KPI";
  const description = kpiData.kpi_description || "No description available";
  
  // Extract elements from kpi_data if available, or from elements field
  const rawElements = kpiData.elements || (kpiData.kpi_data?.elements as any[]) || [];
  
  // Transform elements to match FormElementInstance interface
  const elements = rawElements.map((el) => {
    // Handle elements that might come in different formats
    if (el.attributes) {
      // Already in the correct format
      return {
        ...el,
        type: el.type as FormElementType
      } as FormElementInstance;
    } else {
      // Need to extract attributes
      const { id, type, ...otherProps } = el;
      return {
        id,
        type: type as FormElementType,
        attributes: { ...otherProps }
      } as FormElementInstance;
    }
  });
  
  // Load existing form responses if available
  const existingData = kpiData.existingData || 
                      (kpiData.form_responses?.entries || []);

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
