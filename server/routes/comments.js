const express = require('express');
const { Comment } = require('../models/Comment');
const { Content } = require('../models/Content');
const { auth, optionalAuth } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const validator = require('validator');

const router = express.Router();

// Rate limiting for comment creation
const commentLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // limit each IP to 10 comments per windowMs
  message: {
    error: 'Too many comments created, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Get comments for content
router.get('/content/:contentId', optionalAuth, async (req, res) => {
  try {
    const { contentId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const sortBy = req.query.sortBy || 'createdAt'; // createdAt, likes, -createdAt, -likes
    
    // Validate contentId
    if (!contentId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid content ID' });
    }
    
    // Check if content exists
    const content = await Content.findById(contentId);
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    // Build sort object
    let sort = {};
    if (sortBy.startsWith('-')) {
      sort[sortBy.substring(1)] = -1;
    } else {
      sort[sortBy] = 1;
    }
    
    // Get comments with pagination
    const comments = await Comment.getCommentsForContent(
      contentId,
      page,
      limit,
      sort,
      req.user?._id
    );
    
    // Get total count for pagination
    const totalComments = await Comment.countDocuments({
      contentId,
      deleted: false
    });
    
    res.json({
      comments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalComments / limit),
        totalComments,
        hasNext: page < Math.ceil(totalComments / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Create comment
router.post('/content/:contentId', commentLimiter, optionalAuth, async (req, res) => {
  try {
    const { contentId } = req.params;
    const { text, parentComment, anonymous } = req.body;
    
    // Validate contentId
    if (!contentId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid content ID' });
    }
    
    // Validate comment text
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Comment text is required' });
    }
    
    const trimmedText = text.trim();
    if (trimmedText.length < 1) {
      return res.status(400).json({ error: 'Comment cannot be empty' });
    }
    
    if (trimmedText.length > 2000) {
      return res.status(400).json({ error: 'Comment too long (max 2000 characters)' });
    }
    
    // Check if content exists
    const content = await Content.findById(contentId);
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }
    
    // Validate parent comment if provided
    if (parentComment) {
      if (!parentComment.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ error: 'Invalid parent comment ID' });
      }
      
      const parent = await Comment.findById(parentComment);
      if (!parent || parent.contentId.toString() !== contentId) {
        return res.status(400).json({ error: 'Invalid parent comment' });
      }
      
      // Prevent deeply nested comments (max 3 levels)
      if (parent.parentComment) {
        const grandParent = await Comment.findById(parent.parentComment);
        if (grandParent && grandParent.parentComment) {
          return res.status(400).json({ error: 'Comment nesting too deep' });
        }
      }
    }
    
    // Get client IP for anonymous comments
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    
    // Create comment
    const comment = new Comment({
      contentId,
      text: trimmedText,
      author: (req.user && !anonymous) ? req.user._id : null,
      parentComment: parentComment || null,
      authorIP: clientIP
    });
    
    await comment.save();
    
    // Populate author info for response
    await comment.populate('author', 'username displayName avatar');
    
    // Add to parent comment's replies if it's a reply
    if (parentComment) {
      await Comment.findByIdAndUpdate(parentComment, {
        $push: { replies: comment._id }
      });
    }
    
    res.status(201).json({
      message: 'Comment created successfully',
      comment: {
        _id: comment._id,
        text: comment.text,
        author: comment.author,
        displayAuthor: comment.displayAuthor,
        createdAt: comment.createdAt,
        likes: comment.likes,
        replies: comment.replies,
        parentComment: comment.parentComment,
        edited: comment.edited,
        deleted: comment.deleted
      }
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// Like/unlike comment
router.post('/:commentId/like', auth, async (req, res) => {
  try {
    const { commentId } = req.params;
    
    // Validate commentId
    if (!commentId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid comment ID' });
    }
    
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    if (comment.deleted) {
      return res.status(400).json({ error: 'Cannot like deleted comment' });
    }
    
    const result = await comment.toggleLike(req.user._id);
    
    res.json({
      message: result.liked ? 'Comment liked' : 'Comment unliked',
      liked: result.liked,
      likesCount: result.likesCount
    });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({ error: 'Failed to like comment' });
  }
});

// Edit comment
router.put('/:commentId', auth, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;
    
    // Validate commentId
    if (!commentId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid comment ID' });
    }
    
    // Validate text
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Comment text is required' });
    }
    
    const trimmedText = text.trim();
    if (trimmedText.length < 1) {
      return res.status(400).json({ error: 'Comment cannot be empty' });
    }
    
    if (trimmedText.length > 2000) {
      return res.status(400).json({ error: 'Comment too long (max 2000 characters)' });
    }
    
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    if (comment.deleted) {
      return res.status(400).json({ error: 'Cannot edit deleted comment' });
    }
    
    // Check if user owns the comment
    if (!comment.author || comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to edit this comment' });
    }
    
    // Check if comment is too old to edit (24 hours)
    const hoursSinceCreation = (Date.now() - comment.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      return res.status(400).json({ error: 'Comment too old to edit (24 hour limit)' });
    }
    
    await comment.editComment(trimmedText);
    
    res.json({
      message: 'Comment updated successfully',
      comment: {
        _id: comment._id,
        text: comment.text,
        edited: comment.edited,
        editedAt: comment.editedAt
      }
    });
  } catch (error) {
    console.error('Edit comment error:', error);
    res.status(500).json({ error: 'Failed to edit comment' });
  }
});

// Delete comment
router.delete('/:commentId', auth, async (req, res) => {
  try {
    const { commentId } = req.params;
    
    // Validate commentId
    if (!commentId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid comment ID' });
    }
    
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    if (comment.deleted) {
      return res.status(400).json({ error: 'Comment already deleted' });
    }
    
    // Check if user owns the comment or is admin/moderator
    const canDelete = comment.author && comment.author.toString() === req.user._id.toString() ||
                     req.user.role === 'admin' ||
                     req.user.role === 'moderator';
    
    if (!canDelete) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }
    
    await comment.softDelete();
    
    res.json({
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// Flag comment
router.post('/:commentId/flag', auth, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { reason } = req.body;
    
    // Validate commentId
    if (!commentId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid comment ID' });
    }
    
    // Validate reason
    const validReasons = ['spam', 'harassment', 'inappropriate', 'other'];
    if (!reason || !validReasons.includes(reason)) {
      return res.status(400).json({ 
        error: 'Valid reason required', 
        validReasons 
      });
    }
    
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    if (comment.deleted) {
      return res.status(400).json({ error: 'Cannot flag deleted comment' });
    }
    
    // Check if user already flagged this comment
    if (comment.flaggedBy.includes(req.user._id)) {
      return res.status(400).json({ error: 'You have already flagged this comment' });
    }
    
    await comment.flagComment(req.user._id, reason);
    
    res.json({
      message: 'Comment flagged successfully',
      flagged: comment.flagged,
      flagCount: comment.flaggedBy.length
    });
  } catch (error) {
    console.error('Flag comment error:', error);
    res.status(500).json({ error: 'Failed to flag comment' });
  }
});

// Get comment replies
router.get('/:commentId/replies', optionalAuth, async (req, res) => {
  try {
    const { commentId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 20);
    
    // Validate commentId
    if (!commentId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid comment ID' });
    }
    
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    // Get replies with pagination
    const skip = (page - 1) * limit;
    const replies = await Comment.find({
      parentComment: commentId,
      deleted: false
    })
    .populate('author', 'username displayName avatar')
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(limit)
    .lean();
    
    // Add user interaction info
    if (req.user) {
      replies.forEach(reply => {
        reply.userLiked = reply.likes.includes(req.user._id);
      });
    }
    
    // Add display author
    replies.forEach(reply => {
      reply.displayAuthor = reply.author ? reply.author.displayName || reply.author.username : 'Anonymous';
    });
    
    const totalReplies = await Comment.countDocuments({
      parentComment: commentId,
      deleted: false
    });
    
    res.json({
      replies,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalReplies / limit),
        totalReplies,
        hasNext: page < Math.ceil(totalReplies / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get replies error:', error);
    res.status(500).json({ error: 'Failed to fetch replies' });
  }
});

module.exports = router;