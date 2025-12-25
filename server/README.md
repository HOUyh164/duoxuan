# DORA 後端系統

DORA 網站的後端 API 服務，提供用戶認證、卡密管理、訂單管理等功能。

## 技術棧

- **框架**: Express.js
- **資料庫**: SQLite (開發) / MySQL (生產)
- **ORM**: Prisma
- **認證**: JWT

## 快速開始

### 1. 安裝依賴

```bash
cd server
npm install
```

### 2. 初始化資料庫

```bash
# 生成 Prisma 客戶端
npx prisma generate

# 創建資料庫表
npx prisma db push
```

### 3. 創建管理員帳號

首次啟動後，需要手動創建管理員帳號。先註冊一個普通帳號，然後使用 Prisma Studio 修改角色：

```bash
npx prisma studio
```

在 User 表中，將目標用戶的 `role` 欄位改為 `admin`。

### 4. 啟動服務

```bash
# 開發模式
npm run dev

# 生產模式
npm start
```

服務將在 http://localhost:3000 啟動。

## 環境變數

編輯 `.env` 文件：

```env
# 資料庫連接
DATABASE_URL="file:./dev.db"

# JWT 密鑰 (生產環境請更換)
JWT_SECRET="your-secret-key-here"

# 服務端口
PORT=3000

# 環境
NODE_ENV=development
```

## API 端點

### 認證 API

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/api/auth/register` | 用戶註冊 |
| POST | `/api/auth/login` | 用戶登入 |
| GET | `/api/auth/me` | 獲取當前用戶信息 |

### 卡密 API (管理員)

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/cards` | 獲取卡密列表 |
| POST | `/api/cards/generate` | 批量生成卡密 |
| DELETE | `/api/cards/:id` | 刪除卡密 |
| POST | `/api/cards/verify` | 驗證卡密 |
| POST | `/api/cards/redeem` | 兌換卡密 |

### 訂單 API

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/orders` | 獲取訂單列表 |
| POST | `/api/orders` | 創建訂單 |
| GET | `/api/orders/:id` | 獲取訂單詳情 |
| PUT | `/api/orders/:id` | 更新訂單狀態 (管理員) |

### 管理 API (管理員)

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/admin/stats` | 獲取統計數據 |
| GET | `/api/admin/users` | 獲取用戶列表 |
| PUT | `/api/admin/users/:id/role` | 更新用戶角色 |

## 目錄結構

```
server/
├── src/
│   ├── index.js          # 入口文件
│   ├── config/           # 配置
│   ├── routes/           # API 路由
│   │   ├── auth.js       # 認證
│   │   ├── cards.js      # 卡密
│   │   ├── orders.js     # 訂單
│   │   └── admin.js      # 管理
│   ├── middleware/       # 中間件
│   │   └── auth.js       # 認證中間件
│   └── utils/            # 工具函數
│       └── cardGenerator.js
├── prisma/
│   └── schema.prisma     # 資料庫模型
├── .env                  # 環境變數
└── package.json
```

## 部署

### 使用 PM2

```bash
# 安裝 PM2
npm install -g pm2

# 啟動服務
pm2 start src/index.js --name dora-server

# 查看狀態
pm2 status

# 查看日誌
pm2 logs dora-server
```

### 生產環境注意事項

1. 更換 `JWT_SECRET` 為隨機字符串
2. 如需使用 MySQL，修改 `DATABASE_URL` 並更新 `prisma/schema.prisma` 中的 provider
3. 配置 HTTPS (使用 Nginx 反向代理)
4. 設置防火牆規則

## 訪問管理後台

啟動服務後，訪問 http://localhost:3000/admin 進入管理後台。

使用管理員帳號登入即可管理卡密、訂單和用戶。


