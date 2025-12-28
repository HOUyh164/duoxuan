const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 清理可能冲突的旧演示数据
  try {
    await prisma.product.deleteMany({
      where: { name: { contains: 'VALORANT' } }
    });
    await prisma.product.deleteMany({
      where: { name: { contains: 'APEX' } }
    });
  } catch (e) {}

  const valorant = await prisma.game.upsert({
    where: { slug: 'valorant' },
    update: {
      name: 'VALORANT',
      description: '業界頂尖的 AI 自瞄與 ESP 透視，穩定不封號。',
      themeColor: '#ff4655',
      isActive: true,
      sortOrder: 1,
      coverImage: 'https://images.unsplash.com/photo-1624138784614-87fd1b6528f8?q=80&w=1000'
    },
    create: {
      name: 'VALORANT',
      slug: 'valorant',
      description: '業界頂尖的 AI 自瞄與 ESP 透視，穩定不封號。',
      themeColor: '#ff4655',
      isActive: true,
      sortOrder: 1,
      coverImage: 'https://images.unsplash.com/photo-1624138784614-87fd1b6528f8?q=80&w=1000'
    }
  });

  const apex = await prisma.game.upsert({
    where: { slug: 'apex' },
    update: {
      name: 'APEX LEGENDS',
      description: '暴力自瞄、鎖頭、預判、自動拾取，帶您輕鬆登頂。',
      themeColor: '#fff000',
      isActive: true,
      sortOrder: 2,
      coverImage: 'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?q=80&w=1000'
    },
    create: {
      name: 'APEX LEGENDS',
      slug: 'apex',
      description: '暴力自瞄、鎖頭、預判、自動拾取，帶您輕鬆登頂。',
      themeColor: '#fff000',
      isActive: true,
      sortOrder: 2,
      coverImage: 'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?q=80&w=1000'
    }
  });

  await prisma.product.createMany({
    data: [
      { 
        gameId: valorant.id, 
        name: '天卡', 
        planType: 'day', 
        price: 120, 
        duration: 24, 
        badge: '熱門', 
        isPopular: true, 
        features: JSON.stringify(['AI 智能自瞄', 'ESP 全圖透視', '無後座力']) 
      },
      { 
        gameId: valorant.id, 
        name: '周卡', 
        planType: 'week', 
        price: 600, 
        duration: 168, 
        features: JSON.stringify(['AI 智能自瞄', 'ESP 全圖透視', '無後座力', '24/7 支援']) 
      },
      { 
        gameId: apex.id, 
        name: '天卡', 
        planType: 'day', 
        price: 150, 
        duration: 24, 
        badge: '推薦', 
        isPopular: true, 
        features: JSON.stringify(['預判自瞄', '物品顯示', '雷達掃描']) 
      }
    ]
  });

  console.log('✅ 演示數據注入成功');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
