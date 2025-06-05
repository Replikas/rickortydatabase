const mongoose = require('mongoose');
const path = require('path');

// Try to load from server directory first (for Railway deployment)
let User;
try {
  User = require('../server/models/User');
} catch (error) {
  // If running from server directory
  User = require('./models/User');
}

// Load environment variables
try {
  require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
} catch (error) {
  require('dotenv').config();
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rickandmorty';

async function makeAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the first user or a specific user
    const args = process.argv.slice(2);
    let user;

    if (args.length > 0) {
      // Make specific user admin by username or email
      const identifier = args[0];
      user = await User.findOne({
        $or: [
          { username: identifier },
          { email: identifier }
        ]
      });
      
      if (!user) {
        console.log(`User not found: ${identifier}`);
        process.exit(1);
      }
    } else {
      // Make the first user admin
      user = await User.findOne().sort({ createdAt: 1 });
      
      if (!user) {
        console.log('No users found in database');
        process.exit(1);
      }
    }

    // Update user role to admin
    await User.findByIdAndUpdate(user._id, { role: 'admin' });
    
    console.log(`Successfully made ${user.username} (${user.email}) an admin!`);
    console.log('They now have admin privileges for content moderation.');
    
  } catch (error) {
    console.error('Error making user admin:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

if (require.main === module) {
  makeAdmin();
}

module.exports = makeAdmin;