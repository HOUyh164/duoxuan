# DORA Railway 部署指南

## 📋 部署前准备

### 1. 创建 GitHub 仓库

将项目推送到 GitHub（Railway 需要从 Git 仓库部署）：

```bash
cd vlore
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/你的用户名/dora.git
git push -u origin main
```

### 2. 注册 Railway

1. 访问 [railway.app](https://railway.app)
2. 使用 GitHub 账号登录
3. 验证邮箱

---

## 🚀 部署步骤

### Step 1: 创建新项目

1. 登录 Railway Dashboard
2. 点击 **"New Project"**
3. 选择 **"Deploy from GitHub repo"**
4. 授权 Railway 访问你的 GitHub
5. 选择 `dora` 仓库

### Step 2: 配置根目录

由于项目结构是 `vlore/server`，需要设置：

1. 点击刚创建的服务
2. 进入 **Settings** 标签
3. 找到 **Root Directory**
4. 设置为：`vlore/server`

### Step 3: 配置环境变量

在 **Variables** 标签中添加以下变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `DATABASE_URL` | `file:/app/data/prod.db` | SQLite 数据库路径 |
| `JWT_SECRET` | `(随机生成的密钥)` | JWT 签名密钥 |
| `NODE_ENV` | `production` | 运行环境 |
| `PORT` | `8080` | 服务端口 |

**生成 JWT_SECRET：**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Step 4: 添加持久化卷（重要！）

⚠️ **SQLite 数据库必须使用持久化卷，否则重启后数据会丢失！**

1. 在服务页面，点击 **"+ New"** → **"Volume"**
2. 设置 **Mount Path** 为：`/app/data`
3. 点击 **"Create Volume"**

### Step 5: 部署

Railway 会自动开始部署。部署过程：
1. 拉取代码
2. 安装依赖 (`npm install`)
3. 执行 build (`npm run build` - 生成 Prisma Client)
4. 启动服务 (`npm start`)

### Step 6: 配置域名

1. 在服务页面，点击 **Settings**
2. 找到 **Networking** → **Generate Domain**
3. Railway 会生成类似 `dora-xxx.railway.app` 的域名

**绑定自定义域名：**
1. 点击 **"Custom Domain"**
2. 输入你的域名（如 `dora.yourdomain.com`）
3. 按提示在你的 DNS 服务商添加 CNAME 记录

---

## 🌐 购买域名 (推荐 Cloudflare)

### 1. 注册 Cloudflare 账号
访问 [cloudflare.com](https://www.cloudflare.com) 注册

### 2. 购买域名
1. 进入 **Domain Registration** → **Register Domains**
2. 搜索你想要的域名
3. 选择并购买（.com 约 $9/年）

### 3. 配置 DNS
1. 进入域名的 DNS 设置
2. 添加 CNAME 记录：
   - Name: `@` 或 `www`
   - Target: Railway 提供的域名

### 4. 启用 HTTPS
Cloudflare 自动提供免费 SSL 证书

---

## 💳 关于第三方金流对接

Railway 完全支持第三方金流（如 Stripe、绿界 ECPay、蓝新 NewebPay 等）：

✅ **支持的功能：**
- HTTPS 加密（金流必需）
- 自定义域名
- Webhook 回调接收
- 稳定的服务运行时间

**配置金流回调 URL：**
```
https://你的域名.railway.app/api/payment/callback
或
https://你的自定义域名.com/api/payment/callback
```

---

## 📝 常用命令

### 查看日志
在 Railway Dashboard 的 **Deployments** 标签查看

### 重新部署
```bash
git add .
git commit -m "Update"
git push
```
Railway 会自动重新部署

### 手动触发部署
在 Railway Dashboard 点击 **"Redeploy"**

---

## 💰 费用说明

Railway 定价：
- **Hobby Plan**: $5/月（包含 $5 使用额度）
- **按用量计费**: 
  - CPU: $0.000463/分钟/vCPU
  - 内存: $0.000231/分钟/GB
  - 出站流量: $0.10/GB

小型项目（如 DORA）每月费用约 $3-8

---

## ❓ 常见问题

### Q: 数据库数据丢失了？
确保已配置持久化卷，Mount Path 为 `/app/data`

### Q: 部署失败？
1. 检查 `railway.json` 配置
2. 查看 Build Logs
3. 确保 Root Directory 设置正确

### Q: 网站无法访问？
1. 检查是否生成了域名
2. 查看 Deploy Logs 是否有错误
3. 访问 `/api/health` 检查服务状态

---

## 🔗 有用链接

- [Railway 文档](https://docs.railway.app/)
- [Railway 定价](https://railway.app/pricing)
- [Cloudflare 域名注册](https://www.cloudflare.com/products/registrar/)
- [Prisma 文档](https://www.prisma.io/docs)
