/**
 * PostgreSQL Comment Model
 * 
 * This module provides comment-related database operations for PostgreSQL,
 * replacing the Mongoose Comment model.
 */

const { query, transaction, toCamelCase, toSnakeCase } = require('../config/database');

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
      authorName = 'Anonymous',
      contentId,
      parentCommentId = null,
      ipAddress = null,
      userAgent = null
    } = commentData;

    const result = await query(
      `INSERT INTO comments (
        content, author_id, author_name, content_id, parent_comment_id, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [content, authorId, authorName, contentId, parentCommentId, ipAddress, userAgent]
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
      'SELECT * FROM comments WHERE id = $1',
      [id]
    );

    return result.rows.length > 0 ? new Comment(toCamelCase(result.rows[0])) : null;
  }

  /**
   * Get comments for content with pagination
   * @param {string} contentId - Content ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Comments and pagination info
   */
  static async getCommentsForContent(contentId, options = {}) {
    const {
      page = 1,
      limit = 20,
      sort = 'created_at',
      order = 'DESC',
      includeReplies = true
    } = options;

    const offset = (page - 1) * limit;

    // Get top-level comments
    const result = await query(
      `SELECT c.*, u.username, u.avatar,
        (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) as like_count,
        (SELECT COUNT(*) FROM comments WHERE parent_comment_id = c.id AND is_deleted = false) as reply_count
       FROM comments c
       LEFT JOIN users u ON c.author_id = u.id
       WHERE c.content_id = $1 AND c.parent_comment_id IS NULL AND c.is_deleted = false
       ORDER BY c.${sort} ${order}
       LIMIT $2 OFFSET $3`,
      [contentId, limit, offset]
    );

    const comments = result.rows.map(row => new Comment(toCamelCase(row)));

    // Get replies if requested
    if (includeReplies && comments.length > 0) {
      const commentIds = comments.map(c => c.id);
      const repliesResult = await query(
        `SELECT c.*, u.username, u.avatar,
          (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) as like_count
         FROM comments c
         LEFT JOIN users u ON c.author_id = u.id
         WHERE c.parent_comment_id = ANY($1) AND c.is_deleted = false
         ORDER BY c.created_at ASC`,
        [commentIds]
      );

      const repliesMap = {};
      repliesResult.rows.forEach(row => {
        const reply = new Comment(toCamelCase(row));
        if (!repliesMap[reply.parentCommentId]) {
          repliesMap[reply.parentCommentId] = [];
        }
        repliesMap[reply.parentCommentId].push(reply);
      });

      // Attach replies to comments
      comments.forEach(comment => {
        comment.replies = repliesMap[comment.id] || [];
      });
    }

    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) FROM comments WHERE content_id = $1 AND parent_comment_id IS NULL AND is_deleted = false',
      [contentId]
    );
    const total = parseInt(countResult.rows[0].count);

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
   * @returns {Promise<Comment|null>} Updated comment or null
   */
  static async findByIdAndUpdate(id, updateData) {
    const snakeCaseData = toSnakeCase(updateData);
    const fields = Object.keys(snakeCaseData);
    const values = Object.values(snakeCaseData);
    
    if (fields.length === 0) {
      return await Comment.findById(id);
    }

    // Build SET clause
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const result = await query(
      `UPDATE comments SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
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
      `UPDATE comments SET 
        is_deleted = true, 
        deleted_at = CURRENT_TIMESTAMP, 
        content = '[deleted]',
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id]
    );

    return result.rowCount > 0;
  }

  /**
   * Toggle like on comment
   * @param {string} commentId - Comment ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Like status (true if liked, false if unliked)
   */
  static async toggleLike(commentId, userId) {
    const existingLike = await query(
      'SELECT id FROM comment_likes WHERE comment_id = $1 AND user_id = $2',
      [commentId, userId]
    );

    if (existingLike.rows.length > 0) {
      // Unlike
      await query(
        'DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2',
        [commentId, userId]
      );
      return false;
    } else {
      // Like
      await query(
        'INSERT INTO comment_likes (comment_id, user_id) VALUES ($1, $2)',
        [commentId, userId]
      );
      return true;
    }
  }

  /**
   * Flag comment
   * @param {string} commentId - Comment ID
   * @param {string} userId - User ID who flagged
   * @param {string} reason - Flag reason
   * @returns {Promise<boolean>} Success status
   */
  static async flagComment(commentId, userId, reason) {
    try {
      await query(
        'INSERT INTO comment_flags (comment_id, user_id, reason) VALUES ($1, $2, $3)',
        [commentId, userId, reason]
      );
      
      // Update comment flag status
      await query(
        'UPDATE comments SET is_flagged = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [commentId]
      );
      
      return true;
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        return false; // Already flagged by this user
      }
      throw error;
    }
  }

  /**
   * Get comment statistics
   * @param {string} commentId - Comment ID
   * @returns {Promise<Object>} Comment statistics
   */
  static async getStats(commentId) {
    const result = await query(
      `SELECT 
        (SELECT COUNT(*) FROM comment_likes WHERE comment_id = $1) as like_count,
        (SELECT COUNT(*) FROM comments WHERE parent_comment_id = $1 AND is_deleted = false) as reply_count,
        (SELECT COUNT(*) FROM comment_flags WHERE comment_id = $1) as flag_count
      `,
      [commentId]
    );

    return toCamelCase(result.rows[0]);
  }

  /**
   * Get user's comments
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} User's comments
   */
  static async getUserComments(userId, options = {}) {
    const {
      page = 1,
      limit = 10,
      sort = 'created_at',
      order = 'DESC'
    } = options;

    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT c.*, co.title as content_title,
        (SELECT COUNT(*) FROM comment_likes WHERE comment_id = c.id) as like_count,
        (SELECT COUNT(*) FROM comments WHERE parent_comment_id = c.id AND is_deleted = false) as reply_count
       FROM comments c
       LEFT JOIN content co ON c.content_id = co.id
       WHERE c.author_id = $1 AND c.is_deleted = false
       ORDER BY c.${sort} ${order}
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return result.rows.map(row => toCamelCase(row));
  }

  /**
   * Edit comment content
   * @param {string} newContent - New content
   * @returns {Promise<void>}
   */
  async editContent(newContent) {
    // Store edit history
    await query(
      'INSERT INTO comment_edit_history (comment_id, old_content) VALUES ($1, $2)',
      [this.id, this.content]
    );

    // Update comment
    await query(
      'UPDATE comments SET content = $1, is_edited = true, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newContent, this.id]
    );

    this.content = newContent;
    this.isEdited = true;
  }

  /**
   * Get edit history
   * @returns {Promise<Array>} Edit history
   */
  async getEditHistory() {
    const result = await query(
      'SELECT * FROM comment_edit_history WHERE comment_id = $1 ORDER BY created_at DESC',
      [this.id]
    );

    return result.rows.map(row => toCamelCase(row));
  }

  /**
   * Check if user has liked this comment
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Like status
   */
  async isLikedBy(userId) {
    const result = await query(
      'SELECT 1 FROM comment_likes WHERE comment_id = $1 AND user_id = $2',
      [this.id, userId]
    );
    return result.rows.length > 0;
  }

  /**
   * Convert to JSON (safe for API responses)
   * @returns {Object} Safe comment object
   */
  toJSON() {
    const { ipAddress, userAgent, ...safeComment } = this;
    return safeComment;
  }
}

module.exports = Comment;