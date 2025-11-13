import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Check if super admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'jkimunyi@gmail.com' },
  });

  if (existingAdmin) {
    console.log('✅ Super Admin already exists:', existingAdmin.email);
    return;
  }

  // Create Super Admin - Jimmy Kimunyi
  const hashedPassword = await bcrypt.hash('@_Kimunyi123!', 10);

  const superAdmin = await prisma.user.create({
    data: {
      name: 'Jimmy Kimunyi',
      email: 'jkimunyi@gmail.com',
      passwordHash: hashedPassword,
      role: 'SUPER_ADMIN',
      isActive: true,
      // Super admin doesn't need hospitalId
    },
  });

  console.log('✅ Super Admin created successfully:');
  console.log('   Name:', superAdmin.name);
  console.log('   Email:', superAdmin.email);
  console.log('   Role:', superAdmin.role);
  console.log('   ID:', superAdmin.id);
  console.log('\n🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
