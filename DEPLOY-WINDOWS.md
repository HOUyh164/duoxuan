# DORA Windows 服务器部署指南

服务器 IP: `149.88.76.104`

## 一、服务器环境准备

### 1. 安装 Node.js

下载并安装 Node.js LTS 版本：
https://nodejs.org/en/download/

安装完成后，打开 PowerShell 验证：

```powershell
node -v
npm -v
```

### 2. 安装 PM2 (进程管理)

```powershell
npm install -g pm2
npm install -g pm2-windows-startup
```

---

## 二、上传项目文件

### 方式一：直接复制

1. 在服务器上创建目录：`C:\dora`
2. 将以下文件夹复制到服务器：
   - `admin\`
   - `server\`
   - `website\`

### 方式二：远程桌面

1. 使用远程桌面连接到 `149.88.76.104`
2. 复制项目文件到 `C:\dora`

### 方式三：使用 SCP

在本地 PowerShell：

```powershell
# 压缩项目
cd C:\Users\Administrator\Desktop\vlore
Compress-Archive -Path admin, server, website -DestinationPath dora.zip -Force

# 上传 (需要安装 OpenSSH)
scp dora.zip administrator@149.88.76.104:C:\
```

---

## 三、配置项目

### 1. 打开 PowerShell (以管理员身份)

```powershell
cd C:\dora\server
```

### 2. 安装依赖

```powershell
npm install
```

### 3. 配置环境变量

复制配置文件：

```powershell
Copy-Item env.production.example .env
```

编辑 `.env` 文件（用记事本或 VS Code）：

```
DATABASE_URL="file:./prod.db"
JWT_SECRET="这里填入一个随机字符串"
PORT=3000
NODE_ENV=production
```

生成随机密钥（在 PowerShell 中）：

```powershell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

### 4. 初始化数据库

```powershell
npx prisma generate
npx prisma db push
```

### 5. 创建日志目录

```powershell
New-Item -ItemType Directory -Force -Path logs
```

---

## 四、启动服务

### 方式一：使用 PM2（推荐）

```powershell
# 启动服务
pm2 start ecosystem.config.js --env production

# 查看状态
pm2 status

# 查看日志
pm2 logs

# 设置开机自启
pm2 save
pm2-startup install
```

### 方式二：直接运行（测试用）

```powershell
npm start
```

---

## 五、配置 Windows 防火墙

### 方式一：PowerShell 命令

```powershell
# 允许 3000 端口入站
New-NetFirewallRule -DisplayName "DORA Server" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow

# 如果要用 80 端口
New-NetFirewallRule -DisplayName "HTTP" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow
```

### 方式二：图形界面

1. 打开 "Windows Defender 防火墙"
2. 点击 "高级设置"
3. 点击 "入站规则" → "新建规则"
4. 选择 "端口" → TCP → 特定端口 `8080`
5. 选择 "允许连接"
6. 命名为 "DORA Server"

---

## 六、配置端口转发（80 → 3000）

如果想通过 80 端口访问（不用输入 :3000），有两种方法：

### 方式一：修改 Node.js 端口

编辑 `.env` 文件，将端口改为 80：

```
PORT=80
```

然后重启服务：

```powershell
pm2 restart all
```

### 方式二：使用 IIS 反向代理

1. 安装 IIS：
   - 打开 "服务器管理器"
   - 添加角色 → Web 服务器 (IIS)

2. 安装 URL Rewrite 和 ARR：
   - 下载：https://www.iis.net/downloads/microsoft/url-rewrite
   - 下载：https://www.iis.net/downloads/microsoft/application-request-routing

3. 配置反向代理（较复杂，建议直接用方式一）

---

## 七、创建管理员账户

1. 访问 http://149.88.76.104:8080 注册一个账户

2. 打开 Prisma Studio：

```powershell
cd C:\dora\server
npx prisma studio
```

3. 在浏览器中打开 http://localhost:5555
4. 找到 User 表，将你的账户的 `role` 改为 `admin`
5. 点击 "Save 1 change"

---

## 八、访问网站

- **主网站**: http://149.88.76.104:8080
- **管理后台**: http://149.88.76.104:8080/admin

如果配置了 80 端口：
- **主网站**: http://149.88.76.104
- **管理后台**: http://149.88.76.104/admin

---

## 九、常用命令

### PM2 管理

```powershell
pm2 status          # 查看状态
pm2 logs            # 查看日志
pm2 restart all     # 重启服务
pm2 stop all        # 停止服务
pm2 delete all      # 删除服务
```

### 更新代码后

```powershell
cd C:\dora\server
pm2 restart all
```

---

## 十、常见问题

### 1. 端口被占用

```powershell
# 查看端口占用
netstat -ano | findstr :8080

# 杀死进程
taskkill /PID <进程ID> /F
```

### 2. PM2 开机自启不生效

```powershell
pm2 save
pm2-startup install
```

### 3. 数据库备份

```powershell
Copy-Item C:\dora\server\prod.db C:\dora\server\prod.db.backup
```

### 4. 查看错误日志

```powershell
Get-Content C:\dora\server\logs\error.log -Tail 50
```

---

## 快速部署命令汇总

在服务器 PowerShell (管理员) 中执行：

```powershell
# 1. 进入目录
cd C:\dora\server

# 2. 安装依赖
npm install

# 3. 复制配置文件
Copy-Item env.production.example .env
# 手动编辑 .env，修改 JWT_SECRET

# 4. 初始化数据库
npx prisma generate
npx prisma db push

# 5. 创建日志目录
New-Item -ItemType Directory -Force -Path logs

# 6. 启动服务
pm2 start ecosystem.config.js --env production
pm2 save
pm2-startup install

# 7. 开放防火墙
New-NetFirewallRule -DisplayName "DORA Server" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow
```


