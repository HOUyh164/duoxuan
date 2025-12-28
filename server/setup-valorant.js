const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🎮 正在配置 VALORANT...');

  // 1. 创建或更新 VALORANT 游戏
  const valorant = await prisma.game.upsert({
    where: { slug: 'valorant' },
    update: {
      name: 'VALORANT',
      description: '專為 VALORANT 打造的極致 AI 視覺與驅動級輔助。完全獨立運行，不讀寫遊戲內存，極致穩定安全。',
      coverImage: 'https://image2url.com/r2/default/images/1766926071108-cff4fe82-edfb-42e7-9b17-49acf463581c.jpg',
      themeColor: '#ff4655',
      isActive: true,
      sortOrder: 1
    },
    create: {
      name: 'VALORANT',
      slug: 'valorant',
      description: '專為 VALORANT 打造的極致 AI 視覺與驅動級輔助。完全獨立運行，不讀寫遊戲內存，極致穩定安全。',
      coverImage: 'https://image2url.com/r2/default/images/1766926071108-cff4fe82-edfb-42e7-9b17-49acf463581c.jpg',
      themeColor: '#ff4655',
      isActive: true,
      sortOrder: 1
    }
  });

  console.log('✅ VALORANT 遊戲已創建/更新，ID:', valorant.id);

  // 2. 清理舊商品
  await prisma.product.deleteMany({ where: { gameId: valorant.id } });

  // 3. 添加商品（周400、月1200、永8000）
  const products = await prisma.product.createMany({
    data: [
      { 
        gameId: valorant.id, 
        name: '體驗天卡', 
        planType: 'day', 
        price: 120, 
        duration: 24, 
        badge: '熱銷', 
        isPopular: true, 
        features: JSON.stringify(['AI 智能自瞄', '全功能骨骼 ESP', '驅動級隱藏', '24小時即時生效']) 
      },
      { 
        gameId: valorant.id, 
        name: '進階周卡', 
        planType: 'week', 
        price: 400, 
        duration: 168, 
        badge: '超值', 
        features: JSON.stringify(['包含天卡全部功能', '優先版本更新', '穩定上分首選', '贈送專屬機器碼修改器']) 
      },
      { 
        gameId: valorant.id, 
        name: '至尊月卡', 
        planType: 'month', 
        price: 1200, 
        duration: 720, 
        badge: '推薦', 
        isPopular: true, 
        features: JSON.stringify(['VIP 售後支持', '月度穩定保障', '極致驅動防護', '30天長效授權']) 
      },
      { 
        gameId: valorant.id, 
        name: '終身永久卡', 
        planType: 'lifetime', 
        price: 8000, 
        duration: -1, 
        badge: '收藏', 
        isPremium: true, 
        features: JSON.stringify(['終身免費更新', '內部專屬通道', '全遊戲通用授權', '防封技術交流群']) 
      }
    ]
  });

  console.log('✅ 商品已添加，共', products.count, '個');
  console.log('💰 天卡120 | 周卡400 | 月卡1200 | 永久8000');
  console.log('🎉 VALORANT 配置完成！');
}

main().catch(console.error).finally(() => prisma.$disconnect());
