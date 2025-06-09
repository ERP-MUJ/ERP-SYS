import FormBuilder from '@/components/formbuilder/form-builder';
import { useFormById } from '@/hooks/forms';

interface EditFormPageProps {
  params: {
    id: string;
  };
}

export default async function EditFormPage({ params }: EditFormPageProps) {
  const form = useFormById(params.id);

  if (!form) {
    return <p>Error</p>;
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Edit Form</h1>
      <p className="bg-secondary mb-8">Make changes to your form and save when you're done.</p>
      <FormBuilder initialForm={form} />
    </main>
  );
}
