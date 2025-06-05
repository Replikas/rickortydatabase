# Deployment Guide

## 🌟 Features

### Content Management
- **Art Gallery**: Direct upload and browse fan art with thumbnail generation
- **Fanfiction Archive**: Direct upload of fanfics or import from AO3 links with word count tracking
- **Advanced Search**: Filter by tags, ratings, warnings, authors, and more
- **Content Discovery**: Popular tags, similar content recommendations

## GitHub Setup

### 1. Initialize Git Repository
```bash
git init
git add .
git commit -m "Initial commit: Rick and Morty Database"
```

### 2. Create GitHub Repository
1. Go to [GitHub](https://github.com) and create a new repository
2. Name it `rick-and-morty-database` or similar
3. Don't initialize with README (we already have one)
4. Add remote and push:
```bash
git remote add origin https://github.com/yourusername/rick-and-morty-database.git
git branch -M main
git push -u origin main
```

## Environment Variables

### Required Environment Variables

#### Server (.env)
```env
# Server Configuration
PORT=5000
NODE_ENV=production
CLIENT_URL=https://your-frontend-domain.com

# Database (REQUIRED)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rickorty-db

# JWT Secret (REQUIRED - Generate a strong secret)
JWT_SECRET=your-super-secure-jwt-secret-key-here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Limits
MAX_FILE_SIZE=52428800
MAX_FILES_PER_USER=1000

# Content Moderation
AUTO_FLAG_THRESHOLD=3
MAX_TAGS_PER_CONTENT=20
MAX_TAG_LENGTH=50

# Security
BCRYPT_ROUNDS=12
SESSION_TIMEOUT=604800000
```

#### Optional Environment Variables
```env
# File Storage (AWS S3)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=rickorty-uploads

# LLM API Keys
OPENROUTER_API_KEY=your-openrouter-key
GEMINI_API_KEY=your-gemini-key

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## Deployment Options

### Option 1: Vercel (Frontend) + Railway/Render (Backend)

#### Frontend (Vercel)
1. Connect your GitHub repo to Vercel
2. Set build command: `cd client && npm run build`
3. Set output directory: `client/build`
4. Add environment variable:
   - `REACT_APP_API_URL`: Your backend URL

#### Backend (Railway)
1. Connect GitHub repo to Railway
2. Set root directory: `server`
3. Add all required environment variables
4. Railway will auto-deploy on git push

### Option 2: Heroku (Full Stack)

#### Prepare for Heroku
1. Create `Procfile` in root:
```
web: cd server && npm start
```

2. Update server package.json scripts:
```json
{
  "scripts": {
    "start": "node server.js",
    "heroku-postbuild": "cd ../client && npm install && npm run build"
  }
}
```

3. Update server.js to serve static files:
```javascript
// Add this in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}
```

#### Deploy to Heroku
```bash
heroku create your-app-name
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your-mongodb-uri
heroku config:set JWT_SECRET=your-jwt-secret
# Add other environment variables
git push heroku main
```

### Option 3: DigitalOcean App Platform

1. Create `app.yaml`:
```yaml
name: rick-morty-database
services:
- name: api
  source_dir: /server
  github:
    repo: yourusername/rick-and-morty-database
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
  - key: MONGODB_URI
    value: ${MONGODB_URI}
  - key: JWT_SECRET
    value: ${JWT_SECRET}

- name: web
  source_dir: /client
  github:
    repo: yourusername/rick-and-morty-database
    branch: main
  build_command: npm run build
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
```

## Database Setup

### MongoDB Atlas (Recommended)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster (free tier available)
3. Create database user
4. Whitelist IP addresses (0.0.0.0/0 for all IPs)
5. Get connection string and add to MONGODB_URI

### Local MongoDB (Development)
```bash
# Install MongoDB locally
# macOS
brew install mongodb-community
brew services start mongodb-community

# Ubuntu
sudo apt install mongodb
sudo systemctl start mongodb

# Windows
# Download and install from MongoDB website
```

## Security Checklist

- [ ] Strong JWT_SECRET (use crypto.randomBytes(64).toString('hex'))
- [ ] MongoDB connection with authentication
- [ ] Environment variables not committed to git
- [ ] CORS configured for production domain
- [ ] Rate limiting enabled
- [ ] File upload size limits set
- [ ] Input validation on all endpoints
- [ ] HTTPS enabled in production

## Monitoring and Maintenance

### Health Checks
- Backend health: `GET /health`
- Database connection: `GET /api/health/db`

### Logs
- Check application logs regularly
- Monitor error rates
- Set up alerts for critical issues

### Backups
- Regular MongoDB backups
- File storage backups (if using local storage)

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check CLIENT_URL in server .env
   - Verify CORS configuration

2. **Database Connection**
   - Verify MONGODB_URI format
   - Check network access in MongoDB Atlas

3. **File Uploads**
   - Check MAX_FILE_SIZE setting
   - Verify upload directory permissions

4. **JWT Errors**
   - Ensure JWT_SECRET is set
   - Check token expiration settings

### Getting Help
- Check server logs for detailed error messages
- Verify all environment variables are set
- Test API endpoints individually
- Check database connectivity