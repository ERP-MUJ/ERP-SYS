'use client';
import React, { use } from 'react';
import { Button } from '@workspace/ui/components/button';
import Link from 'next/link';
import { ArrowLeft, Edit } from 'lucide-react';
import FormPreview from '@/components/formbuilder/form-preview';
import { useFormById } from '@/hooks/forms';

export default function KpiViewPage({ params }: { params: Promise<{ id: string }> }) {
  // Use React.use to unwrap the Promise params
  const { id } = use(params);
  const { data, isLoading, error } = useFormById(id);

  if (isLoading) {
    return <div className="text-center">Loading...</div>;
  }

  const kpi = data.kpi;
  const kpi_id = kpi?.kpi_id;
  const kpi_name = kpi?.kpi_name || 'Untitled KPI';
  const elements = kpi.elements || [];
  const kpi_description = kpi?.kpi_description || 'No description available';

  return (
    <main className="container mx-auto px-4 py-4">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <Link href="/qoc/builder/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to KPI Dashboard
            </Button>
          </Link>
        </div>
        <h1 className="mt-4 text-3xl font-bold">{kpi_name}</h1>
        <p className="mt-2 text-gray-500">View and submit the form for this KPI</p>
      </div>

      <div className="mx-auto max-w-3xl">
        <FormPreview formTitle={kpi_name} elements={elements} description={kpi_description} />
      </div>
    </main>
  );
}
