// Script to convert coach users to admin role
// Run this in the browser console or as a temporary component

import api from './frontend/src/services/api.js';

async function convertCoachesToAdmins() {
  try {
    console.log('Fetching all users...');
    const users = await api.getAllUsers({ limit: 100 });
    
    const coaches = users.filter(user => user.role === 'coach');
    console.log('Found coaches:', coaches);
    
    for (const coach of coaches) {
      console.log(`Converting ${coach.username} (${coach.email}) from coach to admin...`);
      try {
        await api.updateUserRole(coach.id, 'admin');
        console.log(`✅ Successfully converted ${coach.username} to admin`);
      } catch (error) {
        console.error(`❌ Failed to convert ${coach.username}:`, error);
      }
    }
    
    console.log('✅ Conversion complete!');
  } catch (error) {
    console.error('❌ Error during conversion:', error);
  }
}

// Export for use in browser console
window.convertCoachesToAdmins = convertCoachesToAdmins;
console.log('Run convertCoachesToAdmins() in browser console to convert coaches to admins');
