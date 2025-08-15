import { z } from "zod";

// Base User schema matching your Prisma model
export const UserSchema = z.object({
  id: z.string().uuid(),
  user_name: z.string(),
  user_email: z.string().email(),
  user_role: z.enum(["QAC", "HOD", "KPI_COORDINATOR", "FACULTY"]),
  dept_id: z.string().uuid().nullable(),
  created_at: z.string(), // ISO string format
});

// Department Faculty Response DTO
export const DepartmentFacultyResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(UserSchema),
  total: z.number(),
  message: z.string().optional(),
});

// Assign Coordinator Request DTO
export const AssignCoordinatorRequestSchema = z.object({
  faculty_id: z.string().uuid("Invalid faculty ID format"),
  new_role: z.enum(["KPI_COORDINATOR", "FACULTY"], {
    errorMap: () => ({
      message: "Role must be either KPI_COORDINATOR or FACULTY",
    }),
  }),
});

// Assign Coordinator Response DTO
export const AssignCoordinatorResponseSchema = z.object({
  success: z.boolean(),
  data: UserSchema,
  message: z.string(),
});

// Export types
export type User = z.infer<typeof UserSchema>;
export type DepartmentFacultyResponseDto = z.infer<
  typeof DepartmentFacultyResponseSchema
>;
export type AssignCoordinatorRequestDto = z.infer<
  typeof AssignCoordinatorRequestSchema
>;
export type AssignCoordinatorResponseDto = z.infer<
  typeof AssignCoordinatorResponseSchema
>;

// Validation helpers
export const validateAssignCoordinatorRequest = (
  data: unknown,
): AssignCoordinatorRequestDto => {
  return AssignCoordinatorRequestSchema.parse(data);
};

export const validateDepartmentFacultyResponse = (
  data: unknown,
): DepartmentFacultyResponseDto => {
  return DepartmentFacultyResponseSchema.parse(data);
};
