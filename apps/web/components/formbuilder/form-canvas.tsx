'use client';

import type { FormElementInstance } from '@/lib/types';
import FormElement from './form-element';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface FormCanvasProps {
  elements: FormElementInstance[];
  updateElement: (id: string, attributes: Record<string, any>) => void;
  removeElement: (id: string) => void;
}

export default function FormCanvas({ elements, updateElement, removeElement }: FormCanvasProps) {
  const { setNodeRef } = useDroppable({
    id: 'canvas',
  });

  return (
    <div ref={setNodeRef} className="min-h-[400px] rounded-md border p-4">
      {elements.length === 0 ? (
        <div className="flex h-full items-center justify-center p-8 text-center text-gray-400">
          <div>
            <p className="mb-2 text-lg">Your form is empty</p>
            <p>Drag elements from the sidebar and drop them here</p>
          </div>
        </div>
      ) : (
        <SortableContext items={elements.map(e => e.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-4">
            {elements.map(element => (
              <FormElement
                key={element.id}
                element={element}
                updateElement={updateElement}
                removeElement={removeElement}
              />
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  );
}
