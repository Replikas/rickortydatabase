const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    match: /^[a-zA-Z0-9_-]+$/
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  displayName: {
    type: String,
    trim: true,
    maxlength: 50
  },
  bio: {
    type: String,
    maxlength: 500
  },
  avatar: {
    type: String, // URL to avatar image
    default: null
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user'
  },
  preferences: {
    showNSFW: {
      type: Boolean,
      default: false
    },
    theme: {
      type: String,
      enum: ['dark', 'light'],
      default: 'dark'
    },
    emailNotifications: {
      type: Boolean,
      default: true
    }
  },
  uploads: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content'
  }],
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content'
  }],
  bookmarks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  lastLogin: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  banReason: {
    type: String
  },
  banExpiresAt: {
    type: Date
  },
  stats: {
    totalUploads: {
      type: Number,
      default: 0
    },
    totalLikes: {
      type: Number,
      default: 0
    },
    totalViews: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Get public profile
userSchema.methods.getPublicProfile = function() {
  return {
    _id: this._id,
    username: this.username,
    displayName: this.displayName,
    bio: this.bio,
    avatar: this.avatar,
    stats: this.stats,
    createdAt: this.createdAt
  };
};

// Add to favorites
userSchema.methods.addToFavorites = function(contentId) {
  if (!this.favorites.includes(contentId)) {
    this.favorites.push(contentId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Remove from favorites
userSchema.methods.removeFromFavorites = function(contentId) {
  this.favorites = this.favorites.filter(id => !id.equals(contentId));
  return this.save();
};

// Add to bookmarks
userSchema.methods.addToBookmarks = function(contentId) {
  if (!this.bookmarks.includes(contentId)) {
    this.bookmarks.push(contentId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Remove from bookmarks
userSchema.methods.removeFromBookmarks = function(contentId) {
  this.bookmarks = this.bookmarks.filter(id => !id.equals(contentId));
  return this.save();
};

// Follow user
userSchema.methods.followUser = function(userId) {
  if (!this.following.includes(userId)) {
    this.following.push(userId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Unfollow user
userSchema.methods.unfollowUser = function(userId) {
  this.following = this.following.filter(id => !id.equals(userId));
  return this.save();
};

module.exports = mongoose.model('User', userSchema);