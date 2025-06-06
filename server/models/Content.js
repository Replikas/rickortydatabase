/**
 * PostgreSQL Content Model
 * 
 * This module provides content-related database operations for PostgreSQL,
 * replacing the Mongoose Content model.
 */

const { query, transaction, toCamelCase, toSnakeCase } = require('../config/database');

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

    return new Content(toCamelCase(result.rows[0]));
  }

  /**
   * Find content by ID
   * @param {string} id - Content ID
   * @returns {Promise<Content|null>} Content or null
   */
  static async findById(id) {
    const result = await query(
      `SELECT c.*, u.username, u.display_name, u.avatar,
        (SELECT COUNT(*) FROM content_likes WHERE content_id = c.id) as like_count,
        (SELECT COUNT(*) FROM content_views WHERE content_id = c.id) as view_count,
        (SELECT COUNT(*) FROM comments WHERE content_id = c.id AND is_deleted = false) as comment_count
       FROM content c
       LEFT JOIN users u ON c.uploader_id = u.id
       WHERE c.id = $1`,
      [id]
    );

    return result.rows.length > 0 ? new Content(toCamelCase(result.rows[0])) : null;
  }

  /**
   * Get all content with pagination and filters
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Content and pagination info
   */
  static async find(options = {}) {
    const {
      page = 1,
      limit = 12,
      type = null,
      category = null,
      tags = [],
      search = '',
      sort = 'created_at',
      order = 'DESC',
      isNsfw = null,
      uploaderId = null
    } = options;

    const offset = (page - 1) * limit;
    let whereClause = 'WHERE c.is_public = true';
    const params = [];
    let paramCount = 0;

    // Add filters
    if (type) {
      paramCount++;
      whereClause += ` AND c.type = $${paramCount}`;
      params.push(type);
    }

    if (category) {
      paramCount++;
      whereClause += ` AND c.category = $${paramCount}`;
      params.push(category);
    }

    if (tags.length > 0) {
      paramCount++;
      whereClause += ` AND c.tags::jsonb ?| $${paramCount}`;
      params.push(tags);
    }

    if (search) {
      paramCount++;
      whereClause += ` AND (c.title ILIKE $${paramCount} OR c.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (isNsfw !== null) {
      paramCount++;
      whereClause += ` AND c.is_nsfw = $${paramCount}`;
      params.push(isNsfw);
    }

    if (uploaderId) {
      paramCount++;
      whereClause += ` AND c.uploader_id = $${paramCount}`;
      params.push(uploaderId);
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM content c ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get content
    const result = await query(
      `SELECT c.*, u.username, u.display_name, u.avatar,
        (SELECT COUNT(*) FROM content_likes WHERE content_id = c.id) as like_count,
        (SELECT COUNT(*) FROM content_views WHERE content_id = c.id) as view_count,
        (SELECT COUNT(*) FROM comments WHERE content_id = c.id AND is_deleted = false) as comment_count
       FROM content c
       LEFT JOIN users u ON c.uploader_id = u.id
       ${whereClause}
       ORDER BY c.${sort} ${order}
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...params, limit, offset]
    );

    const content = result.rows.map(row => new Content(toCamelCase(row)));

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
   * @returns {Promise<Content|null>} Updated content or null
   */
  static async findByIdAndUpdate(id, updateData) {
    const snakeCaseData = toSnakeCase(updateData);
    const fields = Object.keys(snakeCaseData);
    const values = Object.values(snakeCaseData);
    
    if (fields.length === 0) {
      return await Content.findById(id);
    }

    // Handle tags separately if present
    if (snakeCaseData.tags) {
      const tagIndex = fields.indexOf('tags');
      values[tagIndex] = JSON.stringify(snakeCaseData.tags);
    }

    // Build SET clause
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const result = await query(
      `UPDATE content SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    return result.rows.length > 0 ? new Content(toCamelCase(result.rows[0])) : null;
  }

  /**
   * Delete content
   * @param {string} id - Content ID
   * @returns {Promise<boolean>} Success status
   */
  static async findByIdAndDelete(id) {
    const result = await query(
      'DELETE FROM content WHERE id = $1',
      [id]
    );

    return result.rowCount > 0;
  }

  /**
   * Toggle like on content
   * @param {string} contentId - Content ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Like status (true if liked, false if unliked)
   */
  static async toggleLike(contentId, userId) {
    const existingLike = await query(
      'SELECT id FROM content_likes WHERE content_id = $1 AND user_id = $2',
      [contentId, userId]
    );

    if (existingLike.rows.length > 0) {
      // Unlike
      await query(
        'DELETE FROM content_likes WHERE content_id = $1 AND user_id = $2',
        [contentId, userId]
      );
      return false;
    } else {
      // Like
      await query(
        'INSERT INTO content_likes (content_id, user_id) VALUES ($1, $2)',
        [contentId, userId]
      );
      return true;
    }
  }

  /**
   * Record content view
   * @param {string} contentId - Content ID
   * @param {string} userId - User ID (optional)
   * @param {string} ipAddress - IP address
   * @returns {Promise<void>}
   */
  static async recordView(contentId, userId = null, ipAddress = null) {
    // Check if view already exists for this user/IP in the last hour
    const existingView = await query(
      `SELECT id FROM content_views 
       WHERE content_id = $1 
       AND (user_id = $2 OR ip_address = $3) 
       AND created_at > NOW() - INTERVAL '1 hour'`,
      [contentId, userId, ipAddress]
    );

    if (existingView.rows.length === 0) {
      await query(
        'INSERT INTO content_views (content_id, user_id, ip_address) VALUES ($1, $2, $3)',
        [contentId, userId, ipAddress]
      );
    }
  }

  /**
   * Get trending content
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Trending content
   */
  static async getTrending(options = {}) {
    const {
      limit = 10,
      timeframe = '7 days',
      type = null
    } = options;

    let whereClause = 'WHERE c.is_public = true AND c.created_at > NOW() - INTERVAL $1';
    const params = [timeframe];
    let paramCount = 1;

    if (type) {
      paramCount++;
      whereClause += ` AND c.type = $${paramCount}`;
      params.push(type);
    }

    const result = await query(
      `SELECT c.*, u.username, u.display_name, u.avatar,
        COUNT(cl.id) as like_count,
        COUNT(cv.id) as view_count,
        COUNT(co.id) as comment_count,
        (COUNT(cl.id) * 3 + COUNT(cv.id) + COUNT(co.id) * 2) as trending_score
       FROM content c
       LEFT JOIN users u ON c.uploader_id = u.id
       LEFT JOIN content_likes cl ON c.id = cl.content_id
       LEFT JOIN content_views cv ON c.id = cv.content_id
       LEFT JOIN comments co ON c.id = co.content_id AND co.is_deleted = false
       ${whereClause}
       GROUP BY c.id, u.id
       ORDER BY trending_score DESC, c.created_at DESC
       LIMIT $${paramCount + 1}`,
      [...params, limit]
    );

    return result.rows.map(row => new Content(toCamelCase(row)));
  }

  /**
   * Get content by user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} User's content
   */
  static async getByUser(userId, options = {}) {
    const {
      page = 1,
      limit = 12,
      type = null,
      sort = 'created_at',
      order = 'DESC'
    } = options;

    const offset = (page - 1) * limit;
    let whereClause = 'WHERE c.uploader_id = $1';
    const params = [userId];
    let paramCount = 1;

    if (type) {
      paramCount++;
      whereClause += ` AND c.type = $${paramCount}`;
      params.push(type);
    }

    const result = await query(
      `SELECT c.*, u.username, u.display_name, u.avatar,
        (SELECT COUNT(*) FROM content_likes WHERE content_id = c.id) as like_count,
        (SELECT COUNT(*) FROM content_views WHERE content_id = c.id) as view_count,
        (SELECT COUNT(*) FROM comments WHERE content_id = c.id AND is_deleted = false) as comment_count
       FROM content c
       LEFT JOIN users u ON c.uploader_id = u.id
       ${whereClause}
       ORDER BY c.${sort} ${order}
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...params, limit, offset]
    );

    return result.rows.map(row => new Content(toCamelCase(row)));
  }

  /**
   * Search content
   * @param {string} searchTerm - Search term
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Search results
   */
  static async search(searchTerm, options = {}) {
    const {
      page = 1,
      limit = 12,
      type = null,
      category = null,
      tags = []
    } = options;

    const offset = (page - 1) * limit;
    let whereClause = `WHERE c.is_public = true AND (
      c.title ILIKE $1 OR 
      c.description ILIKE $1 OR 
      c.character ILIKE $1 OR 
      c.location ILIKE $1
    )`;
    const params = [`%${searchTerm}%`];
    let paramCount = 1;

    if (type) {
      paramCount++;
      whereClause += ` AND c.type = $${paramCount}`;
      params.push(type);
    }

    if (category) {
      paramCount++;
      whereClause += ` AND c.category = $${paramCount}`;
      params.push(category);
    }

    if (tags.length > 0) {
      paramCount++;
      whereClause += ` AND c.tags::jsonb ?| $${paramCount}`;
      params.push(tags);
    }

    const result = await query(
      `SELECT c.*, u.username, u.display_name, u.avatar,
        (SELECT COUNT(*) FROM content_likes WHERE content_id = c.id) as like_count,
        (SELECT COUNT(*) FROM content_views WHERE content_id = c.id) as view_count,
        (SELECT COUNT(*) FROM comments WHERE content_id = c.id AND is_deleted = false) as comment_count
       FROM content c
       LEFT JOIN users u ON c.uploader_id = u.id
       ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...params, limit, offset]
    );

    return result.rows.map(row => new Content(toCamelCase(row)));
  }

  /**
   * Get content statistics
   * @param {string} contentId - Content ID
   * @returns {Promise<Object>} Content statistics
   */
  static async getStats(contentId) {
    const result = await query(
      `SELECT 
        (SELECT COUNT(*) FROM content_likes WHERE content_id = $1) as like_count,
        (SELECT COUNT(*) FROM content_views WHERE content_id = $1) as view_count,
        (SELECT COUNT(*) FROM comments WHERE content_id = $1 AND is_deleted = false) as comment_count,
        (SELECT COUNT(*) FROM content_favorites WHERE content_id = $1) as favorite_count
      `,
      [contentId]
    );

    return toCamelCase(result.rows[0]);
  }

  /**
   * Get related content
   * @param {string} contentId - Content ID
   * @param {number} limit - Number of related items
   * @returns {Promise<Array>} Related content
   */
  static async getRelated(contentId, limit = 6) {
    const content = await Content.findById(contentId);
    if (!content) return [];

    const result = await query(
      `SELECT c.*, u.username, u.display_name, u.avatar,
        (SELECT COUNT(*) FROM content_likes WHERE content_id = c.id) as like_count,
        (SELECT COUNT(*) FROM content_views WHERE content_id = c.id) as view_count
       FROM content c
       LEFT JOIN users u ON c.uploader_id = u.id
       WHERE c.id != $1 
       AND c.is_public = true
       AND (
         c.type = $2 OR 
         c.category = $3 OR 
         c.character = $4 OR 
         c.location = $5 OR
         c.tags::jsonb ?| $6
       )
       ORDER BY RANDOM()
       LIMIT $7`,
      [
        contentId, 
        content.type, 
        content.category, 
        content.character, 
        content.location,
        JSON.parse(content.tags || '[]'),
        limit
      ]
    );

    return result.rows.map(row => new Content(toCamelCase(row)));
  }

  /**
   * Check if user has liked this content
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Like status
   */
  async isLikedBy(userId) {
    const result = await query(
      'SELECT 1 FROM content_likes WHERE content_id = $1 AND user_id = $2',
      [this.id, userId]
    );
    return result.rows.length > 0;
  }

  /**
   * Check if user has favorited this content
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Favorite status
   */
  async isFavoritedBy(userId) {
    const result = await query(
      'SELECT 1 FROM content_favorites WHERE content_id = $1 AND user_id = $2',
      [this.id, userId]
    );
    return result.rows.length > 0;
  }

  /**
   * Toggle favorite on content
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Favorite status (true if favorited, false if unfavorited)
   */
  async toggleFavorite(userId) {
    const existingFavorite = await query(
      'SELECT id FROM content_favorites WHERE content_id = $1 AND user_id = $2',
      [this.id, userId]
    );

    if (existingFavorite.rows.length > 0) {
      // Unfavorite
      await query(
        'DELETE FROM content_favorites WHERE content_id = $1 AND user_id = $2',
        [this.id, userId]
      );
      return false;
    } else {
      // Favorite
      await query(
        'INSERT INTO content_favorites (content_id, user_id) VALUES ($1, $2)',
        [this.id, userId]
      );
      return true;
    }
  }

  /**
   * Get content tags as array
   * @returns {Array} Tags array
   */
  getTagsArray() {
    try {
      return JSON.parse(this.tags || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Convert to JSON (safe for API responses)
   * @returns {Object} Safe content object
   */
  toJSON() {
    const contentObj = { ...this };
    
    // Parse tags if it's a string
    if (typeof contentObj.tags === 'string') {
      try {
        contentObj.tags = JSON.parse(contentObj.tags);
      } catch {
        contentObj.tags = [];
      }
    }
    
    return contentObj;
  }
}

module.exports = Content;
    required: true
  },
  thumbnailUrl: {
    type: String // For art only
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  rating: {
    type: String,
    enum: ['G', 'PG', 'T', 'M', 'E', 'XXX'],
    default: 'T'
  },
  warnings: [{
    type: String,
    enum: ['NSFW', 'Gore', 'Noncon', 'Kink', 'Other']
  }],
  description: {
    type: String,
    maxlength: 2000
  },
  isNSFW: {
    type: Boolean,
    default: false
  },
  isAnonymized: {
    type: Boolean,
    default: false
  },
  uploader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow anonymous uploads
  },
  uploaderIP: {
    type: String,
    required: true
  },
  likes: {
    type: Number,
    default: 0
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  views: {
    type: Number,
    default: 0
  },
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  bookmarkedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  flagged: {
    type: Boolean,
    default: false
  },
  flagReason: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    width: Number, // For images
    height: Number, // For images
    duration: Number, // For GIFs
    wordCount: Number, // For fics
    chapters: Number // For fics
  }
}, {
  timestamps: true
});

// Indexes for better search performance
contentSchema.index({ contentType: 1, createdAt: -1 });
contentSchema.index({ tags: 1 });
contentSchema.index({ rating: 1 });
contentSchema.index({ warnings: 1 });
contentSchema.index({ isNSFW: 1 });
contentSchema.index({ title: 'text', description: 'text', tags: 'text' });
contentSchema.index({ likes: -1 });
contentSchema.index({ views: -1 });

// Virtual for display author
contentSchema.virtual('displayAuthor').get(function() {
  if (this.isAnonymized) {
    return 'Anonymous';
  }
  return this.author || 'Anonymous';
});

// Method to increment views
contentSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Method to toggle like
contentSchema.methods.toggleLike = function(userId) {
  const index = this.likedBy.indexOf(userId);
  if (index > -1) {
    this.likedBy.splice(index, 1);
    this.likes -= 1;
  } else {
    this.likedBy.push(userId);
    this.likes += 1;
  }
  return this.save();
};

module.exports = mongoose.model('Content', contentSchema);