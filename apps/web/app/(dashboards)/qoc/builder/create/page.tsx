import FormBuilder from '@/components/formbuilder/form-builder';

export default function CreateFormPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Create KPI's</h1>
      <p className="mb-8">
        Start building KPI's and Add values like decription, value and number to your KPI's
      </p>
      <FormBuilder />
    </main>
  );
}
