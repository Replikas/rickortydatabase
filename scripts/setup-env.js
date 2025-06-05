#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Setup script for Rick and Morty Database
 * Generates secure JWT secret and creates .env file
 */

function generateJWTSecret() {
  return crypto.randomBytes(64).toString('hex');
}

function createEnvFile() {
  const envPath = path.join(__dirname, '../server/.env');
  const examplePath = path.join(__dirname, '../server/.env.example');
  
  // Check if .env already exists
  if (fs.existsSync(envPath)) {
    console.log('⚠️  .env file already exists. Skipping creation.');
    console.log('   If you want to regenerate, delete the existing .env file first.');
    return;
  }
  
  // Read the example file
  if (!fs.existsSync(examplePath)) {
    console.error('❌ .env.example file not found!');
    process.exit(1);
  }
  
  let envContent = fs.readFileSync(examplePath, 'utf8');
  
  // Generate secure JWT secret
  const jwtSecret = generateJWTSecret();
  
  // Replace the example JWT secret
  envContent = envContent.replace(
    'JWT_SECRET=rickorty-secret-key-change-in-production-please',
    `JWT_SECRET=${jwtSecret}`
  );
  
  // Write the new .env file
  fs.writeFileSync(envPath, envContent);
  
  console.log('✅ Created .env file with secure JWT secret');
  console.log('📝 Please update the following variables in server/.env:');
  console.log('   - MONGODB_URI (required)');
  console.log('   - CLIENT_URL (for production)');
  console.log('   - Other optional services as needed');
}

function displaySetupInstructions() {
  console.log('\n🚀 Rick and Morty Database Setup');
  console.log('================================\n');
  
  console.log('Next steps:');
  console.log('1. Set up MongoDB:');
  console.log('   - Local: Install MongoDB and start service');
  console.log('   - Cloud: Create MongoDB Atlas cluster');
  console.log('\n2. Update server/.env with your MongoDB URI');
  console.log('\n3. Install dependencies:');
  console.log('   npm run install-all');
  console.log('\n4. Start development servers:');
  console.log('   npm run dev');
  console.log('\n5. For deployment, see DEPLOYMENT.md');
  
  console.log('\n📚 Useful commands:');
  console.log('   npm run dev      - Start both frontend and backend');
  console.log('   npm run server   - Start backend only');
  console.log('   npm run client   - Start frontend only');
  console.log('   npm run build    - Build for production');
}

function main() {
  try {
    createEnvFile();
    displaySetupInstructions();
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  generateJWTSecret,
  createEnvFile
};