# CampusConnect

面向高中生与大学生的校园社区平台 —— 发现活动、匹配伙伴、组建团队、交换校园资源。

> English docs (primary): [README.md](./README.md)

## 技术栈

| 层 | 技术 |
| --- | --- |
| 前端 | Next.js 14 (App Router) · TypeScript · Tailwind · shadcn/ui · React Query · Axios · RHF · Zod |
| 后端 | FastAPI · SQLAlchemy 2 · Alembic · Pydantic v2 · JWT |
| 数据库 | PostgreSQL |
| 图片 | Cloudinary（可选） |
| 邮件 | SMTP（开发可空；生产忘记密码 / 改邮箱需配置） |

## 功能概览

- 认证：注册登录、「保持登录 30 天」、忘记/重置密码、更改邮箱
- 主页：XP/等级、推荐伙伴、近期活动
- 活动：创建、报名、管理、分类筛选
- 伙伴匹配 + 站内私信
- 二手市场：发布、编辑、卖掉、图片
- 社区：发帖、评论、点赞
- 设置：主题、字号、中/英
- 个人资料与他人主页

## 目录结构

见英文 README 中的 Project layout。

## 快速开始

### 1. 数据库

```sql
CREATE DATABASE campusconnect;
```

### 2. 后端

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
# 修改 DATABASE_URL、SECRET_KEY、CORS_ORIGINS 等
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- 开发文档：http://localhost:8000/docs  
- 健康检查：http://localhost:8000/api/health  

### 3. 前端

```powershell
cd frontend
npm install
Copy-Item .env.example .env.local
npm run dev -- -H 0.0.0.0 -p 3000
```

访问 http://localhost:3000（已登录会自动进入 `/dashboard`）。

## 邮箱服务配置（SMTP）

忘记密码与更改邮箱验证码通过 SMTP 发送。

### 本地开发（可不配邮件）

`SMTP_HOST` / `SMTP_USERNAME` / `SMTP_PASSWORD` 留空即可：

- 忘记密码：接口在开发环境会返回 `reset_url`
- 更改邮箱：接口在开发环境会返回 `dev_code`

### 正式发信（163 邮箱）

在 `backend/.env` 中配置：

```env
FRONTEND_URL=http://localhost:3000
SMTP_HOST=smtp.163.com
SMTP_PORT=465
SMTP_USERNAME=you@163.com
SMTP_PASSWORD=授权码
SMTP_FROM=CampusConnect <you@163.com>
SMTP_USE_TLS=false
SMTP_USE_SSL=true
```

**163 步骤：**

1. 登录 [163 邮箱](https://mail.163.com) → 设置 → POP3/SMTP/IMAP  
2. 开启 SMTP，按提示获取 **授权码**（不是登录密码）  
3. 把真实邮箱和授权码填进 `.env`（替换占位符）  
4. **重启** uvicorn 后再测「忘记密码」  

也可使用 QQ 邮箱（`smtp.qq.com`，同样 465 + SSL + 授权码）。

> 端口 **465** 用 SSL（`SMTP_USE_SSL=true`，`SMTP_USE_TLS=false`）；**587** 用 STARTTLS（反之）。

## 局域网联调

1. `ipconfig` 查看本机 IP  
2. 后端：`CORS_ORIGINS=http://localhost:3000,http://你的IP:3000`  
3. 前端：`NEXT_PUBLIC_API_URL=http://你的IP:8000/api`  
4. 前后端绑定 `0.0.0.0`，防火墙放行 3000 / 8000  
5. 同学访问 `http://你的IP:3000`  

## 安全提示

- 生产务必更换 `SECRET_KEY`，并设 `ENVIRONMENT=production`  
- 不要把 `backend/.env` 提交到 Git；Cloudinary 密钥若曾泄露请到控制台轮换  
- JWT 存在浏览器 Storage，注意防范 XSS  
- 生产环境不开放 `/docs`，也不再 API 回传重置链接 / 验证码  

## API 统一响应

```json
{ "success": true, "data": {}, "message": "" }
```
