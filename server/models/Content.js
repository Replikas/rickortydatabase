const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  author: {
    type: String,
    trim: true,
    maxlength: 100,
    default: 'Anonymous'
  },
  contentType: {
    type: String,
    required: true,
    enum: ['art', 'fic']
  },
  filename: {
    type: String,
    required: true
  },
  originalFilename: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
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