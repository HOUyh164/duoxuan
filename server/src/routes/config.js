const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// 默认配置值
const defaultConfigs = {
  // 全局配置
  siteName: 'DORA',
  siteTagline: '頂級遊戲輔助',
  heroTitle: '征服戰場',
  heroSubtitle: '業界頂尖的 AI 輔助技術，為您帶來無與倫比的遊戲體驗。',
  discordUrl: 'https://discord.gg/your-invite',
  discordOnline: '100+',
  discordMembers: '1000+',
  stats: JSON.stringify([
    { value: '99.9%', label: '穩定率' },
    { value: '24/7', label: '技術支援' },
    { value: '1000+', label: '活躍用戶' }
  ]),
  footerCopyright: '© 2024 DORA. All rights reserved.',
  footerDisclaimer: '免責聲明：本軟體僅供學習研究使用，使用者須自行承擔使用風險。'
};

// 获取配置（公开接口）
router.get('/', async (req, res) => {
  try {
    const { gameId } = req.query;

    // 获取全局配置
    const globalConfigs = await prisma.siteConfig.findMany({
      where: { gameId: null }
    });

    // 如果指定了游戏ID，也获取游戏特定配置
    let gameConfigs = [];
    if (gameId) {
      gameConfigs = await prisma.siteConfig.findMany({
        where: { gameId: parseInt(gameId) }
      });
    }

    // 合并配置，游戏配置优先
    const configMap = { ...defaultConfigs };
    
    globalConfigs.forEach(config => {
      try {
        configMap[config.key] = JSON.parse(config.value);
      } catch {
        configMap[config.key] = config.value;
      }
    });

    gameConfigs.forEach(config => {
      try {
        configMap[config.key] = JSON.parse(config.value);
      } catch {
        configMap[config.key] = config.value;
      }
    });

    res.json(configMap);
  } catch (error) {
    console.error('获取配置失败:', error);
    res.status(500).json({ error: '获取配置失败' });
  }
});

// 获取指定key的配置
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { gameId } = req.query;

    // 先查找游戏特定配置
    if (gameId) {
      const gameConfig = await prisma.siteConfig.findUnique({
        where: {
          gameId_key: {
            gameId: parseInt(gameId),
            key
          }
        }
      });
      if (gameConfig) {
        try {
          return res.json({ value: JSON.parse(gameConfig.value) });
        } catch {
          return res.json({ value: gameConfig.value });
        }
      }
    }

    // 查找全局配置
    const globalConfig = await prisma.siteConfig.findUnique({
      where: {
        gameId_key: {
          gameId: null,
          key
        }
      }
    });

    if (globalConfig) {
      try {
        return res.json({ value: JSON.parse(globalConfig.value) });
      } catch {
        return res.json({ value: globalConfig.value });
      }
    }

    // 返回默认值
    if (defaultConfigs[key] !== undefined) {
      return res.json({ value: defaultConfigs[key] });
    }

    res.status(404).json({ error: '配置不存在' });
  } catch (error) {
    console.error('获取配置失败:', error);
    res.status(500).json({ error: '获取配置失败' });
  }
});

// 设置配置（管理员）
router.put('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { configs, gameId } = req.body;

    if (!configs || typeof configs !== 'object') {
      return res.status(400).json({ error: '配置数据格式错误' });
    }

    // 如果指定了gameId，验证游戏存在
    if (gameId) {
      const game = await prisma.game.findUnique({
        where: { id: parseInt(gameId) }
      });
      if (!game) {
        return res.status(404).json({ error: '游戏不存在' });
      }
    }

    const parsedGameId = gameId ? parseInt(gameId) : null;

    // 批量更新配置
    const results = await Promise.all(
      Object.entries(configs).map(async ([key, value]) => {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        
        return prisma.siteConfig.upsert({
          where: {
            gameId_key: {
              gameId: parsedGameId,
              key
            }
          },
          update: {
            value: stringValue
          },
          create: {
            gameId: parsedGameId,
            key,
            value: stringValue
          }
        });
      })
    );

    res.json({ message: '配置已更新', count: results.length });
  } catch (error) {
    console.error('更新配置失败:', error);
    res.status(500).json({ error: '更新配置失败' });
  }
});

// 设置单个配置（管理员）
router.put('/:key', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { value, gameId } = req.body;

    if (value === undefined) {
      return res.status(400).json({ error: '配置值不能为空' });
    }

    // 如果指定了gameId，验证游戏存在
    if (gameId) {
      const game = await prisma.game.findUnique({
        where: { id: parseInt(gameId) }
      });
      if (!game) {
        return res.status(404).json({ error: '游戏不存在' });
      }
    }

    const parsedGameId = gameId ? parseInt(gameId) : null;
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

    const config = await prisma.siteConfig.upsert({
      where: {
        gameId_key: {
          gameId: parsedGameId,
          key
        }
      },
      update: {
        value: stringValue
      },
      create: {
        gameId: parsedGameId,
        key,
        value: stringValue
      }
    });

    res.json(config);
  } catch (error) {
    console.error('更新配置失败:', error);
    res.status(500).json({ error: '更新配置失败' });
  }
});

// 删除配置（管理员）
router.delete('/:key', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { gameId } = req.query;

    const parsedGameId = gameId ? parseInt(gameId) : null;

    await prisma.siteConfig.delete({
      where: {
        gameId_key: {
          gameId: parsedGameId,
          key
        }
      }
    });

    res.json({ message: '配置已删除' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: '配置不存在' });
    }
    console.error('删除配置失败:', error);
    res.status(500).json({ error: '删除配置失败' });
  }
});

// 获取所有配置列表（管理员）
router.get('/admin/list', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const configs = await prisma.siteConfig.findMany({
      include: {
        game: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: [
        { gameId: 'asc' },
        { key: 'asc' }
      ]
    });

    res.json(configs);
  } catch (error) {
    console.error('获取配置列表失败:', error);
    res.status(500).json({ error: '获取配置列表失败' });
  }
});

module.exports = router;
