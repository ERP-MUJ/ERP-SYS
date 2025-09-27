import { useFetchForms } from "@/hooks/forms";
import {
  Home,
  Hammer,
  Check,
  Settings,
  LayoutDashboard,
  LineChart,
  User2,
  Eye,
  DownloadCloudIcon,
  Table,
} from "lucide-react"; // Icons
import { SidebarItem } from "@/lib/types";
import { useFetchAssignedKPI } from "@/hooks/faculty";

type SidebarConfig = Record<string, { title: string; items: SidebarItem[] }>;

export function useSidebarConfig(): SidebarConfig {
  /*const { data, isLoading, error } = useFetchAssignedKPI();
  console.log("Assigned KPI Data:", data);

  const kpiSubItems: SidebarItem[] =
  data?.map((kpi: any) => ({
    icon: LineChart,
    label: kpi.kpi_name, 
    id: kpi.assigned_kpi_id, 
    path: `/faculty/kpi-management/${kpi.assigned_kpi_id}`, // Assuming kpi_id is the ID you want to use
  })) || [];

  const HodkpiSubItems: SidebarItem[] =
  data?.map((kpi: any) => ({
    icon: LineChart,
    label: kpi.kpi_name, 
    id: kpi.assigned_kpi_id, 
    path: `/hod/kpi-management/${kpi.kpi_id}`, // Assuming kpi_id is the ID you want to use
  })) || [];*/

  return {
    qc: {
      title: "QC Dashboard",
      items: [
        { icon: Home, label: "Dashboard", id: "qc-dashboard", path: "/qc/" },
        {
          icon: Hammer,
          label: "Pillar and KPI Builder",
          id: "form-builder",
          path: "/qc/builder",
        },
        {
          icon: User2,
          label: "Assign KPI to Department",
          id: "assign-kpi",
          path: "/qc/assign",
        },
        {
          icon: Check,
          label: "Review Submissions",
          id: "review-submissions",
          path: "/qc/review",
        },
        {
          icon: DownloadCloudIcon,
          label: "Report Generation",
          id: "report-generation",
          path: "/qc/report",
        },
      ],
    },
    faculty: {
      title: "Faculty Dashboard",
      items: [
        {
          icon: LayoutDashboard,
          label: "Dashboard",
          id: "dashboard",
          path: "/faculty/",
        },
        {
          icon: LineChart,
          label: "KPI Management",
          id: "kpi-management",
          path: "/faculty/kpi-management", // Nested KPI items with required paths
        },
      ],
    },
    hod: {
      title: "HoD Dashboard",
      items: [
        {
          icon: LayoutDashboard,
          label: "Dashboard",
          id: "dashboard",
          path: "/hod/",
        },
        {
          icon: Table,
          label: "Department Profile",
          id: "department-profile",
          path: "/hod/department-profile",
        },
        {
          icon: LineChart,
          label: "KPI Management",
          id: "kpi-management",
          path: "/hod/kpi-management", // Nested KPI items with required paths
        },
        {
          icon: User2,
          label: "Assign KPI Coordinator",
          id: "kpi-coordinator",
          path: "/hod/assign-coordinator", // Nested KPI items with required paths
        },
      ],
    },
  };
}
