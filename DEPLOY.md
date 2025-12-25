# DORA 服务器部署指南

服务器 IP: `149.88.76.104`

## 一、服务器环境准备

### 1. 安装 Node.js (v18+)

```bash
# 使用 NodeSource 安装
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node -v
npm -v
```

### 2. 安装 PM2 (进程管理)

```bash
sudo npm install -g pm2
```

### 3. 安装 Nginx

```bash
sudo apt update
sudo apt install nginx -y
sudo systemctl enable nginx
```

---

## 二、上传项目文件

### 方式一：使用 SCP 上传

在本地电脑执行：

```bash
# 压缩项目（排除 node_modules）
# Windows PowerShell:
Compress-Archive -Path admin, server, website, nginx.conf -DestinationPath dora.zip

# 上传到服务器
scp dora.zip root@149.88.76.104:/var/www/
```

在服务器上解压：

```bash
cd /var/www
unzip dora.zip -d dora
cd dora
```

### 方式二：使用 Git

```bash
# 在服务器上
cd /var/www
git clone <你的仓库地址> dora
cd dora
```

---

## 三、配置项目

### 1. 进入项目目录

```bash
cd /var/www/dora/server
```

### 2. 安装依赖

```bash
npm install --production
```

### 3. 配置环境变量

```bash
# 复制配置文件
cp env.production.example .env

# 编辑配置 (重要：修改 JWT_SECRET!)
nano .env
```

**修改 .env 文件：**

```
DATABASE_URL="file:./prod.db"
JWT_SECRET="生成一个随机密钥"
PORT=3000
NODE_ENV=production
```

生成随机密钥：

```bash
openssl rand -base64 32
```

### 4. 初始化数据库

```bash
npx prisma generate
npx prisma db push
```

### 5. 创建日志目录

```bash
mkdir -p logs
```

---

## 四、启动服务

### 使用 PM2 启动

```bash
# 启动服务
pm2 start ecosystem.config.js --env production

# 保存 PM2 进程列表（开机自启）
pm2 save
pm2 startup
```

### PM2 常用命令

```bash
pm2 status          # 查看状态
pm2 logs            # 查看日志
pm2 restart all     # 重启
pm2 stop all        # 停止
pm2 delete all      # 删除
```

---

## 五、配置 Nginx

### 1. 复制配置文件

```bash
sudo cp /var/www/dora/nginx.conf /etc/nginx/sites-available/dora
```

### 2. 创建软链接

```bash
sudo ln -s /etc/nginx/sites-available/dora /etc/nginx/sites-enabled/
```

### 3. 删除默认配置（可选）

```bash
sudo rm /etc/nginx/sites-enabled/default
```

### 4. 测试并重启 Nginx

```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

## 六、防火墙配置

```bash
# 允许 HTTP
sudo ufw allow 80

# 允许 HTTPS（如果配置 SSL）
sudo ufw allow 443

# 允许 SSH
sudo ufw allow 22

# 启用防火墙
sudo ufw enable
```

---

## 七、创建管理员账户

项目启动后，访问网站注册一个账户，然后在服务器上手动设置为管理员：

```bash
cd /var/www/dora/server

# 打开 Prisma Studio
npx prisma studio
```

在浏览器中打开 http://149.88.76.104:5555，找到 User 表，将你的账户的 `role` 改为 `admin`。

或者使用命令行：

```bash
# 进入 SQLite
sqlite3 prod.db

# 更新用户角色
UPDATE User SET role = 'admin' WHERE email = '你的邮箱';

# 退出
.exit
```

---

## 八、访问网站

- **主网站**: http://149.88.76.104
- **管理后台**: http://149.88.76.104/admin

---

## 九、常见问题

### 1. 端口被占用

```bash
# 查看端口占用
sudo lsof -i :3000
# 杀死进程
sudo kill -9 <PID>
```

### 2. 权限问题

```bash
# 修改目录权限
sudo chown -R $USER:$USER /var/www/dora
```

### 3. 查看错误日志

```bash
# PM2 日志
pm2 logs dora-server

# Nginx 日志
sudo tail -f /var/log/nginx/error.log
```

### 4. 数据库备份

```bash
# 备份
cp /var/www/dora/server/prod.db /var/www/dora/server/prod.db.backup

# 恢复
cp /var/www/dora/server/prod.db.backup /var/www/dora/server/prod.db
pm2 restart all
```

---

## 十、可选：配置域名和 HTTPS

如果有域名，可以使用 Let's Encrypt 免费证书：

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取证书（替换为你的域名）
sudo certbot --nginx -d your-domain.com

# 自动续期测试
sudo certbot renew --dry-run
```

---

## 快速部署命令（汇总）

```bash
# 在服务器上一键执行
cd /var/www/dora/server
npm install --production
cp env.production.example .env
# 手动编辑 .env 修改 JWT_SECRET
npx prisma generate
npx prisma db push
mkdir -p logs
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# 配置 Nginx
sudo cp /var/www/dora/nginx.conf /etc/nginx/sites-available/dora
sudo ln -s /etc/nginx/sites-available/dora /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
```


