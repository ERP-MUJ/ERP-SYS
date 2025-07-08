import { DeptConfig, PillarInstance, ProcessError } from "@/lib/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { AssignKpiPayload } from "@/lib/types";

const fetchDepts = async (): Promise<DeptConfig[]> => {
  const response = await axios.get("/api/department");
  return response.data.departments.map((dept: any) => ({
    id: dept.dept_id,
    name: dept.dept_name,
    pillars: (dept.pillars || []).map((pillar: any) => ({
      id: pillar.pillar_id,
      name: pillar.pillar_name,
    })),
  }));
};

export function useFetchDepartments() {
  return useQuery<DeptConfig[]>({
    queryKey: ["depts"],
    queryFn: fetchDepts,
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useAssignKpiToPillar() {
  return useMutation({
    mutationFn: async (payload: AssignKpiPayload) => {
      console.log(payload);
      const response = await axios.post("/api/assigned-kpi", payload);
      return response.data;
    },
    onSuccess: () => {
      toast.success("KPIs successfully assigned!");
    },
    onError: (error: any) => {
      // Extract the error message from the axios error response
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Unknown error occurred";

      toast.error("Error assigning KPI", {
        description: errorMessage,
      });
    },
  });
}

export const useFetchAssignedKpis = (
  departmentId?: string,
  pillarId?: string,
) => {
  return useQuery({
    queryKey: ["assignedKpis", departmentId, pillarId],
    queryFn: async () => {
      if (!departmentId || !pillarId) return null;
      const response = await fetch(
        `/api/assigned-kpi?department_id=${departmentId}&pillar_id=${pillarId}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch assigned KPIs");
      }
      return response.json();
    },
    enabled: !!departmentId && !!pillarId,
  });
};

export function useCreatePillar() {
  return useMutation({
    mutationFn: async ({ pillar_name, department_id }: { pillar_name: string; department_id: string }) => {
      const response = await axios.post("/api/pillar", { pillar_name, department_id });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Pillar created successfully!");
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || error.message || "Unknown error occurred";
      toast.error("Error creating pillar", { description: errorMessage });
    },
  });
}

export function useFetchPillars() {
  return useQuery({
    queryKey: ["pillars"],
    queryFn: async () => {
      const response = await axios.get("/api/pillar");
      return response.data.pillars.map((pillar: any) => ({
        id: pillar.pillar_id,
        name: pillar.pillar_name,
        ...pillar,
      }));
    },
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
