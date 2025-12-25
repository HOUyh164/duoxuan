const crypto = require('crypto');

/**
 * 生成卡密
 * 格式: DORA-XXXX-XXXX-XXXX-XXXX
 */
function generateCardKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = [];
  
  for (let i = 0; i < 4; i++) {
    let segment = '';
    for (let j = 0; j < 4; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(segment);
  }
  
  return 'DORA-' + segments.join('-');
}

/**
 * 批量生成唯一卡密
 * @param {number} count - 生成数量
 * @param {Set} existingKeys - 已存在的卡密集合
 * @returns {string[]} - 卡密数组
 */
function generateUniqueCardKeys(count, existingKeys = new Set()) {
  const keys = [];
  const allKeys = new Set(existingKeys);
  
  while (keys.length < count) {
    const key = generateCardKey();
    if (!allKeys.has(key)) {
      allKeys.add(key);
      keys.push(key);
    }
  }
  
  return keys;
}

module.exports = {
  generateCardKey,
  generateUniqueCardKeys
};


