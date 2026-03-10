# Automatic User Seeding on Render

The admin and coach accounts are now **automatically created** when your backend app starts on Render! No manual intervention needed.

## What Happens Automatically

When your Render backend starts up, it will:

1. ✅ Check if coach account exists (`coach@tennis.com`)
2. ✅ Check if admin account exists (`admin@tennis.com`) 
3. ✅ Create any missing accounts
4. ✅ Log the results in the Render logs

## Default Accounts

### Coach Account
- **Email:** coach@tennis.com
- **Password:** coach123
- **Username:** Coach
- **Role:** Coach

### Admin Account  
- **Email:** admin@tennis.com
- **Password:** admin123
- **Username:** Admin
- **Role:** Admin

## How to Verify

1. Deploy your backend to Render
2. Check the Render logs for seeding messages:
   ```
   ==> ✅ Coach account created: coach@tennis.com
   ==> ✅ Admin account created: admin@tennis.com
   ==> 🎾 Default users seeding completed!
   ```
3. Try logging in with the credentials above

## Safe to Run Multiple Times

The seeding function is idempotent - it checks if users exist before creating them, so it's safe to restart your app multiple times without creating duplicates.

## If You Need to Reset

If you ever need to recreate the accounts, simply:
1. Delete the existing users from the database
2. Restart your Render service
3. The accounts will be recreated automatically

## Manual Option (If Needed)

If you ever need to run seeding manually, you can still use:
```bash
cd /opt/render/project/backend
python render_seed.py
```

But the automatic startup seeding should handle everything! 🎾
