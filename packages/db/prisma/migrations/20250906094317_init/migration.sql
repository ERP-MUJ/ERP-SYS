-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('QAC', 'HOD', 'KPI_COORDINATOR', 'FACULTY');

-- CreateEnum
CREATE TYPE "KpiStatus" AS ENUM ('APPROVED', 'OVERDUE', 'REJECTED', 'REVISION', 'PENDING');

-- CreateEnum
CREATE TYPE "TotalCalculationType" AS ENUM ('ADMITTED', 'SANCTIONED');

-- CreateTable
CREATE TABLE "users" (
    "_id" UUID NOT NULL,
    "user_name" TEXT NOT NULL,
    "user_email" TEXT NOT NULL,
    "user_password" TEXT NOT NULL,
    "user_role" "UserRole" NOT NULL DEFAULT 'FACULTY',
    "dept_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "pillar_templates" (
    "_id" UUID NOT NULL,
    "pillar_name" TEXT NOT NULL,
    "description" TEXT,
    "pillar_value" DOUBLE PRECISION,
    "percentage_target_achieved" DOUBLE PRECISION,
    "performance" DOUBLE PRECISION,
    "academic_year" INTEGER NOT NULL,
    "created_by_user" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pillar_templates_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "kpi_templates" (
    "_id" UUID NOT NULL,
    "pillar_template_id" UUID,
    "kpi_number" INTEGER NOT NULL,
    "kpi_metric_name" TEXT NOT NULL,
    "kpi_description" TEXT,
    "kpi_value" DOUBLE PRECISION,
    "percentage_target_achieved" DOUBLE PRECISION,
    "performance" DOUBLE PRECISION,
    "data_provided_by" TEXT,
    "kpi_data" JSONB NOT NULL,
    "academic_year" INTEGER NOT NULL,
    "kpi_calculated_metrics" JSONB NOT NULL,
    "created_by_user" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kpi_templates_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "departments" (
    "_id" UUID NOT NULL,
    "dept_name" TEXT NOT NULL,
    "hod_id" UUID,
    "dept_creation" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "hod_name" TEXT,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "department_info" (
    "_id" UUID NOT NULL,
    "ug_programs" INTEGER NOT NULL DEFAULT 0,
    "pg_programs" INTEGER NOT NULL DEFAULT 0,
    "total_courses" INTEGER NOT NULL DEFAULT 0,
    "credits_even" INTEGER NOT NULL DEFAULT 0,
    "credits_odd" INTEGER NOT NULL DEFAULT 0,
    "students_internship" INTEGER NOT NULL DEFAULT 0,
    "students_project" INTEGER NOT NULL DEFAULT 0,
    "full_time_teachers" INTEGER NOT NULL DEFAULT 0,
    "department_id" UUID NOT NULL,
    "total_calculation_type" "TotalCalculationType" NOT NULL DEFAULT 'ADMITTED',

    CONSTRAINT "department_info_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "student_strength_records" (
    "_id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "intake" INTEGER NOT NULL DEFAULT 0,
    "admitted" INTEGER NOT NULL DEFAULT 0,
    "department_info_id" UUID NOT NULL,

    CONSTRAINT "student_strength_records_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "department_pillars" (
    "_id" UUID NOT NULL,
    "dept_id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "pillar_name" TEXT NOT NULL,
    "description" TEXT,
    "pillar_weight" DOUBLE PRECISION,
    "pillar_target" DOUBLE PRECISION,
    "percentage_target_achieved" DOUBLE PRECISION,
    "performance" DOUBLE PRECISION,
    "hod_percentage_target_achieved" DOUBLE PRECISION,
    "hod_performance" DOUBLE PRECISION,
    "academic_year" INTEGER NOT NULL,
    "assigned_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "department_pillars_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "department_kpis" (
    "_id" UUID NOT NULL,
    "dept_id" UUID NOT NULL,
    "dept_pillar_id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "kpi_number" INTEGER NOT NULL,
    "kpi_metric_name" TEXT NOT NULL,
    "kpi_description" TEXT,
    "kpi_value" DOUBLE PRECISION,
    "kpi_target" DOUBLE PRECISION,
    "percentage_target_achieved" DOUBLE PRECISION,
    "performance" DOUBLE PRECISION,
    "hod_percentage_target_achieved" DOUBLE PRECISION,
    "hod_performance" DOUBLE PRECISION,
    "data_provided_by" TEXT,
    "kpi_data" JSONB NOT NULL,
    "academic_year" INTEGER NOT NULL,
    "kpi_calculated_metrics" JSONB NOT NULL,
    "kpi_status" "KpiStatus" NOT NULL DEFAULT 'PENDING',
    "assigned_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" TIMESTAMP(3),
    "completed_date" TIMESTAMP(3),
    "comments" TEXT,
    "form_responses" JSONB,
    "user_ids" UUID[] DEFAULT ARRAY[]::UUID[],

    CONSTRAINT "department_kpis_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "otps" (
    "_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otps_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "_DepartmentKpiAssignedUsers" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_DepartmentKpiAssignedUsers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_user_email_key" ON "users"("user_email");

-- CreateIndex
CREATE UNIQUE INDEX "departments_dept_name_key" ON "departments"("dept_name");

-- CreateIndex
CREATE UNIQUE INDEX "department_info_department_id_key" ON "department_info"("department_id");

-- CreateIndex
CREATE UNIQUE INDEX "department_pillars_dept_id_template_id_key" ON "department_pillars"("dept_id", "template_id");

-- CreateIndex
CREATE UNIQUE INDEX "department_kpis_dept_pillar_id_template_id_key" ON "department_kpis"("dept_pillar_id", "template_id");

-- CreateIndex
CREATE UNIQUE INDEX "otps_email_key" ON "otps"("email");

-- CreateIndex
CREATE INDEX "_DepartmentKpiAssignedUsers_B_index" ON "_DepartmentKpiAssignedUsers"("B");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_dept_id_fkey" FOREIGN KEY ("dept_id") REFERENCES "departments"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpi_templates" ADD CONSTRAINT "kpi_templates_pillar_template_id_fkey" FOREIGN KEY ("pillar_template_id") REFERENCES "pillar_templates"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_info" ADD CONSTRAINT "department_info_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_strength_records" ADD CONSTRAINT "student_strength_records_department_info_id_fkey" FOREIGN KEY ("department_info_id") REFERENCES "department_info"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_pillars" ADD CONSTRAINT "department_pillars_dept_id_fkey" FOREIGN KEY ("dept_id") REFERENCES "departments"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_kpis" ADD CONSTRAINT "department_kpis_dept_id_fkey" FOREIGN KEY ("dept_id") REFERENCES "departments"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_kpis" ADD CONSTRAINT "department_kpis_dept_pillar_id_fkey" FOREIGN KEY ("dept_pillar_id") REFERENCES "department_pillars"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DepartmentKpiAssignedUsers" ADD CONSTRAINT "_DepartmentKpiAssignedUsers_A_fkey" FOREIGN KEY ("A") REFERENCES "department_kpis"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DepartmentKpiAssignedUsers" ADD CONSTRAINT "_DepartmentKpiAssignedUsers_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("_id") ON DELETE CASCADE ON UPDATE CASCADE;
