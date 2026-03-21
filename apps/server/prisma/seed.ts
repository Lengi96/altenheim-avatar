import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Admin user
  const passwordHash = await bcrypt.hash('admin123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@altenheim.de' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@altenheim.de',
      passwordHash,
      role: 'admin',
    },
  });

  // Demo resident
  const resident = await prisma.resident.upsert({
    where: { id: 'demo-resident-id-0000-000000000001' },
    update: {},
    create: {
      id: 'demo-resident-id-0000-000000000001',
      name: 'Maria Müller',
      roomNumber: '12A',
      language: 'de',
      avatarName: 'Lena',
      preferences: { music: 'Schlager', games: ['memory'], topics: ['Garten', 'Familie'] },
    },
  });

  // Demo schedule
  await prisma.schedule.upsert({
    where: { id: 'demo-schedule-id-00000-000000000001' },
    update: {},
    create: {
      id: 'demo-schedule-id-00000-000000000001',
      residentId: resident.id,
      type: 'medication',
      title: 'Morgenmedikamente',
      cronExpression: '0 8 * * *',
    },
  });

  console.log('Seed complete');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
