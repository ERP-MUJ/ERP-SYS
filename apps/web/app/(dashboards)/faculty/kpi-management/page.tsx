"use client";

import { useState } from "react";
import Link from "next/link";
import { TrendingUp, BarChart3 } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@workspace/ui/components/table";

// KPI data and pillars
const PILLARS = [
  { id: "academic", name: "Academic Excellence", icon: BarChart3 },
  { id: "student", name: "Student Experience", icon: TrendingUp },
  { id: "research", name: "Research & Innovation", icon: BarChart3 },
  { id: "infrastructure", name: "Infrastructure", icon: BarChart3 },
];

const DUMMY_KPIS = {
  academic: [
    {
      id: "kpi-1",
      title: "Student Pass Rate",
      description:
        "Track student pass rates across different courses and semesters",
      value: 85,
      status: "accepted",
      lastUpdated: "2024-01-15",
      target: 90,
      actual: 85,
      targetAchieved: "94%",
      dataProvider: "Dr. Sharma",
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
      description:
        "Evaluate faculty teaching effectiveness and student feedback",
      value: 4.2,
      status: "pending",
      lastUpdated: "2024-01-10",
      target: 4.5,
      actual: 4.2,
      targetAchieved: "93%",
      dataProvider: "Prof. Mehta",
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
      description:
        "Collect and analyze student satisfaction across various services",
      value: 4.1,
      status: "needs review",
      lastUpdated: "2024-01-12",
      target: 4.5,
      actual: 4.1,
      targetAchieved: "91%",
      dataProvider: "Ms. Gupta",
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
      description:
        "Track research publications and citations by faculty members",
      value: 23,
      status: "rejected",
      lastUpdated: "2024-01-08",
      target: 30,
      actual: 23,
      targetAchieved: "77%",
      dataProvider: "Dr. Rao",
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
      description:
        "Monitor utilization rates of campus facilities and resources",
      value: 78,
      status: "accepted",
      lastUpdated: "2024-01-14",
      target: 80,
      actual: 78,
      targetAchieved: "98%",
      dataProvider: "Facilities Team",
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
};

export default function KpiManagementPage() {
  const [selectedPillar, setSelectedPillar] = useState<string>("");

  const kpisForPillar = selectedPillar
    ? DUMMY_KPIS[selectedPillar as keyof typeof DUMMY_KPIS] || []
    : [];

  return (
    <main className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">KPI Management</h1>
          <p className="text-gray-600 mt-2">
            Select a pillar to view and manage your KPIs
          </p>
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
                  const Icon = pillar.icon;
                  return (
                    <SelectItem key={pillar.id} value={pillar.id}>
                      <div className="flex items-center space-x-2">
                        <Icon className="h-4 w-4" />
                        <span>{pillar.name}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* KPI Table */}
      {!selectedPillar ? (
        <div className="text-center py-12">
          <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Select a Pillar to Get Started
          </h3>
          <p className="text-gray-500">
            Choose a pillar from the dropdown above to view and manage your KPIs
          </p>
        </div>
      ) : kpisForPillar.length === 0 ? (
        <div className="text-center py-12">
          <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No KPIs Found
          </h3>
          <p className="text-gray-500">
            No KPIs are available for the selected pillar
          </p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>KPI List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>KPI No</TableHead>
                  <TableHead>Metric</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Actual</TableHead>
                  <TableHead>Target Achieved</TableHead>
                  <TableHead>Data Provided By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kpisForPillar.map((kpi, idx) => (
                  <TableRow key={kpi.id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{kpi.title}</TableCell>
                    <TableCell>{kpi.target ?? "-"}</TableCell>
                    <TableCell>{kpi.actual ?? "-"}</TableCell>
                    <TableCell>{kpi.targetAchieved ?? "-"}</TableCell>
                    <TableCell>{kpi.dataProvider ?? "-"}</TableCell>
                    <TableCell>
                      <span
                        className={
                          kpi.status === "accepted"
                            ? "px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800"
                            : kpi.status === "pending"
                              ? "px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-800"
                              : kpi.status === "rejected"
                                ? "px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-800"
                                : kpi.status === "needs review"
                                  ? "px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800"
                                  : "px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-800"
                        }
                      >
                        {kpi.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Link href={`/faculty/kpi-management/${kpi.id}`}>
                        <Button size="sm">Open KPI</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
