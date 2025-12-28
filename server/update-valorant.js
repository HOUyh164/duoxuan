const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const imageUrl = 'https://image2url.com/r2/default/images/1766926071108-cff4fe82-edfb-42e7-9b17-49acf463581c.jpg';
  
  // 1. 更新 VALORANT 遊戲
  const valorant = await prisma.game.upsert({
    where: { slug: 'valorant' },
    update: {
      coverImage: imageUrl,
      description: '專為 VALORANT 打造的極致 AI 視覺與驅動級輔助。完全獨立運行，不讀寫遊戲內存，極致穩定安全。'
    },
    create: {
      name: 'VALORANT',
      slug: 'valorant',
      coverImage: imageUrl,
      themeColor: '#ff4655',
      description: '專為 VALORANT 打造的極致 AI 視覺與驅動級輔助。完全獨立運行，不讀寫遊戲內存，極致穩定安全。'
    }
  });

  // 2. 清理舊商品
  await prisma.product.deleteMany({ where: { gameId: valorant.id } });
  
  // 3. 添加新商品
  await prisma.product.createMany({
    data: [
      { 
        gameId: valorant.id, 
        name: '體驗天卡', 
        planType: 'day', 
        price: 120, 
        duration: 24, 
        badge: '熱銷', 
        isPopular: true, 
        features: JSON.stringify(['AI 智能自瞄 (可調平滑)', '全功能骨骼 ESP', '獨家 HWID 防護', '24小時即時生效']) 
      },
      { 
        gameId: valorant.id, 
        name: '進階周卡', 
        planType: 'week', 
        price: 600, 
        duration: 168, 
        badge: '超值', 
        isPopular: false, 
        features: JSON.stringify(['包含天卡全部功能', '優先版本更新', '1對1 售後調教', '贈送專屬機器碼修改器']) 
      },
      { 
        gameId: valorant.id, 
        name: '至尊月卡', 
        planType: 'month', 
        price: 1800, 
        duration: 720, 
        badge: '推薦', 
        isPopular: true, 
        features: JSON.stringify(['極致隱藏驅動', '自定義配置保存', 'VIP 專屬頻道', '30天穩定使用保障']) 
      },
      { 
        gameId: valorant.id, 
        name: '終身永久卡', 
        planType: 'lifetime', 
        price: 5800, 
        duration: -1, 
        badge: '收藏', 
        isPopular: false, 
        isPremium: true,
        features: JSON.stringify(['終身免費更新', '內部專用通道', '防封號技術交流群', '全遊戲輔助永久授權']) 
      }
    ]
  });

  console.log('✅ VALORANT 封面與價格體系已完美更新');
}

main().catch(console.error).finally(() => prisma.$disconnect());
