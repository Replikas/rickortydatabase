# PostgreSQL Migration Guide

This guide explains how to migrate the Rick and Morty Database from MongoDB to PostgreSQL for better reliability and Railway compatibility.

## 🎯 Why PostgreSQL?

- **Better Railway Integration**: Native PostgreSQL support with zero configuration
- **ACID Compliance**: Stronger data consistency and reliability
- **Better Performance**: Optimized for complex queries and relationships
- **Cost Effective**: More predictable pricing on Railway
- **SQL Standards**: Industry-standard SQL support

## 📋 Migration Overview

The migration includes:

1. **Database Schema**: Complete PostgreSQL schema with tables, indexes, and relationships
2. **Models**: New PostgreSQL models replacing Mongoose models
3. **Configuration**: Database connection and query utilities
4. **Migration Script**: Tool to migrate existing MongoDB data (if needed)

## 🚀 Quick Start (New Installation)

### 1. Railway PostgreSQL Setup

1. **Create Railway Project**:
   ```bash
   railway login
   railway init
   ```

2. **Add PostgreSQL Service**:
   ```bash
   railway add postgresql
   ```

3. **Get Database URL**:
   ```bash
   railway variables
   ```
   Copy the `DATABASE_URL` value.

### 2. Environment Configuration

1. **Update `.env` file**:
   ```env
   # Replace MongoDB URI with PostgreSQL
   DATABASE_URL=postgresql://username:password@hostname:port/database
   
   # Keep other variables
   JWT_SECRET=your-jwt-secret
   CLIENT_URL=https://your-frontend-domain.com
   ```

### 3. Install Dependencies

```bash
cd server
npm install
```

The updated `package.json` includes:
- `pg` - PostgreSQL client
- Removed `mongoose` dependency
- Updated scripts for PostgreSQL

### 4. Deploy to Railway

```bash
railway up
```

The database will be automatically initialized on first startup.

## 🔄 Migration from Existing MongoDB

### 1. Backup MongoDB Data

```bash
mongodump --uri="your-mongodb-uri" --out=./backup
```

### 2. Set Up PostgreSQL

Follow the Railway setup steps above.

### 3. Run Migration Script

```bash
# Set environment variables for both databases
export MONGODB_URI="your-mongodb-uri"
export DATABASE_URL="your-postgresql-url"

# Run migration
npm run migrate
```

The migration script will:
- Connect to both databases
- Create PostgreSQL schema
- Migrate users, content, and comments
- Preserve relationships and metadata
- Provide progress updates

## 📊 Database Schema

### Tables Created

1. **users** - User accounts and profiles
2. **content** - Media content (images, videos, audio)
3. **comments** - User comments and replies
4. **content_likes** - Content like relationships
5. **content_favorites** - User favorites
6. **content_bookmarks** - User bookmarks
7. **content_flags** - Content moderation flags
8. **comment_likes** - Comment like relationships
9. **comment_flags** - Comment moderation flags
10. **user_follows** - User follow relationships
11. **user_blocks** - User block relationships

### Key Features

- **UUID Primary Keys**: Better for distributed systems
- **Foreign Key Constraints**: Data integrity enforcement
- **Indexes**: Optimized query performance
- **Triggers**: Automatic like count updates
- **Views**: Pre-computed statistics
- **JSONB Support**: Flexible tag storage

## 🔧 Configuration

### Database Connection

The new `config/database.js` provides:

- **Connection Pooling**: Efficient connection management
- **Query Utilities**: Simplified database operations
- **Transaction Support**: ACID compliance
- **Error Handling**: Comprehensive error management
- **Auto-initialization**: Schema creation on startup

### Environment Variables

```env
# Primary connection (Railway provides this)
DATABASE_URL=postgresql://user:pass@host:port/db

# Or individual components
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rickandmorty_db
DB_USER=username
DB_PASSWORD=password
DB_SSL=true
```

## 🏗️ Model Changes

### Before (Mongoose)
```javascript
const User = require('./models/User');
const user = await User.findById(id);
```

### After (PostgreSQL)
```javascript
const User = require('./models/postgres/User');
const user = await User.findById(id);
```

### Key Differences

1. **Static Methods**: All operations are static class methods
2. **Explicit Queries**: Direct SQL with parameter binding
3. **Transaction Support**: Built-in transaction handling
4. **Type Safety**: Better type checking and validation
5. **Performance**: Optimized queries with indexes

## 🔍 API Compatibility

The API endpoints remain the same. The migration is transparent to frontend applications:

- ✅ All existing routes work unchanged
- ✅ Same request/response formats
- ✅ Same authentication flow
- ✅ Same error handling
- ✅ Same pagination

## 🧪 Testing

### Health Check

```bash
curl https://your-app.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Database Connection

```bash
# Test database connectivity
psql $DATABASE_URL -c "SELECT version();"
```

## 🚨 Troubleshooting

### Common Issues

1. **Connection Errors**:
   ```
   Error: connect ECONNREFUSED
   ```
   - Check `DATABASE_URL` format
   - Verify Railway PostgreSQL service is running
   - Check network connectivity

2. **SSL Errors**:
   ```
   Error: self signed certificate
   ```
   - Set `DB_SSL=true` for Railway
   - Use `?sslmode=require` in connection string

3. **Migration Errors**:
   ```
   Error: relation already exists
   ```
   - Database already initialized
   - Drop and recreate if needed

### Debug Mode

```env
DEBUG_MODE=true
LOG_LEVEL=debug
```

## 📈 Performance Optimization

### Indexes

The schema includes optimized indexes for:
- User lookups (username, email)
- Content searches (title, tags, category)
- Comment threads (content_id, parent_id)
- Relationship queries (follows, likes, favorites)

### Query Optimization

- **Pagination**: Efficient LIMIT/OFFSET queries
- **Joins**: Optimized relationship queries
- **Aggregations**: Pre-computed statistics
- **Caching**: Connection pooling and prepared statements

## 🔐 Security

### Database Security

- **Parameter Binding**: SQL injection prevention
- **Connection Encryption**: SSL/TLS for Railway
- **Access Control**: Role-based permissions
- **Audit Logging**: Query and error logging

### Application Security

- **Input Validation**: Joi schema validation
- **Authentication**: JWT token verification
- **Rate Limiting**: Request throttling
- **CORS**: Cross-origin protection

## 📚 Additional Resources

- [Railway PostgreSQL Documentation](https://docs.railway.app/databases/postgresql)
- [PostgreSQL Official Documentation](https://www.postgresql.org/docs/)
- [Node.js pg Library](https://node-postgres.com/)
- [SQL Migration Best Practices](https://www.postgresql.org/docs/current/ddl.html)

## 🆘 Support

If you encounter issues during migration:

1. Check the Railway dashboard for service status
2. Review application logs: `railway logs`
3. Test database connectivity: `railway connect postgresql`
4. Verify environment variables: `railway variables`

## 🎉 Next Steps

After successful migration:

1. **Monitor Performance**: Use Railway metrics dashboard
2. **Set Up Backups**: Configure automated backups
3. **Scale Resources**: Adjust database resources as needed
4. **Update Documentation**: Document any custom changes
5. **Test Thoroughly**: Verify all functionality works correctly

The PostgreSQL migration provides a more robust, scalable, and reliable foundation for the Rick and Morty Database application.