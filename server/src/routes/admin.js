const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// 初始化管理员账户（仅在没有管理员时可用）
router.post('/init', async (req, res) => {
  try {
    // 检查是否已有管理员
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'admin' }
    });
    
    if (existingAdmin) {
      return res.status(400).json({ 
        error: '管理员账户已存在，无法重复初始化',
        message: '如需重置管理员，请联系技术支持'
      });
    }
    
    // 从环境变量或使用默认值
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@dora.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123456';
    
    // 检查邮箱是否已被注册
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    });
    
    if (existingUser) {
      // 如果用户已存在，升级为管理员
      await prisma.user.update({
        where: { email: adminEmail },
        data: { role: 'admin' }
      });
      
      return res.json({
        message: '已将现有用户升级为管理员',
        admin: {
          email: adminEmail,
          note: '请使用原有密码登录'
        }
      });
    }
    
    // 创建新管理员账户
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        role: 'admin'
      }
    });
    
    res.status(201).json({
      message: '管理员账户创建成功！',
      admin: {
        email: adminEmail,
        password: adminPassword,
        note: '请登录后立即修改密码！'
      },
      loginUrl: '/admin'
    });
  } catch (error) {
    console.error('Init admin error:', error);
    res.status(500).json({ error: '初始化管理员失败' });
  }
});

// 检查是否有管理员（公开接口，用于判断是否需要初始化）
router.get('/check-init', async (req, res) => {
  try {
    const adminCount = await prisma.user.count({
      where: { role: 'admin' }
    });
    
    res.json({
      initialized: adminCount > 0,
      message: adminCount > 0 ? '系统已初始化' : '需要初始化管理员账户'
    });
  } catch (error) {
    console.error('Check init error:', error);
    res.status(500).json({ error: '检查失败' });
  }
});

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


