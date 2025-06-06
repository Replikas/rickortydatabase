/**
 * Database Configuration for PostgreSQL
 * 
 * This module provides database connection and query utilities for PostgreSQL,
 * replacing the MongoDB/Mongoose setup.
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL || process.env.POSTGRESQL_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
};

// Create connection pool
const pool = new Pool(dbConfig);

// Handle pool errors
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

/**
 * Execute a query with optional parameters
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query', { text, duration, rows: res.rowCount });
    }
    
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 * @returns {Promise<Object>} Database client
 */
async function getClient() {
  return await pool.connect();
}

/**
 * Execute multiple queries in a transaction
 * @param {Function} callback - Function that receives client and executes queries
 * @returns {Promise<any>} Transaction result
 */
async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Initialize database connection and run migrations if needed
 */
async function initializeDatabase() {
  try {
    // Test connection
    const client = await pool.connect();
    console.log('Connected to PostgreSQL database');
    
    // Check if tables exist
    const result = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users'"
    );
    
    if (result.rows.length === 0) {
      console.log('Database tables not found. Running initial setup...');
      await runMigrations(client);
    }
    
    client.release();
    console.log('Database initialization completed');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

/**
 * Run database migrations
 * @param {Object} client - Database client
 */
async function runMigrations(client) {
  try {
    const migrationPath = path.join(__dirname, '../migrations/postgresql-setup.sql');
    
    if (fs.existsSync(migrationPath)) {
      const sql = fs.readFileSync(migrationPath, 'utf8');
      await client.query(sql);
      console.log('Database migrations completed successfully');
    } else {
      console.warn('Migration file not found:', migrationPath);
    }
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

/**
 * Close all database connections
 */
async function closeDatabase() {
  try {
    await pool.end();
    console.log('Database connections closed');
  } catch (error) {
    console.error('Error closing database connections:', error);
  }
}

/**
 * Helper function to build WHERE clauses for filtering
 * @param {Object} filters - Filter object
 * @param {number} startIndex - Starting parameter index
 * @returns {Object} { whereClause, params, nextIndex }
 */
function buildWhereClause(filters, startIndex = 1) {
  const conditions = [];
  const params = [];
  let paramIndex = startIndex;
  
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        // Handle array values (e.g., tags)
        conditions.push(`${key} && $${paramIndex}`);
        params.push(value);
      } else if (typeof value === 'string' && value.includes('%')) {
        // Handle LIKE queries
        conditions.push(`${key} ILIKE $${paramIndex}`);
        params.push(value);
      } else {
        // Handle exact matches
        conditions.push(`${key} = $${paramIndex}`);
        params.push(value);
      }
      paramIndex++;
    }
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  return {
    whereClause,
    params,
    nextIndex: paramIndex
  };
}

/**
 * Helper function to build pagination
 * @param {number} page - Page number (1-based)
 * @param {number} limit - Items per page
 * @returns {Object} { offset, limit }
 */
function buildPagination(page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  return { offset, limit };
}

/**
 * Helper function to build ORDER BY clause
 * @param {string} sortBy - Field to sort by
 * @param {string} sortOrder - 'ASC' or 'DESC'
 * @returns {string} ORDER BY clause
 */
function buildOrderBy(sortBy = 'created_at', sortOrder = 'DESC') {
  const validOrders = ['ASC', 'DESC'];
  const order = validOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
  return `ORDER BY ${sortBy} ${order}`;
}

/**
 * Convert PostgreSQL row to camelCase object
 * @param {Object} row - PostgreSQL row object
 * @returns {Object} Converted object
 */
function toCamelCase(row) {
  const result = {};
  for (const [key, value] of Object.entries(row)) {
    const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
    result[camelKey] = value;
  }
  return result;
}

/**
 * Convert camelCase object to snake_case for PostgreSQL
 * @param {Object} obj - Object with camelCase keys
 * @returns {Object} Object with snake_case keys
 */
function toSnakeCase(obj) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    result[snakeKey] = value;
  }
  return result;
}

module.exports = {
  pool,
  query,
  getClient,
  transaction,
  initializeDatabase,
  closeDatabase,
  buildWhereClause,
  buildPagination,
  buildOrderBy,
  toCamelCase,
  toSnakeCase
};