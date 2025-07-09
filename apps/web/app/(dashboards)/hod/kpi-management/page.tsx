"use client"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import Link from "next/link"
import { useState } from "react"
import { Badge } from "@workspace/ui/components/badge"
import { GraduationCap, Users, FlaskConical, Building, BarChart3, Calendar, TrendingUp } from "lucide-react"

// Dummy data structure
const PILLARS = [
  {
    id: "academic",
    name: "Academic Excellence",
    icon: GraduationCap,
    color: "bg-blue-500",
    description: "Academic performance and educational quality metrics",
  },
  {
    id: "student",
    name: "Student Development",
    icon: Users,
    color: "bg-green-500",
    description: "Student engagement and development indicators",
  },
  {
    id: "research",
    name: "Research & Innovation",
    icon: FlaskConical,
    color: "bg-purple-500",
    description: "Research output and innovation metrics",
  },
  {
    id: "infrastructure",
    name: "Infrastructure",
    icon: Building,
    color: "bg-orange-500",
    description: "Infrastructure utilization and development",
  },
]

const DUMMY_KPIS = {
  academic: [
    {
      id: "kpi-1",
      title: "Student Pass Rate",
      description: "Track student pass rates across different courses and semesters",
      value: 85,
      status: "active",
      lastUpdated: "2024-01-15",
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
    {
      id: "kpi-2",
      title: "Faculty Performance",
      description: "Evaluate faculty teaching effectiveness and student feedback",
      value: 4.2,
      status: "active",
      lastUpdated: "2024-01-10",
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
  ],
  student: [
    {
      id: "kpi-3",
      title: "Student Satisfaction Survey",
      description: "Collect and analyze student satisfaction across various services",
      value: 4.1,
      status: "active",
      lastUpdated: "2024-01-12",
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
  ],
  research: [
    {
      id: "kpi-4",
      title: "Faculty Research Publications",
      description: "Track research publications and citations by faculty members",
      value: 23,
      status: "active",
      lastUpdated: "2024-01-08",
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
  ],
  infrastructure: [
    {
      id: "kpi-5",
      title: "Infrastructure Utilization",
      description: "Monitor utilization rates of campus facilities and resources",
      value: 78,
      status: "active",
      lastUpdated: "2024-01-14",
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
  ],
}

export default function KpiManagementPage() {
  const [selectedPillar, setSelectedPillar] = useState<string>("")

  const selectedPillarData = PILLARS.find((p) => p.id === selectedPillar)
  const kpisForPillar = selectedPillar ? DUMMY_KPIS[selectedPillar as keyof typeof DUMMY_KPIS] || [] : []

  return (
    <main className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">KPI Management</h1>
          <p className="text-gray-600 mt-2">Select a pillar to view and manage your KPIs</p>
        </div>
      </div>

      {/* Pillar Selection */}
      <div className="mb-8">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-4">
            <label htmlFor="pillar-select" className="text-sm font-medium">
              Select Pillar:
            </label>
            <Select value={selectedPillar} onValueChange={setSelectedPillar}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Choose a pillar to view KPIs" />
              </SelectTrigger>
              <SelectContent>
                {PILLARS.map((pillar) => {
                  const Icon = pillar.icon
                  return (
                    <SelectItem key={pillar.id} value={pillar.id}>
                      <div className="flex items-center space-x-2">
                        <Icon className="h-4 w-4" />
                        <span>{pillar.name}</span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {!selectedPillar ? (
        <div className="text-center py-12">
          <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Select a Pillar to Get Started</h3>
          <p className="text-gray-500">Choose a pillar from the dropdown above to view and manage your KPIs</p>
        </div>
      ) : kpisForPillar.length === 0 ? (
        <div className="text-center py-12">
          <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No KPIs Found</h3>
          <p className="text-gray-500">No KPIs are available for the selected pillar</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {kpisForPillar.map((kpi) => (
            <Card key={kpi.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{kpi.title}</CardTitle>
                    <CardDescription className="mt-1">{kpi.description}</CardDescription>
                  </div>
                  <Badge variant={kpi.status === "active" ? "default" : "secondary"} className="ml-2">
                    {kpi.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pb-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Current Value:</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">
                    {kpi.value}
                    {kpi.id === "kpi-1" || kpi.id === "kpi-5" ? "%" : ""}
                    {kpi.id === "kpi-3" || kpi.id === "kpi-2" ? "/5" : ""}
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Calendar className="h-3 w-3" />
                  <span>Updated: {new Date(kpi.lastUpdated).toLocaleDateString()}</span>
                </div>

                <div className="mt-2 text-sm text-gray-600">
                  {kpi.elements.length} data field{kpi.elements.length !== 1 ? "s" : ""}
                </div>
              </CardContent>

              <CardFooter>
                <Link href={`/hod/kpi-management/${kpi.id}`} className="w-full">
                  <Button className="w-full">Open KPI</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}
