const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow anonymous comments
  },
  authorName: {
    type: String,
    default: 'Anonymous',
    maxlength: 50
  },
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: true
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null // For nested replies
  },
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  likes: {
    type: Number,
    default: 0
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  flagged: {
    type: Boolean,
    default: false
  },
  flagReason: {
    type: String
  },
  flaggedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    flaggedAt: {
      type: Date,
      default: Date.now
    }
  }],
  authorIP: {
    type: String,
    required: true
  },
  isAnonymous: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
commentSchema.index({ contentId: 1, createdAt: -1 });
commentSchema.index({ author: 1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ flagged: 1 });

// Virtual for display author name
commentSchema.virtual('displayAuthor').get(function() {
  if (this.isAnonymous || !this.author) {
    return this.authorName || 'Anonymous';
  }
  return this.authorName;
});

// Method to toggle like
commentSchema.methods.toggleLike = function(userId) {
  if (!userId) return Promise.resolve(this); // Anonymous users can't like
  
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

// Method to add reply
commentSchema.methods.addReply = function(replyId) {
  if (!this.replies.includes(replyId)) {
    this.replies.push(replyId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to soft delete
commentSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.content = '[Comment deleted]';
  return this.save();
};

// Method to edit comment
commentSchema.methods.editContent = function(newContent) {
  this.content = newContent;
  this.isEdited = true;
  this.editedAt = new Date();
  return this.save();
};

// Method to flag comment
commentSchema.methods.flagComment = function(userId, reason) {
  if (!this.flaggedBy.some(flag => flag.user.equals(userId))) {
    this.flaggedBy.push({
      user: userId,
      reason: reason,
      flaggedAt: new Date()
    });
    
    // Auto-flag if multiple users flag it
    if (this.flaggedBy.length >= 3) {
      this.flagged = true;
      this.flagReason = 'Multiple user reports';
    }
    
    return this.save();
  }
  return Promise.resolve(this);
};

// Static method to get comments for content
commentSchema.statics.getCommentsForContent = function(contentId, page = 1, limit = 20) {
  return this.find({ 
    contentId: contentId, 
    parentComment: null, // Only top-level comments
    isDeleted: false 
  })
  .populate('author', 'username displayName avatar')
  .populate({
    path: 'replies',
    match: { isDeleted: false },
    populate: {
      path: 'author',
      select: 'username displayName avatar'
    },
    options: { sort: { createdAt: 1 } }
  })
  .sort({ createdAt: -1 })
  .skip((page - 1) * limit)
  .limit(limit);
};

module.exports = mongoose.model('Comment', commentSchema);