# Firebase Firestore Security Rules

Copy these rules to your Firebase Console → Firestore Database → Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection - users can read all, write own data
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Tournaments - everyone can read, only coaches/admins can write
    match /tournaments/{tournamentId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['coach', 'admin'];
    }
    
    // Tournament registrations - authenticated users can read/write
    match /tournament_registrations/{registrationId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Training sessions - authenticated users can read, coaches can write
    match /training_sessions/{sessionId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['coach', 'admin'];
    }
    
    // Announcements - authenticated users can read, coaches can write
    match /announcements/{announcementId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['coach', 'admin'];
    }
    
    // Courts - authenticated users can read, coaches can write
    match /courts/{courtId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['coach', 'admin'];
    }
    
    // Messages - only sender and recipient can read/write
    match /messages/{messageId} {
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.sender_id || request.auth.uid == resource.data.receiver_id);
      allow write: if request.auth != null;
    }
    
    // Clubs - authenticated users can read, admins can write
    match /clubs/{clubId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin'];
    }
  }
}
```

# Firebase Storage Security Rules

Copy these rules to your Firebase Console → Storage → Rules

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /profile_pictures/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

# Creating Firestore Index

For the leaderboard to work, you need to create a compound index:

1. Go to https://console.firebase.google.com/v1/r/project/tennis-academy-19edb/fires…
2. Or go to Firestore → Indexes → Composite → Add Index
3. Collection: users
4. Fields to index:
   - role == asc
   - ranking_points == desc
5. Click Create Index
