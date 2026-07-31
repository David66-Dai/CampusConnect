# CampusConnect

Campus community platform for high-school and college students — discover events, find study partners, build teams, and trade campus resources.

> 中文说明见 [README.zh-CN.md](./README.zh-CN.md)

## Stack

| Layer | Tech |
| --- | --- |
| Frontend | Next.js 14 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · React Query · Axios · React Hook Form · Zod |
| Backend | Python FastAPI · SQLAlchemy 2.0 · Alembic · Pydantic v2 · JWT |
| Database | PostgreSQL |
| Media | Cloudinary (optional) |
| Email | SMTP (optional in development; required for production password reset / email change) |

## Features

- Auth: register, login, “stay signed in 30 days”, forgot / reset password, change email
- Dashboard: XP / level, partner suggestions, upcoming events
- Events: create, join, manage, filter by category
- Connect: interest / skill / goal matching + messaging
- Marketplace: list, edit, mark sold, image upload
- Community: posts, comments, likes
- Settings: theme, font size, Chinese / English
- Profile & public user pages

## Project layout

```
CampusConnect/
├── frontend/                 # Next.js app
│   └── src/
│       ├── app/              # Routes (App Router)
│       ├── components/       # Shared UI (incl. shadcn)
│       ├── features/         # Domain UI modules
│       ├── hooks/            # Auth, i18n, preferences
│       ├── i18n/             # Message catalogs
│       ├── lib/              # Axios client, helpers
│       ├── services/         # API calls
│       └── types/            # TypeScript types
└── backend/                  # FastAPI app
    ├── alembic/              # DB migrations
    └── app/
        ├── api/              # Routers
        ├── core/             # Settings, JWT, deps
        ├── models/           # SQLAlchemy models
        ├── schemas/          # Pydantic schemas
        ├── services/         # Business logic + email / upload
        └── database/         # Engine & session
```

## Quick start

### 1. PostgreSQL

```sql
CREATE DATABASE campusconnect;
```

### 2. Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

Copy-Item .env.example .env
# Edit DATABASE_URL, SECRET_KEY, CORS_ORIGINS, …

alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Swagger (dev only): http://localhost:8000/docs  
- Health: http://localhost:8000/api/health  

### 3. Frontend

```powershell
cd frontend
npm install
Copy-Item .env.example .env.local
npm run dev -- -H 0.0.0.0 -p 3000
```

Open http://localhost:3000

If you are already logged in (token in storage), `/` redirects to `/dashboard`.

## Environment variables

### Backend (`backend/.env`)

| Variable | Purpose |
| --- | --- |
| `ENVIRONMENT` | `development` or `production` |
| `SECRET_KEY` | JWT signing key — **never** keep the sample value in production |
| `DATABASE_URL` | SQLAlchemy URL |
| `CORS_ORIGINS` | Comma-separated frontend origins |
| `FRONTEND_URL` | Used in password-reset email links |
| `SMTP_*` | Email delivery (see below) |
| `CLOUDINARY_*` | Image uploads (optional) |

### Frontend (`frontend/.env.local`)

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | API root, e.g. `http://localhost:8000/api` |
| `NEXT_PUBLIC_CAMPUS_NAME` | Campus name written on register (default「本校」) |

## Email (SMTP) setup

Password reset and email-change codes are sent through SMTP.

### Local development (no SMTP)

Leave `SMTP_HOST` / `SMTP_USERNAME` / `SMTP_PASSWORD` empty.

- Forgot password: API response includes `reset_url` (development only)
- Change email: API response includes `dev_code` (development only)

### Production / real mail (163 example)

```env
FRONTEND_URL=https://your-frontend.example.com
SMTP_HOST=smtp.163.com
SMTP_PORT=465
SMTP_USERNAME=you@163.com
SMTP_PASSWORD=your-authorization-code
SMTP_FROM=CampusConnect <you@163.com>
SMTP_USE_TLS=false
SMTP_USE_SSL=true
```

1. Open 163 mail → Settings → POP3/SMTP/IMAP → enable SMTP → get an **authorization code** (not the login password)
2. Fill `SMTP_USERNAME` / `SMTP_PASSWORD` / `SMTP_FROM`
3. Restart uvicorn
4. Test Forgot password / Change email

QQ Mail (`smtp.qq.com`, port 465 + SSL) works the same way. Gmail often breaks behind Clash Fake-IP in CN networks.

> Port **465** → SSL (`SMTP_USE_SSL=true`, `SMTP_USE_TLS=false`); port **587** → STARTTLS (the opposite).

## LAN testing

1. Find your PC IPv4 (`ipconfig`)
2. Backend: `CORS_ORIGINS=http://localhost:3000,http://YOUR_IP:3000`
3. Frontend: `NEXT_PUBLIC_API_URL=http://YOUR_IP:8000/api`
4. Run with `--host 0.0.0.0` / `-H 0.0.0.0`
5. Allow inbound TCP **3000** and **8000** in the firewall
6. Friends open `http://YOUR_IP:3000`

## API response shape

```json
{ "success": true, "data": {}, "message": "" }
```

## Security notes

- Replace `SECRET_KEY` before any shared / production deploy
- Set `ENVIRONMENT=production` to hide Swagger and stop returning `reset_url` / `dev_code`
- Keep `backend/.env` out of git; rotate Cloudinary keys if they were ever shared
- JWT lives in `localStorage` / `sessionStorage` (XSS-sensitive) — keep dependencies updated
- Event / product / message writes are ownership-checked; recommended partners no longer expose emails

## License

Private / school project — adjust as needed.
