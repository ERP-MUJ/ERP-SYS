import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";
  const isUnauthenticated = status === "unauthenticated";

  const user = session?.user;
  const userRole = user?.role;

  const roleRoutes = {
    QAC: "/qc",
    HOD: "/hod",
    FACULTY: "/faculty",
    KPI_COORDINATOR: "/faculty", // KPI coordinators use faculty dashboard
  };

  const redirectToRoleDashboard = () => {
    if (userRole && roleRoutes[userRole as keyof typeof roleRoutes]) {
      router.push(roleRoutes[userRole as keyof typeof roleRoutes]);
    }
  };

  const isAllowedRoute = (allowedRoles: string[]) => {
    return userRole ? allowedRoles.includes(userRole) : false;
  };

  const getRoleLabel = (role: string) => {
    const roleLabels = {
      QAC: "Quality Assurance Committee",
      HOD: "Head of Department",
      FACULTY: "Faculty Member",
      KPI_COORDINATOR: "KPI Coordinator",
    };
    return roleLabels[role as keyof typeof roleLabels] || role;
  };

  return {
    session,
    user,
    userRole,
    isAuthenticated,
    isLoading,
    isUnauthenticated,
    redirectToRoleDashboard,
    isAllowedRoute,
    getRoleLabel,
  };
}
