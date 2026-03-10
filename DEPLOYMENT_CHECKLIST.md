# 🚀 Deployment Checklist

## Pre-Deployment ✅

- [x] Fixed Procfile with correct module path
- [x] Created render.yaml configuration
- [x] Enhanced database.py for PostgreSQL
- [x] Created startup script (start.sh)
- [x] Added .env.example
- [x] Updated documentation

## Render Setup Steps

### 1. Database Setup
- [ ] Create PostgreSQL database on Render
- [ ] Copy Internal Database URL
- [ ] Note down database credentials

### 2. Web Service Setup
- [ ] Create new Web Service
- [ ] Connect GitHub repository
- [ ] Set Build Command: `pip install -r requirements.txt`
- [ ] Set Start Command: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
- [ ] Select Python 3.11.9

### 3. Environment Variables
- [ ] DATABASE_URL (from step 1)
- [ ] SECRET_KEY (generate with: `python -c "import secrets; print(secrets.token_urlsafe(32))"`)
- [ ] FRONTEND_URL (your frontend URL)
- [ ] ALGORITHM=HS256
- [ ] ACCESS_TOKEN_EXPIRE_MINUTES=30
- [ ] REFRESH_TOKEN_EXPIRE_DAYS=7

### 4. Deploy
- [ ] Click "Create Web Service"
- [ ] Wait for build to complete
- [ ] Check logs for any errors

## Post-Deployment Verification

- [ ] Visit: `https://your-app.onrender.com/`
- [ ] Check health: `https://your-app.onrender.com/health`
- [ ] View API docs: `https://your-app.onrender.com/docs`
- [ ] Test authentication endpoints
- [ ] Verify database connection

## Common Issues & Solutions

### Issue: Build fails with module not found
**Solution**: Ensure Procfile uses `uvicorn backend.app.main:app`

### Issue: Database connection error
**Solution**: 
- Use Internal Database URL (not External)
- Ensure DATABASE_URL starts with `postgresql://`
- Check database is in same region

### Issue: Application crashes on startup
**Solution**:
- Check Render logs
- Verify all environment variables are set
- Ensure SECRET_KEY is set

## Quick Commands

Generate SECRET_KEY:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Test locally with PostgreSQL:
```bash
export DATABASE_URL="postgresql://user:pass@localhost/tennis_academy"
export SECRET_KEY="your-secret-key"
uvicorn backend.app.main:app --reload
```

## Support Resources

- Render Docs: https://render.com/docs
- Deployment Guide: See DEPLOYMENT.md
- Fixes Applied: See FIXES.md

---

**Status**: Ready for deployment! 🎾
