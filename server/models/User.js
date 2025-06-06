/**
 * PostgreSQL User Model
 * 
 * This module provides user-related database operations for PostgreSQL,
 * replacing the Mongoose User model.
 */

const { query, transaction, toCamelCase, toSnakeCase } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  constructor(data) {
    Object.assign(this, data);
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<User>} Created user
   */
  static async create(userData) {
    const {
      username,
      email,
      password,
      displayName,
      bio,
      avatar,
      role = 'user'
    } = userData;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await query(
      `INSERT INTO users (
        username, email, password, display_name, bio, avatar, role
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [username, email, hashedPassword, displayName, bio, avatar, role]
    );

    return new User(toCamelCase(result.rows[0]));
  }

  /**
   * Find user by ID
   * @param {string} id - User ID
   * @returns {Promise<User|null>} User or null
   */
  static async findById(id) {
    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );

    return result.rows.length > 0 ? new User(toCamelCase(result.rows[0])) : null;
  }

  /**
   * Find user by username
   * @param {string} username - Username
   * @returns {Promise<User|null>} User or null
   */
  static async findByUsername(username) {
    const result = await query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    return result.rows.length > 0 ? new User(toCamelCase(result.rows[0])) : null;
  }

  /**
   * Find user by email
   * @param {string} email - Email
   * @returns {Promise<User|null>} User or null
   */
  static async findByEmail(email) {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    return result.rows.length > 0 ? new User(toCamelCase(result.rows[0])) : null;
  }

  /**
   * Find user by username or email
   * @param {string} identifier - Username or email
   * @returns {Promise<User|null>} User or null
   */
  static async findByUsernameOrEmail(identifier) {
    const result = await query(
      'SELECT * FROM users WHERE username = $1 OR email = $1',
      [identifier]
    );

    return result.rows.length > 0 ? new User(toCamelCase(result.rows[0])) : null;
  }

  /**
   * Update user
   * @param {string} id - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<User|null>} Updated user or null
   */
  static async findByIdAndUpdate(id, updateData) {
    const snakeCaseData = toSnakeCase(updateData);
    const fields = Object.keys(snakeCaseData);
    const values = Object.values(snakeCaseData);
    
    if (fields.length === 0) {
      return await User.findById(id);
    }

    // Build SET clause
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const result = await query(
      `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    return result.rows.length > 0 ? new User(toCamelCase(result.rows[0])) : null;
  }

  /**
   * Delete user
   * @param {string} id - User ID
   * @returns {Promise<boolean>} Success status
   */
  static async findByIdAndDelete(id) {
    const result = await query(
      'DELETE FROM users WHERE id = $1',
      [id]
    );

    return result.rowCount > 0;
  }

  /**
   * Get all users with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Users and pagination info
   */
  static async find(options = {}) {
    const {
      page = 1,
      limit = 10,
      sort = 'created_at',
      order = 'DESC',
      search = '',
      role = null
    } = options;

    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    // Add search filter
    if (search) {
      paramCount++;
      whereClause += ` AND (username ILIKE $${paramCount} OR email ILIKE $${paramCount} OR display_name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Add role filter
    if (role) {
      paramCount++;
      whereClause += ` AND role = $${paramCount}`;
      params.push(role);
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM users ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get users
    const result = await query(
      `SELECT * FROM users ${whereClause} ORDER BY ${sort} ${order} LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...params, limit, offset]
    );

    const users = result.rows.map(row => new User(toCamelCase(row)));

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Count users
   * @param {Object} filter - Filter criteria
   * @returns {Promise<number>} User count
   */
  static async countDocuments(filter = {}) {
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    Object.entries(filter).forEach(([key, value]) => {
      paramCount++;
      whereClause += ` AND ${toSnakeCase({ [key]: value })[key]} = $${paramCount}`;
      params.push(value);
    });

    const result = await query(
      `SELECT COUNT(*) FROM users ${whereClause}`,
      params
    );

    return parseInt(result.rows[0].count);
  }

  /**
   * Compare password
   * @param {string} candidatePassword - Password to compare
   * @returns {Promise<boolean>} Match status
   */
  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  }

  /**
   * Update password
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  async updatePassword(newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, this.id]
    );
    this.password = hashedPassword;
  }

  /**
   * Get user stats
   * @returns {Promise<Object>} User statistics
   */
  async getStats() {
    const result = await query(
      `SELECT 
        (SELECT COUNT(*) FROM content WHERE author_id = $1) as content_count,
        (SELECT COUNT(*) FROM comments WHERE author_id = $1) as comment_count,
        (SELECT COUNT(*) FROM user_follows WHERE follower_id = $1) as following_count,
        (SELECT COUNT(*) FROM user_follows WHERE followed_id = $1) as followers_count,
        (SELECT COUNT(*) FROM content_likes cl JOIN content c ON cl.content_id = c.id WHERE c.author_id = $1) as total_likes_received
      `,
      [this.id]
    );

    return toCamelCase(result.rows[0]);
  }

  /**
   * Follow another user
   * @param {string} userId - User ID to follow
   * @returns {Promise<boolean>} Success status
   */
  async follow(userId) {
    try {
      await query(
        'INSERT INTO user_follows (follower_id, followed_id) VALUES ($1, $2)',
        [this.id, userId]
      );
      return true;
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        return false; // Already following
      }
      throw error;
    }
  }

  /**
   * Unfollow a user
   * @param {string} userId - User ID to unfollow
   * @returns {Promise<boolean>} Success status
   */
  async unfollow(userId) {
    const result = await query(
      'DELETE FROM user_follows WHERE follower_id = $1 AND followed_id = $2',
      [this.id, userId]
    );
    return result.rowCount > 0;
  }

  /**
   * Check if following a user
   * @param {string} userId - User ID to check
   * @returns {Promise<boolean>} Following status
   */
  async isFollowing(userId) {
    const result = await query(
      'SELECT 1 FROM user_follows WHERE follower_id = $1 AND followed_id = $2',
      [this.id, userId]
    );
    return result.rows.length > 0;
  }

  /**
   * Block a user
   * @param {string} userId - User ID to block
   * @returns {Promise<boolean>} Success status
   */
  async block(userId) {
    try {
      await query(
        'INSERT INTO user_blocks (blocker_id, blocked_id) VALUES ($1, $2)',
        [this.id, userId]
      );
      
      // Remove any existing follow relationships
      await query(
        'DELETE FROM user_follows WHERE (follower_id = $1 AND followed_id = $2) OR (follower_id = $2 AND followed_id = $1)',
        [this.id, userId]
      );
      
      return true;
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        return false; // Already blocked
      }
      throw error;
    }
  }

  /**
   * Unblock a user
   * @param {string} userId - User ID to unblock
   * @returns {Promise<boolean>} Success status
   */
  async unblock(userId) {
    const result = await query(
      'DELETE FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2',
      [this.id, userId]
    );
    return result.rowCount > 0;
  }

  /**
   * Check if blocking a user
   * @param {string} userId - User ID to check
   * @returns {Promise<boolean>} Blocking status
   */
  async isBlocking(userId) {
    const result = await query(
      'SELECT 1 FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2',
      [this.id, userId]
    );
    return result.rows.length > 0;
  }

  /**
   * Get user's content
   * @param {Object} options - Query options
   * @returns {Promise<Array>} User's content
   */
  async getContent(options = {}) {
    const {
      page = 1,
      limit = 10,
      type = null,
      sort = 'created_at',
      order = 'DESC'
    } = options;

    const offset = (page - 1) * limit;
    let whereClause = 'WHERE author_id = $1';
    const params = [this.id];
    let paramCount = 1;

    if (type) {
      paramCount++;
      whereClause += ` AND type = $${paramCount}`;
      params.push(type);
    }

    const result = await query(
      `SELECT c.*, u.username, u.display_name, u.avatar,
        (SELECT COUNT(*) FROM content_likes WHERE content_id = c.id) as like_count,
        (SELECT COUNT(*) FROM comments WHERE content_id = c.id) as comment_count
       FROM content c
       JOIN users u ON c.author_id = u.id
       ${whereClause}
       ORDER BY c.${sort} ${order}
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      [...params, limit, offset]
    );

    return result.rows.map(row => toCamelCase(row));
  }

  /**
   * Convert to JSON (remove sensitive data)
   * @returns {Object} Safe user object
   */
  toJSON() {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }

  /**
   * Get public profile
   * @returns {Object} Public user data
   */
  getPublicProfile() {
    const {
      id,
      username,
      displayName,
      bio,
      avatar,
      role,
      createdAt,
      isVerified
    } = this;

    return {
      id,
      username,
      displayName,
      bio,
      avatar,
      role,
      createdAt,
      isVerified
    };
  }
}

module.exports = User;