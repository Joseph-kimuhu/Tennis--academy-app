# Firebase Permissions Fix

## Problem
Players are getting "Missing or insufficient permissions" error when trying to fetch messages.

## Solution Options

### Option 1: Quick Manual Fix (Recommended)

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: `tennis-academy-19edb`
3. **Go to Firestore Database**
4. **Click on "Rules" tab**
5. **Replace the entire rules content** with the content from `firestore.rules` file
6. **Click "Publish"**

### Option 2: Deploy via CLI

1. **Install Firebase CLI** (if not installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Deploy rules**:
   ```bash
   node deploy-rules.js
   ```

## What the Rules Do

### Messages Collection Permissions:
```javascript
match /messages/{messageId} {
  allow read: if isAuthenticated() && 
    (resource.data.sender_id == request.auth.uid || 
     resource.data.receiver_id == request.auth.uid ||
     isCoachOrAdmin());
  allow create: if isAuthenticated();
  allow update: if isAuthenticated() && 
    (resource.data.receiver_id == request.auth.uid || isCoachOrAdmin());
}
```

**This means:**
- ✅ Players can read messages they sent
- ✅ Players can read messages sent to them
- ✅ Coaches/Admins can read all messages
- ✅ Authenticated users can create messages
- ✅ Users can update messages they received

### Other Collection Permissions:
- **Users**: Authenticated users can read profiles
- **Bookings**: Users can manage their own bookings
- **Tournaments**: Coaches/Admins have full access
- **Notifications**: Users can only access their own notifications

## After Fix

Once deployed:
1. **Refresh the player dashboard**
2. **Messages should load** (showing "Debug: X messages loaded")
3. **Players can see** messages from coaches/admins
4. **No more permission errors**

## Testing

1. **Go to player dashboard** → Messages tab
2. **Check console** - should show messages loading
3. **Send a test message** to verify sending works
4. **Check if messages appear** in the inbox

## Troubleshooting

If still getting permission errors:
1. **Verify rules deployed** - Check Firebase Console Rules tab
2. **Check authentication** - Make sure user is logged in
3. **Clear browser cache** - Force refresh the page
4. **Check Firebase project ID** - Make sure it's the right project
