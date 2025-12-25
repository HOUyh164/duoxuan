const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// 获取卡密列表 (管理员)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, planType, page = 1, limit = 20 } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (planType) where.planType = planType;
    
    const [cards, total] = await Promise.all([
      prisma.card.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit),
        include: {
          order: {
            include: {
              user: {
                select: { email: true }
              }
            }
          }
        }
      }),
      prisma.card.count({ where })
    ]);
    
    res.json({
      cards,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get cards error:', error);
    res.status(500).json({ error: '获取卡密列表失败' });
  }
});

// 批量上传卡密 (管理员)
router.post('/upload', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { planType, cardKeys } = req.body;
    
    // 验证方案类型
    if (!planType) {
      return res.status(400).json({ error: '请指定方案类型' });
    }
    
    const validPlanTypes = ['day', 'week', 'month', 'lifetime'];
    if (!validPlanTypes.includes(planType)) {
      return res.status(400).json({ error: '无效的方案类型' });
    }
    
    // 验证卡密列表
    if (!cardKeys || !Array.isArray(cardKeys) || cardKeys.length === 0) {
      return res.status(400).json({ error: '请提供卡密列表' });
    }
    
    if (cardKeys.length > 500) {
      return res.status(400).json({ error: '单次最多上传 500 个卡密' });
    }
    
    // 处理卡密：去除空格、过滤空值、去重
    const processedKeys = [...new Set(
      cardKeys
        .map(key => key.trim())
        .filter(key => key.length > 0)
    )];
    
    if (processedKeys.length === 0) {
      return res.status(400).json({ error: '没有有效的卡密' });
    }
    
    // 检查数据库中是否有重复
    const existingCards = await prisma.card.findMany({
      where: {
        cardKey: { in: processedKeys }
      },
      select: { cardKey: true }
    });
    
    if (existingCards.length > 0) {
      const duplicates = existingCards.map(c => c.cardKey);
      return res.status(400).json({ 
        error: `以下卡密已存在：${duplicates.slice(0, 5).join(', ')}${duplicates.length > 5 ? '...' : ''}`,
        duplicates
      });
    }
    
    // 批量创建卡密
    await prisma.card.createMany({
      data: processedKeys.map(cardKey => ({
        cardKey,
        planType,
        status: 'unused'
      }))
    });
    
    // 返回创建的卡密
    const createdCards = await prisma.card.findMany({
      where: {
        cardKey: { in: processedKeys }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.status(201).json({
      message: `成功上传 ${createdCards.length} 张卡密`,
      count: createdCards.length,
      cards: createdCards
    });
  } catch (error) {
    console.error('Upload cards error:', error);
    res.status(500).json({ error: '上传卡密失败' });
  }
});

// 删除卡密 (管理员)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const card = await prisma.card.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!card) {
      return res.status(404).json({ error: '卡密不存在' });
    }
    
    if (card.status === 'used') {
      return res.status(400).json({ error: '已使用的卡密无法删除' });
    }
    
    await prisma.card.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ message: '卡密已删除' });
  } catch (error) {
    console.error('Delete card error:', error);
    res.status(500).json({ error: '删除卡密失败' });
  }
});

// 验证卡密 (用户)
router.post('/verify', authenticateToken, async (req, res) => {
  try {
    const { cardKey } = req.body;
    
    if (!cardKey) {
      return res.status(400).json({ error: '请提供卡密' });
    }
    
    const card = await prisma.card.findUnique({
      where: { cardKey }
    });
    
    if (!card) {
      return res.status(404).json({ error: '卡密不存在' });
    }
    
    if (card.status === 'used') {
      return res.status(400).json({ error: '该卡密已被使用' });
    }
    
    if (card.status === 'expired') {
      return res.status(400).json({ error: '该卡密已过期' });
    }
    
    res.json({
      valid: true,
      planType: card.planType,
      message: '卡密有效'
    });
  } catch (error) {
    console.error('Verify card error:', error);
    res.status(500).json({ error: '验证卡密失败' });
  }
});

// 兑换卡密 (用户)
router.post('/redeem', authenticateToken, async (req, res) => {
  try {
    const { cardKey } = req.body;
    const userId = req.user.id;
    
    if (!cardKey) {
      return res.status(400).json({ error: '请提供卡密' });
    }
    
    const card = await prisma.card.findUnique({
      where: { cardKey }
    });
    
    if (!card) {
      return res.status(404).json({ error: '卡密不存在' });
    }
    
    if (card.status !== 'unused') {
      return res.status(400).json({ error: '该卡密无法使用' });
    }
    
    // 创建订单并使用卡密
    const result = await prisma.$transaction(async (tx) => {
      // 创建订单
      const order = await tx.order.create({
        data: {
          userId,
          planType: card.planType,
          amount: 0, // 卡密兑换不收费
          status: 'paid',
          paymentMethod: 'card_redeem'
        }
      });
      
      // 更新卡密状态
      const updatedCard = await tx.card.update({
        where: { id: card.id },
        data: {
          status: 'used',
          orderId: order.id,
          usedAt: new Date()
        }
      });
      
      return { order, card: updatedCard };
    });
    
    res.json({
      message: '卡密兑换成功',
      order: result.order,
      planType: card.planType
    });
  } catch (error) {
    console.error('Redeem card error:', error);
    res.status(500).json({ error: '兑换卡密失败' });
  }
});

module.exports = router;


