# Railway Deployment Guide - PostgreSQL Version

This guide provides step-by-step instructions for deploying the Rick and Morty Database to Railway with PostgreSQL.

## 🚀 Quick Deployment

### 1. Prerequisites

- Railway account ([railway.app](https://railway.app))
- Git repository with the migrated code
- Railway CLI (optional but recommended)

### 2. Install Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login
```

### 3. Create New Railway Project

```bash
# Initialize Railway project
railway init

# Or deploy from GitHub
# Connect your GitHub repository in Railway dashboard
```

### 4. Add PostgreSQL Database

```bash
# Add PostgreSQL service
railway add postgresql

# This automatically creates:
# - PostgreSQL database instance
# - DATABASE_URL environment variable
# - Connection credentials
```

### 5. Configure Environment Variables

In Railway dashboard or via CLI:

```bash
# Set required environment variables
railway variables set JWT_SECRET="your-super-secret-jwt-key-here"
railway variables set CLIENT_URL="https://your-frontend-domain.com"
railway variables set NODE_ENV="production"

# Optional variables
railway variables set MAX_FILE_SIZE="10485760"
railway variables set RATE_LIMIT_MAX_REQUESTS="100"
```

### 6. Deploy Application

```bash
# Deploy to Railway
railway up

# Or push to connected GitHub repo
git push origin main
```

## 🔧 Detailed Configuration

### Environment Variables

#### Required Variables

| Variable | Description | Example |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:port/db` |
| `JWT_SECRET` | JWT signing secret | `your-super-secret-key` |
| `CLIENT_URL` | Frontend application URL | `https://yourapp.netlify.app` |
| `NODE_ENV` | Environment mode | `production` |

#### Optional Variables

| Variable | Description | Default |
|----------|-------------|----------|
| `PORT` | Server port | `5000` |
| `MAX_FILE_SIZE` | File upload limit | `10485760` (10MB) |
| `RATE_LIMIT_MAX_REQUESTS` | Rate limit per window | `100` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15 min) |
| `BCRYPT_ROUNDS` | Password hashing rounds | `12` |
| `JWT_EXPIRES_IN` | JWT expiration | `7d` |

### Setting Variables via Dashboard

1. Go to Railway dashboard
2. Select your project
3. Click on your service
4. Go to "Variables" tab
5. Add each variable with its value

### Setting Variables via CLI

```bash
# Set individual variables
railway variables set VARIABLE_NAME="value"

# Set multiple variables from file
railway variables set --from-file .env.production

# View all variables
railway variables
```

## 🗄️ Database Setup

### Automatic Initialization

The application automatically:
1. Connects to PostgreSQL on startup
2. Creates tables if they don't exist
3. Sets up indexes and constraints
4. Creates triggers and views

### Manual Database Access

```bash
# Connect to PostgreSQL via Railway CLI
railway connect postgresql

# Or use psql with DATABASE_URL
psql $DATABASE_URL
```

### Database Schema

The PostgreSQL schema includes:
- **11 tables** for users, content, comments, and relationships
- **Indexes** for optimized queries
- **Foreign key constraints** for data integrity
- **Triggers** for automatic updates
- **Views** for common queries

## 🌐 Domain Configuration

### Custom Domain Setup

1. **In Railway Dashboard**:
   - Go to your service
   - Click "Settings" tab
   - Scroll to "Domains"
   - Click "Generate Domain" or "Custom Domain"

2. **Update Environment Variables**:
   ```bash
   railway variables set CLIENT_URL="https://your-custom-domain.com"
   ```

3. **Update Frontend Configuration**:
   Update your frontend's API URL to point to the new Railway domain.

### SSL/HTTPS

Railway automatically provides:
- SSL certificates for all domains
- HTTPS redirection
- HTTP/2 support

## 📊 Monitoring and Logs

### View Logs

```bash
# View real-time logs
railway logs

# View logs with follow
railway logs --follow

# View specific service logs
railway logs --service your-service-name
```

### Health Monitoring

The application provides a health endpoint:

```bash
# Check application health
curl https://your-app.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "environment": "production"
}
```

### Metrics Dashboard

Railway provides built-in metrics:
- CPU usage
- Memory usage
- Network traffic
- Database connections
- Response times

## 🔄 Deployment Workflow

### Automatic Deployments

1. **Connect GitHub Repository**:
   - Link your GitHub repo in Railway dashboard
   - Enable automatic deployments
   - Set deployment branch (usually `main`)

2. **Deploy on Push**:
   ```bash
   git add .
   git commit -m "Update application"
   git push origin main
   # Railway automatically deploys
   ```

### Manual Deployments

```bash
# Deploy current directory
railway up

# Deploy specific service
railway up --service backend

# Deploy with environment
railway up --environment production
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Database Connection Errors

```
Error: connect ECONNREFUSED
```

**Solutions**:
- Verify PostgreSQL service is running
- Check `DATABASE_URL` format
- Ensure database service is in same project

#### 2. Environment Variable Issues

```
Error: JWT_SECRET is required
```

**Solutions**:
```bash
# Check variables
railway variables

# Set missing variables
railway variables set JWT_SECRET="your-secret"
```

#### 3. Build Failures

```
Error: Cannot find module 'pg'
```

**Solutions**:
- Ensure `package.json` includes PostgreSQL dependencies
- Run `npm install` locally to verify dependencies
- Check build logs for specific errors

#### 4. CORS Errors

```
CORS policy: No 'Access-Control-Allow-Origin' header
```

**Solutions**:
```bash
# Update CLIENT_URL to match frontend domain
railway variables set CLIENT_URL="https://your-frontend.netlify.app"
```

### Debug Commands

```bash
# Check service status
railway status

# View environment variables
railway variables

# Connect to database
railway connect postgresql

# View recent logs
railway logs --tail 100

# Restart service
railway restart
```

## 📈 Scaling and Performance

### Database Scaling

Railway PostgreSQL automatically handles:
- Connection pooling
- Memory management
- Storage scaling
- Backup management

### Application Scaling

```bash
# Scale application resources
# (Available in Railway Pro plans)
railway scale --memory 1GB --cpu 1
```

### Performance Optimization

1. **Database Indexes**: Already optimized in schema
2. **Connection Pooling**: Built into the application
3. **Caching**: Consider adding Redis for session storage
4. **CDN**: Use Railway's edge caching for static assets

## 🔐 Security Best Practices

### Environment Security

```bash
# Use strong JWT secret (32+ characters)
railway variables set JWT_SECRET="$(openssl rand -base64 32)"

# Enable secure cookies in production
railway variables set SECURE_COOKIES="true"

# Set proper CORS origins
railway variables set CLIENT_URL="https://your-exact-domain.com"
```

### Database Security

- Railway PostgreSQL includes SSL by default
- Database credentials are automatically managed
- Network isolation between services
- Automatic security updates

## 💰 Cost Optimization

### Railway Pricing

- **Hobby Plan**: $5/month per service
- **Pro Plan**: Usage-based pricing
- **PostgreSQL**: Included in service cost

### Cost Reduction Tips

1. **Optimize Queries**: Use efficient database queries
2. **Resource Monitoring**: Monitor CPU/memory usage
3. **Cleanup**: Remove unused services and databases
4. **Caching**: Implement caching to reduce database load

## 🎯 Production Checklist

- [ ] PostgreSQL service added and running
- [ ] All environment variables set
- [ ] JWT_SECRET is secure and unique
- [ ] CLIENT_URL matches frontend domain
- [ ] Health endpoint returns "healthy"
- [ ] Database schema initialized
- [ ] CORS configured correctly
- [ ] SSL/HTTPS working
- [ ] Logs show no errors
- [ ] Frontend can connect to API
- [ ] Authentication flow works
- [ ] File uploads work (if enabled)
- [ ] Rate limiting configured
- [ ] Error handling tested

## 📞 Support Resources

- [Railway Documentation](https://docs.railway.app/)
- [Railway Discord Community](https://discord.gg/railway)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Railway Status Page](https://status.railway.app/)

## 🎉 Success!

Once deployed successfully:

1. **Test the API**: `https://your-app.railway.app/health`
2. **Update Frontend**: Point to new Railway URL
3. **Monitor Performance**: Use Railway dashboard
4. **Set Up Monitoring**: Configure alerts if needed

Your Rick and Morty Database is now running on Railway with PostgreSQL! 🚀