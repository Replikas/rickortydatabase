const express = require('express');
const router = express.Router();
const Content = require('../models/Content');
const User = require('../models/User');
const Comment = require('../models/Comment');
const { adminAuth } = require('../middleware/auth');

// Get all content for admin
router.get('/content', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50, search, type } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (type && type !== 'all') {
      query.contentType = type;
    }
    
    const content = await Content.find(query)
      .populate('uploader', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Content.countDocuments(query);
    
    res.json({
      content,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching content for admin:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users for admin
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching users for admin:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all comments for admin
router.get('/comments', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    
    if (search) {
      query.content = { $regex: search, $options: 'i' };
    }
    
    const comments = await Comment.find(query)
      .populate('author', 'username email')
      .populate('contentId', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Comment.countDocuments(query);
    
    res.json({
      comments,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching comments for admin:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Ban user
router.post('/users/:userId/ban', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason = 'Violation of terms of service', duration } = req.body;
    
    // Don't allow banning other admins
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (targetUser.role === 'admin') {
      return res.status(403).json({ message: 'Cannot ban admin users' });
    }
    
    const banExpiresAt = duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null;
    
    await User.findByIdAndUpdate(userId, {
      isBanned: true,
      banReason: reason,
      banExpiresAt,
      bannedBy: req.user.userId,
      bannedAt: new Date()
    });
    
    res.json({ message: 'User banned successfully' });
  } catch (error) {
    console.error('Error banning user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unban user
router.post('/users/:userId/unban', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    await User.findByIdAndUpdate(userId, {
      isBanned: false,
      banReason: null,
      banExpiresAt: null,
      bannedBy: null,
      bannedAt: null
    });
    
    res.json({ message: 'User unbanned successfully' });
  } catch (error) {
    console.error('Error unbanning user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete content (admin override)
router.delete('/content/:contentId', adminAuth, async (req, res) => {
  try {
    const { contentId } = req.params;
    const { reason = 'Content removed by administrator' } = req.body;
    
    const content = await Content.findById(contentId);
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }
    
    // Log the deletion
    console.log(`Admin ${req.user.userId} deleted content ${contentId}: ${reason}`);
    
    // Delete associated files
    const fs = require('fs').promises;
    const path = require('path');
    
    try {
      if (content.filename) {
        const filePath = path.join('uploads', content.contentType === 'art' ? 'art' : 'fics', content.filename);
        await fs.unlink(filePath);
      }
      
      if (content.thumbnailUrl) {
        const thumbnailPath = content.thumbnailUrl.replace('/uploads/', 'uploads/');
        await fs.unlink(thumbnailPath);
      }
    } catch (fileError) {
      console.error('Error deleting files:', fileError);
      // Continue with database deletion even if file deletion fails
    }
    
    // Delete all comments associated with this content
    await Comment.deleteMany({ contentId });
    
    // Delete the content
    await Content.findByIdAndDelete(contentId);
    
    res.json({ message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete comment (admin override)
router.delete('/comments/:commentId', adminAuth, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { reason = 'Comment removed by administrator' } = req.body;
    
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Log the deletion
    console.log(`Admin ${req.user.userId} deleted comment ${commentId}: ${reason}`);
    
    // Delete all replies to this comment
    await Comment.deleteMany({ parentComment: commentId });
    
    // Delete the comment
    await Comment.findByIdAndDelete(commentId);
    
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get admin dashboard stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const [totalUsers, totalContent, totalComments, bannedUsers, recentContent] = await Promise.all([
      User.countDocuments(),
      Content.countDocuments(),
      Comment.countDocuments(),
      User.countDocuments({ isBanned: true }),
      Content.find().sort({ createdAt: -1 }).limit(5).populate('uploader', 'username')
    ]);
    
    res.json({
      stats: {
        totalUsers,
        totalContent,
        totalComments,
        bannedUsers
      },
      recentContent
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;