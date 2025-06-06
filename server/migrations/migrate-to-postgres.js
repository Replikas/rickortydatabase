/**
 * MongoDB to PostgreSQL Migration Script
 * 
 * This script migrates data from MongoDB to PostgreSQL for the Rick and Morty Database.
 * It handles the conversion of MongoDB documents to PostgreSQL records while preserving
 * relationships and data integrity.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// MongoDB Models
const User = require('../models/User');
const Content = require('../models/Content');
const Comment = require('../models/Comment');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rickandmorty';
const PG_CONNECTION_STRING = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/rickandmorty';

// PostgreSQL connection
const pgPool = new Pool({
  connectionString: PG_CONNECTION_STRING,
});

// Map to store MongoDB IDs to PostgreSQL UUIDs
const idMap = {
  users: new Map(),
  content: new Map(),
  comments: new Map(),
};

/**
 * Main migration function
 */
async function migrateData() {
  try {
    console.log('Starting migration from MongoDB to PostgreSQL...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Create PostgreSQL schema
    await createPostgresSchema();
    
    // Start a PostgreSQL transaction
    const pgClient = await pgPool.connect();
    try {
      await pgClient.query('BEGIN');
      
      // Migrate users
      await migrateUsers(pgClient);
      
      // Migrate content
      await migrateContent(pgClient);
      
      // Migrate comments
      await migrateComments(pgClient);
      
      // Migrate relationships
      await migrateRelationships(pgClient);
      
      await pgClient.query('COMMIT');
      console.log('Migration completed successfully!');
    } catch (error) {
      await pgClient.query('ROLLBACK');
      throw error;
    } finally {
      pgClient.release();
    }
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
    // Close PostgreSQL pool
    await pgPool.end();
    console.log('Disconnected from PostgreSQL');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

/**
 * Create PostgreSQL schema from SQL file
 */
async function createPostgresSchema() {
  try {
    console.log('Creating PostgreSQL schema...');
    const sqlPath = path.join(__dirname, 'postgresql-setup.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    const client = await pgPool.connect();
    try {
      await client.query(sql);
      console.log('PostgreSQL schema created successfully');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating PostgreSQL schema:', error);
    throw error;
  }
}

/**
 * Migrate users from MongoDB to PostgreSQL
 */
async function migrateUsers(pgClient) {
  console.log('Migrating users...');
  const users = await User.find({});
  
  for (const user of users) {
    const pgId = await pgClient.query(
      `INSERT INTO users (
        username, email, password, display_name, bio, avatar, is_verified, role,
        preferences, last_login, is_active, is_banned, ban_reason, ban_expires_at, stats, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING id`,
      [
        user.username,
        user.email,
        user.password,
        user.displayName || null,
        user.bio || null,
        user.avatar || null,
        user.isVerified || false,
        user.role || 'user',
        JSON.stringify({
          showNSFW: user.preferences?.showNSFW || false,
          theme: user.preferences?.theme || 'dark',
          emailNotifications: user.preferences?.emailNotifications || true
        }),
        user.lastLogin || new Date(),
        user.isActive !== undefined ? user.isActive : true,
        user.isBanned || false,
        user.banReason || null,
        user.banExpiresAt || null,
        JSON.stringify({
          totalUploads: user.stats?.totalUploads || 0,
          totalLikes: user.stats?.totalLikes || 0,
          totalViews: user.stats?.totalViews || 0
        }),
        user.createdAt || new Date(),
        user.updatedAt || new Date()
      ]
    );
    
    // Store mapping from MongoDB ID to PostgreSQL UUID
    idMap.users.set(user._id.toString(), pgId.rows[0].id);
  }
  
  console.log(`Migrated ${users.length} users`);
}

/**
 * Migrate content from MongoDB to PostgreSQL
 */
async function migrateContent(pgClient) {
  console.log('Migrating content...');
  const contents = await Content.find({});
  
  for (const content of contents) {
    const uploaderId = content.uploader ? idMap.users.get(content.uploader.toString()) : null;
    
    const pgId = await pgClient.query(
      `INSERT INTO content (
        title, author, content_type, filename, original_filename, file_url, thumbnail_url,
        file_size, mime_type, tags, rating, warnings, description, is_nsfw, is_anonymized,
        uploader_id, uploader_ip, likes, views, flagged, flag_reason, is_active, metadata,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25) RETURNING id`,
      [
        content.title,
        content.author || 'Anonymous',
        content.contentType,
        content.filename,
        content.originalFilename,
        content.fileUrl,
        content.thumbnailUrl || null,
        content.fileSize,
        content.mimeType,
        content.tags || [],
        content.rating || 'T',
        content.warnings || [],
        content.description || null,
        content.isNSFW || false,
        content.isAnonymized || false,
        uploaderId,
        content.uploaderIP || '127.0.0.1',
        content.likes || 0,
        content.views || 0,
        content.flagged || false,
        content.flagReason || null,
        content.isActive !== undefined ? content.isActive : true,
        JSON.stringify(content.metadata || {}),
        content.createdAt || new Date(),
        content.updatedAt || new Date()
      ]
    );
    
    // Store mapping from MongoDB ID to PostgreSQL UUID
    idMap.content.set(content._id.toString(), pgId.rows[0].id);
    
    // Migrate content likes
    if (content.likedBy && content.likedBy.length > 0) {
      for (const userId of content.likedBy) {
        const pgUserId = idMap.users.get(userId.toString());
        if (pgUserId) {
          try {
            await pgClient.query(
              'INSERT INTO content_likes (user_id, content_id) VALUES ($1, $2)',
              [pgUserId, pgId.rows[0].id]
            );
          } catch (error) {
            console.warn(`Could not migrate like for content ${content._id} by user ${userId}:`, error.message);
          }
        }
      }
    }
  }
  
  console.log(`Migrated ${contents.length} content items`);
}

/**
 * Migrate comments from MongoDB to PostgreSQL
 */
async function migrateComments(pgClient) {
  console.log('Migrating comments...');
  const comments = await Comment.find({});
  
  // First pass: create all comments
  for (const comment of comments) {
    const authorId = comment.author ? idMap.users.get(comment.author.toString()) : null;
    const contentId = idMap.content.get(comment.contentId.toString());
    
    if (!contentId) {
      console.warn(`Skipping comment ${comment._id} - content ${comment.contentId} not found`);
      continue;
    }
    
    const pgId = await pgClient.query(
      `INSERT INTO comments (
        content, author_id, author_name, content_id, parent_comment_id, likes,
        is_edited, edited_at, is_deleted, deleted_at, flagged, flag_reason,
        author_ip, is_anonymous, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING id`,
      [
        comment.content,
        authorId,
        comment.authorName || 'Anonymous',
        contentId,
        null, // We'll update parent_comment_id in the second pass
        comment.likes || 0,
        comment.isEdited || false,
        comment.editedAt || null,
        comment.isDeleted || false,
        comment.deletedAt || null,
        comment.flagged || false,
        comment.flagReason || null,
        comment.authorIP || '127.0.0.1',
        comment.isAnonymous || false,
        comment.createdAt || new Date(),
        comment.updatedAt || new Date()
      ]
    );
    
    // Store mapping from MongoDB ID to PostgreSQL UUID
    idMap.comments.set(comment._id.toString(), pgId.rows[0].id);
    
    // Migrate comment likes
    if (comment.likedBy && comment.likedBy.length > 0) {
      for (const userId of comment.likedBy) {
        const pgUserId = idMap.users.get(userId.toString());
        if (pgUserId) {
          try {
            await pgClient.query(
              'INSERT INTO comment_likes (user_id, comment_id) VALUES ($1, $2)',
              [pgUserId, pgId.rows[0].id]
            );
          } catch (error) {
            console.warn(`Could not migrate like for comment ${comment._id} by user ${userId}:`, error.message);
          }
        }
      }
    }
    
    // Migrate comment flags
    if (comment.flaggedBy && comment.flaggedBy.length > 0) {
      for (const flag of comment.flaggedBy) {
        const pgUserId = idMap.users.get(flag.user.toString());
        if (pgUserId) {
          try {
            await pgClient.query(
              'INSERT INTO comment_flags (comment_id, user_id, reason, flagged_at) VALUES ($1, $2, $3, $4)',
              [pgId.rows[0].id, pgUserId, flag.reason || null, flag.flaggedAt || new Date()]
            );
          } catch (error) {
            console.warn(`Could not migrate flag for comment ${comment._id} by user ${flag.user}:`, error.message);
          }
        }
      }
    }
  }
  
  // Second pass: update parent_comment_id for replies
  for (const comment of comments) {
    if (comment.parentComment) {
      const pgCommentId = idMap.comments.get(comment._id.toString());
      const pgParentId = idMap.comments.get(comment.parentComment.toString());
      
      if (pgCommentId && pgParentId) {
        await pgClient.query(
          'UPDATE comments SET parent_comment_id = $1 WHERE id = $2',
          [pgParentId, pgCommentId]
        );
      }
    }
  }
  
  console.log(`Migrated ${comments.length} comments`);
}

/**
 * Migrate relationships (follows, bookmarks, etc.)
 */
async function migrateRelationships(pgClient) {
  console.log('Migrating relationships...');
  
  // Migrate user follows
  const users = await User.find({});
  for (const user of users) {
    const pgUserId = idMap.users.get(user._id.toString());
    
    if (!pgUserId) continue;
    
    // Follows
    if (user.following && user.following.length > 0) {
      for (const followingId of user.following) {
        const pgFollowingId = idMap.users.get(followingId.toString());
        if (pgFollowingId && pgUserId !== pgFollowingId) {
          try {
            await pgClient.query(
              'INSERT INTO user_follows (follower_id, following_id) VALUES ($1, $2)',
              [pgUserId, pgFollowingId]
            );
          } catch (error) {
            console.warn(`Could not migrate follow relationship for user ${user._id} following ${followingId}:`, error.message);
          }
        }
      }
    }
    
    // Blocked users
    if (user.blockedUsers && user.blockedUsers.length > 0) {
      for (const blockedId of user.blockedUsers) {
        const pgBlockedId = idMap.users.get(blockedId.toString());
        if (pgBlockedId && pgUserId !== pgBlockedId) {
          try {
            await pgClient.query(
              'INSERT INTO user_blocks (blocker_id, blocked_id) VALUES ($1, $2)',
              [pgUserId, pgBlockedId]
            );
          } catch (error) {
            console.warn(`Could not migrate block relationship for user ${user._id} blocking ${blockedId}:`, error.message);
          }
        }
      }
    }
    
    // Favorites
    if (user.favorites && user.favorites.length > 0) {
      for (const favoriteId of user.favorites) {
        const pgContentId = idMap.content.get(favoriteId.toString());
        if (pgContentId) {
          try {
            await pgClient.query(
              'INSERT INTO user_favorites (user_id, content_id) VALUES ($1, $2)',
              [pgUserId, pgContentId]
            );
          } catch (error) {
            console.warn(`Could not migrate favorite for user ${user._id} content ${favoriteId}:`, error.message);
          }
        }
      }
    }
    
    // Bookmarks
    if (user.bookmarks && user.bookmarks.length > 0) {
      for (const bookmarkId of user.bookmarks) {
        const pgContentId = idMap.content.get(bookmarkId.toString());
        if (pgContentId) {
          try {
            await pgClient.query(
              'INSERT INTO user_bookmarks (user_id, content_id) VALUES ($1, $2)',
              [pgUserId, pgContentId]
            );
          } catch (error) {
            console.warn(`Could not migrate bookmark for user ${user._id} content ${bookmarkId}:`, error.message);
          }
        }
      }
    }
  }
  
  console.log('Relationships migration completed');
}

// Run the migration
migrateData();