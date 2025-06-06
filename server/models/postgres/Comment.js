/**
 * PostgreSQL Comment Model
 * 
 * This module provides comment-related database operations for PostgreSQL,
 * replacing the Mongoose Comment model.
 */

const { query, transaction, toCamelCase, toSnakeCase } = require('../../config/database');

class Comment {
  constructor(data) {
    Object.assign(this, data);
  }

  /**
   * Create a new comment
   * @param {Object} commentData - Comment data
   * @returns {Promise<Comment>} Created comment
   */
  static async create(commentData) {
    const {
      content,
      authorId,
      contentId,
      parentId = null,
      isEdited = false
    } = commentData;

    const result = await query(
      `INSERT INTO comments (
        content, author_id, content_id, parent_id, is_edited
      ) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [content, authorId, contentId, parentId, isEdited]
    );

    return new Comment(toCamelCase(result.rows[0]));
  }

  /**
   * Find comment by ID
   * @param {string} id - Comment ID
   * @returns {Promise<Comment|null>} Comment or null
   */
  static async findById(id) {
    const result = await query(
      `SELECT c.*, u.username as author_username, u.display_name as author_display_name,
              u.avatar as author_avatar
       FROM comments c
       LEFT JOIN users u ON c.author_id = u.id
       WHERE c.id = $1 AND c.is_active = true`,
      [id]
    );
    
    return result.rows.length > 0 ? new Comment(toCamelCase(result.rows[0])) : null;
  }

  /**
   * Find comments by content ID with pagination
   * @param {string} contentId - Content ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Comments and pagination info
   */
  static async findByContentId(contentId, options = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'ASC',
      parentId = null,
      userId // For checking likes
    } = options;

    const offset = (page - 1) * limit;
    let whereConditions = ['c.content_id = $1', 'c.is_active = true'];
    let params = [contentId];
    let paramIndex = 2;

    if (parentId === null) {
      whereConditions.push('c.parent_id IS NULL');
    } else {
      whereConditions.push(`c.parent_id = $${paramIndex}`);
      params.push(parentId);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM comments c WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Build select query
    let selectQuery = `
      SELECT c.*, 
             u.username as author_username, 
             u.display_name as author_display_name,
             u.avatar as author_avatar,
             (SELECT COUNT(*) FROM comments WHERE parent_id = c.id AND is_active = true) as reply_count
    `;
    
    if (userId) {
      selectQuery += `,
        CASE WHEN cl.user_id IS NOT NULL THEN true ELSE false END as is_liked
      `;
    }

    selectQuery += `
      FROM comments c
      LEFT JOIN users u ON c.author_id = u.id
    `;

    if (userId) {
      selectQuery += `
        LEFT JOIN comment_likes cl ON c.id = cl.comment_id AND cl.user_id = $${paramIndex}
      `;
      params.push(userId);
      paramIndex++;
    }

    selectQuery += `
      WHERE ${whereClause}
      ORDER BY c.${sortBy} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const result = await query(selectQuery, [...params, limit, offset]);

    const comments = result.rows.map(row => new Comment(toCamelCase(row)));

    return {
      comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Find replies to a comment
   * @param {string} parentId - Parent comment ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Replies and pagination info
   */
  static async findReplies(parentId, options = {}) {
    return await Comment.findByContentId(null, {
      ...options,
      parentId
    });
  }

  /**
   * Find comments by user ID
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Comments and pagination info
   */
  static async findByUserId(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = options;

    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) FROM comments WHERE author_id = $1 AND is_active = true',
      [userId]
    );
    const total = parseInt(countResult.rows[0].count);

    // Get comments
    const result = await query(
      `SELECT c.*, 
              u.username as author_username, 
              u.display_name as author_display_name,
              u.avatar as author_avatar,
              ct.title as content_title,
              (SELECT COUNT(*) FROM comments WHERE parent_id = c.id AND is_active = true) as reply_count
       FROM comments c
       LEFT JOIN users u ON c.author_id = u.id
       LEFT JOIN content ct ON c.content_id = ct.id
       WHERE c.author_id = $1 AND c.is_active = true
       ORDER BY c.${sortBy} ${sortOrder}
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const comments = result.rows.map(row => new Comment(toCamelCase(row)));

    return {
      comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Update comment
   * @param {string} id - Comment ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Comment|null>} Updated comment
   */
  static async findByIdAndUpdate(id, updateData) {
    const snakeData = toSnakeCase(updateData);
    const fields = Object.keys(snakeData);
    const values = Object.values(snakeData);
    
    if (fields.length === 0) {
      return await Comment.findById(id);
    }

    // Mark as edited if content is being updated
    if (snakeData.content) {
      snakeData.is_edited = true;
      if (!fields.includes('is_edited')) {
        fields.push('is_edited');
        values.push(true);
      }
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const result = await query(
      `UPDATE comments SET ${setClause}, updated_at = NOW() WHERE id = $1 AND is_active = true RETURNING *`,
      [id, ...values]
    );

    return result.rows.length > 0 ? new Comment(toCamelCase(result.rows[0])) : null;
  }

  /**
   * Delete comment (soft delete)
   * @param {string} id - Comment ID
   * @returns {Promise<boolean>} Success status
   */
  static async findByIdAndDelete(id) {
    const result = await query(
      'UPDATE comments SET is_active = false, updated_at = NOW() WHERE id = $1',
      [id]
    );
    return result.rowCount > 0;
  }

  /**
   * Like a comment
   * @param {string} commentId - Comment ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  static async likeComment(commentId, userId) {
    try {
      await transaction(async (client) => {
        // Insert like
        await client.query(
          'INSERT INTO comment_likes (comment_id, user_id) VALUES ($1, $2)',
          [commentId, userId]
        );
        
        // Update like count (handled by trigger)
      });
      return true;
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        return false; // Already liked
      }
      throw error;
    }
  }

  /**
   * Unlike a comment
   * @param {string} commentId - Comment ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  static async unlikeComment(commentId, userId) {
    const result = await query(
      'DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2',
      [commentId, userId]
    );
    return result.rowCount > 0;
  }

  /**
   * Flag a comment
   * @param {string} commentId - Comment ID
   * @param {string} userId - User ID
   * @param {string} reason - Flag reason
   * @returns {Promise<boolean>} Success status
   */
  static async flagComment(commentId, userId, reason) {
    try {
      await query(
        'INSERT INTO comment_flags (comment_id, user_id, reason) VALUES ($1, $2, $3)',
        [commentId, userId, reason]
      );
      return true;
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        return false; // Already flagged
      }
      throw error;
    }
  }

  /**
   * Get comment thread (comment and all its replies)
   * @param {string} commentId - Comment ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Comment thread
   */
  static async getThread(commentId, options = {}) {
    const { userId, maxDepth = 5 } = options;

    // Get the main comment
    const mainComment = await Comment.findById(commentId);
    if (!mainComment) return null;

    // Get all replies recursively
    const getReplies = async (parentId, depth = 0) => {
      if (depth >= maxDepth) return [];

      const repliesResult = await Comment.findByContentId(mainComment.contentId, {
        parentId,
        userId,
        limit: 100 // Get more replies for threads
      });

      const replies = [];
      for (const reply of repliesResult.comments) {
        const nestedReplies = await getReplies(reply.id, depth + 1);
        replies.push({
          ...reply,
          replies: nestedReplies
        });
      }

      return replies;
    };

    const replies = await getReplies(commentId);

    return {
      ...mainComment,
      replies
    };
  }

  /**
   * Get comment statistics
   * @param {string} id - Comment ID
   * @returns {Promise<Object>} Comment statistics
   */
  static async getStats(id) {
    const result = await query(
      `SELECT 
        c.likes,
        (SELECT COUNT(*) FROM comments WHERE parent_id = $1 AND is_active = true) as reply_count,
        (SELECT COUNT(*) FROM comment_flags WHERE comment_id = $1) as flag_count
       FROM comments c
       WHERE c.id = $1`,
      [id]
    );

    return result.rows.length > 0 ? toCamelCase(result.rows[0]) : null;
  }

  /**
   * Get recent comments for a user's content
   * @param {string} userId - User ID (content owner)
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Recent comments and pagination
   */
  static async getRecentForUserContent(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      unreadOnly = false
    } = options;

    const offset = (page - 1) * limit;
    let whereConditions = [
      'ct.uploader_id = $1',
      'c.is_active = true',
      'ct.is_active = true'
    ];
    let params = [userId];
    let paramIndex = 2;

    if (unreadOnly) {
      whereConditions.push('c.is_read = false');
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM comments c 
       JOIN content ct ON c.content_id = ct.id 
       WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get comments
    const result = await query(
      `SELECT c.*, 
              u.username as author_username, 
              u.display_name as author_display_name,
              u.avatar as author_avatar,
              ct.title as content_title,
              ct.id as content_id
       FROM comments c
       JOIN content ct ON c.content_id = ct.id
       LEFT JOIN users u ON c.author_id = u.id
       WHERE ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    const comments = result.rows.map(row => new Comment(toCamelCase(row)));

    return {
      comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Mark comments as read
   * @param {Array} commentIds - Array of comment IDs
   * @returns {Promise<boolean>} Success status
   */
  static async markAsRead(commentIds) {
    if (!commentIds || commentIds.length === 0) return true;

    const placeholders = commentIds.map((_, index) => `$${index + 1}`).join(', ');
    const result = await query(
      `UPDATE comments SET is_read = true WHERE id IN (${placeholders})`,
      commentIds
    );
    return result.rowCount > 0;
  }

  /**
   * Get top-level comments count for content
   * @param {string} contentId - Content ID
   * @returns {Promise<number>} Comment count
   */
  static async getTopLevelCount(contentId) {
    const result = await query(
      'SELECT COUNT(*) FROM comments WHERE content_id = $1 AND parent_id IS NULL AND is_active = true',
      [contentId]
    );
    return parseInt(result.rows[0].count);
  }

  /**
   * Get total comments count for content (including replies)
   * @param {string} contentId - Content ID
   * @returns {Promise<number>} Total comment count
   */
  static async getTotalCount(contentId) {
    const result = await query(
      'SELECT COUNT(*) FROM comments WHERE content_id = $1 AND is_active = true',
      [contentId]
    );
    return parseInt(result.rows[0].count);
  }

  /**
   * Search comments
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results and pagination
   */
  static async search(options = {}) {
    const {
      query: searchQuery,
      contentId,
      authorId,
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = options;

    const offset = (page - 1) * limit;
    let whereConditions = ['c.is_active = true'];
    let params = [];
    let paramIndex = 1;

    if (searchQuery) {
      whereConditions.push(`c.content ILIKE $${paramIndex}`);
      params.push(`%${searchQuery}%`);
      paramIndex++;
    }

    if (contentId) {
      whereConditions.push(`c.content_id = $${paramIndex}`);
      params.push(contentId);
      paramIndex++;
    }

    if (authorId) {
      whereConditions.push(`c.author_id = $${paramIndex}`);
      params.push(authorId);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM comments c WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get comments
    const result = await query(
      `SELECT c.*, 
              u.username as author_username, 
              u.display_name as author_display_name,
              u.avatar as author_avatar,
              ct.title as content_title
       FROM comments c
       LEFT JOIN users u ON c.author_id = u.id
       LEFT JOIN content ct ON c.content_id = ct.id
       WHERE ${whereClause}
       ORDER BY c.${sortBy} ${sortOrder}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    const comments = result.rows.map(row => new Comment(toCamelCase(row)));

    return {
      comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = Comment;