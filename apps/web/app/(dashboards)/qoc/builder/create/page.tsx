"use client";
import { useSearchParams } from "next/navigation";
import FormBuilder from "@/components/formbuilder/form-builder";

export default function CreateFormPage() {
  // Get the pillar template ID from the query params
  const searchParams = useSearchParams();
  const pillarTemplateId = searchParams.get("kpiPillarTemplateId");

  // TODO: When saving the KPI template, call the API to create a KPI template
  // POST /api/kpi-templates with { pillar_template_id: pillarTemplateId, ... }

  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Create KPI Template</h1>
      <p className="mb-8">
        Start building a KPI template for the selected pillar. (Pillar Template
        ID: {pillarTemplateId || "Not selected"})
      </p>
      {/* Pass pillarTemplateId to FormBuilder if needed */}
      <FormBuilder /* pillarTemplateId={pillarTemplateId} */ />
      {/* TODO: On save, call the API to create the KPI template and link it to the pillar template */}
    </main>
  );
}
