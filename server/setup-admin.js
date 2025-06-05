const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/rickandmorty';

async function setupAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for admin setup');

    // Look for user with username 'Replika'
    let user = await User.findOne({ username: 'Replika' });
    
    if (!user) {
      // If Replika doesn't exist, make the first user admin
      user = await User.findOne().sort({ createdAt: 1 });
      
      if (!user) {
        console.log('No users found in database. Admin setup will run after first user registration.');
        return;
      }
      
      console.log(`User 'Replika' not found. Making first user ${user.username} admin instead.`);
    }

    // Update user role to admin
    await User.findByIdAndUpdate(user._id, { role: 'admin' });
    
    console.log(`Successfully made ${user.username} (${user.email}) an admin!`);
    console.log('They can now access the admin panel at /admin');
    
  } catch (error) {
    console.error('Error setting up admin:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Auto-run if this is the main module
if (require.main === module) {
  setupAdmin().then(() => process.exit(0));
}

module.exports = setupAdmin;