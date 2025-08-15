"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  useGetDepartmentInfo,
  useCreateDepartmentInfo,
  useUpdateDepartmentInfo,
} from "@/queries/hod/department-info";
import { TotalCalculationType } from "@workspace/types/enums/enums";
import { GeneralInfoSection } from "@/components/hod/DepartmentInfo/GeneralInfoSection";
import { StudentStrengthSection } from "@/components/hod/DepartmentInfo/StudentStrengthSection";
import { FacultyInfoSection } from "@/components/hod/DepartmentInfo/FacultyInfoSection";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorDisplay } from "@/components/common/ErrorDisplay";

export default function DepartmentProfilePage() {
  const FacultyName = "FOSTA";
  const schoolName = "School of CSE";

  const {
    data: existingData,
    isLoading: isLoadingData,
    error: fetchError,
    refetch,
  } = useGetDepartmentInfo();

  const createMutation = useCreateDepartmentInfo();
  const updateMutation = useUpdateDepartmentInfo();

  const [data, setData] = useState({
    ugPrograms: 0,
    pgPrograms: 0,
    totalCourses: 0,
    creditsEven: 0,
    creditsOdd: 0,
    studentsInternship: 0,
    studentsProject: 0,
    fullTimeTeachers: 0,
  });

  const [yearData, setYearData] = useState([
    { year: 1, intake: 0, admitted: 0 },
    { year: 2, intake: 0, admitted: 0 },
    { year: 3, intake: 0, admitted: 0 },
    { year: 4, intake: 0, admitted: 0 },
  ]);

  // State is now correctly typed and initialized using the imported enum
  const [totalType, setTotalType] = useState<TotalCalculationType>(
    TotalCalculationType.ADMITTED,
  );

  useEffect(() => {
    if (existingData) {
      const {
        studentStrength,
        ...mainData
      } = existingData;
      setData(mainData);
      setTotalType(TotalCalculationType.ADMITTED);
      if (studentStrength && studentStrength.length > 0) {
        // Use functional update to avoid dependency on yearData
        setYearData(prevYearData => 
          prevYearData.map((localYear) => {
            const foundYear = studentStrength.find(
              (dbYear) => dbYear.year === localYear.year,
            );
            return foundYear
              ? {
                  ...localYear,
                  intake: foundYear.intake,
                  admitted: foundYear.admitted,
                }
              : localYear;
          })
        );
      }
    }
  }, [existingData]); // Removed yearData from dependencies

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData({ ...data, [e.target.name]: Number(e.target.value) });
  };

  const handleYearChange = (
    idx: number,
    field: "intake" | "admitted",
    value: number,
  ) => {
    setYearData((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row)),
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...data,
      studentStrength: yearData,
      totalCalculationType: totalType,
    };
    if (existingData?.id) {
      updateMutation.mutate({ id: existingData.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isLoading =
    isLoadingData || createMutation.isPending || updateMutation.isPending;

  if (isLoadingData) {
    return (
      <div className="container mx-auto py-8 px-4 flex justify-center">
        <LoadingSpinner message="Loading Department Profile..." />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="container mx-auto py-8 px-4 flex justify-center">
        <ErrorDisplay
          title="Failed to load data"
          message={fetchError.message}
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <main className="container mx-auto py-8 px-4">
      <form onSubmit={handleSave}>
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">{FacultyName}</CardTitle>
            <CardDescription className="text-lg">
              {schoolName} - Department Profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GeneralInfoSection
              data={data}
              isLoading={isLoading}
              handleChange={handleChange}
            />
            <StudentStrengthSection
              yearData={yearData}
              totalType={totalType}
              isLoading={isLoading}
              handleYearChange={handleYearChange}
              setTotalType={setTotalType}
            />
            <FacultyInfoSection
              data={data}
              isLoading={isLoading}
              handleChange={handleChange}
            />
          </CardContent>
          <CardFooter className="border-t mt-8 pt-6 flex justify-end">
            <Button type="submit" size="lg" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </main>
  );
}
