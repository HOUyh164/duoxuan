const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const config = require('../config');

const router = express.Router();
const prisma = new PrismaClient();

// 获取订单列表
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const isAdmin = req.user.role === 'admin';
    
    const where = isAdmin ? {} : { userId: req.user.id };
    
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit),
        include: {
          user: {
            select: { id: true, email: true }
          },
          cards: {
            select: { cardKey: true, status: true }
          }
        }
      }),
      prisma.order.count({ where })
    ]);
    
    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: '获取订单列表失败' });
  }
});

// 创建订单
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { planType, paymentMethod } = req.body;
    const userId = req.user.id;
    
    // 验证方案类型
    const validPlanTypes = ['day', 'week', 'month', 'lifetime'];
    if (!planType || !validPlanTypes.includes(planType)) {
      return res.status(400).json({ error: '无效的方案类型' });
    }
    
    // 获取价格
    const amount = config.pricing[planType];
    if (amount === 0) {
      return res.status(400).json({ error: '该方案暂未开放购买' });
    }
    
    // 创建订单
    const order = await prisma.order.create({
      data: {
        userId,
        planType,
        amount,
        status: 'pending',
        paymentMethod: paymentMethod || null
      }
    });
    
    res.status(201).json({
      message: '订单创建成功',
      order,
      // 预留支付信息
      payment: {
        amount,
        currency: 'TWD',
        orderId: order.id
        // paymentUrl: 将在接入支付平台后添加
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: '创建订单失败' });
  }
});

// 获取订单详情
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user.role === 'admin';
    
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: { id: true, email: true }
        },
        cards: true
      }
    });
    
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }
    
    // 非管理员只能查看自己的订单
    if (!isAdmin && order.userId !== req.user.id) {
      return res.status(403).json({ error: '无权查看此订单' });
    }
    
    res.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: '获取订单详情失败' });
  }
});

// 支付确认 (模拟支付 - 用户)
router.post('/:id/pay', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // 查找订单
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: { cards: true }
    });
    
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }
    
    // 验证订单属于当前用户
    if (order.userId !== userId) {
      return res.status(403).json({ error: '无权操作此订单' });
    }
    
    // 验证订单状态
    if (order.status === 'paid') {
      return res.status(400).json({ 
        error: '订单已支付',
        order,
        card: order.cards[0] || null
      });
    }
    
    if (order.status !== 'pending') {
      return res.status(400).json({ error: '订单状态异常，无法支付' });
    }
    
    // 查找可用卡密
    const availableCard = await prisma.card.findFirst({
      where: {
        planType: order.planType,
        status: 'unused'
      }
    });
    
    if (!availableCard) {
      return res.status(400).json({ 
        error: '暂无可用卡密，请联系客服',
        errorCode: 'NO_CARD_AVAILABLE'
      });
    }
    
    // 使用事务：更新订单状态 + 分配卡密
    const result = await prisma.$transaction(async (tx) => {
      // 更新订单状态为已支付
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: { 
          status: 'paid',
          paymentMethod: 'mock_payment' // 模拟支付
        }
      });
      
      // 分配卡密给订单
      const assignedCard = await tx.card.update({
        where: { id: availableCard.id },
        data: {
          status: 'used',
          orderId: order.id,
          usedAt: new Date()
        }
      });
      
      return { order: updatedOrder, card: assignedCard };
    });
    
    res.json({
      success: true,
      message: '支付成功！',
      order: result.order,
      card: {
        cardKey: result.card.cardKey,
        planType: result.card.planType
      }
    });
  } catch (error) {
    console.error('Pay order error:', error);
    res.status(500).json({ error: '支付处理失败，请稍后再试' });
  }
});

// 更新订单状态 (管理员)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'paid', 'cancelled', 'refunded'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: '无效的订单状态' });
    }
    
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }
    
    // 如果订单状态改为已付款，需要分配卡密
    let assignedCard = null;
    if (status === 'paid' && order.status !== 'paid') {
      // 查找可用卡密
      const availableCard = await prisma.card.findFirst({
        where: {
          planType: order.planType,
          status: 'unused'
        }
      });
      
      if (availableCard) {
        assignedCard = await prisma.card.update({
          where: { id: availableCard.id },
          data: {
            status: 'used',
            orderId: order.id,
            usedAt: new Date()
          }
        });
      }
    }
    
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        user: { select: { email: true } },
        cards: true
      }
    });
    
    res.json({
      message: '订单状态已更新',
      order: updatedOrder,
      assignedCard
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: '更新订单失败' });
  }
});

module.exports = router;


