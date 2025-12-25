# DORA Render 部署指南

## 📋 部署前准备

### 1. 创建 GitHub 仓库

将项目推送到 GitHub：

```bash
cd vlore
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/你的用户名/dora.git
git push -u origin main
```

### 2. 注册 Render

1. 访问 [render.com](https://render.com)
2. 使用 GitHub 账号登录

---

## 🚀 部署步骤

### Step 1: 创建 Web Service

1. 登录 Render Dashboard
2. 点击 **"New +"** → **"Web Service"**
3. 选择 **"Build and deploy from a Git repository"**
4. 连接 GitHub 并选择你的仓库

### Step 2: 配置服务

| 配置项 | 值 |
|--------|-----|
| **Name** | `dora-server` |
| **Region** | `Singapore` (或离你最近的) |
| **Branch** | `main` |
| **Root Directory** | `vlore/server` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

### Step 3: 添加环境变量

点击 **"Advanced"** → **"Add Environment Variable"**：

| Key | Value |
|-----|-------|
| `DATABASE_URL` | `file:./prod.db` |
| `JWT_SECRET` | `(点击 Generate 自动生成)` |
| `NODE_ENV` | `production` |
| `PORT` | `10000` |

### Step 4: 部署

点击 **"Create Web Service"**，Render 会自动开始部署。

---

## 🌐 访问你的网站

部署完成后，Render 会提供一个免费域名：
- 格式：`https://dora-server-xxxx.onrender.com`
- 在 Dashboard 的服务页面可以找到

**访问地址：**
- 主网站：`https://你的域名.onrender.com`
- 管理后台：`https://你的域名.onrender.com/admin`
- API 健康检查：`https://你的域名.onrender.com/api/health`

---

## ⚠️ 免费层注意事项

### 1. 休眠机制

免费服务会在 **15分钟无访问后休眠**：
- 首次访问需等待 30-60 秒启动
- 这是免费层的正常行为

**解决方案：**
- 使用 [UptimeRobot](https://uptimerobot.com) 每5分钟 ping 一次保持唤醒
- 或升级到 Starter Plan ($7/月)

### 2. 数据持久化

⚠️ **重要**：免费层的 SQLite 数据在重新部署后会丢失！

**解决方案：**
1. 升级到付费版添加持久化磁盘
2. 或改用 Render 的免费 PostgreSQL（见下方）

---

## 🐘 可选：使用 PostgreSQL（推荐生产环境）

如果担心数据丢失，可以改用 Render 免费提供的 PostgreSQL：

### Step 1: 创建数据库

1. 在 Render Dashboard 点击 **"New +"** → **"PostgreSQL"**
2. 选择 **Free** plan
3. 点击 **"Create Database"**

### Step 2: 修改项目代码

需要修改 `prisma/schema.prisma`：

```prisma
datasource db {
  provider = "postgresql"  // 改为 postgresql
  url      = env("DATABASE_URL")
}
```

### Step 3: 更新环境变量

将 Web Service 的 `DATABASE_URL` 改为 PostgreSQL 的连接字符串（在数据库页面复制 "Internal Database URL"）

### Step 4: 重新部署

```bash
git add .
git commit -m "Switch to PostgreSQL"
git push
```

---

## 🔧 常用操作

### 查看日志

在 Render Dashboard → 你的服务 → **"Logs"** 标签

### 手动重新部署

点击 **"Manual Deploy"** → **"Deploy latest commit"**

### 添加自定义域名

1. 进入服务设置
2. 找到 **"Custom Domains"**
3. 添加你的域名
4. 按提示配置 DNS

---

## 💰 Render 定价

| Plan | 价格 | 特点 |
|------|------|------|
| **Free** | $0 | 750小时/月，休眠机制，无持久化 |
| **Starter** | $7/月 | 无休眠，持久化磁盘可选 |
| **Standard** | $25/月 | 更高性能 |

---

## ❓ 常见问题

### Q: 网站加载很慢？
免费层休眠后首次访问需要启动时间，这是正常的。

### Q: 数据丢失了？
免费层不保证数据持久化，建议升级或改用 PostgreSQL。

### Q: 部署失败？
1. 检查 Build Logs
2. 确保 Root Directory 设置正确
3. 确保 package.json 中有 start 脚本

### Q: 如何查看错误？
在 Logs 页面查看实时日志

---

## 🔗 有用链接

- [Render 文档](https://render.com/docs)
- [Render Node.js 部署指南](https://render.com/docs/deploy-node-express-app)
- [Render 定价](https://render.com/pricing)
