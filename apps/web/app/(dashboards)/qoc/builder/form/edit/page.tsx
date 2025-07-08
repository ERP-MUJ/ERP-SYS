'use client'

import FormBuilder from '@/components/formbuilder/form-builder'
import { useFormById } from '@/hooks/forms'

interface EditFormPageProps {
  params: {
    id: string
  }
}

export default function EditFormPage({ params }: EditFormPageProps) {
  const formQuery = useFormById(params.id)

  if (formQuery.isLoading) {
    return <p>Loading...</p>
  }

  if (formQuery.error || !formQuery.data) {
    return <p>Error</p>
  }

  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Edit Form</h1>
      <p className="bg-secondary mb-8">
        Make changes to your form and save when you&apos;re done.
      </p>
      <FormBuilder initialForm={formQuery.data} />
    </main>
  )
}
