/**
 * PostgreSQL Content Model
 * 
 * This module provides content-related database operations for PostgreSQL,
 * replacing the Mongoose Content model.
 */

const { query, transaction, toCamelCase, toSnakeCase } = require('../../config/database');

class Content {
  constructor(data) {
    Object.assign(this, data);
  }

  /**
   * Create new content
   * @param {Object} contentData - Content data
   * @returns {Promise<Content>} Created content
   */
  static async create(contentData) {
    const {
      title,
      description,
      type,
      category,
      tags = [],
      imageUrl,
      videoUrl,
      audioUrl,
      uploaderId,
      season,
      episode,
      character,
      location,
      isNsfw = false,
      isPublic = true
    } = contentData;

    const result = await query(
      `INSERT INTO content (
        title, description, type, category, tags, image_url, video_url, audio_url,
        uploader_id, season, episode, character, location, is_nsfw, is_public
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
      [
        title, description, type, category, JSON.stringify(tags), imageUrl,
        videoUrl, audioUrl, uploaderId, season, episode, character, location,
        isNsfw, isPublic
      ]
    );

    const content = new Content(toCamelCase(result.rows[0]));
    // Parse tags back to array
    if (content.tags && typeof content.tags === 'string') {
      content.tags = JSON.parse(content.tags);
    }
    return content;
  }

  /**
   * Find content by ID
   * @param {string} id - Content ID
   * @returns {Promise<Content|null>} Content or null
   */
  static async findById(id) {
    const result = await query(
      `SELECT c.*, u.username as uploader_username, u.display_name as uploader_display_name
       FROM content c
       LEFT JOIN users u ON c.uploader_id = u.id
       WHERE c.id = $1 AND c.is_active = true`,
      [id]
    );
    
    if (result.rows.length === 0) return null;
    
    const content = new Content(toCamelCase(result.rows[0]));
    if (content.tags && typeof content.tags === 'string') {
      content.tags = JSON.parse(content.tags);
    }
    return content;
  }

  /**
   * Find all content with filters and pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Content and pagination info
   */
  static async findAll(options = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      search,
      type,
      category,
      tags,
      uploaderId,
      season,
      episode,
      character,
      location,
      isNsfw,
      isPublic = true,
      userId // For checking likes/favorites
    } = options;

    const offset = (page - 1) * limit;
    let whereConditions = ['c.is_active = true'];
    let params = [];
    let paramIndex = 1;

    if (isPublic !== undefined) {
      whereConditions.push(`c.is_public = $${paramIndex}`);
      params.push(isPublic);
      paramIndex++;
    }

    if (search) {
      whereConditions.push(`(c.title ILIKE $${paramIndex} OR c.description ILIKE $${paramIndex} OR c.character ILIKE $${paramIndex} OR c.location ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (type) {
      whereConditions.push(`c.type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }

    if (category) {
      whereConditions.push(`c.category = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }

    if (tags && tags.length > 0) {
      whereConditions.push(`c.tags::jsonb ?| $${paramIndex}`);
      params.push(tags);
      paramIndex++;
    }

    if (uploaderId) {
      whereConditions.push(`c.uploader_id = $${paramIndex}`);
      params.push(uploaderId);
      paramIndex++;
    }

    if (season !== undefined) {
      whereConditions.push(`c.season = $${paramIndex}`);
      params.push(season);
      paramIndex++;
    }

    if (episode !== undefined) {
      whereConditions.push(`c.episode = $${paramIndex}`);
      params.push(episode);
      paramIndex++;
    }

    if (character) {
      whereConditions.push(`c.character ILIKE $${paramIndex}`);
      params.push(`%${character}%`);
      paramIndex++;
    }

    if (location) {
      whereConditions.push(`c.location ILIKE $${paramIndex}`);
      params.push(`%${location}%`);
      paramIndex++;
    }

    if (isNsfw !== undefined) {
      whereConditions.push(`c.is_nsfw = $${paramIndex}`);
      params.push(isNsfw);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM content c WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Build select query with user interaction data if userId provided
    let selectQuery = `
      SELECT c.*, 
             u.username as uploader_username, 
             u.display_name as uploader_display_name
    `;
    
    if (userId) {
      selectQuery += `,
        CASE WHEN cl.user_id IS NOT NULL THEN true ELSE false END as is_liked,
        CASE WHEN cf.user_id IS NOT NULL THEN true ELSE false END as is_favorited,
        CASE WHEN cb.user_id IS NOT NULL THEN true ELSE false END as is_bookmarked
      `;
    }

    selectQuery += `
      FROM content c
      LEFT JOIN users u ON c.uploader_id = u.id
    `;

    if (userId) {
      selectQuery += `
        LEFT JOIN content_likes cl ON c.id = cl.content_id AND cl.user_id = $${paramIndex}
        LEFT JOIN content_favorites cf ON c.id = cf.content_id AND cf.user_id = $${paramIndex}
        LEFT JOIN content_bookmarks cb ON c.id = cb.content_id AND cb.user_id = $${paramIndex}
      `;
      params.push(userId, userId, userId);
      paramIndex += 3;
    }

    selectQuery += `
      WHERE ${whereClause}
      ORDER BY c.${sortBy} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const result = await query(selectQuery, [...params, limit, offset]);

    const content = result.rows.map(row => {
      const item = new Content(toCamelCase(row));
      if (item.tags && typeof item.tags === 'string') {
        item.tags = JSON.parse(item.tags);
      }
      return item;
    });

    return {
      content,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Update content
   * @param {string} id - Content ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Content|null>} Updated content
   */
  static async findByIdAndUpdate(id, updateData) {
    const snakeData = toSnakeCase(updateData);
    
    // Handle tags array conversion
    if (snakeData.tags && Array.isArray(snakeData.tags)) {
      snakeData.tags = JSON.stringify(snakeData.tags);
    }
    
    const fields = Object.keys(snakeData);
    const values = Object.values(snakeData);
    
    if (fields.length === 0) {
      return await Content.findById(id);
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const result = await query(
      `UPDATE content SET ${setClause}, updated_at = NOW() WHERE id = $1 AND is_active = true RETURNING *`,
      [id, ...values]
    );

    if (result.rows.length === 0) return null;
    
    const content = new Content(toCamelCase(result.rows[0]));
    if (content.tags && typeof content.tags === 'string') {
      content.tags = JSON.parse(content.tags);
    }
    return content;
  }

  /**
   * Delete content (soft delete)
   * @param {string} id - Content ID
   * @returns {Promise<boolean>} Success status
   */
  static async findByIdAndDelete(id) {
    const result = await query(
      'UPDATE content SET is_active = false, updated_at = NOW() WHERE id = $1',
      [id]
    );
    return result.rowCount > 0;
  }

  /**
   * Increment view count
   * @param {string} id - Content ID
   * @returns {Promise<boolean>} Success status
   */
  static async incrementViews(id) {
    const result = await query(
      'UPDATE content SET views = views + 1, updated_at = NOW() WHERE id = $1 AND is_active = true',
      [id]
    );
    return result.rowCount > 0;
  }

  /**
   * Like content
   * @param {string} contentId - Content ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  static async likeContent(contentId, userId) {
    try {
      await transaction(async (client) => {
        // Insert like
        await client.query(
          'INSERT INTO content_likes (content_id, user_id) VALUES ($1, $2)',
          [contentId, userId]
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
   * Unlike content
   * @param {string} contentId - Content ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  static async unlikeContent(contentId, userId) {
    const result = await query(
      'DELETE FROM content_likes WHERE content_id = $1 AND user_id = $2',
      [contentId, userId]
    );
    return result.rowCount > 0;
  }

  /**
   * Add to favorites
   * @param {string} contentId - Content ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  static async addToFavorites(contentId, userId) {
    try {
      await query(
        'INSERT INTO content_favorites (content_id, user_id) VALUES ($1, $2)',
        [contentId, userId]
      );
      return true;
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        return false; // Already favorited
      }
      throw error;
    }
  }

  /**
   * Remove from favorites
   * @param {string} contentId - Content ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  static async removeFromFavorites(contentId, userId) {
    const result = await query(
      'DELETE FROM content_favorites WHERE content_id = $1 AND user_id = $2',
      [contentId, userId]
    );
    return result.rowCount > 0;
  }

  /**
   * Add to bookmarks
   * @param {string} contentId - Content ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  static async addToBookmarks(contentId, userId) {
    try {
      await query(
        'INSERT INTO content_bookmarks (content_id, user_id) VALUES ($1, $2)',
        [contentId, userId]
      );
      return true;
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        return false; // Already bookmarked
      }
      throw error;
    }
  }

  /**
   * Remove from bookmarks
   * @param {string} contentId - Content ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  static async removeFromBookmarks(contentId, userId) {
    const result = await query(
      'DELETE FROM content_bookmarks WHERE content_id = $1 AND user_id = $2',
      [contentId, userId]
    );
    return result.rowCount > 0;
  }

  /**
   * Flag content
   * @param {string} contentId - Content ID
   * @param {string} userId - User ID
   * @param {string} reason - Flag reason
   * @returns {Promise<boolean>} Success status
   */
  static async flagContent(contentId, userId, reason) {
    try {
      await query(
        'INSERT INTO content_flags (content_id, user_id, reason) VALUES ($1, $2, $3)',
        [contentId, userId, reason]
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
   * Get user's favorites
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Favorites and pagination
   */
  static async getUserFavorites(userId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const countResult = await query(
      `SELECT COUNT(*) FROM content_favorites cf 
       JOIN content c ON cf.content_id = c.id 
       WHERE cf.user_id = $1 AND c.is_active = true AND c.is_public = true`,
      [userId]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await query(
      `SELECT c.*, u.username as uploader_username, u.display_name as uploader_display_name,
              cf.created_at as favorited_at
       FROM content_favorites cf
       JOIN content c ON cf.content_id = c.id
       LEFT JOIN users u ON c.uploader_id = u.id
       WHERE cf.user_id = $1 AND c.is_active = true AND c.is_public = true
       ORDER BY cf.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const favorites = result.rows.map(row => {
      const content = new Content(toCamelCase(row));
      if (content.tags && typeof content.tags === 'string') {
        content.tags = JSON.parse(content.tags);
      }
      return content;
    });

    return {
      favorites,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get user's bookmarks
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Bookmarks and pagination
   */
  static async getUserBookmarks(userId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const countResult = await query(
      `SELECT COUNT(*) FROM content_bookmarks cb 
       JOIN content c ON cb.content_id = c.id 
       WHERE cb.user_id = $1 AND c.is_active = true AND c.is_public = true`,
      [userId]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await query(
      `SELECT c.*, u.username as uploader_username, u.display_name as uploader_display_name,
              cb.created_at as bookmarked_at
       FROM content_bookmarks cb
       JOIN content c ON cb.content_id = c.id
       LEFT JOIN users u ON c.uploader_id = u.id
       WHERE cb.user_id = $1 AND c.is_active = true AND c.is_public = true
       ORDER BY cb.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const bookmarks = result.rows.map(row => {
      const content = new Content(toCamelCase(row));
      if (content.tags && typeof content.tags === 'string') {
        content.tags = JSON.parse(content.tags);
      }
      return content;
    });

    return {
      bookmarks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get trending content
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Trending content
   */
  static async getTrending(options = {}) {
    const { limit = 10, timeframe = '7 days' } = options;

    const result = await query(
      `SELECT c.*, u.username as uploader_username, u.display_name as uploader_display_name,
              (c.likes * 2 + c.views * 0.1) as trend_score
       FROM content c
       LEFT JOIN users u ON c.uploader_id = u.id
       WHERE c.is_active = true AND c.is_public = true 
             AND c.created_at > NOW() - INTERVAL '${timeframe}'
       ORDER BY trend_score DESC, c.created_at DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows.map(row => {
      const content = new Content(toCamelCase(row));
      if (content.tags && typeof content.tags === 'string') {
        content.tags = JSON.parse(content.tags);
      }
      return content;
    });
  }

  /**
   * Get content statistics
   * @param {string} id - Content ID
   * @returns {Promise<Object>} Content statistics
   */
  static async getStats(id) {
    const result = await query(
      `SELECT 
        c.views,
        c.likes,
        (SELECT COUNT(*) FROM comments WHERE content_id = $1 AND is_active = true) as comment_count,
        (SELECT COUNT(*) FROM content_favorites WHERE content_id = $1) as favorite_count,
        (SELECT COUNT(*) FROM content_bookmarks WHERE content_id = $1) as bookmark_count,
        (SELECT COUNT(*) FROM content_flags WHERE content_id = $1) as flag_count
       FROM content c
       WHERE c.id = $1`,
      [id]
    );

    return result.rows.length > 0 ? toCamelCase(result.rows[0]) : null;
  }
}

module.exports = Content;