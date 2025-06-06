const { connectDB } = require('./config/database');
const User = require('./models/User');
require('dotenv').config();

async function setupAdmin() {
  try {
    await connectDB();
    console.log('Connected to PostgreSQL for admin setup');

    // Look for user with username 'Replika'
    let user = await User.findByUsername('Replika');
    
    if (!user) {
      // If Replika doesn't exist, make the first user admin
      const users = await User.find({ limit: 1, sort: 'created_at', order: 'ASC' });
      
      if (users.length === 0) {
        console.log('No users found in database. Admin setup will run after first user registration.');
        return;
      }
      
      user = users[0];
      console.log(`User 'Replika' not found. Making first user ${user.username} admin instead.`);
    }

    // Update user role to admin
    await User.findByIdAndUpdate(user.id, { role: 'admin' });
    
    console.log(`Successfully made ${user.username} (${user.email}) an admin!`);
    console.log('They now have admin privileges for content moderation.');
    
  } catch (error) {
    console.error('Error setting up admin:', error);
  }
}

// Auto-run if this is the main module
if (require.main === module) {
  setupAdmin().then(() => process.exit(0));
}

module.exports = setupAdmin;