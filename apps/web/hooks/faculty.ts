import { useQuery, useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query"
import axios from "axios"
import type { AssignedKPI } from "@/lib/types"
import { toast } from "sonner"
import { ProcessError } from "@/lib/types"
import type { KpiFormData } from "@/lib/types"

// Add this dummy data at the top of the file after imports
const DUMMY_KPI_DATA = {
  "kpi-1": {
    kpi: {
      kpi_name: "Student Pass Rate",
      kpi_description: "Track student pass rates across different courses and semesters",
      elements: [
        {
          id: "course_code",
          type: "text",
          attributes: {
            label: "Course Code",
            placeholder: "e.g., CS101",
            required: true,
          },
        },
        {
          id: "semester",
          type: "select",
          attributes: {
            label: "Semester",
            required: true,
            options: [
              { label: "Fall 2024", value: "fall_2024" },
              { label: "Spring 2024", value: "spring_2024" },
              { label: "Summer 2024", value: "summer_2024" },
            ],
          },
        },
        {
          id: "total_students",
          type: "number",
          attributes: {
            label: "Total Students",
            placeholder: "Enter total number of students",
            required: true,
            min: 1,
          },
        },
        {
          id: "passed_students",
          type: "number",
          attributes: {
            label: "Passed Students",
            placeholder: "Enter number of passed students",
            required: true,
            min: 0,
          },
        },
        {
          id: "pass_rate",
          type: "number",
          attributes: {
            label: "Pass Rate (%)",
            placeholder: "Calculated pass rate",
            required: true,
            min: 0,
            max: 100,
          },
        },
        {
          id: "instructor_name",
          type: "text",
          attributes: {
            label: "Instructor Name",
            placeholder: "Enter instructor name",
            required: true,
          },
        },
        {
          id: "comments",
          type: "textarea",
          attributes: {
            label: "Comments",
            placeholder: "Additional notes or observations",
            rows: 3,
          },
        },
      ],
    },
    existingData: [
      {
        course_code: "CS101",
        semester: "fall_2024",
        total_students: 45,
        passed_students: 38,
        pass_rate: 84.4,
        instructor_name: "Dr. Smith",
        comments: "Good performance overall, need to focus on advanced topics",
      },
      {
        course_code: "CS201",
        semester: "fall_2024",
        total_students: 32,
        passed_students: 29,
        pass_rate: 90.6,
        instructor_name: "Prof. Johnson",
        comments: "Excellent results, students well prepared",
      },
      {
        course_code: "CS301",
        semester: "spring_2024",
        total_students: 28,
        passed_students: 22,
        pass_rate: 78.6,
        instructor_name: "Dr. Brown",
        comments: "Some students struggled with complex algorithms",
      },
    ],
  },
  "kpi-2": {
    kpi: {
      kpi_name: "Faculty Performance",
      kpi_description: "Evaluate faculty teaching effectiveness and student feedback",
      elements: [
        {
          id: "faculty_name",
          type: "text",
          attributes: {
            label: "Faculty Name",
            placeholder: "Enter faculty name",
            required: true,
          },
        },
        {
          id: "department",
          type: "select",
          attributes: {
            label: "Department",
            required: true,
            options: [
              { label: "Computer Science", value: "cs" },
              { label: "Mathematics", value: "math" },
              { label: "Physics", value: "physics" },
              { label: "Chemistry", value: "chemistry" },
            ],
          },
        },
        {
          id: "student_rating",
          type: "number",
          attributes: {
            label: "Student Rating (1-5)",
            required: true,
            min: 1,
            max: 5,
          },
        },
        {
          id: "peer_review_score",
          type: "number",
          attributes: {
            label: "Peer Review Score (1-5)",
            required: true,
            min: 1,
            max: 5,
          },
        },
        {
          id: "research_active",
          type: "checkbox",
          attributes: {
            label: "Research Active",
          },
        },
      ],
    },
    existingData: [
      {
        faculty_name: "Dr. Smith",
        department: "cs",
        student_rating: 4.2,
        peer_review_score: 4.5,
        research_active: true,
      },
      {
        faculty_name: "Prof. Johnson",
        department: "math",
        student_rating: 4.8,
        peer_review_score: 4.6,
        research_active: true,
      },
    ],
  },
  "kpi-3": {
    kpi: {
      kpi_name: "Student Satisfaction Survey",
      kpi_description: "Collect and analyze student satisfaction across various services",
      elements: [
        {
          id: "student_id",
          type: "text",
          attributes: {
            label: "Student ID",
            placeholder: "Enter student ID",
            required: true,
          },
        },
        {
          id: "program",
          type: "select",
          attributes: {
            label: "Program",
            required: true,
            options: [
              { label: "Bachelor of Science", value: "bs" },
              { label: "Master of Science", value: "ms" },
              { label: "PhD", value: "phd" },
            ],
          },
        },
        {
          id: "overall_satisfaction",
          type: "radio",
          attributes: {
            label: "Overall Satisfaction",
            required: true,
            options: [
              { label: "Very Satisfied", value: "very_satisfied" },
              { label: "Satisfied", value: "satisfied" },
              { label: "Neutral", value: "neutral" },
              { label: "Dissatisfied", value: "dissatisfied" },
              { label: "Very Dissatisfied", value: "very_dissatisfied" },
            ],
          },
        },
        {
          id: "academic_support_rating",
          type: "number",
          attributes: {
            label: "Academic Support Rating (1-5)",
            required: true,
            min: 1,
            max: 5,
          },
        },
        {
          id: "campus_facilities_rating",
          type: "number",
          attributes: {
            label: "Campus Facilities Rating (1-5)",
            required: true,
            min: 1,
            max: 5,
          },
        },
        {
          id: "feedback",
          type: "textarea",
          attributes: {
            label: "Additional Feedback",
            placeholder: "Please provide any additional comments",
            rows: 4,
          },
        },
      ],
    },
    existingData: [
      {
        student_id: "STU001",
        program: "bs",
        overall_satisfaction: "satisfied",
        academic_support_rating: 4,
        campus_facilities_rating: 3,
        feedback: "Good academic support, facilities could be improved",
      },
      {
        student_id: "STU002",
        program: "ms",
        overall_satisfaction: "very_satisfied",
        academic_support_rating: 5,
        campus_facilities_rating: 4,
        feedback: "Excellent program structure and support",
      },
    ],
  },
  "kpi-4": {
    kpi: {
      kpi_name: "Faculty Research Publications",
      kpi_description: "Track research publications and citations by faculty members",
      elements: [
        {
          id: "faculty_name",
          type: "text",
          attributes: {
            label: "Faculty Name",
            placeholder: "Enter faculty name",
            required: true,
          },
        },
        {
          id: "publication_title",
          type: "text",
          attributes: {
            label: "Publication Title",
            placeholder: "Enter publication title",
            required: true,
          },
        },
        {
          id: "journal_name",
          type: "text",
          attributes: {
            label: "Journal/Conference Name",
            placeholder: "Enter journal or conference name",
            required: true,
          },
        },
        {
          id: "publication_date",
          type: "date",
          attributes: {
            label: "Publication Date",
            required: true,
          },
        },
        {
          id: "impact_factor",
          type: "number",
          attributes: {
            label: "Impact Factor",
            placeholder: "Enter impact factor",
            min: 0,
          },
        },
        {
          id: "citation_count",
          type: "number",
          attributes: {
            label: "Citation Count",
            placeholder: "Enter citation count",
            min: 0,
          },
        },
        {
          id: "research_area",
          type: "select",
          attributes: {
            label: "Research Area",
            required: true,
            options: [
              { label: "Artificial Intelligence", value: "ai" },
              { label: "Data Science", value: "ds" },
              { label: "Software Engineering", value: "se" },
              { label: "Cybersecurity", value: "cyber" },
              { label: "Other", value: "other" },
            ],
          },
        },
      ],
    },
    existingData: [
      {
        faculty_name: "Dr. Smith",
        publication_title: "Advanced Machine Learning Techniques",
        journal_name: "IEEE Transactions on AI",
        publication_date: "2024-01-15",
        impact_factor: 3.2,
        citation_count: 15,
        research_area: "ai",
      },
      {
        faculty_name: "Prof. Johnson",
        publication_title: "Data Mining in Educational Systems",
        journal_name: "Journal of Educational Technology",
        publication_date: "2023-12-10",
        impact_factor: 2.8,
        citation_count: 8,
        research_area: "ds",
      },
    ],
  },
  "kpi-5": {
    kpi: {
      kpi_name: "Infrastructure Utilization",
      kpi_description: "Monitor utilization rates of campus facilities and resources",
      elements: [
        {
          id: "facility_name",
          type: "text",
          attributes: {
            label: "Facility Name",
            placeholder: "Enter facility name",
            required: true,
          },
        },
        {
          id: "facility_type",
          type: "select",
          attributes: {
            label: "Facility Type",
            required: true,
            options: [
              { label: "Classroom", value: "classroom" },
              { label: "Laboratory", value: "lab" },
              { label: "Library", value: "library" },
              { label: "Auditorium", value: "auditorium" },
              { label: "Sports Facility", value: "sports" },
            ],
          },
        },
        {
          id: "capacity",
          type: "number",
          attributes: {
            label: "Total Capacity",
            placeholder: "Enter total capacity",
            required: true,
            min: 1,
          },
        },
        {
          id: "average_utilization",
          type: "number",
          attributes: {
            label: "Average Utilization (%)",
            placeholder: "Enter utilization percentage",
            required: true,
            min: 0,
            max: 100,
          },
        },
        {
          id: "peak_hours",
          type: "text",
          attributes: {
            label: "Peak Usage Hours",
            placeholder: "e.g., 9:00 AM - 12:00 PM",
          },
        },
        {
          id: "maintenance_required",
          type: "checkbox",
          attributes: {
            label: "Maintenance Required",
          },
        },
        {
          id: "notes",
          type: "textarea",
          attributes: {
            label: "Additional Notes",
            placeholder: "Any additional observations or notes",
            rows: 3,
          },
        },
      ],
    },
    existingData: [
      {
        facility_name: "Computer Lab A",
        facility_type: "lab",
        capacity: 40,
        average_utilization: 85,
        peak_hours: "9:00 AM - 12:00 PM",
        maintenance_required: false,
        notes: "High utilization during morning hours",
      },
      {
        facility_name: "Main Auditorium",
        facility_type: "auditorium",
        capacity: 200,
        average_utilization: 65,
        peak_hours: "2:00 PM - 5:00 PM",
        maintenance_required: true,
        notes: "Audio system needs upgrade",
      },
    ],
  },
}

const fetchAssignedKPIs = async (): Promise<AssignedKPI[]> => {
  const response = await axios.get("/api/assigned-kpi")
  return response.data.assignedKpis.map((kpi: any) => ({
    assigned_kpi_id: kpi.assigned_kpi_id,
    kpi_name: kpi.kpi_name,
    kpi_status: kpi.kpi_status,
    comments: kpi.comments,
    kpi_id: kpi.original_kpi_id,
    elements: kpi.elements,
  }))
}
export function useFetchAssignedKPI() {
  return useQuery<AssignedKPI[]>({
    queryKey: ["assigned-kpis"],
    queryFn: fetchAssignedKPIs,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

const fetchKPIById = async (id: number) => {
  const { data } = await axios.get(`/api/assigned-kpi/${id}`)

  const kpiName = data.assignedKpi.kpi_name
  const elements = data.assignedKpi.elements
  return { kpiName, elements }
}

export const useFetchKPIById = (id: number) => {
  return useQuery({
    queryKey: ["kpi", id],
    queryFn: () => fetchKPIById(id),
    enabled: !!id,
  })
}

// Update the fetchAssignedKPIById function to use dummy data
const fetchAssignedKPIById = async (id: string) => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  const data = DUMMY_KPI_DATA[id as keyof typeof DUMMY_KPI_DATA]
  if (!data) {
    throw new Error(`KPI with id ${id} not found`)
  }

  return data
}

export const useFetchAssignedKPIById = (id: string) => {
  return useQuery({
    queryKey: ["assigned-kpi", id],
    queryFn: () => fetchAssignedKPIById(id),
    enabled: !!id,
  })
}

export const saveDataToBackend = async (formData: KpiFormData): Promise<any> => {
  try {
    const response = await axios.put(`/api/assigned-kpi/${formData.id}`, {
      form_input: formData.formData.entries,
    })
    return response.data
  } catch (error: any) {
    throw new ProcessError({
      name: "PROCESSING_ERROR",
      message: error.response?.data?.error || "Failed to save data",
      cause: error,
    })
  }
}

export function useSaveKpiData(): UseMutationResult<any, ProcessError, KpiFormData> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (formData: KpiFormData) => {
      return saveDataToBackend(formData)
    },
    onSuccess: () => {
      toast.success("KPI data saved successfully", {
        description: "Your KPI data has been updated successfully.",
      })
      queryClient.invalidateQueries({ queryKey: ["kpiData"] }) // Adjust the queryKey as necessary
    },
    onError: (error: ProcessError) => {
      toast.error("Error saving KPI data", {
        description: error.message,
      })
      console.error("Save KPI data error:", error.name, error.cause)
    },
  })
}

type KpiData = {
  assigned_kpi_id: number
  kpi_name: string
  kpi_description: string
  kpi_status: string
  form_input: Record<string, string | number>[] | null
}

const fetchAssignedKPIByDepartmentId = async (departmentId: string) => {
  const { data } = await axios.get(`/api/assigned-kpi`, {
    params: { department_id: departmentId },
  })
  return data
}

export const useFetchKPISubmisson = (departmentId: string) => {
  return useQuery({
    queryKey: ["assigned-kpi", departmentId], // Include departmentId in the query key
    queryFn: () => fetchAssignedKPIByDepartmentId(departmentId),
    enabled: !!departmentId, // Only enable the query if departmentId is provided
  })
}
