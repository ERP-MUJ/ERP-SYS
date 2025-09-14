"use client";

import { useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
} from "@dnd-kit/modifiers";
import FormElementsSidebar from "./form-elements-sidebar";
import FormCanvas from "./form-canvas";
import FormElement from "./form-element";
import { Button } from "@workspace/ui/components/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import FormPreview from "./form-preview";
import type { FormElementType, FormElementInstance } from "@/lib/types";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import {
  useAddKpi,
  useUpdateKpi,
  useCheckKpiNumberExists,
} from "@/queries/qc/kpi";
import { useRouter } from "next/navigation";
import { WeightValidation } from "@/components/common/WeightValidation";
import { CreateKpiRequestData } from "@workspace/types/types";

interface FormBuilderProps {
  pillarId: string;
  kpiId?: string; // Optional - if provided, we're in edit mode
  existingKpis?: Array<{ id: string; kpi_value?: number }>;
  initialForm?: {
    kpi_number?: number;
    kpi_metric_name?: string;
    data_provided_by?: string;
    kpi_value?: number;
    elements?: FormElementInstance[];
  };
}

export default function FormBuilder({
  pillarId,
  kpiId,
  existingKpis = [],
  initialForm,
}: FormBuilderProps) {
  const [kpiNo, setKpiNo] = useState(initialForm?.kpi_number?.toString() || "");
  const [metric, setMetric] = useState(initialForm?.kpi_metric_name || "");
  const [dataProvidedBy, setDataProvidedBy] = useState(
    initialForm?.data_provided_by || "",
  );
  const [kpiValue, setKpiValue] = useState(initialForm?.kpi_value || 0);
  const [elements, setElements] = useState<FormElementInstance[]>(
    initialForm?.elements || [],
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeElement, setActiveElement] =
    useState<FormElementInstance | null>(null);

  const { mutate: addKpi, isPending: isSavingAdd } = useAddKpi();
  const { mutate: updateKpi, isPending: isSavingUpdate } = useUpdateKpi();
  const router = useRouter();

  const isEditMode = !!kpiId;
  const isSaving = isSavingAdd || isSavingUpdate;
  const currentYear = new Date().getFullYear();

  // Check for duplicate KPI numbers
  const { data: duplicateCheck, isLoading: isCheckingDuplicate } =
    useCheckKpiNumberExists(
      pillarId,
      parseInt(kpiNo) || 0,
      currentYear,
      isEditMode ? kpiId : undefined,
    );

  const isDuplicate = duplicateCheck?.exists || false;

  // Calculate current total weight from existing KPIs (values are already 0-1)
  // In edit mode, exclude the current KPI from the calculation
  const currentTotalWeight = existingKpis.reduce((sum, kpi) => {
    if (isEditMode && kpi.id === kpiId) {
      return sum; // Exclude current KPI from calculation in edit mode
    }
    return sum + (kpi.kpi_value || 0);
  }, 0);
  const newWeight = kpiValue; // kpiValue is already 0-1
  const isValidWeight = currentTotalWeight + newWeight <= 1.0;

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    setActiveId(active.id as string);

    if (typeof active.id === "string" && active.id.includes("sidebar-")) {
      const elementType = active.id.replace("sidebar-", "") as FormElementType;
      const newElement: FormElementInstance = {
        id: `element-${Date.now()}`,
        type: elementType,
        attributes: getDefaultAttributes(elementType),
      };
      setActiveElement(newElement);
    } else {
      // If dragging an existing element
      const draggedElement = elements.find((el) => el.id === active.id);
      if (draggedElement) {
        setActiveElement(draggedElement);
      }
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    setActiveElement(null);

    if (!over) return;

    if (typeof active.id === "string" && active.id.includes("sidebar-")) {
      const elementType = active.id.replace("sidebar-", "") as FormElementType;
      const newElement: FormElementInstance = {
        id: `element-${Date.now()}`,
        type: elementType,
        attributes: getDefaultAttributes(elementType),
      };
      setElements([...elements, newElement]);
      return;
    }

    // If reordering elements within the canvas
    const oldIndex = elements.findIndex((el) => el.id === active.id);
    const newIndex = elements.findIndex((el) => el.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      setElements(arrayMove(elements, oldIndex, newIndex));
    }
  }

  function getDefaultAttributes(type: FormElementType) {
    switch (type) {
      case "text":
        return {
          label: "Text Input",
          placeholder: "Enter text...",
          required: false,
        };
      case "textarea":
        return {
          label: "Text Area",
          placeholder: "Enter long text...",
          required: false,
          rows: 3,
        };
      case "number":
        return {
          label: "Number Input",
          placeholder: "Enter a number",
          required: false,
          min: 0,
          max: 100,
        };
      case "select":
        return {
          label: "Select",
          placeholder: "Select an option",
          required: false,
          options: [
            { label: "Option 1", value: "option1" },
            { label: "Option 2", value: "option2" },
            { label: "Option 3", value: "option3" },
          ],
        };
      case "checkbox":
        return { label: "Checkbox", required: false };
      case "radio":
        return {
          label: "Radio Group",
          required: false,
          options: [
            { label: "Option 1", value: "option1" },
            { label: "Option 2", value: "option2" },
            { label: "Option 3", value: "option3" },
          ],
        };
      case "date":
        return { label: "Date Picker", required: false };
      case "email":
        return {
          label: "Email Input",
          placeholder: "Enter email...",
          required: false,
        };
      case "file":
        return {
          label: "File Upload",
          required: false,
          multiple: false,
          acceptedFileTypes: ".pdf,.doc,.docx,.jpg,.jpeg,.png",
        };
      default:
        return { label: "New Field", required: false };
    }
  }

  function updateElement(id: string, attributes: Record<string, any>) {
    setElements(
      elements.map((element) => {
        if (element.id === id) {
          return {
            ...element,
            attributes: { ...element.attributes, ...attributes },
          };
        }
        return element;
      }),
    );
  }

  function removeElement(id: string) {
    setElements(elements.filter((element) => element.id !== id));
  }

  const handleSaveKpi = () => {
    // Validation
    if (!kpiNo.trim()) {
      toast.error("KPI Number is required");
      return;
    }

    // Check for duplicate KPI number
    if (isDuplicate) {
      toast.error(
        `KPI number ${kpiNo} already exists in academic year ${currentYear}. Please choose a different number.`,
      );
      return;
    }

    if (!metric.trim()) {
      toast.error("KPI Metric Name is required");
      return;
    }

    if (!dataProvidedBy.trim()) {
      toast.error("Data Provider is required");
      return;
    }

    if (kpiValue <= 0) {
      toast.error("KPI Value must be greater than 0");
      return;
    }

    if (kpiValue > 1) {
      toast.error("KPI Value cannot exceed 1.0");
      return;
    }

    if (!isValidWeight) {
      toast.error("Total weight exceeds 1.0. Please reduce the KPI value.");
      return;
    }

    if (elements.length === 0) {
      toast.warning("Cannot save empty form", {
        description: "Please add at least one element to your form",
      });
      return;
    }

    // Prepare KPI data
    const kpiData: CreateKpiRequestData = {
      kpi_number: parseInt(kpiNo),
      kpi_metric_name: metric,
      kpi_description: metric, // Using metric as description
      kpi_value: kpiValue,
      data_provided_by: dataProvidedBy,
      academic_year: new Date().getFullYear(),
      kpi_data: {
        elements: elements,
        metadata: {
          version: "1.0",
          form_title: `KPI ${kpiNo} - ${metric}`,
          form_description: metric,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        layout: {
          columns: 1,
          sections: [
            {
              title: "KPI Data Collection",
              elementIds: elements.map((el) => el.id),
            },
          ],
        },
      },
      kpi_calculated_metrics: {
        formulas: {
          target_calculation: "sum(submitted_forms) / total_expected * 100",
          performance_rating:
            "if(percentage_achieved >= 90, 'Excellent', if(percentage_achieved >= 75, 'Good', 'Needs Improvement'))",
        },
        thresholds: {
          excellent: 90,
          good: 75,
          satisfactory: 60,
          minimum: 50,
        },
        weights: {},
        aggregation: {
          method: "weighted_average",
        },
      },
    };

    // Save KPI
    if (isEditMode) {
      updateKpi(
        {
          pillarId,
          kpiId: kpiId!,
          data: kpiData,
        },
        {
          onSuccess: () => {
            setTimeout(() => router.push("/qc/builder"), 2000);
          },
        },
      );
    } else {
      addKpi(
        {
          pillarId,
          data: kpiData,
        },
        {
          onSuccess: () => {
            setTimeout(() => router.push("/qc/builder"), 2000);
          },
        },
      );
    }
  };

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
    >
      <div className="mb-6">
        <div className="space-y-6">
          {/* KPI No */}
          <div className="flex flex-col">
            <Label className="text-lg font-medium mb-2">KPI No</Label>
            <p className="text-sm text-gray-500 mb-2">
              KPI identification number, usually between 1 to 78.
            </p>
            <Input
              id="kpi-no"
              type="number"
              min={1}
              max={78}
              value={kpiNo}
              onChange={(e) => setKpiNo(e.target.value.replace(/\D/g, ""))}
              className={`text-lg font-medium ${
                isDuplicate ? "border-red-500 focus:border-red-500" : ""
              }`}
              placeholder="Enter KPI Number"
              required
            />
            {isCheckingDuplicate && kpiNo && (
              <p className="text-sm text-blue-600 mt-1">
                Checking for duplicates...
              </p>
            )}
            {isDuplicate && kpiNo && (
              <p className="text-sm text-red-600 mt-1">
                ⚠️ KPI number {kpiNo} already exists in academic year{" "}
                {currentYear}. Please choose a different number.
              </p>
            )}
            {!isDuplicate &&
              !isCheckingDuplicate &&
              kpiNo &&
              parseInt(kpiNo) > 0 && (
                <p className="text-sm text-green-600 mt-1">
                  ✓ KPI number {kpiNo} is available.
                </p>
              )}
          </div>

          {/* Metric */}
          <div className="flex flex-col">
            <Label className="text-lg font-medium mb-2">Metric</Label>
            <p className="text-sm text-gray-500 mb-2">
              A short description of what this KPI is and what faculty is
              expected to fill.
            </p>
            <Input
              id="metric"
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              className="text-lg font-medium"
              placeholder="Enter KPI Description"
              required
            />
          </div>

          {/* Data Provided by */}
          <div className="flex flex-col">
            <Label className="text-lg font-medium mb-2">Data Provided by</Label>
            <p className="text-sm text-gray-500 mb-2">E.g., HoD, DoR, CoE</p>
            <Input
              id="data-provided-by"
              value={dataProvidedBy}
              onChange={(e) => setDataProvidedBy(e.target.value)}
              className="text-lg font-medium"
              placeholder="Enter Data Provider"
              required
            />
          </div>

          {/* KPI Value with Weight Validation */}
          <div className="flex flex-col">
            <Label className="text-lg font-medium mb-2">KPI Value (0-1)</Label>
            <p className="text-sm text-gray-500 mb-2">
              Weight of this KPI (0-1). Total weight of all KPIs in this pillar
              cannot exceed 1.0.
            </p>
            <Input
              id="kpi-value"
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={kpiValue}
              onChange={(e) => setKpiValue(Number(e.target.value))}
              className="text-lg font-medium"
              placeholder="Enter KPI Value (0-1)"
              required
            />

            {/* Weight Validation Component */}
            <div className="mt-3">
              <WeightValidation
                currentWeight={currentTotalWeight}
                newWeight={newWeight}
                maxWeight={1.0}
                showDetails={true}
                showProgressBar={false}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <FormElementsSidebar />

        <div className="flex-1">
          <Tabs defaultValue="editor">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="editor">Editor</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>

              <div className="flex gap-2">
                <Button
                  onClick={handleSaveKpi}
                  disabled={
                    isSaving ||
                    !isValidWeight ||
                    isDuplicate ||
                    isCheckingDuplicate
                  }
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save KPI
                    </>
                  )}
                </Button>
              </div>
            </div>

            <TabsContent value="editor" className="mt-0">
              <SortableContext
                items={elements.map((e) => e.id)}
                strategy={verticalListSortingStrategy}
              >
                <FormCanvas
                  elements={elements}
                  updateElement={updateElement}
                  removeElement={removeElement}
                />
              </SortableContext>
            </TabsContent>

            <TabsContent value="preview" className="mt-0">
              <FormPreview formTitle={kpiNo} elements={elements} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <DragOverlay>
        {activeId && activeElement && (
          <div className="opacity-80">
            <FormElement
              element={activeElement}
              isOverlay={true}
              updateElement={() => {}}
              removeElement={() => {}}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
