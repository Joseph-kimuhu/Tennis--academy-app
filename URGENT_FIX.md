# 🚨 URGENT FIX - Render Deployment Error

## Problem
Render is using an OLD start command from dashboard settings, NOT from Procfile or render.yaml.

The logs show: `Running 'cd backend && uvicorn app.main:app'` ❌
Should be: `uvicorn backend.app.main:app` ✅

## ✅ SOLUTION 1: Update Render Dashboard (RECOMMENDED)

### Steps:
1. Go to your Render dashboard: https://dashboard.render.com
2. Click on your service (tennis-academy-backend)
3. Click **"Settings"** tab
4. Scroll to **"Build & Deploy"** section
5. Find **"Start Command"** field
6. **DELETE** the current command
7. **PASTE** this exact command:
   ```
   uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT
   ```
8. Click **"Save Changes"**
9. Go to **"Manual Deploy"** → **"Deploy latest commit"**

### Why this works:
- Render dashboard settings override Procfile and render.yaml
- The command runs from the root directory, not backend/
- Uses correct Python module path: `backend.app.main:app`

---

## ✅ SOLUTION 2: Use Alternative Start Command (If Solution 1 doesn't work)

If you can't change the dashboard settings, use this command instead:

```
cd backend && python3 run.py $PORT
```

This uses the new `backend/run.py` script that:
- Adds parent directory to Python path
- Imports the app correctly
- Starts uvicorn with the right configuration

---

## ✅ SOLUTION 3: Use Root Directory Start Script

Update Start Command to:
```
python3 start.sh
```

Then update `start.sh` to handle the path correctly.

---

## 🎯 Quick Action Checklist

- [ ] Go to Render Dashboard
- [ ] Navigate to your service settings
- [ ] Update Start Command to: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
- [ ] Save changes
- [ ] Trigger manual deploy
- [ ] Check logs - should see app starting successfully
- [ ] Test: Visit `https://your-app.onrender.com/health`

---

## 📋 Environment Variables to Set

Make sure these are set in Render dashboard:

```
DATABASE_URL=<your-postgresql-internal-url>
SECRET_KEY=<generate-secure-key>
FRONTEND_URL=https://your-frontend.com
```

Generate SECRET_KEY:
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## ✅ Verification

After deployment succeeds, check:
1. Logs show: `Application startup complete`
2. Visit: `https://your-app.onrender.com/`
3. Visit: `https://your-app.onrender.com/health`
4. Visit: `https://your-app.onrender.com/docs`

All should return successful responses!

---

## 🆘 Still Having Issues?

If the error persists:
1. Check you saved the Start Command in dashboard
2. Verify you triggered a NEW deploy after saving
3. Check the logs show the NEW command (not the old one)
4. Try Solution 2 or 3 as alternatives

The key issue is Render is using cached/old settings. You MUST update it in the dashboard!
