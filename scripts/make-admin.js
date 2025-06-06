const path = require('path');

// Try to load database and User model from server directory first (for Railway deployment)
let User, connectDB;
try {
  const database = require('../server/config/database');
  connectDB = database.connectDB;
  User = require('../server/models/User');
} catch (error) {
  // If running from server directory
  const database = require('./config/database');
  connectDB = database.connectDB;
  User = require('./models/User');
}

// Load environment variables
try {
  require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
} catch (error) {
  require('dotenv').config();
}

async function makeAdmin() {
  try {
    await connectDB();
    console.log('Connected to PostgreSQL');

    // Get the first user or a specific user
    const args = process.argv.slice(2);
    let user;

    if (args.length > 0) {
      // Make specific user admin by username or email
      const identifier = args[0];
      // Try to find by username first
      user = await User.findByUsername(identifier);
      
      // If not found, try by email
      if (!user) {
        user = await User.findByEmail(identifier);
      }
      
      if (!user) {
        console.log(`User not found: ${identifier}`);
        process.exit(1);
      }
    } else {
      // Make the first user admin
      const users = await User.find({ limit: 1, sort: 'created_at', order: 'ASC' });
      
      if (users.length === 0) {
        console.log('No users found in database');
        process.exit(1);
      }
      
      user = users[0];
    }

    // Update user role to admin
    await User.findByIdAndUpdate(user.id, { role: 'admin' });
    
    console.log(`Successfully made ${user.username} (${user.email}) an admin!`);
    console.log('They now have admin privileges for content moderation.');
    
  } catch (error) {
    console.error('Error making user admin:', error);
  } finally {
    process.exit(0);
  }
}

if (require.main === module) {
  makeAdmin();
}

module.exports = makeAdmin;