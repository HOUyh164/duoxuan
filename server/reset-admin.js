const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function resetAdmin() {
  const email = 'admin@gmail.com';
  const password = 'admin'; // 您可以改为 123456，这里先设为 admin 方便记忆
  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email: email },
    update: {
      password: hashedPassword,
      role: 'admin'
    },
    create: {
      email: email,
      password: hashedPassword,
      role: 'admin'
    }
  });

  console.log('✅ 管理員賬號已重置');
  console.log('📧 賬號:', email);
  console.log('🔑 密碼:', password);
}

resetAdmin()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
