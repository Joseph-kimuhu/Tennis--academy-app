# Deployment Guide for EPIC TENNIS ACADEMY App

## Render Deployment

### Step 1: Prepare Your Repository

Ensure these files are in your root directory:
- `requirements.txt` - Python dependencies
- `Procfile` - Render start command
- `render.yaml` - Render configuration (optional)
- `runtime.txt` - Python version

### Step 2: Create PostgreSQL Database

1. Go to Render Dashboard
2. Click "New +" → "PostgreSQL"
3. Configure:
   - Name: `tennis-academy-db`
   - Database: `tennis_academy`
   - User: `tennis_user`
4. Click "Create Database"
5. Copy the "Internal Database URL"

### Step 3: Create Web Service

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `tennis-academy-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Free or Starter

### Step 4: Set Environment Variables

Add these environment variables in Render:

```
DATABASE_URL=<your-internal-database-url>
SECRET_KEY=<generate-a-secure-random-key>
FRONTEND_URL=https://your-frontend-url.com
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

To generate a secure SECRET_KEY:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Step 5: Deploy

1. Click "Create Web Service"
2. Render will automatically:
   - Clone your repository
   - Install dependencies
   - Start your application
   - Create database tables on first run

### Troubleshooting

**Issue: ModuleNotFoundError: No module named 'app'**
- Solution: Use `uvicorn backend.app.main:app` instead of `cd backend && uvicorn app.main:app`

**Issue: Database connection failed**
- Ensure DATABASE_URL is set correctly
- Use the Internal Database URL from Render
- Check that the database is in the same region

**Issue: Port binding error**
- Ensure you're using `--port $PORT` in the start command
- Render automatically sets the PORT environment variable

## Frontend Deployment (Vercel/Netlify)

### Build Settings
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Environment Variables
```
VITE_API_URL=https://your-backend-url.onrender.com
```

## Post-Deployment

1. Visit your backend URL to verify it's running
2. Check `/docs` endpoint for API documentation
3. Test the `/health` endpoint
4. Create initial admin/coach accounts if needed

## Monitoring

- Check Render logs for errors
- Monitor database connections
- Set up health check endpoints
- Configure alerts for downtime
