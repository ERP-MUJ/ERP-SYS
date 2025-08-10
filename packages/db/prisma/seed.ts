import {
  PrismaClient,
  UserRole,
  KpiStatus,
  TotalCalculationType,
} from "./client";
import * as bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

async function main() {
  console.log("🌱 Starting database seeding...");

  try {
    // Clear existing data in reverse dependency order
    console.log("🧹 Cleaning existing data...");
    await prisma.otp.deleteMany({});
    await prisma.departmentKpi.deleteMany({});
    await prisma.departmentPillar.deleteMany({});
    await prisma.kpiTemplate.deleteMany({});
    await prisma.pillarTemplate.deleteMany({});
    await prisma.studentStrength.deleteMany({});
    await prisma.departmentInfo.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.department.deleteMany({});

    // Create departments
    console.log("🏢 Creating departments...");
    const departments = await Promise.all([
      prisma.department.create({
        data: {
          dept_name: "Computer Science and Engineering",
          hod_name: "Dr. John Smith",
          dept_creation: new Date("2020-01-01"),
        },
      }),
      prisma.department.create({
        data: {
          dept_name: "Electrical and Electronics Engineering",
          hod_name: "Dr. Jane Doe",
          dept_creation: new Date("2020-01-01"),
        },
      }),
      prisma.department.create({
        data: {
          dept_name: "Mechanical Engineering",
          hod_name: "Dr. Robert Johnson",
          dept_creation: new Date("2020-01-01"),
        },
      }),
      prisma.department.create({
        data: {
          dept_name: "Civil Engineering",
          hod_name: "Dr. Emily Brown",
          dept_creation: new Date("2020-01-01"),
        },
      }),
    ]);

    // Create users with hashed passwords
    console.log("👥 Creating users...");
    const hashedPassword = await hashPassword("123456");
    const adminPassword = await hashPassword("123456");

    const users = await Promise.all([
      // QAC Users
      prisma.user.create({
        data: {
          user_name: "QAC Administrator",
          user_email: "qac@jaipur.manipal.edu",
          user_password: adminPassword,
          user_role: UserRole.QAC,
        },
      }),
      prisma.user.create({
        data: {
          user_name: "QAC Assistant",
          user_email: "qac.assistant@jaipur.manipal.edu",
          user_password: hashedPassword,
          user_role: UserRole.QAC,
        },
      }),
      // HOD Users
      prisma.user.create({
        data: {
          user_name: "Dr. John Smith",
          user_email: "hod.cse@jaipur.manipal.edu",
          user_password: hashedPassword,
          user_role: UserRole.HOD,
          dept_id: departments[0].id,
        },
      }),
      prisma.user.create({
        data: {
          user_name: "Dr. Jane Doe",
          user_email: "hod.eee@jaipur.manipal.edu",
          user_password: hashedPassword,
          user_role: UserRole.HOD,
          dept_id: departments[1].id,
        },
      }),
      prisma.user.create({
        data: {
          user_name: "Dr. Robert Johnson",
          user_email: "hod.mech@jaipur.manipal.edu",
          user_password: hashedPassword,
          user_role: UserRole.HOD,
          dept_id: departments[2].id,
        },
      }),
      prisma.user.create({
        data: {
          user_name: "Dr. Emily Brown",
          user_email: "hod.civil@jaipur.manipal.edu",
          user_password: hashedPassword,
          user_role: UserRole.HOD,
          dept_id: departments[3].id,
        },
      }),
      // KPI Coordinators
      prisma.user.create({
        data: {
          user_name: "Alice Cooper",
          user_email: "alice.cooper@jaipur.manipal.edu",
          user_password: hashedPassword,
          user_role: UserRole.KPI_COORDINATOR,
          dept_id: departments[0].id,
        },
      }),
      prisma.user.create({
        data: {
          user_name: "Bob Wilson",
          user_email: "bob.wilson@jaipur.manipal.edu",
          user_password: hashedPassword,
          user_role: UserRole.KPI_COORDINATOR,
          dept_id: departments[1].id,
        },
      }),
      // Faculty Members
      prisma.user.create({
        data: {
          user_name: "Prof. Sarah Davis",
          user_email: "sarah.davis@jaipur.manipal.edu",
          user_password: hashedPassword,
          user_role: UserRole.FACULTY,
          dept_id: departments[0].id,
        },
      }),
      prisma.user.create({
        data: {
          user_name: "Dr. Michael Lee",
          user_email: "michael.lee@jaipur.manipal.edu",
          user_password: hashedPassword,
          user_role: UserRole.FACULTY,
          dept_id: departments[1].id,
        },
      }),
      prisma.user.create({
        data: {
          user_name: "Prof. Lisa Wang",
          user_email: "lisa.wang@jaipur.manipal.edu",
          user_password: hashedPassword,
          user_role: UserRole.FACULTY,
          dept_id: departments[2].id,
        },
      }),
      prisma.user.create({
        data: {
          user_name: "Dr. David Clark",
          user_email: "david.clark@jaipur.manipal.edu",
          user_password: hashedPassword,
          user_role: UserRole.FACULTY,
          dept_id: departments[3].id,
        },
      }),
    ]);

    // Update departments with HOD IDs
    console.log("🔗 Updating department HODs...");
    await Promise.all([
      prisma.department.update({
        where: { id: departments[0].id },
        data: { hod_id: users[2].id }, // Dr. John Smith (CSE HOD)
      }),
      prisma.department.update({
        where: { id: departments[1].id },
        data: { hod_id: users[3].id }, // Dr. Jane Doe (EEE HOD)
      }),
      prisma.department.update({
        where: { id: departments[2].id },
        data: { hod_id: users[4].id }, // Dr. Robert Johnson (Mech HOD)
      }),
      prisma.department.update({
        where: { id: departments[3].id },
        data: { hod_id: users[5].id }, // Dr. Emily Brown (Civil HOD)
      }),
    ]);

    // Create department info
    console.log("📊 Creating department information...");
    const departmentInfos = await Promise.all([
      prisma.departmentInfo.create({
        data: {
          departmentId: departments[0].id,
          ugPrograms: 3,
          pgPrograms: 2,
          totalCourses: 45,
          creditsEven: 20,
          creditsOdd: 22,
          studentsInternship: 150,
          studentsProject: 80,
          fullTimeTeachers: 25,
          totalCalculationType: TotalCalculationType.ADMITTED,
        },
      }),
      prisma.departmentInfo.create({
        data: {
          departmentId: departments[1].id,
          ugPrograms: 2,
          pgPrograms: 1,
          totalCourses: 38,
          creditsEven: 18,
          creditsOdd: 20,
          studentsInternship: 120,
          studentsProject: 60,
          fullTimeTeachers: 20,
          totalCalculationType: TotalCalculationType.SANCTIONED,
        },
      }),
      prisma.departmentInfo.create({
        data: {
          departmentId: departments[2].id,
          ugPrograms: 2,
          pgPrograms: 1,
          totalCourses: 40,
          creditsEven: 19,
          creditsOdd: 21,
          studentsInternship: 100,
          studentsProject: 70,
          fullTimeTeachers: 22,
          totalCalculationType: TotalCalculationType.ADMITTED,
        },
      }),
      prisma.departmentInfo.create({
        data: {
          departmentId: departments[3].id,
          ugPrograms: 2,
          pgPrograms: 1,
          totalCourses: 35,
          creditsEven: 17,
          creditsOdd: 19,
          studentsInternship: 90,
          studentsProject: 50,
          fullTimeTeachers: 18,
          totalCalculationType: TotalCalculationType.ADMITTED,
        },
      }),
    ]);

    // Create student strength records
    console.log("📈 Creating student strength records...");
    for (const deptInfo of departmentInfos) {
      await Promise.all([
        prisma.studentStrength.create({
          data: {
            year: 2021,
            intake: 120,
            admitted: 115,
            departmentInfoId: deptInfo.id,
          },
        }),
        prisma.studentStrength.create({
          data: {
            year: 2022,
            intake: 120,
            admitted: 118,
            departmentInfoId: deptInfo.id,
          },
        }),
        prisma.studentStrength.create({
          data: {
            year: 2023,
            intake: 140,
            admitted: 135,
            departmentInfoId: deptInfo.id,
          },
        }),
        prisma.studentStrength.create({
          data: {
            year: 2024,
            intake: 140,
            admitted: 138,
            departmentInfoId: deptInfo.id,
          },
        }),
      ]);
    }

    // Create pillar templates
    console.log("🏛️ Creating pillar templates...");
    const pillarTemplates = await Promise.all([
      prisma.pillarTemplate.create({
        data: {
          pillar_name: "Teaching-Learning and Evaluation",
          description:
            "Quality of teaching-learning process and evaluation methods",
          pillar_value: 100.0,
          percentage_target_achieved: 85.0,
          performance: 85.0,
          academic_year: 2024,
          created_by_user: users[0].id, // QAC Administrator
        },
      }),
      prisma.pillarTemplate.create({
        data: {
          pillar_name: "Research, Innovations and Extension",
          description: "Research output, innovations, and extension activities",
          pillar_value: 100.0,
          percentage_target_achieved: 75.0,
          performance: 75.0,
          academic_year: 2024,
          created_by_user: users[0].id,
        },
      }),
      prisma.pillarTemplate.create({
        data: {
          pillar_name: "Governance, Leadership and Management",
          description: "Institutional governance and management systems",
          pillar_value: 100.0,
          percentage_target_achieved: 80.0,
          performance: 80.0,
          academic_year: 2024,
          created_by_user: users[0].id,
        },
      }),
    ]);

    // Create KPI templates
    console.log("📋 Creating KPI templates...");
    const kpiTemplates = await Promise.all([
      // Teaching-Learning KPIs
      prisma.kpiTemplate.create({
        data: {
          pillar_template_id: pillarTemplates[0].id,
          kpi_number: 1,
          kpi_metric_name: "Student Teacher Ratio",
          kpi_description: "Average number of students per teacher",
          kpi_value: 15.0,
          percentage_target_achieved: 90.0,
          performance: 90.0,
          data_provided_by: "Academic Office",
          kpi_data: {
            target: 15,
            actual: 13.5,
            unit: "ratio",
          },
          academic_year: 2024,
          kpi_calculated_metrics: {
            efficiency: 90.0,
            trend: "improving",
          },
          created_by_user: users[0].id,
        },
      }),
      prisma.kpiTemplate.create({
        data: {
          pillar_template_id: pillarTemplates[0].id,
          kpi_number: 2,
          kpi_metric_name: "Pass Percentage",
          kpi_description: "Percentage of students passing examinations",
          kpi_value: 85.0,
          percentage_target_achieved: 85.0,
          performance: 85.0,
          data_provided_by: "Examination Office",
          kpi_data: {
            target: 85,
            actual: 85,
            unit: "percentage",
          },
          academic_year: 2024,
          kpi_calculated_metrics: {
            efficiency: 100.0,
            trend: "stable",
          },
          created_by_user: users[0].id,
        },
      }),
      // Research KPIs
      prisma.kpiTemplate.create({
        data: {
          pillar_template_id: pillarTemplates[1].id,
          kpi_number: 3,
          kpi_metric_name: "Research Publications",
          kpi_description: "Number of research publications per faculty",
          kpi_value: 2.5,
          percentage_target_achieved: 75.0,
          performance: 75.0,
          data_provided_by: "Research Office",
          kpi_data: {
            target: 3,
            actual: 2.25,
            unit: "publications per faculty",
          },
          academic_year: 2024,
          kpi_calculated_metrics: {
            efficiency: 75.0,
            trend: "improving",
          },
          created_by_user: users[0].id,
        },
      }),
      // Governance KPIs
      prisma.kpiTemplate.create({
        data: {
          pillar_template_id: pillarTemplates[2].id,
          kpi_number: 4,
          kpi_metric_name: "Faculty Development Programs",
          kpi_description: "Number of faculty development programs conducted",
          kpi_value: 12.0,
          percentage_target_achieved: 80.0,
          performance: 80.0,
          data_provided_by: "HR Department",
          kpi_data: {
            target: 15,
            actual: 12,
            unit: "programs",
          },
          academic_year: 2024,
          kpi_calculated_metrics: {
            efficiency: 80.0,
            trend: "stable",
          },
          created_by_user: users[0].id,
        },
      }),
    ]);

    // Create department pillars
    console.log("🏛️ Creating department pillars...");
    const departmentPillars = [];
    for (const dept of departments) {
      for (const pillarTemplate of pillarTemplates) {
        const deptPillar = await prisma.departmentPillar.create({
          data: {
            dept_id: dept.id,
            template_id: pillarTemplate.id,
            pillar_name: pillarTemplate.pillar_name,
            description: pillarTemplate.description,
            pillar_weight: pillarTemplate.pillar_value,
            percentage_target_achieved:
              pillarTemplate.percentage_target_achieved,
            performance: pillarTemplate.performance,
            academic_year: 2024,
            status: "active",
          },
        });
        departmentPillars.push(deptPillar);
      }
    }

    // Create department KPIs
    console.log("📋 Creating department KPIs...");
    for (const deptPillar of departmentPillars) {
      const relatedKpiTemplates = kpiTemplates.filter(
        (kpi: any) => kpi.pillar_template_id === deptPillar.template_id,
      );

      for (const kpiTemplate of relatedKpiTemplates) {
        // Find faculty/coordinators for this department
        const deptUsers = users.filter(
          (user: any) =>
            user.dept_id === deptPillar.dept_id &&
            (user.user_role === UserRole.FACULTY ||
              user.user_role === UserRole.KPI_COORDINATOR),
        );

        await prisma.departmentKpi.create({
          data: {
            dept_id: deptPillar.dept_id,
            dept_pillar_id: deptPillar.id,
            template_id: kpiTemplate.id,
            kpi_number: kpiTemplate.kpi_number,
            kpi_metric_name: kpiTemplate.kpi_metric_name,
            kpi_description: kpiTemplate.kpi_description,
            kpi_value: kpiTemplate.kpi_value,
            percentage_target_achieved: kpiTemplate.percentage_target_achieved,
            performance: kpiTemplate.performance,
            data_provided_by: kpiTemplate.data_provided_by,
            kpi_data: kpiTemplate.kpi_data as any,
            academic_year: 2024,
            kpi_calculated_metrics: kpiTemplate.kpi_calculated_metrics as any,
            kpi_status:
              Math.random() > 0.5 ? KpiStatus.PENDING : KpiStatus.APPROVED,
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            user_ids: deptUsers.slice(0, 2).map((user: any) => user.id), // Assign first 2 users
            assigned_users: {
              connect: deptUsers
                .slice(0, 2)
                .map((user: any) => ({ id: user.id })),
            },
          },
        });
      }
    }

    // Create sample OTP records
    console.log("🔐 Creating sample OTP records...");
    await Promise.all([
      prisma.otp.create({
        data: {
          email: "test@jaipur.manipal.edu",
          otp: "123456",
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
        },
      }),
    ]);

    console.log("✅ Database seeding completed successfully!");
    console.log("\n📊 Seeded data summary:");
    console.log(`- ${departments.length} departments`);
    console.log(`- ${users.length} users`);
    console.log(`- ${departmentInfos.length} department info records`);
    console.log(`- ${pillarTemplates.length} pillar templates`);
    console.log(`- ${kpiTemplates.length} KPI templates`);
    console.log(`- ${departmentPillars.length} department pillars`);
    console.log("\n🔑 Login credentials:");
    console.log("QAC Admin: qac@jaipur.manipal.edu / 123456");
    console.log("HOD (CSE): hod.cse@jaipur.manipal.edu / 123456");
    console.log("Faculty: sarah.davis@jaipur.manipal.edu / 123456");
    console.log("All users: 123456");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seeding failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
