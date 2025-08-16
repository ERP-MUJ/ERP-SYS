"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { AlertCircle, CheckCircle, FileText } from "lucide-react";

export function KpiCoordinatorNotification() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [hasShownNotification, setHasShownNotification] = useState(false);

  useEffect(() => {
    // Check if user is KPI_COORDINATOR and hasn't seen notification in this session
    if (
      session?.user?.role === "KPI_COORDINATOR" &&
      !hasShownNotification &&
      typeof window !== "undefined"
    ) {
      // Check localStorage to see if notification was shown recently (within 24 hours)
      const lastShown = localStorage.getItem(
        "kpi-coordinator-notification-shown",
      );
      const now = new Date().getTime();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;

      if (!lastShown || parseInt(lastShown) < oneDayAgo) {
        setIsOpen(true);
        setHasShownNotification(true);
        localStorage.setItem(
          "kpi-coordinator-notification-shown",
          now.toString(),
        );
      }
    }
  }, [session, hasShownNotification]);

  const handleGoToKpiManagement = () => {
    setIsOpen(false);
    router.push("/faculty/kpi-management");
  };

  const handleDismiss = () => {
    setIsOpen(false);
  };

  if (session?.user?.role !== "KPI_COORDINATOR") {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-500" />
            <DialogTitle>KPI Coordinator Assignment</DialogTitle>
          </div>
          <DialogDescription asChild>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>
                  You have been assigned as a{" "}
                  <Badge variant="secondary">KPI Coordinator</Badge> for your
                  department.
                </span>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/50 p-3 rounded-md space-y-2">
                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                  Your New Responsibilities:
                </p>
                <ul className="text-sm text-blue-600 dark:text-blue-400 list-disc pl-5 space-y-1">
                  <li>Fill KPI forms for your department</li>
                  <li>Submit completed forms for HOD review</li>
                  <li>Respond to revision requests promptly</li>
                  <li>Monitor KPI status and deadlines</li>
                </ul>
              </div>
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  You can access and manage KPIs in the KPI Management section.
                </span>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleDismiss}>
            Dismiss
          </Button>
          <Button onClick={handleGoToKpiManagement}>
            <FileText className="h-4 w-4 mr-2" />
            Go to KPI Management
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
