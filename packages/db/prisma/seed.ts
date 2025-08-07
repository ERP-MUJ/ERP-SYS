import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create test departments
  const departments = [
    {
      dept_name: 'Computer Science and Engineering',
      hod_name: 'Dr. John Smith',
    },
    {
      dept_name: 'Mechanical Engineering',
      hod_name: 'Dr. Sarah Johnson',
    },
    {
      dept_name: 'Electrical Engineering',
      hod_name: 'Dr. Michael Brown',
    },
    {
      dept_name: 'Civil Engineering',
      hod_name: 'Dr. Emily Davis',
    },
  ];

  console.log('📚 Creating departments...');
  for (const dept of departments) {
    await prisma.department.upsert({
      where: { dept_name: dept.dept_name },
      update: {},
      create: {
        dept_name: dept.dept_name,
        hod_name: dept.hod_name,
      },
    });
  }

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 10);

  console.log('👥 Creating test users...');

  // Create QAC user
  const qacUser = await prisma.user.upsert({
    where: { user_email: 'qac@test.com' },
    update: {},
    create: {
      user_name: 'QAC Admin',
      user_email: 'qac@test.com',
      user_password: hashedPassword,
      user_role: UserRole.QAC,
    },
  });

  // Create HOD users
  const hodUsers = [
    {
      user_name: 'Dr. John Smith',
      user_email: 'hod.cse@test.com',
      user_role: UserRole.HOD,
      dept_name: 'Computer Science and Engineering',
    },
    {
      user_name: 'Dr. Sarah Johnson',
      user_email: 'hod.mech@test.com',
      user_role: UserRole.HOD,
      dept_name: 'Mechanical Engineering',
    },
    {
      user_name: 'Dr. Michael Brown',
      user_email: 'hod.ee@test.com',
      user_role: UserRole.HOD,
      dept_name: 'Electrical Engineering',
    },
    {
      user_name: 'Dr. Emily Davis',
      user_email: 'hod.ce@test.com',
      user_role: UserRole.HOD,
      dept_name: 'Civil Engineering',
    },
  ];

  for (const hod of hodUsers) {
    const department = await prisma.department.findUnique({
      where: { dept_name: hod.dept_name },
    });

    if (department) {
      await prisma.user.upsert({
        where: { user_email: hod.user_email },
        update: {},
        create: {
          user_name: hod.user_name,
          user_email: hod.user_email,
          user_password: hashedPassword,
          user_role: hod.user_role,
          dept_id: department.id,
        },
      });

      // Update department with HOD ID
      await prisma.department.update({
        where: { id: department.id },
        data: { hod_id: (await prisma.user.findUnique({ where: { user_email: hod.user_email } }))?.id },
      });
    }
  }

  // Create faculty users
  const facultyUsers = [
    {
      user_name: 'Prof. Alice Wilson',
      user_email: 'faculty1@test.com',
      dept_name: 'Computer Science and Engineering',
    },
    {
      user_name: 'Prof. Bob Chen',
      user_email: 'faculty2@test.com',
      dept_name: 'Computer Science and Engineering',
    },
    {
      user_name: 'Prof. Carol Lee',
      user_email: 'faculty3@test.com',
      dept_name: 'Mechanical Engineering',
    },
    {
      user_name: 'Prof. David Kim',
      user_email: 'faculty4@test.com',
      dept_name: 'Electrical Engineering',
    },
  ];

  for (const faculty of facultyUsers) {
    const department = await prisma.department.findUnique({
      where: { dept_name: faculty.dept_name },
    });

    if (department) {
      await prisma.user.upsert({
        where: { user_email: faculty.user_email },
        update: {},
        create: {
          user_name: faculty.user_name,
          user_email: faculty.user_email,
          user_password: hashedPassword,
          user_role: UserRole.FACULTY,
          dept_id: department.id,
        },
      });
    }
  }

  // Create test pillar templates
  console.log('🏛️ Creating test pillar templates...');
  const pillarTemplates = [
    {
      pillar_name: 'Academic Excellence',
      description: 'Focus on academic performance and student achievements',
      pillar_value: 40,
      academic_year: 2024,
    },
    {
      pillar_name: 'Research & Innovation',
      description: 'Research publications, patents, and innovative projects',
      pillar_value: 30,
      academic_year: 2024,
    },
    {
      pillar_name: 'Industry Connect',
      description: 'Industry partnerships, internships, and placements',
      pillar_value: 20,
      academic_year: 2024,
    },
    {
      pillar_name: 'Infrastructure & Resources',
      description: 'Facilities, equipment, and learning resources',
      pillar_value: 10,
      academic_year: 2024,
    },
  ];

  for (const pillar of pillarTemplates) {
    await prisma.pillarTemplate.upsert({
      where: {
        id: `${pillar.pillar_name.toLowerCase().replace(/\s+/g, '-')}-${pillar.academic_year}`,
      },
      update: {},
      create: {
        id: `${pillar.pillar_name.toLowerCase().replace(/\s+/g, '-')}-${pillar.academic_year}`,
        pillar_name: pillar.pillar_name,
        description: pillar.description,
        pillar_value: pillar.pillar_value,
        academic_year: pillar.academic_year,
        created_by_user: qacUser.id,
      },
    });
  }

  console.log('✅ Database seed completed successfully!');
  console.log('\n📋 Test Accounts:');
  console.log('QAC: qac@test.com / password123');
  console.log('HOD CSE: hod.cse@test.com / password123');
  console.log('HOD Mech: hod.mech@test.com / password123');
  console.log('HOD EE: hod.ee@test.com / password123');
  console.log('HOD CE: hod.ce@test.com / password123');
  console.log('Faculty: faculty1@test.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });