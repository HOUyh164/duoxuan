const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// 获取统计数据
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      totalOrders,
      totalCards,
      paidOrders,
      unusedCards,
      recentOrders
    ] = await Promise.all([
      prisma.user.count(),
      prisma.order.count(),
      prisma.card.count(),
      prisma.order.findMany({
        where: { status: 'paid' },
        select: { amount: true }
      }),
      prisma.card.count({ where: { status: 'unused' } }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { email: true } }
        }
      })
    ]);
    
    const totalRevenue = paidOrders.reduce((sum, order) => sum + order.amount, 0);
    
    // 按方案类型统计卡密
    const cardsByPlan = await prisma.card.groupBy({
      by: ['planType', 'status'],
      _count: true
    });
    
    // 按状态统计订单
    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      _count: true
    });
    
    res.json({
      overview: {
        totalUsers,
        totalOrders,
        totalCards,
        unusedCards,
        totalRevenue
      },
      cardsByPlan,
      ordersByStatus,
      recentOrders
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

// 获取用户列表
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    
    const where = search ? {
      email: { contains: search }
    } : {};
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit),
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          _count: {
            select: { orders: true }
          }
        }
      }),
      prisma.user.count({ where })
    ]);
    
    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

// 更新用户角色
router.put('/users/:id/role', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: '无效的角色' });
    }
    
    // 不能修改自己的角色
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: '不能修改自己的角色' });
    }
    
    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { role },
      select: {
        id: true,
        email: true,
        role: true
      }
    });
    
    res.json({
      message: '用户角色已更新',
      user
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: '更新用户角色失败' });
  }
});

module.exports = router;


