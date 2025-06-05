const express = require('express');
const { body, query, validationResult } = require('express-validator');
const User = require('../models/User');
const Content = require('../models/Content');
const Comment = require('../models/Comment');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/:username', optionalAuth, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .populate({
        path: 'uploads',
        match: { isActive: true },
        select: 'title contentType createdAt likes views thumbnailUrl fileUrl rating isNSFW',
        options: { sort: { createdAt: -1 } }
      });

    if (!user || !user.isActive) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if current user is viewing their own profile
    const isOwnProfile = req.user && req.user.userId === user._id.toString();
    
    // Check if current user is following this user
    let isFollowing = false;
    if (req.user && req.userDoc) {
      isFollowing = req.userDoc.following.includes(user._id);
    }

    const profileData = {
      ...user.getPublicProfile(),
      uploads: user.uploads,
      followersCount: user.followers.length,
      followingCount: user.following.length,
      isFollowing
    };

    // Add private info if viewing own profile
    if (isOwnProfile) {
      const fullUser = await User.findById(user._id)
        .populate('favorites', 'title contentType author createdAt thumbnailUrl fileUrl')
        .populate('bookmarks', 'title contentType author createdAt thumbnailUrl fileUrl');
      
      profileData.email = fullUser.email;
      profileData.preferences = fullUser.preferences;
      profileData.favorites = fullUser.favorites;
      profileData.bookmarks = fullUser.bookmarks;
    }

    res.json({ user: profileData });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's content with pagination
router.get('/:username/content', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('contentType')
    .optional()
    .isIn(['art', 'fic'])
    .withMessage('Content type must be art or fic')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, limit = 20, contentType, sortBy = 'newest' } = req.query;
    
    const user = await User.findOne({ username: req.params.username });
    if (!user || !user.isActive) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Build filter
    const filter = {
      uploader: user._id,
      isActive: true
    };
    
    if (contentType) {
      filter.contentType = contentType;
    }

    // Build sort
    let sort = {};
    switch (sortBy) {
      case 'oldest':
        sort = { createdAt: 1 };
        break;
      case 'popular':
        sort = { likes: -1, createdAt: -1 };
        break;
      case 'views':
        sort = { views: -1, createdAt: -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [content, total] = await Promise.all([
      Content.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-uploaderIP'),
      Content.countDocuments(filter)
    ]);

    res.json({
      content,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get user content error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Follow/unfollow user
router.post('/:username/follow', auth, async (req, res) => {
  try {
    const targetUser = await User.findOne({ username: req.params.username });
    if (!targetUser || !targetUser.isActive) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (targetUser._id.equals(req.user.userId)) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    const currentUser = await User.findById(req.user.userId);
    const isFollowing = currentUser.following.includes(targetUser._id);

    if (isFollowing) {
      // Unfollow
      await currentUser.unfollowUser(targetUser._id);
      targetUser.followers = targetUser.followers.filter(id => !id.equals(currentUser._id));
      await targetUser.save();
      
      res.json({ 
        message: 'User unfollowed successfully',
        isFollowing: false,
        followersCount: targetUser.followers.length
      });
    } else {
      // Follow
      await currentUser.followUser(targetUser._id);
      if (!targetUser.followers.includes(currentUser._id)) {
        targetUser.followers.push(currentUser._id);
        await targetUser.save();
      }
      
      res.json({ 
        message: 'User followed successfully',
        isFollowing: true,
        followersCount: targetUser.followers.length
      });
    }
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's followers
router.get('/:username/followers', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, limit = 20 } = req.query;
    
    const user = await User.findOne({ username: req.params.username });
    if (!user || !user.isActive) {
      return res.status(404).json({ message: 'User not found' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const followers = await User.find({
      _id: { $in: user.followers },
      isActive: true
    })
    .select('username displayName avatar stats createdAt')
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

    res.json({
      followers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: user.followers.length,
        pages: Math.ceil(user.followers.length / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's following
router.get('/:username/following', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, limit = 20 } = req.query;
    
    const user = await User.findOne({ username: req.params.username });
    if (!user || !user.isActive) {
      return res.status(404).json({ message: 'User not found' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const following = await User.find({
      _id: { $in: user.following },
      isActive: true
    })
    .select('username displayName avatar stats createdAt')
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

    res.json({
      following,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: user.following.length,
        pages: Math.ceil(user.following.length / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's favorites
router.get('/:username/favorites', auth, [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, limit = 20 } = req.query;
    
    const user = await User.findOne({ username: req.params.username });
    if (!user || !user.isActive) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only allow users to view their own favorites
    if (!req.user || req.user.userId !== user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const favorites = await Content.find({
      _id: { $in: user.favorites },
      isActive: true
    })
    .populate('uploader', 'username displayName')
    .select('-uploaderIP')
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

    res.json({
      favorites,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: user.favorites.length,
        pages: Math.ceil(user.favorites.length / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's bookmarks
router.get('/:username/bookmarks', auth, [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, limit = 20 } = req.query;
    
    const user = await User.findOne({ username: req.params.username });
    if (!user || !user.isActive) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only allow users to view their own bookmarks
    if (!req.user || req.user.userId !== user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const bookmarks = await Content.find({
      _id: { $in: user.bookmarks },
      isActive: true
    })
    .populate('uploader', 'username displayName')
    .select('-uploaderIP')
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

    res.json({
      bookmarks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: user.bookmarks.length,
        pages: Math.ceil(user.bookmarks.length / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Block/unblock user
router.post('/:username/block', auth, async (req, res) => {
  try {
    const targetUser = await User.findOne({ username: req.params.username });
    if (!targetUser || !targetUser.isActive) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (targetUser._id.equals(req.user.userId)) {
      return res.status(400).json({ message: 'Cannot block yourself' });
    }

    const currentUser = await User.findById(req.user.userId);
    const isBlocked = currentUser.blockedUsers.includes(targetUser._id);

    if (isBlocked) {
      // Unblock
      currentUser.blockedUsers = currentUser.blockedUsers.filter(id => !id.equals(targetUser._id));
      await currentUser.save();
      
      res.json({ 
        message: 'User unblocked successfully',
        isBlocked: false
      });
    } else {
      // Block
      currentUser.blockedUsers.push(targetUser._id);
      
      // Also unfollow if following
      if (currentUser.following.includes(targetUser._id)) {
        await currentUser.unfollowUser(targetUser._id);
        targetUser.followers = targetUser.followers.filter(id => !id.equals(currentUser._id));
        await targetUser.save();
      }
      
      await currentUser.save();
      
      res.json({ 
        message: 'User blocked successfully',
        isBlocked: true
      });
    }
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search users
router.get('/', [
  query('q')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Search query must be between 1 and 50 characters'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { q, page = 1, limit = 20, sortBy = 'newest' } = req.query;
    
    const filter = { isActive: true };
    
    if (q) {
      filter.$or = [
        { username: { $regex: q, $options: 'i' } },
        { displayName: { $regex: q, $options: 'i' } }
      ];
    }

    let sort = {};
    switch (sortBy) {
      case 'oldest':
        sort = { createdAt: 1 };
        break;
      case 'popular':
        sort = { 'stats.totalLikes': -1, createdAt: -1 };
        break;
      case 'active':
        sort = { lastLogin: -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('username displayName avatar stats createdAt lastLogin')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter)
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;