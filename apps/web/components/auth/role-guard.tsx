"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: string[];
  fallbackPath?: string;
}

export function RoleGuard({
  children,
  allowedRoles,
  fallbackPath,
}: RoleGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/auth");
      return;
    }

    if (session?.user?.role && !allowedRoles.includes(session.user.role)) {
      // Redirect to role-specific dashboard
      const roleRoutes = {
        QAC: "/qc",
        HOD: "/hod",
        FACULTY: "/faculty",
        KPI_COORDINATOR: "/faculty", // KPI coordinators use faculty dashboard
      };

      const redirectPath =
        fallbackPath ||
        roleRoutes[session.user.role as keyof typeof roleRoutes] ||
        "/";
      router.push(redirectPath);
    }
  }, [session, status, allowedRoles, router, fallbackPath]);

  if (status === "loading") {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  if (!session?.user?.role || !allowedRoles.includes(session.user.role)) {
    return null;
  }

  return <>{children}</>;
}
