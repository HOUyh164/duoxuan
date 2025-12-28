const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// 获取所有商品（公开接口）
router.get('/', async (req, res) => {
  try {
    const { gameId, active } = req.query;

    const where = {};
    if (gameId) {
      where.gameId = parseInt(gameId);
    }
    if (active === 'true') {
      where.isActive = true;
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: [
        { sortOrder: 'asc' },
        { price: 'asc' }
      ],
      include: {
        game: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        _count: {
          select: { cards: true }
        }
      }
    });

    // 解析features JSON字符串
    const productsWithFeatures = products.map(product => ({
      ...product,
      features: JSON.parse(product.features || '[]')
    }));

    res.json(productsWithFeatures);
  } catch (error) {
    console.error('获取商品列表失败:', error);
    res.status(500).json({ error: '获取商品列表失败' });
  }
});

// 根据游戏slug获取商品
router.get('/game/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const game = await prisma.game.findUnique({
      where: { slug }
    });

    if (!game) {
      return res.status(404).json({ error: '游戏不存在' });
    }

    const products = await prisma.product.findMany({
      where: {
        gameId: game.id,
        isActive: true
      },
      orderBy: [
        { sortOrder: 'asc' },
        { price: 'asc' }
      ]
    });

    // 解析features JSON字符串
    const productsWithFeatures = products.map(product => ({
      ...product,
      features: JSON.parse(product.features || '[]')
    }));

    res.json(productsWithFeatures);
  } catch (error) {
    console.error('获取商品列表失败:', error);
    res.status(500).json({ error: '获取商品列表失败' });
  }
});

// 根据ID获取单个商品
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        game: true,
        _count: {
          select: { 
            cards: {
              where: { status: 'unused' }
            }
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ error: '商品不存在' });
    }

    res.json({
      ...product,
      features: JSON.parse(product.features || '[]')
    });
  } catch (error) {
    console.error('获取商品详情失败:', error);
    res.status(500).json({ error: '获取商品详情失败' });
  }
});

// 创建商品（管理员）
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      gameId, 
      name, 
      planType, 
      price, 
      currency,
      duration, 
      description, 
      features, 
      badge,
      isPopular,
      isPremium,
      isActive, 
      sortOrder 
    } = req.body;

    if (!gameId || !name || !planType || price === undefined || duration === undefined) {
      return res.status(400).json({ error: '游戏ID、名称、方案类型、价格和时长为必填项' });
    }

    // 检查游戏是否存在
    const game = await prisma.game.findUnique({
      where: { id: parseInt(gameId) }
    });

    if (!game) {
      return res.status(404).json({ error: '游戏不存在' });
    }

    const product = await prisma.product.create({
      data: {
        gameId: parseInt(gameId),
        name,
        planType,
        price: parseFloat(price),
        currency: currency || 'NT$',
        duration: parseInt(duration),
        description: description || null,
        features: JSON.stringify(features || []),
        badge: badge || null,
        isPopular: isPopular || false,
        isPremium: isPremium || false,
        isActive: isActive !== false,
        sortOrder: sortOrder || 0
      },
      include: {
        game: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    res.status(201).json({
      ...product,
      features: JSON.parse(product.features)
    });
  } catch (error) {
    console.error('创建商品失败:', error);
    res.status(500).json({ error: '创建商品失败' });
  }
});

// 更新商品（管理员）
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      gameId,
      name, 
      planType, 
      price, 
      currency,
      duration, 
      description, 
      features, 
      badge,
      isPopular,
      isPremium,
      isActive, 
      sortOrder 
    } = req.body;

    // 检查商品是否存在
    const existingProduct = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingProduct) {
      return res.status(404).json({ error: '商品不存在' });
    }

    // 如果更改游戏ID，检查新游戏是否存在
    if (gameId && gameId !== existingProduct.gameId) {
      const game = await prisma.game.findUnique({
        where: { id: parseInt(gameId) }
      });
      if (!game) {
        return res.status(404).json({ error: '目标游戏不存在' });
      }
    }

    const updateData = {};
    if (gameId !== undefined) updateData.gameId = parseInt(gameId);
    if (name !== undefined) updateData.name = name;
    if (planType !== undefined) updateData.planType = planType;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (currency !== undefined) updateData.currency = currency;
    if (duration !== undefined) updateData.duration = parseInt(duration);
    if (description !== undefined) updateData.description = description;
    if (features !== undefined) updateData.features = JSON.stringify(features);
    if (badge !== undefined) updateData.badge = badge;
    if (isPopular !== undefined) updateData.isPopular = isPopular;
    if (isPremium !== undefined) updateData.isPremium = isPremium;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        game: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    res.json({
      ...product,
      features: JSON.parse(product.features)
    });
  } catch (error) {
    console.error('更新商品失败:', error);
    res.status(500).json({ error: '更新商品失败' });
  }
});

// 删除商品（管理员）
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // 检查商品是否存在
    const existingProduct = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: { cards: true, orders: true }
        }
      }
    });

    if (!existingProduct) {
      return res.status(404).json({ error: '商品不存在' });
    }

    // 删除商品
    await prisma.product.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: '商品已删除' });
  } catch (error) {
    console.error('删除商品失败:', error);
    res.status(500).json({ error: '删除商品失败' });
  }
});

module.exports = router;
