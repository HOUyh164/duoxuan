require('dotenv').config();

module.exports = {
  port: process.env.PORT || 8080,
  jwtSecret: process.env.JWT_SECRET || 'default-secret',
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // 方案定价 (NT$)
  pricing: {
    day: 120,     // 日卡
    week: 0,      // 即将推出
    month: 1400,
    lifetime: 8000
  },
  
  // 方案天数
  planDays: {
    day: 1,
    week: 7,
    month: 30,
    lifetime: 36500 // ~100年
  }
};


