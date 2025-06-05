const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const { body, validationResult, query } = require('express-validator');
const Content = require('../models/Content');
const Comment = require('../models/Comment');
const User = require('../models/User');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Ensure upload directories exist
const ensureDirectories = async () => {
  const dirs = ['uploads/art', 'uploads/fics', 'uploads/thumbnails'];
  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      console.error(`Error creating directory ${dir}:`, error);
    }
  }
};
ensureDirectories();

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const contentType = req.body.contentType;
    const uploadPath = contentType === 'art' ? 'uploads/art' : 'uploads/fics';
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const contentType = req.body.contentType;
  
  if (contentType === 'art') {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type for art. Only PNG, JPG, JPEG, and GIF are allowed.'), false);
    }
  } else if (contentType === 'fic') {
    const allowedTypes = ['text/plain', 'text/markdown', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.md') || file.originalname.endsWith('.txt')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type for fic. Only TXT, MD, and PDF are allowed.'), false);
    }
  } else {
    cb(new Error('Invalid content type'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

// Helper function to create thumbnail
const createThumbnail = async (imagePath, thumbnailPath) => {
  try {
    await sharp(imagePath)
      .resize(640, null, {
        withoutEnlargement: true,
        fit: 'inside'
      })
      .jpeg({ quality: 85 })
      .toFile(thumbnailPath);
    return true;
  } catch (error) {
    console.error('Error creating thumbnail:', error);
    return false;
  }
};

// Helper function to get image metadata
const getImageMetadata = async (imagePath) => {
  try {
    const metadata = await sharp(imagePath).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format
    };
  } catch (error) {
    console.error('Error getting image metadata:', error);
    return {};
  }
};

// Helper function to get text file word count
const getWordCount = async (filePath, mimeType) => {
  try {
    if (mimeType === 'application/pdf') {
      return 0; // PDF word count would require additional library
    }
    
    const content = await fs.readFile(filePath, 'utf-8');
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length;
  } catch (error) {
    console.error('Error counting words:', error);
    return 0;
  }
};

// Upload content
router.post('/upload', optionalAuth, upload.single('file'), [
  body('title')
    .notEmpty()
    .isLength({ max: 200 })
    .withMessage('Title is required and must be less than 200 characters'),
  body('contentType')
    .isIn(['art', 'fic'])
    .withMessage('Content type must be either art or fic'),
  body('author')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Author name must be less than 100 characters'),
  body('tags')
    .optional()
    .custom((value) => {
      if (value && typeof value === 'string') {
        const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        if (tags.length > 20) {
          throw new Error('Maximum 20 tags allowed');
        }
        if (tags.some(tag => tag.length > 50)) {
          throw new Error('Each tag must be less than 50 characters');
        }
      }
      return true;
    }),
  body('rating')
    .optional()
    .isIn(['G', 'PG', 'T', 'M', 'E', 'XXX'])
    .withMessage('Invalid rating'),
  body('warnings')
    .optional()
    .custom((value) => {
      if (value && Array.isArray(value)) {
        const validWarnings = ['NSFW', 'Gore', 'Noncon', 'Kink', 'Other'];
        if (!value.every(warning => validWarnings.includes(warning))) {
          throw new Error('Invalid warning type');
        }
      }
      return true;
    }),
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Description must be less than 2000 characters'),
  body('isNSFW')
    .optional()
    .isBoolean()
    .withMessage('isNSFW must be a boolean'),
  body('isAnonymized')
    .optional()
    .isBoolean()
    .withMessage('isAnonymized must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Clean up uploaded file if validation fails
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const {
      title,
      contentType,
      author,
      tags,
      rating,
      warnings,
      description,
      isNSFW,
      isAnonymized
    } = req.body;

    // Process tags
    const processedTags = tags ? 
      tags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0) : 
      [];

    // Process warnings
    const processedWarnings = warnings ? 
      (Array.isArray(warnings) ? warnings : [warnings]) : 
      [];

    // Create content object
    const contentData = {
      title,
      author: author || 'Anonymous',
      contentType,
      filename: req.file.filename,
      originalFilename: req.file.originalname,
      fileUrl: `/uploads/${contentType === 'art' ? 'art' : 'fics'}/${req.file.filename}`,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      tags: processedTags,
      rating: rating || 'T',
      warnings: processedWarnings,
      description: description || '',
      isNSFW: isNSFW === 'true' || isNSFW === true,
      isAnonymized: isAnonymized === 'true' || isAnonymized === true,
      uploader: req.user ? req.user.userId : null,
      uploaderIP: req.ip || req.connection.remoteAddress,
      metadata: {}
    };

    // Handle art-specific processing
    if (contentType === 'art') {
      const imageMetadata = await getImageMetadata(req.file.path);
      contentData.metadata = {
        width: imageMetadata.width,
        height: imageMetadata.height
      };

      // Create thumbnail
      const thumbnailFilename = `thumb_${req.file.filename.replace(path.extname(req.file.filename), '.jpg')}`;
      const thumbnailPath = path.join('uploads/thumbnails', thumbnailFilename);
      
      const thumbnailCreated = await createThumbnail(req.file.path, thumbnailPath);
      if (thumbnailCreated) {
        contentData.thumbnailUrl = `/uploads/thumbnails/${thumbnailFilename}`;
      }
    }

    // Handle fic-specific processing
    if (contentType === 'fic') {
      const wordCount = await getWordCount(req.file.path, req.file.mimetype);
      contentData.metadata = {
        wordCount: wordCount,
        chapters: 1 // Default to 1, could be enhanced to detect chapters
      };
    }

    // Save to database
    const content = new Content(contentData);
    await content.save();

    // Update user stats if logged in
    if (req.user) {
      await User.findByIdAndUpdate(req.user.userId, {
        $push: { uploads: content._id },
        $inc: { 'stats.totalUploads': 1 }
      });
    }

    res.status(201).json({
      message: 'Content uploaded successfully',
      content: {
        _id: content._id,
        title: content.title,
        contentType: content.contentType,
        fileUrl: content.fileUrl,
        thumbnailUrl: content.thumbnailUrl,
        tags: content.tags,
        rating: content.rating,
        warnings: content.warnings,
        createdAt: content.createdAt
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    
    res.status(500).json({ message: 'Server error during upload' });
  }
});

// Get content list with filtering and pagination
router.get('/', [
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
    .withMessage('Content type must be art or fic'),
  query('rating')
    .optional()
    .isIn(['G', 'PG', 'T', 'M', 'E', 'XXX'])
    .withMessage('Invalid rating'),
  query('sortBy')
    .optional()
    .isIn(['newest', 'oldest', 'popular', 'views'])
    .withMessage('Invalid sort option')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      page = 1,
      limit = 20,
      contentType,
      rating,
      tags,
      warnings,
      search,
      sortBy = 'newest',
      showNSFW = 'false'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };
    
    if (contentType) filter.contentType = contentType;
    if (rating) filter.rating = rating;
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase());
      filter.tags = { $in: tagArray };
    }
    if (warnings) {
      const warningArray = warnings.split(',');
      filter.warnings = { $in: warningArray };
    }
    if (showNSFW !== 'true') {
      filter.isNSFW = false;
    }
    if (search) {
      filter.$text = { $search: search };
    }

    // Build sort object
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
        .populate('uploader', 'username displayName')
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
    console.error('Get content error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single content item
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id)
      .populate('uploader', 'username displayName avatar')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'username displayName avatar'
        }
      });

    if (!content || !content.isActive) {
      return res.status(404).json({ message: 'Content not found' });
    }

    // Increment view count
    await content.incrementViews();

    // Check if user has liked/bookmarked this content
    let userInteractions = {};
    if (req.user) {
      userInteractions = {
        hasLiked: content.likedBy.includes(req.user.userId),
        hasBookmarked: false // Will be set below
      };
      
      const user = await User.findById(req.user.userId);
      if (user) {
        userInteractions.hasBookmarked = user.bookmarks.includes(content._id);
      }
    }

    res.json({
      content: {
        ...content.toObject(),
        uploaderIP: undefined // Remove IP from response
      },
      userInteractions
    });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like/unlike content
router.post('/:id/like', auth, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content || !content.isActive) {
      return res.status(404).json({ message: 'Content not found' });
    }

    await content.toggleLike(req.user.userId);
    
    res.json({
      message: 'Like toggled successfully',
      likes: content.likes,
      hasLiked: content.likedBy.includes(req.user.userId)
    });
  } catch (error) {
    console.error('Like content error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bookmark/unbookmark content
router.post('/:id/bookmark', auth, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content || !content.isActive) {
      return res.status(404).json({ message: 'Content not found' });
    }

    const user = await User.findById(req.user.userId);
    const isBookmarked = user.bookmarks.includes(content._id);
    
    if (isBookmarked) {
      await user.removeFromBookmarks(content._id);
    } else {
      await user.addToBookmarks(content._id);
    }
    
    res.json({
      message: 'Bookmark toggled successfully',
      hasBookmarked: !isBookmarked
    });
  } catch (error) {
    console.error('Bookmark content error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Flag content
router.post('/:id/flag', optionalAuth, [
  body('reason')
    .notEmpty()
    .isLength({ max: 500 })
    .withMessage('Flag reason is required and must be less than 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const content = await Content.findById(req.params.id);
    if (!content || !content.isActive) {
      return res.status(404).json({ message: 'Content not found' });
    }

    content.flagged = true;
    content.flagReason = req.body.reason;
    await content.save();
    
    res.json({ message: 'Content flagged for review' });
  } catch (error) {
    console.error('Flag content error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete content (only by uploader or admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    // Check if user is the uploader or admin
    const isOwner = content.uploader && content.uploader.equals(req.user.userId);
    const isAdmin = req.userDoc && req.userDoc.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this content' });
    }

    // Soft delete
    content.isActive = false;
    await content.save();
    
    res.json({ message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;