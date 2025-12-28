const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// 获取所有游戏（公开接口）
router.get('/', async (req, res) => {
  try {
    const { active } = req.query;
    
    const where = {};
    if (active === 'true') {
      where.isActive = true;
    }

    const games = await prisma.game.findMany({
      where,
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' }
      ],
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    res.json(games);
  } catch (error) {
    console.error('获取游戏列表失败:', error);
    res.status(500).json({ error: '获取游戏列表失败' });
  }
});

// 根据slug获取单个游戏（公开接口）
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const game = await prisma.game.findUnique({
      where: { slug },
      include: {
        products: {
          where: { isActive: true },
          orderBy: [
            { sortOrder: 'asc' },
            { price: 'asc' }
          ]
        },
        configs: true
      }
    });

    if (!game) {
      return res.status(404).json({ error: '游戏不存在' });
    }

    res.json(game);
  } catch (error) {
    console.error('获取游戏详情失败:', error);
    res.status(500).json({ error: '获取游戏详情失败' });
  }
});

// 根据ID获取单个游戏
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const game = await prisma.game.findUnique({
      where: { id: parseInt(id) },
      include: {
        products: {
          orderBy: [
            { sortOrder: 'asc' },
            { price: 'asc' }
          ]
        },
        configs: true,
        _count: {
          select: { 
            products: true,
            cards: true
          }
        }
      }
    });

    if (!game) {
      return res.status(404).json({ error: '游戏不存在' });
    }

    res.json(game);
  } catch (error) {
    console.error('获取游戏详情失败:', error);
    res.status(500).json({ error: '获取游戏详情失败' });
  }
});

// 创建游戏（管理员）
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, slug, description, icon, coverImage, themeColor, isActive, sortOrder } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: '名称和标识符为必填项' });
    }

    // 检查slug是否已存在
    const existingGame = await prisma.game.findUnique({
      where: { slug }
    });

    if (existingGame) {
      return res.status(400).json({ error: '该标识符已被使用' });
    }

    const game = await prisma.game.create({
      data: {
        name,
        slug,
        description: description || null,
        icon: icon || null,
        coverImage: coverImage || null,
        themeColor: themeColor || '#ff4655',
        isActive: isActive !== false,
        sortOrder: sortOrder || 0
      }
    });

    res.status(201).json(game);
  } catch (error) {
    console.error('创建游戏失败:', error);
    res.status(500).json({ error: '创建游戏失败' });
  }
});

// 更新游戏（管理员）
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, icon, coverImage, themeColor, isActive, sortOrder } = req.body;

    // 检查游戏是否存在
    const existingGame = await prisma.game.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingGame) {
      return res.status(404).json({ error: '游戏不存在' });
    }

    // 如果更改slug，检查新slug是否已被使用
    if (slug && slug !== existingGame.slug) {
      const slugExists = await prisma.game.findUnique({
        where: { slug }
      });
      if (slugExists) {
        return res.status(400).json({ error: '该标识符已被使用' });
      }
    }

    const game = await prisma.game.update({
      where: { id: parseInt(id) },
      data: {
        name: name !== undefined ? name : existingGame.name,
        slug: slug !== undefined ? slug : existingGame.slug,
        description: description !== undefined ? description : existingGame.description,
        icon: icon !== undefined ? icon : existingGame.icon,
        coverImage: coverImage !== undefined ? coverImage : existingGame.coverImage,
        themeColor: themeColor !== undefined ? themeColor : existingGame.themeColor,
        isActive: isActive !== undefined ? isActive : existingGame.isActive,
        sortOrder: sortOrder !== undefined ? sortOrder : existingGame.sortOrder
      }
    });

    res.json(game);
  } catch (error) {
    console.error('更新游戏失败:', error);
    res.status(500).json({ error: '更新游戏失败' });
  }
});

// 删除游戏（管理员）
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // 检查游戏是否存在
    const existingGame = await prisma.game.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: { products: true, cards: true }
        }
      }
    });

    if (!existingGame) {
      return res.status(404).json({ error: '游戏不存在' });
    }

    // 删除游戏（级联删除相关商品和配置）
    await prisma.game.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: '游戏已删除' });
  } catch (error) {
    console.error('删除游戏失败:', error);
    res.status(500).json({ error: '删除游戏失败' });
  }
});

module.exports = router;
