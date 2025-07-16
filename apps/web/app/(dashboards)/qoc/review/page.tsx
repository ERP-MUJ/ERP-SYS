"use client";

import { DialogFooter } from "@workspace/ui/components/dialog";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@workspace/ui/components/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  Check,
  Eye,
  X,
  AlertCircle,
  ArrowLeft,
  Filter,
  Building,
  GraduationCap,
} from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { toast } from "sonner";
import Link from "next/link";
import KpiReviewTable from "@/components/qoc/kpi-review-table";

type KpiData = {
  assigned_kpi_id: number;
  kpi_name: string;
  kpi_description: string;
  kpi_status: string;
  pillar: string;
  department: string;
  form_input: Record<string, string | number>[] | null;
  qoc_remark?: string;
};

// Updated dummy data with pillar and department information
const ENHANCED_DUMMY_DATA = {
  assignedKpis: [
    {
      assigned_kpi_id: 1,
      kpi_name: "Student Pass Rate",
      kpi_description:
        "Track student pass rates across different courses and semesters",
      kpi_status: "pending",
      pillar: "Academic Excellence",
      department: "Computer Science Engineering",
      form_input: [
        {
          course_code: "CS101",
          semester: "Fall 2024",
          total_students: 45,
          passed_students: 38,
          pass_rate: 84.4,
          instructor_name: "Dr. Sandeep Chaurasia",
          comments:
            "Good performance overall, need to focus on advanced topics",
        },
        {
          course_code: "CS201",
          semester: "Fall 2024",
          total_students: 32,
          passed_students: 29,
          pass_rate: 90.6,
          instructor_name: "Prof. Pradeep Krishnan",
          comments: "Excellent results, students well prepared",
        },
      ],
      qoc_remark: null,
    },
    {
      assigned_kpi_id: 2,
      kpi_name: "Faculty Performance Evaluation",
      kpi_description:
        "Comprehensive evaluation of faculty teaching effectiveness and research contributions",
      kpi_status: "approved",
      pillar: "Academic Excellence",
      department: "Computer and Communication Engineering",
      form_input: [
        {
          faculty_name: "Dr. Sunil Kumar",
          department: "Computer Science",
          student_rating: 4.2,
          peer_review_score: 4.5,
          research_active: "Yes",
          publications_count: 3,
          teaching_load: "12 hours/week",
        },
        {
          faculty_name: "Prof. Kalpana Sharma",
          department: "Mathematics",
          student_rating: 4.8,
          peer_review_score: 4.6,
          research_active: "Yes",
          publications_count: 5,
          teaching_load: "10 hours/week",
        },
      ],
      qoc_remark:
        "Excellent faculty performance across all metrics. Recommend for promotion consideration.",
    },
    {
      assigned_kpi_id: 3,
      kpi_name: "Industry Partnership Projects",
      kpi_description:
        "Track collaborative projects and partnerships with industry organizations",
      kpi_status: "pending",
      pillar: "Industrial Collaborations",
      department: "IT",
      form_input: [
        {
          company_name: "Tech Corp Ltd",
          project_title: "AI-Based Customer Analytics",
          project_duration: "6 months",
          students_involved: 8,
          faculty_lead: "Dr. Patel",
          project_value: 250000,
          completion_status: "In Progress",
        },
        {
          company_name: "Innovation Systems",
          project_title: "IoT Smart Campus Solution",
          project_duration: "12 months",
          students_involved: 12,
          faculty_lead: "Prof. Kumar",
          project_value: 450000,
          completion_status: "Completed",
        },
      ],
      qoc_remark: null,
    },
    {
      assigned_kpi_id: 4,
      kpi_name: "Research Publications & Citations",
      kpi_description:
        "Track faculty research output, publication quality, and citation impact",
      kpi_status: "redo",
      pillar: "Research",
      department: "Computer Science Engineering",
      form_input: [
        {
          faculty_name: "Dr. Amit Verma",
          publication_title:
            "Advanced Machine Learning Techniques in Educational Data Mining",
          journal_name: "IEEE Transactions on Learning Technologies",
          publication_date: "2024-01-15",
          impact_factor: 3.2,
          citation_count: 15,
          research_area: "Artificial Intelligence",
        },
        {
          faculty_name: "Prof. Rita Singh",
          publication_title: "Statistical Methods for Educational Assessment",
          journal_name: "Journal of Educational Measurement",
          publication_date: "2023-12-10",
          impact_factor: 2.8,
          citation_count: 8,
          research_area: "Educational Statistics",
        },
      ],
      qoc_remark:
        "Data collection methodology needs improvement. Please provide more detailed research impact analysis.",
    },
    {
      assigned_kpi_id: 5,
      kpi_name: "Industry Internship Placements",
      kpi_description:
        "Monitor student internship placements in industry organizations",
      kpi_status: "approved",
      pillar: "Industrial Collaborations",
      department: "Computer and Communication Engineering",
      form_input: [
        {
          student_name: "Sidharth Nigam",
          student_id: "CS2021001",
          company_name: "Microsoft India",
          internship_duration: "3 months",
          stipend_amount: 25000,
          performance_rating: 4.5,
          offer_received: "Yes",
        },
        {
          student_name: "Meghneel Gogoi",
          student_id: "CS2021002",
          company_name: "Google India",
          internship_duration: "6 months",
          stipend_amount: 35000,
          performance_rating: 4.8,
          offer_received: "Yes",
        },
      ],
      qoc_remark:
        "Excellent internship placement record with high-quality companies.",
    },
    {
      assigned_kpi_id: 6,
      kpi_name: "Research Grant Applications",
      kpi_description:
        "Track research grant applications and funding success rates",
      kpi_status: "pending",
      pillar: "Research",
      department: "IT",
      form_input: [
        {
          faculty_name: "Mr. Vasu Verma",
          grant_agency: "DST",
          project_title: "Blockchain for Secure Healthcare Data",
          amount_requested: 1500000,
          grant_status: "Under Review",
          application_date: "2024-01-10",
          co_investigators: 2,
        },
        {
          faculty_name: "Prof. Rakesh Kumar Goel",
          grant_agency: "SERB",
          project_title: "Machine Learning for Climate Prediction",
          amount_requested: 2000000,
          grant_status: "Approved",
          application_date: "2023-11-15",
          co_investigators: 3,
        },
      ],
      qoc_remark: null,
    },
  ],
};

const PILLARS = [
  { value: "Academic Excellence", label: "Academic Excellence" },
  { value: "Industrial Collaborations", label: "Industrial Collaborations" },
  { value: "Research", label: "Research" },
];

const DEPARTMENTS = [
  {
    value: "Computer and Communication Engineering",
    label: "Computer and Communication Engineering",
  },
  {
    value: "Computer Science Engineering",
    label: "Computer Science Engineering",
  },
  { value: "IT", label: "IT" },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "approved":
      return (
        <Badge
          variant="outline"
          className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-900"
        >
          <Check className="w-3 h-3 mr-1" />
          Approved
        </Badge>
      );
    case "redo":
      return (
        <Badge
          variant="outline"
          className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-900"
        >
          <X className="w-3 h-3 mr-1" />
          Needs Revision
        </Badge>
      );
    default:
      return (
        <Badge
          variant="outline"
          className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200 dark:hover:bg-yellow-900"
        >
          <AlertCircle className="w-3 h-3 mr-1" />
          Pending Review
        </Badge>
      );
  }
};

export default function QOCSubmissionReview() {
  const [selectedPillar, setSelectedPillar] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedKpi, setSelectedKpi] = useState<KpiData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [qocRemark, setQocRemark] = useState("");
  const [localData, setLocalData] = useState<any>(ENHANCED_DUMMY_DATA);
  const [rowComments, setRowComments] = useState<
    Record<number, Record<number, { status: string; comment: string }>>
  >({});

  // Filter KPIs based on selected pillar and department
  const filteredKpis = localData.assignedKpis.filter((kpi: KpiData) => {
    const pillarMatch =
      selectedPillar === "all" || kpi.pillar === selectedPillar;
    const departmentMatch =
      selectedDepartment === "all" || kpi.department === selectedDepartment;
    return pillarMatch && departmentMatch;
  });

  // Get counts for each filter combination
  const getFilterCounts = () => {
    const counts = {
      total: localData.assignedKpis.length,
      byPillar: {} as Record<string, number>,
      byDepartment: {} as Record<string, number>,
    };

    localData.assignedKpis.forEach((kpi: KpiData) => {
      counts.byPillar[kpi.pillar] = (counts.byPillar[kpi.pillar] || 0) + 1;
      counts.byDepartment[kpi.department] =
        (counts.byDepartment[kpi.department] || 0) + 1;
    });

    return counts;
  };

  const filterCounts = getFilterCounts();

  const handleOverallReviewSubmit = (action: "approved" | "redo") => {
    if (!selectedKpi || !qocRemark.trim()) {
      toast.error("Please provide feedback before submitting your review");
      return;
    }

    // Update the KPI status in the local data
    const updatedKpis = localData.assignedKpis.map((kpi: KpiData) => {
      if (kpi.assigned_kpi_id === selectedKpi.assigned_kpi_id) {
        return {
          ...kpi,
          kpi_status: action,
          qoc_remark: qocRemark,
        };
      }
      return kpi;
    });

    const updatedData = { ...localData, assignedKpis: updatedKpis };
    setLocalData(updatedData);

    toast.success(
      `KPI ${action === "approved" ? "approved" : "marked for revision"} successfully`,
      {
        description: `${selectedKpi.kpi_name} has been ${action === "approved" ? "approved" : "sent back for revision"}.`,
      },
    );

    setQocRemark("");
    setDialogOpen(false);
    setSelectedKpi(null);
  };

  const handleRowReview = (
    kpiId: number,
    rowIndex: number,
    status: "approved" | "rejected",
    comment: string,
  ) => {
    setRowComments((prev) => ({
      ...prev,
      [kpiId]: {
        ...prev[kpiId],
        [rowIndex]: { status, comment },
      },
    }));
  };

  const handleOpenDialog = (kpi: KpiData) => {
    setSelectedKpi(kpi);
    setQocRemark(kpi.qoc_remark || "");
    setDialogOpen(true);
  };

  const clearFilters = () => {
    setSelectedPillar("all");
    setSelectedDepartment("all");
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/qoc">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold">KPI Submission Review</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Review and evaluate department KPI submissions
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredKpis.length} of {localData.assignedKpis.length}{" "}
            KPIs
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {
              filteredKpis.filter(
                (kpi: KpiData) => kpi.kpi_status === "pending",
              ).length
            }{" "}
            pending review
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter KPI Submissions
          </CardTitle>
          <CardDescription>
            Filter submissions by department and pillar to focus your review
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Department Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Building className="h-4 w-4" />
                Department
              </label>
              <Select
                value={selectedDepartment}
                onValueChange={setSelectedDepartment}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    All Departments ({filterCounts.total})
                  </SelectItem>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept.value} value={dept.value}>
                      {dept.label} ({filterCounts.byDepartment[dept.value] || 0}
                      )
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Pillar Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Pillar
              </label>
              <Select value={selectedPillar} onValueChange={setSelectedPillar}>
                <SelectTrigger>
                  <SelectValue placeholder="Select pillar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    All Pillars ({filterCounts.total})
                  </SelectItem>
                  {PILLARS.map((pillar) => (
                    <SelectItem key={pillar.value} value={pillar.value}>
                      {pillar.label} ({filterCounts.byPillar[pillar.value] || 0}
                      )
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            <div className="space-y-2">
              <label className="text-sm font-medium opacity-0">Actions</label>
              <Button
                variant="outline"
                onClick={clearFilters}
                disabled={
                  selectedPillar === "all" && selectedDepartment === "all"
                }
                className="w-full bg-transparent"
              >
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Active Filters Display */}
          {(selectedPillar !== "all" || selectedDepartment !== "all") && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  Active filters:
                </span>
                {selectedPillar !== "all" && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <GraduationCap className="h-3 w-3" />
                    {selectedPillar}
                    <button
                      onClick={() => setSelectedPillar("all")}
                      className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {selectedDepartment !== "all" && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <Building className="h-3 w-3" />
                    {selectedDepartment}
                    <button
                      onClick={() => setSelectedDepartment("all")}
                      className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredKpis.length > 0 ? (
          filteredKpis.map((kpi: KpiData) => (
            <Card
              key={kpi.assigned_kpi_id}
              className="hover:shadow-lg transition-shadow flex flex-col"
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg leading-tight">
                    {kpi.kpi_name}
                  </CardTitle>
                  {getStatusBadge(kpi.kpi_status)}
                </div>
                <CardDescription className="text-sm">
                  {kpi.kpi_description}
                </CardDescription>

                {/* Pillar and Department Tags */}
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    <GraduationCap className="h-3 w-3 mr-1" />
                    {kpi.pillar}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Building className="h-3 w-3 mr-1" />
                    {kpi.department}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      Submissions:
                    </span>
                    <span className="font-medium">
                      {kpi.form_input ? kpi.form_input.length : 0} entries
                    </span>
                  </div>

                  {/* Row-wise review progress */}
                  {kpi.form_input && kpi.form_input.length > 0 && (
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">
                          Row Reviews:
                        </span>
                        <span className="font-medium">
                          {
                            Object.keys(rowComments[kpi.assigned_kpi_id] || {})
                              .length
                          }{" "}
                          / {kpi.form_input.length}
                        </span>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <span className="text-green-600">
                          ✓{" "}
                          {
                            Object.values(
                              rowComments[kpi.assigned_kpi_id] || {},
                            ).filter((r) => r.status === "approved").length
                          }
                        </span>
                        <span className="text-red-600">
                          ✗{" "}
                          {
                            Object.values(
                              rowComments[kpi.assigned_kpi_id] || {},
                            ).filter((r) => r.status === "rejected").length
                          }
                        </span>
                      </div>
                    </div>
                  )}

                  {kpi.qoc_remark && (
                    <Alert className="mt-3">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle className="text-sm">
                        Review Feedback
                      </AlertTitle>
                      <AlertDescription className="text-xs mt-1">
                        {kpi.qoc_remark.length > 100
                          ? `${kpi.qoc_remark.substring(0, 100)}...`
                          : kpi.qoc_remark}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
              <CardFooter className="mt-auto">
                <Button
                  onClick={() => handleOpenDialog(kpi)}
                  className="w-full"
                  variant={kpi.kpi_status === "pending" ? "default" : "outline"}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {kpi.kpi_status === "pending"
                    ? "Review Submission"
                    : "View Details"}
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    No KPI Submissions Found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    No KPI submissions match your current filter criteria.
                  </p>
                  <Button onClick={clearFilters} variant="outline">
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* KPI Review Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-hidden [&>button]:hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedKpi?.kpi_name}</span>
              {selectedKpi && getStatusBadge(selectedKpi.kpi_status)}
            </DialogTitle>
            <DialogDescription>
              {selectedKpi?.kpi_description}
            </DialogDescription>
            {selectedKpi && (
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  <GraduationCap className="h-3 w-3 mr-1" />
                  {selectedKpi.pillar}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Building className="h-3 w-3 mr-1" />
                  {selectedKpi.department}
                </Badge>
              </div>
            )}
          </DialogHeader>

          <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
            <Tabs defaultValue="data" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="data">Review Data</TabsTrigger>
                <TabsTrigger value="overall">Overall Review</TabsTrigger>
              </TabsList>

              <TabsContent value="data" className="space-y-4">
                <div className="mt-4">
                  {selectedKpi &&
                  selectedKpi.form_input &&
                  selectedKpi.form_input.length > 0 ? (
                    <KpiReviewTable
                      kpiName={selectedKpi.kpi_name}
                      kpiDescription={selectedKpi.kpi_description}
                      formData={selectedKpi.form_input}
                      onRowReview={(rowIndex, status, comment) =>
                        handleRowReview(
                          selectedKpi.assigned_kpi_id,
                          rowIndex,
                          status,
                          comment,
                        )
                      }
                      existingComments={
                        rowComments[selectedKpi.assigned_kpi_id] || {}
                      }
                    />
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        No data has been submitted for this KPI yet.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="overall">
                <div className="mt-4 space-y-6">
                  <div>
                    <h3 className="font-medium text-lg mb-3">
                      Overall KPI Review Comments
                    </h3>
                    <Textarea
                      placeholder="Enter your overall feedback about this KPI submission. Include summary observations, recommendations, and any areas that need improvement..."
                      value={qocRemark}
                      onChange={(e) => setQocRemark(e.target.value)}
                      rows={6}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Provide constructive feedback to help improve future
                      submissions
                    </p>
                  </div>

                  {selectedKpi?.kpi_status === "pending" && (
                    <div className="pt-4 border-t">
                      <h3 className="font-medium text-lg mb-4">
                        Overall Review Decision
                      </h3>
                      <div className="flex gap-4">
                        <Button
                          onClick={() => handleOverallReviewSubmit("approved")}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          disabled={!qocRemark.trim()}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Approve KPI
                        </Button>
                        <Button
                          onClick={() => handleOverallReviewSubmit("redo")}
                          variant="destructive"
                          className="flex-1"
                          disabled={!qocRemark.trim()}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Request Revision
                        </Button>
                      </div>
                      {!qocRemark.trim() && (
                        <p className="text-xs text-red-500 mt-2 text-center">
                          Please provide feedback before making a decision
                        </p>
                      )}
                    </div>
                  )}

                  {selectedKpi?.kpi_status !== "pending" && (
                    <div className="pt-4 border-t">
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Review Completed</AlertTitle>
                        <AlertDescription>
                          This KPI has already been reviewed and marked as{" "}
                          <strong>{selectedKpi?.kpi_status}</strong>.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
