const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');

// Import routes
const authRoutes = require('./routes/auth');
const cardRoutes = require('./routes/cards');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');

const app = express();

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


