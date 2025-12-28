const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. 找到瓦洛蘭特遊戲
  const game = await prisma.game.findUnique({ where: { slug: 'valorant' } });
  
  if (!game) {
    console.log('❌ 未找到 VALORANT 類別，正在為您自動創建...');
    await prisma.game.create({
      data: {
        name: 'VALORANT',
        slug: 'valorant',
        description: '專為 VALORANT 打造的極致 AI 視覺與驅動級輔助。完全獨立運行，不讀寫遊戲內存，極致穩定安全。',
        coverImage: 'https://image2url.com/r2/default/images/1766926071108-cff4fe82-edfb-42e7-9b17-49acf463581c.jpg',
        themeColor: '#ff4655',
        isActive: true
      }
    });
  }

  const valorantId = (await prisma.game.findUnique({ where: { slug: 'valorant' } })).id;

  // 2. 清理可能殘留的空數據
  await prisma.product.deleteMany({ where: { gameId: valorantId } });

  // 3. 重新添加商品
  await prisma.product.createMany({
    data: [
      { 
        gameId: valorantId, 
        name: '體驗天卡', 
        planType: 'day', 
        price: 120, 
        duration: 24, 
        badge: '熱銷', 
        isPopular: true, 
        features: JSON.stringify(['AI 智能自瞄', '全功能骨骼 ESP', '驅動級隱藏', '24小時即時生效']) 
      },
      { 
        gameId: valorantId, 
        name: '進階周卡', 
        planType: 'week', 
        price: 400, 
        duration: 168, 
        badge: '超值', 
        features: JSON.stringify(['包含天卡全部功能', '優先版本更新', '穩定上分首選', '贈送專屬機器碼修改器']) 
      },
      { 
        gameId: valorantId, 
        name: '至尊月卡', 
        planType: 'month', 
        price: 1200, 
        duration: 720, 
        badge: '推薦', 
        isPopular: true, 
        features: JSON.stringify(['VIP 售後支持', '月度穩定保障', '極致驅動防護', '30天長效授權']) 
      },
      { 
        gameId: valorantId, 
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

  console.log('✅ VALORANT 商品已成功重新補全！');
  console.log('💰 周400, 月1200, 永8000');
}

main().catch(console.error).finally(() => prisma.$disconnect());
