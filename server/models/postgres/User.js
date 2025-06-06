/**
 * PostgreSQL User Model
 * 
 * This module provides user-related database operations for PostgreSQL,
 * replacing the Mongoose User model.
 */

const { query, transaction, toCamelCase, toSnakeCase } = require('../../config/database');
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
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows.length > 0 ? new User(toCamelCase(result.rows[0])) : null;
  }

  /**
   * Find user by username
   * @param {string} username - Username
   * @returns {Promise<User|null>} User or null
   */
  static async findByUsername(username) {
    const result = await query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows.length > 0 ? new User(toCamelCase(result.rows[0])) : null;
  }

  /**
   * Find user by email
   * @param {string} email - Email
   * @returns {Promise<User|null>} User or null
   */
  static async findByEmail(email) {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
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
   * Get all users with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Users and pagination info
   */
  static async findAll(options = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      search,
      role,
      isActive = true
    } = options;

    const offset = (page - 1) * limit;
    let whereConditions = ['is_active = $1'];
    let params = [isActive];
    let paramIndex = 2;

    if (search) {
      whereConditions.push(`(username ILIKE $${paramIndex} OR display_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (role) {
      whereConditions.push(`role = $${paramIndex}`);
      params.push(role);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM users WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get users
    const result = await query(
      `SELECT * FROM users WHERE ${whereClause} ORDER BY ${sortBy} ${sortOrder} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
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
   * Update user
   * @param {string} id - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<User|null>} Updated user
   */
  static async findByIdAndUpdate(id, updateData) {
    const snakeData = toSnakeCase(updateData);
    const fields = Object.keys(snakeData);
    const values = Object.values(snakeData);
    
    if (fields.length === 0) {
      return await User.findById(id);
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const result = await query(
      `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    return result.rows.length > 0 ? new User(toCamelCase(result.rows[0])) : null;
  }

  /**
   * Delete user (soft delete)
   * @param {string} id - User ID
   * @returns {Promise<boolean>} Success status
   */
  static async findByIdAndDelete(id) {
    const result = await query(
      'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1',
      [id]
    );
    return result.rowCount > 0;
  }

  /**
   * Compare password
   * @param {string} candidatePassword - Password to compare
   * @returns {Promise<boolean>} Password match status
   */
  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  }

  /**
   * Update password
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} Success status
   */
  async updatePassword(newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const result = await query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, this.id]
    );
    return result.rowCount > 0;
  }

  /**
   * Follow a user
   * @param {string} userId - User ID to follow
   * @returns {Promise<boolean>} Success status
   */
  async followUser(userId) {
    try {
      await query(
        'INSERT INTO user_follows (follower_id, following_id) VALUES ($1, $2)',
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
  async unfollowUser(userId) {
    const result = await query(
      'DELETE FROM user_follows WHERE follower_id = $1 AND following_id = $2',
      [this.id, userId]
    );
    return result.rowCount > 0;
  }

  /**
   * Block a user
   * @param {string} userId - User ID to block
   * @returns {Promise<boolean>} Success status
   */
  async blockUser(userId) {
    try {
      await transaction(async (client) => {
        // Remove follow relationships
        await client.query(
          'DELETE FROM user_follows WHERE (follower_id = $1 AND following_id = $2) OR (follower_id = $2 AND following_id = $1)',
          [this.id, userId]
        );
        
        // Add block relationship
        await client.query(
          'INSERT INTO user_blocks (blocker_id, blocked_id) VALUES ($1, $2)',
          [this.id, userId]
        );
      });
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
  async unblockUser(userId) {
    const result = await query(
      'DELETE FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2',
      [this.id, userId]
    );
    return result.rowCount > 0;
  }

  /**
   * Get user's followers
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Followers and pagination
   */
  async getFollowers(options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const countResult = await query(
      'SELECT COUNT(*) FROM user_follows uf JOIN users u ON uf.follower_id = u.id WHERE uf.following_id = $1 AND u.is_active = true',
      [this.id]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await query(
      `SELECT u.* FROM user_follows uf 
       JOIN users u ON uf.follower_id = u.id 
       WHERE uf.following_id = $1 AND u.is_active = true 
       ORDER BY uf.created_at DESC 
       LIMIT $2 OFFSET $3`,
      [this.id, limit, offset]
    );

    const followers = result.rows.map(row => new User(toCamelCase(row)));

    return {
      followers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get users that this user is following
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Following and pagination
   */
  async getFollowing(options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const countResult = await query(
      'SELECT COUNT(*) FROM user_follows uf JOIN users u ON uf.following_id = u.id WHERE uf.follower_id = $1 AND u.is_active = true',
      [this.id]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await query(
      `SELECT u.* FROM user_follows uf 
       JOIN users u ON uf.following_id = u.id 
       WHERE uf.follower_id = $1 AND u.is_active = true 
       ORDER BY uf.created_at DESC 
       LIMIT $2 OFFSET $3`,
      [this.id, limit, offset]
    );

    const following = result.rows.map(row => new User(toCamelCase(row)));

    return {
      following,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Check if user is following another user
   * @param {string} userId - User ID to check
   * @returns {Promise<boolean>} Following status
   */
  async isFollowing(userId) {
    const result = await query(
      'SELECT 1 FROM user_follows WHERE follower_id = $1 AND following_id = $2',
      [this.id, userId]
    );
    return result.rows.length > 0;
  }

  /**
   * Check if user is blocked by another user
   * @param {string} userId - User ID to check
   * @returns {Promise<boolean>} Blocked status
   */
  async isBlockedBy(userId) {
    const result = await query(
      'SELECT 1 FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2',
      [userId, this.id]
    );
    return result.rows.length > 0;
  }

  /**
   * Get user statistics
   * @returns {Promise<Object>} User statistics
   */
  async getStats() {
    const result = await query(
      `SELECT 
        (SELECT COUNT(*) FROM content WHERE uploader_id = $1 AND is_active = true) as upload_count,
        (SELECT COUNT(*) FROM content_likes cl JOIN content c ON cl.content_id = c.id WHERE cl.user_id = $1 AND c.is_active = true) as likes_given,
        (SELECT COUNT(*) FROM user_follows WHERE follower_id = $1) as following_count,
        (SELECT COUNT(*) FROM user_follows WHERE following_id = $1) as followers_count,
        (SELECT COALESCE(SUM(c.likes), 0) FROM content c WHERE c.uploader_id = $1 AND c.is_active = true) as total_likes_received,
        (SELECT COALESCE(SUM(c.views), 0) FROM content c WHERE c.uploader_id = $1 AND c.is_active = true) as total_views
      `,
      [this.id]
    );

    return toCamelCase(result.rows[0]);
  }

  /**
   * Convert to JSON (remove sensitive fields)
   * @returns {Object} Safe user object
   */
  toJSON() {
    const { password, ...safeUser } = this;
    return safeUser;
  }
}

module.exports = User;