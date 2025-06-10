import { notFound } from 'next/navigation';
import { Button } from '@workspace/ui/components/button';
import Link from 'next/link';
import { ArrowLeft, Edit } from 'lucide-react';
import FormPreview from '@/components/formbuilder/form-preview';

type Props = {
  params: {
    id: string;
  };
  searchParams: { [key: string]: string | string[] | undefined };
};

export default async function KpiViewPage({ params }: Props) {
  const kpi = await getKpiById(params.id);

  if (!kpi) {
    notFound();
  }

  if (!kpi.hasForm || !kpi.form) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to KPI Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">KPI: {kpi.name}</h1>
        </div>

        <div className="rounded-lg border bg-gray-50 py-12 text-center">
          <h3 className="mb-2 text-lg font-medium">No form created yet</h3>
          <p className="mb-6 text-gray-500">This KPI doesn't have an associated form</p>
          <Link href={`/kpi/${kpi.id}/form`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Create Form
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to KPI Dashboard
            </Button>
          </Link>
          <Link href={`/kpi/${kpi.id}/form`}>
            <Button size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit Form
            </Button>
          </Link>
        </div>
        <h1 className="mt-4 text-3xl font-bold">KPI: {kpi.name}</h1>
        <p className="mt-2 text-gray-600">View and submit the form for this KPI</p>
      </div>

      <div className="mx-auto max-w-3xl">
        <FormPreview formTitle={kpi.name} elements={kpi.form.elements} kpiId={kpi.id} />
      </div>
    </main>
  );
}
