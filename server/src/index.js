const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const config = require('./config');

// Import routes
const authRoutes = require('./routes/auth');
const cardRoutes = require('./routes/cards');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const gameRoutes = require('./routes/games');
const productRoutes = require('./routes/products');
const configRoutes = require('./routes/config');

const app = express();
const prisma = new PrismaClient();

// 启动时自动创建管理员账户
async function initializeAdmin() {
  try {
    // 硬编码的管理员账户
    const ADMIN_EMAIL = 'dora@gmail.com';
    const ADMIN_PASSWORD = 'doraai';
    
    // 检查是否已有管理员
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'admin' }
    });
    
    if (existingAdmin) {
      console.log('✅ 管理员账户已存在:', existingAdmin.email);
      return;
    }
    
    // 检查该邮箱是否存在
    const existingUser = await prisma.user.findUnique({
      where: { email: ADMIN_EMAIL }
    });
    
    if (existingUser) {
      // 升级为管理员
      await prisma.user.update({
        where: { email: ADMIN_EMAIL },
        data: { role: 'admin' }
      });
      console.log('✅ 已将用户升级为管理员:', ADMIN_EMAIL);
    } else {
      // 创建新管理员
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      await prisma.user.create({
        data: {
          email: ADMIN_EMAIL,
          password: hashedPassword,
          role: 'admin'
        }
      });
      console.log('✅ 管理员账户已创建');
      console.log('📧 邮箱:', ADMIN_EMAIL);
      console.log('🔑 密码:', ADMIN_PASSWORD);
    }
  } catch (error) {
    console.error('❌ 初始化管理员失败:', error.message);
  }
}

// 启动时初始化
initializeAdmin();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (website)
app.use(express.static(path.join(__dirname, '../../website')));

// Serve admin panel
app.use('/admin', express.static(path.join(__dirname, '../../admin')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/products', productRoutes);
app.use('/api/config', configRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: '服务器内部错误',
    message: config.nodeEnv === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(config.port, '0.0.0.0', () => {
  console.log(`🚀 DORA Server running on http://0.0.0.0:${config.port}`);
  console.log(`📊 Admin panel: http://0.0.0.0:${config.port}/admin`);
  console.log(`✅ External access: http://149.88.76.104:${config.port}`);
});


