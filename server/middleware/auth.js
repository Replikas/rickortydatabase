const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'rickorty-secret-key-change-in-production';

// Authentication middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user still exists and is active
    const user = await User.findById(decoded.userId).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    // Check if user is banned
    if (user.isBanned && (!user.banExpiresAt || user.banExpiresAt > new Date())) {
      return res.status(403).json({ 
        message: 'Account is banned',
        reason: user.banReason,
        expiresAt: user.banExpiresAt
      });
    }

    req.user = decoded;
    req.userDoc = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      req.user = null;
      req.userDoc = null;
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user still exists and is active
    const user = await User.findById(decoded.userId).select('-password');
    if (!user || !user.isActive) {
      req.user = null;
      req.userDoc = null;
      return next();
    }

    // Check if user is banned
    if (user.isBanned && (!user.banExpiresAt || user.banExpiresAt > new Date())) {
      req.user = null;
      req.userDoc = null;
      return next();
    }

    req.user = decoded;
    req.userDoc = user;
    next();
  } catch (error) {
    req.user = null;
    req.userDoc = null;
    next();
  }
};

// Admin middleware
const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {});
    
    if (!req.userDoc || req.userDoc.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authorization failed' });
  }
};

// Moderator middleware
const moderatorAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {});
    
    if (!req.userDoc || !['admin', 'moderator'].includes(req.userDoc.role)) {
      return res.status(403).json({ message: 'Moderator access required' });
    }
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authorization failed' });
  }
};

module.exports = {
  auth,
  optionalAuth,
  adminAuth,
  moderatorAuth
};