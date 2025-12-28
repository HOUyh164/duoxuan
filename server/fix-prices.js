const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function update() {
  const game = await prisma.game.findUnique({ where: { slug: 'valorant' } });
  if (!game) {
    console.log('未找到瓦，請先添加');
    return;
  }
  
  // 刪除舊的
  await prisma.product.deleteMany({ where: { gameId: game.id } });
  
  // 添加新的（按照您的要求：周400，月1200，永8000）
  await prisma.product.createMany({
    data: [
      { gameId: game.id, name: '體驗天卡', planType: 'day', price: 120, duration: 24, badge: '熱銷', isPopular: true, features: JSON.stringify(["AI 智能自瞄", "全功能 ESP", "驅動隱藏"]) },
      { gameId: game.id, name: '進階周卡', planType: 'week', price: 400, duration: 168, features: JSON.stringify(["周卡專屬優化", "穩定上分首選", "贈送修改器"]) },
      { gameId: game.id, name: '至尊月卡', planType: 'month', price: 1200, duration: 720, badge: '推薦', isPopular: true, features: JSON.stringify(["VIP 售後支持", "月度穩定更新", "極致安全"]) },
      { gameId: game.id, name: '終身永久卡', planType: 'lifetime', price: 8000, duration: -1, badge: '收藏', isPremium: true, features: JSON.stringify(["終身授權", "內部專供版本", "全遊戲通用"]) }
    ]
  });
  console.log('✅ VALORANT 價格已修正');
}

update().catch(console.error).finally(() => prisma.$disconnect());
