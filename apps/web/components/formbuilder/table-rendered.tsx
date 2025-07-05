"use client"

import { useState } from "react"
import type { FormElementInstance } from "@/lib/types"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import { toast } from "sonner"
import { Loader2, Plus, Trash2, Save, FileUp, FileDown, ChartLine } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog"
// import { Label } from "@workspace/ui/components/label"
// import { Textarea } from "@workspace/ui/components/textarea"
// import { RadioGroup, RadioGroupItem } from "@workspace/ui/components/radio-group"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { useSaveKpiData } from "@/hooks/faculty"

type Option = {
  label: string
  value: string
}

type FormEntry = Record<string, string | number | boolean | null | undefined | Option | FileList>

interface TableFormRendererProps {
  name: string
  elements: FormElementInstance[]
  description?: string
  onSuccess?: () => void
  className?: string
  id: string
}

export default function TableFormRenderer({ name, elements, description, className = "" }: TableFormRendererProps) {
  const [entries, setEntries] = useState<FormEntry[]>([{}])
  const { mutate: saveKpiData } = useSaveKpiData()
  const [isSubmitting] = useState(false)
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null)
  const [activeElement, setActiveElement] = useState<FormElementInstance | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [complexValue, setComplexValue] = useState<string | boolean | Option | FileList | null>(null)

  const tableElements = elements.filter((element) => ["text", "number", "email", "date", "select", "checkbox"].includes(element.type))
  const complexElements = elements.filter((element) => ["textarea", "radio", "file"].includes(element.type))

  const addNewRow = () => setEntries([...entries, {}])

  const removeRow = (index: number) => {
    if (entries.length === 1) setEntries([{}])
    else setEntries(entries.filter((_, i) => i !== index))
  }

  const updateEntry = (rowIndex: number, elementId: string, value: string | number | boolean | FileList | Option | null) => {
    const newEntries = [...entries]
    newEntries[rowIndex] = {
      ...newEntries[rowIndex],
      [elementId]: value,
    }
    setEntries(newEntries)
  }

  const openComplexEditor = (rowIndex: number, element: FormElementInstance) => {
    setActiveRowIndex(rowIndex)
    setActiveElement(element)
    setComplexValue(entries[rowIndex]?.[element.id] as string | boolean | Option | FileList | null || null)
    setDialogOpen(true)
  } // i edited this function to ensure it sets the correct type for complexValue

  const saveComplexValue = () => {
    if (activeRowIndex !== null && activeElement) {
      updateEntry(activeRowIndex, activeElement.id, complexValue)
    }
    setDialogOpen(false)
  }

  const validateEntries = () => {
    const invalidRows: number[] = []
    entries.forEach((entry, index) => {
      if (Object.keys(entry).length === 0 && entries.length > 1) return
      elements.forEach((element) => {
        if (element.attributes.required && !entry[element.id]) {
          invalidRows.push(index + 1)
        }
      })
    })
    return invalidRows
  }

  const handleSubmit = async () => {
    const filledEntries = entries.filter((entry) => Object.keys(entry).length > 0)
    if (filledEntries.length === 0) {
      toast.warning("No data to submit", { description: "Please add at least one entry to the table" })
      return
    }
    const invalidRows = validateEntries()
    if (invalidRows.length > 0) {
      toast.error("Missing required fields", { description: `Please complete all required fields in rows: ${invalidRows.join(", ")}` })
      return
    }
    const formDataToSubmit: {
    id: string;
    formData: {
        entries: FormEntry[];
    };
}
    saveKpiData(formDataToSubmit)
    setEntries([{}])
  }

  const hasComplexElements = complexElements.length > 0

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center">
              <ChartLine className="mr-2" />
              {name}
            </CardTitle>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          <Button variant="outline" onClick={() => toast.success("Excel template downloaded")}> <FileDown className="mr-2" /> Download Excel </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {tableElements.map((element) => (
                  <TableHead key={element.id} className="whitespace-nowrap">
                    {element.attributes.label}
                    {element.attributes.required && " *"}
                  </TableHead>
                ))}
                {hasComplexElements && <TableHead>Additional Fields</TableHead>}
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry, rowIndex) => (
                <TableRow key={rowIndex}>
                  {tableElements.map((element) => (
                    <TableCell key={element.id}>
                      {renderTableCellInput(element, entry, rowIndex, updateEntry)}
                    </TableCell>
                  ))}
                  {hasComplexElements && (
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {complexElements.map((element) => {
                          const hasValue = entry[element.id] !== undefined && entry[element.id] !== null && entry[element.id] !== ""
                          return (
                            <Button
                              key={element.id}
                              variant={hasValue ? "default" : "outline"}
                              size="sm"
                              onClick={() => openComplexEditor(rowIndex, element)}
                              className="text-xs h-7"
                            >
                              {element.attributes.label}
                              {hasValue && " ✓"}
                            </Button>
                          )
                        })}
                      </div>
                    </TableCell>
                  )}
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRow(rowIndex)}
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          <Button variant="outline" onClick={addNewRow} disabled={isSubmitting}> <Plus className="mr-2 h-4 w-4" /> Add Row </Button>
          <Button variant="outline" onClick={() => toast.success("Excel data uploaded")}> <FileUp className="mr-2 h-4 w-4" /> Upload Excel </Button>
        </div>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (<> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting... </>) : (<> <Save className="mr-2 h-4 w-4" /> Save All Entries </>)}
        </Button>
      </CardFooter>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{activeElement?.attributes.label}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {/* Add your complex element renderer here if needed */}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveComplexValue}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

function renderTableCellInput(
  element: FormElementInstance,
  entry: FormEntry,
  rowIndex: number,
  updateEntry: (rowIndex: number, elementId: string, value: string | number | boolean | FileList | Option | null) => void
) {
  const { id, type, attributes } = element
  const value = entry[id]

  switch (type) {
    case "text":
    case "email":
      return (
        <Input
          type={type}
          value={value || ""}
          onChange={(e) => updateEntry(rowIndex, id, e.target.value)}
          placeholder={attributes.placeholder}
          className="h-8 w-full"
        />
      )
    case "number":
      return (
        <Input
          type="number"
          value={value || ""}
          onChange={(e) => updateEntry(rowIndex, id, e.target.value ? Number(e.target.value) : "")}
          placeholder={attributes.placeholder}
          min={attributes.min}
          max={attributes.max}
          className="h-8 w-full"
        />
      )
    case "date":
      return (
        <Input
          type="date"
          value={value || ""}
          onChange={(e) => updateEntry(rowIndex, id, e.target.value)}
          className="h-8 w-full"
        />
      )
    case "select":
      return (
        <Select value={value || ""} onValueChange={(val) => updateEntry(rowIndex, id, val)}>
          <SelectTrigger className="h-8 w-full">
            <SelectValue placeholder={attributes.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {attributes.options?.map((option: Option, index: number) => (
              <SelectItem key={index} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    case "checkbox":
      return (
        <div className="flex items-center justify-center">
          <Checkbox checked={Boolean(value)} onCheckedChange={(checked) => updateEntry(rowIndex, id, Boolean(checked))} />
        </div>
      )
    default:
      return <div>Unsupported in table</div>
  }
}
