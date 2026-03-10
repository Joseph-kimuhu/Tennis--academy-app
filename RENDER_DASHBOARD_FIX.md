# 🎯 RENDER DASHBOARD FIX - Step by Step

## The Problem in Your Logs:
```
==&gt; Running 'cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT'
ModuleNotFoundError: No module named 'app'
```

This is the WRONG command! ❌

## The Solution:

### Step 1: Open Render Dashboard
Go to: https://dashboard.render.com

### Step 2: Select Your Service
Click on your web service (probably named something like "tennis-academy-backend")

### Step 3: Go to Settings
Click the "Settings" tab at the top

### Step 4: Find Build & Deploy Section
Scroll down to the "Build & Deploy" section

### Step 5: Locate Start Command
You'll see a field labeled "Start Command"

Current value (WRONG):
```
cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Step 6: Update Start Command
Clear the field and enter this EXACT command:
```
uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT
```

### Step 7: Save Changes
Click the "Save Changes" button at the bottom

### Step 8: Manual Deploy
1. Go back to the main service page
2. Click "Manual Deploy" button (top right)
3. Select "Deploy latest commit"
4. Click "Deploy"

### Step 9: Watch the Logs
The logs should now show:
```
==&gt; Running 'uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT'
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

✅ SUCCESS!

---

## Alternative Commands (if the above doesn't work):

### Option A: Use the start script
```
bash start.sh
```

### Option B: Use the Python runner
```
cd backend && python3 run.py $PORT
```

### Option C: Set PYTHONPATH
```
export PYTHONPATH=/opt/render/project/src:$PYTHONPATH && cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

---

## Environment Variables Needed:

Make sure these are set in the "Environment" section:

| Variable | Value | Example |
|----------|-------|---------|
| DATABASE_URL | Your PostgreSQL URL | postgresql://user:pass@host/db |
| SECRET_KEY | Random secure string | Use: `python3 -c "import secrets; print(secrets.token_urlsafe(32))"` |
| FRONTEND_URL | Your frontend URL | https://yourapp.vercel.app |

---

## Verification URLs:

After successful deployment, test these:

1. **Root**: https://your-app.onrender.com/
   - Should return: `{"message": "Welcome to Lawn Tennis Application API"}`

2. **Health**: https://your-app.onrender.com/health
   - Should return: `{"status": "healthy"}`

3. **Docs**: https://your-app.onrender.com/docs
   - Should show: Interactive API documentation

---

## Common Mistakes to Avoid:

❌ Using `cd backend &&` in the command
❌ Using `app.main:app` instead of `backend.app.main:app`
❌ Not saving changes after updating
❌ Not triggering a new deploy after saving
❌ Forgetting to set environment variables

✅ Use the exact command provided above
✅ Save changes in dashboard
✅ Trigger manual deploy
✅ Set all required environment variables

---

## Need Help?

If you're still stuck:
1. Screenshot your Render dashboard settings
2. Copy the full error logs
3. Check that you're editing the correct service
4. Verify the command was actually saved (refresh the page)

The deployment WILL work once the Start Command is corrected in the dashboard! 🚀
