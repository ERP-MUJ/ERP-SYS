import FormBuilder from "@/components/formbuilder/form-builder"
import { getFormById } from "@/lib/actions" // or wherever it's defined 

interface EditFormPageProps {
  params: {
    id: string
  }
}

export default async function EditFormPage({ params }: EditFormPageProps) {
  const form = await getFormById(params.id)

  if (!form) {
    return <p>Error loading form.</p>
  }

  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Edit Form</h1>
      <p className="bg-secondary mb-8">Make changes to your form and save when you&apos;re done.</p>
      <FormBuilder initialForm={form} />
    </main>
  )
}

/*
Changes done 
useFormById inside an async function is Replaced with await getFormById(...)
Unescaped ' in you're is Fixed to you&apos;re

This page allows users to edit an existing form by passing the form ID as a parameter.
   It fetches the form data using the `getFormById` function and passes it to the `FormBuilder` component.
   If the form is not found, it displays an error message.
*/