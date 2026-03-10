# 🎯 Render Configuration - Quick Reference

## Web Service Settings

```
Name: tennis-academy-backend
Environment: Python 3
Region: Choose closest to your users
Branch: master (or main)
```

## Build & Deploy

```
Build Command:
pip install -r requirements.txt

Start Command:
uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT

Root Directory:
(leave empty - use repository root)
```

## Environment Variables

Copy and paste these, then fill in the values:

```
DATABASE_URL=
SECRET_KEY=
FRONTEND_URL=https://your-frontend.vercel.app
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
ADMIN_EMAIL=admin@tenniscourt.com
ADMIN_PASSWORD=admin123
```

## Database Settings

```
Name: tennis-academy-db
Database Name: tennis_academy
User: tennis_user
Region: Same as web service
Plan: Free (or Starter)
```

## Important URLs After Deployment

```
Application: https://your-app-name.onrender.com
Health Check: https://your-app-name.onrender.com/health
API Docs: https://your-app-name.onrender.com/docs
```

## Generate SECRET_KEY

Run this command locally:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copy the output and use it as your SECRET_KEY.

## Database URL Format

Render provides this automatically, but it should look like:
```
postgresql://user:password@host.region.render.com/database_name
```

Use the **Internal Database URL** from your Render PostgreSQL dashboard.

---

**That's it!** Your app should deploy successfully with these settings. 🚀
