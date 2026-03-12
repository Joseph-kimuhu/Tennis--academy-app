// Simple script to deploy Firestore security rules
// Run with: node deploy-rules.js

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Deploying Firestore Security Rules...\n');

try {
  // Check if firebase CLI is installed
  try {
    execSync('firebase --version', { stdio: 'pipe' });
    console.log('✅ Firebase CLI found');
  } catch (error) {
    console.log('❌ Firebase CLI not found');
    console.log('Please install Firebase CLI:');
    console.log('npm install -g firebase-tools');
    process.exit(1);
  }

  // Check if we're in the right directory
  if (!fs.existsSync('firestore.rules')) {
    console.log('❌ firestore.rules file not found');
    console.log('Please run this from the project root directory');
    process.exit(1);
  }

  console.log('✅ firestore.rules file found');

  // Deploy the rules
  console.log('\n🚀 Deploying rules to Firebase...');
  console.log('This will overwrite the current rules in Firebase Console.\n');

  const deployCommand = 'firebase deploy --only firestore:rules';
  console.log(`Running: ${deployCommand}`);
  
  const output = execSync(deployCommand, { 
    stdio: 'inherit',
    encoding: 'utf8'
  });

  console.log('\n✅ Firestore rules deployed successfully!');
  console.log('\n📋 What was deployed:');
  console.log('- Messages: Users can read their own sent/received messages');
  console.log('- Users: Authenticated users can read user profiles');
  console.log('- Bookings: Users can manage their own bookings');
  console.log('- Collections: Proper read/write permissions for all collections');

} catch (error) {
  console.error('\n❌ Deployment failed:', error.message);
  console.log('\n🔧 Troubleshooting:');
  console.log('1. Make sure you\'re logged into Firebase CLI: firebase login');
  console.log('2. Make sure you\'re in the correct project directory');
  console.log('3. Check that firebase.json exists and points to the right project');
  console.log('4. Verify your Firebase project ID matches');
  process.exit(1);
}
