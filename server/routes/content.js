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
// const cv = require('opencv4nodejs'); // Commented out due to installation issues

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
      .resize(300, 300, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 80 })
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
    return null;
  }
};

// Helper function to classify image as cartoon vs real photo
// Simplified version without opencv dependency
const isCartoonImage = async (imagePath) => {
  try {
    // For now, we'll use a simple file-based approach
    // This can be enhanced later with proper image analysis libraries
    const stats = await fs.stat(imagePath);
    
    // Basic heuristic: smaller file sizes often indicate simpler images (cartoons)
    // This is a temporary solution until proper image analysis is implemented
    const fileSizeKB = stats.size / 1024;
    
    console.log(`Image analysis - File size: ${fileSizeKB.toFixed(1)}KB`);
    
    // Allow all images for now (fail-safe approach)
    return true;
    
  } catch (error) {
    console.error('Error in image classification:', error);
    // If classification fails, allow the image (fail-safe)
    return true;
  }
};

// Helper function to get word count from text files
const getWordCount = async (filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content.split(/\s+/).filter(word => word.length > 0).length;
  } catch (error) {
    console.error('Error reading file for word count:', error);
    return 0;
  }
};

// Import content from AO3
router.post('/import-ao3', optionalAuth, [
  body('ao3Url')
    .notEmpty()
    .isURL()
    .contains('archiveofourown.org')
    .withMessage('Valid AO3 URL is required'),
  body('title')
    .notEmpty()
    .isLength({ max: 200 })
    .withMessage('Title is required and must be less than 200 characters'),
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
    .withMessage('isNSFW must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      ao3Url,
      title,
      author,
      tags,
      rating,
      warnings,
      description,
      isNSFW
    } = req.body;

    // Extract work ID from AO3 URL
    const workIdMatch = ao3Url.match(/works\/(\d+)/);
    if (!workIdMatch) {
      return res.status(400).json({ message: 'Invalid AO3 URL format' });
    }
    const workId = workIdMatch[1];

    // Process tags
    const processedTags = tags ? 
      tags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0) : 
      [];

    // Process warnings
    const processedWarnings = warnings ? 
      (Array.isArray(warnings) ? warnings : [warnings]) : 
      [];

    // Create a unique filename for the imported content
    const filename = `ao3_import_${workId}_${uuidv4()}.txt`;
    const filePath = path.join('uploads/fics', filename);

    // Create a placeholder text file with AO3 reference
    const placeholderContent = `This fanfiction was imported from AO3.\n\nOriginal URL: ${ao3Url}\n\nTitle: ${title}\nAuthor: ${author || 'Unknown'}\n\nNote: This is a reference to the original work on Archive of Our Own. Please visit the original URL to read the full content.`;
    
    await fs.writeFile(filePath, placeholderContent, 'utf-8');

    // Create content object
    const contentData = {
      title,
      author: author || 'Anonymous',
      contentType: 'fic',
      filename: filename,
      originalFilename: `${title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`,
      fileUrl: `/uploads/fics/${filename}`,
      fileSize: Buffer.byteLength(placeholderContent, 'utf-8'),
      mimeType: 'text/plain',
      tags: processedTags,
      rating: rating || 'T',
      warnings: processedWarnings,
      description: description || '',
      isNSFW: isNSFW === 'true' || isNSFW === true,
      isAnonymized: false,
      uploader: req.user ? req.user.userId : null,
      uploaderIP: req.ip || req.connection.remoteAddress,
      metadata: {
        wordCount: placeholderContent.split(/\s+/).length,
        chapters: 1,
        ao3Url: ao3Url,
        ao3WorkId: workId,
        importedAt: new Date()
      }
    };

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
      message: 'Content imported successfully from AO3',
      content: {
        _id: content._id,
        title: content.title,
        contentType: content.contentType,
        fileUrl: content.fileUrl,
        tags: content.tags,
        rating: content.rating,
        warnings: content.warnings,
        ao3Url: ao3Url,
        createdAt: content.createdAt
      }
    });
  } catch (error) {
    console.error('AO3 import error:', error);
    res.status(500).json({ message: 'Server error during AO3 import' });
  }
});

// Upload content
router.post('/upload', upload.single('file'), [
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
    .withMessage('isNSFW must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
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
      isNSFW
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
      isAnonymized: false,
      uploader: req.user ? req.user.userId : null,
      uploaderIP: req.ip || req.connection.remoteAddress
    };

    // Handle art-specific processing
    if (contentType === 'art') {
      const imagePath = req.file.path;
      
      // Check if image is cartoon/animated content only
      const isCartoon = await isCartoonImage(imagePath);
      if (!isCartoon) {
        // Delete the uploaded file
        try {
          await fs.unlink(imagePath);
        } catch (unlinkError) {
          console.error('Error deleting rejected file:', unlinkError);
        }
        return res.status(400).json({ 
          message: 'Only cartoon/animated artwork is allowed. Real photographs are not permitted.',
          code: 'REAL_PHOTO_DETECTED'
        });
      }
      
      const metadata = await getImageMetadata(imagePath);
      
      if (metadata) {
        contentData.metadata = {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format
        };
      }

      // Create thumbnail
      const thumbnailFilename = `thumb_${req.file.filename.replace(/\.[^/.]+$/, '')}.jpg`;
      const thumbnailPath = path.join('uploads/thumbnails', thumbnailFilename);
      
      const thumbnailCreated = await createThumbnail(imagePath, thumbnailPath);
      if (thumbnailCreated) {
        contentData.thumbnailUrl = `/uploads/thumbnails/${thumbnailFilename}`;
      }
    }

    // Handle fic-specific processing
    if (contentType === 'fic') {
      const wordCount = await getWordCount(req.file.path);
      contentData.metadata = {
        wordCount,
        chapters: 1
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
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError);
      }
    }
    
    res.status(500).json({ message: 'Server error during upload' });
  }
});

// Get all content with pagination and filtering
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
    .withMessage('Content type must be either art or fic'),
  query('rating')
    .optional()
    .isIn(['G', 'PG', 'T', 'M', 'E', 'XXX'])
    .withMessage('Invalid rating'),
  query('tags')
    .optional()
    .isString()
    .withMessage('Tags must be a string'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'title', 'rating'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
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
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (contentType) filter.contentType = contentType;
    if (rating) filter.rating = rating;
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase());
      filter.tags = { $in: tagArray };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [content, total] = await Promise.all([
      Content.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('uploader', 'username')
        .select('-uploaderIP'),
      Content.countDocuments(filter)
    ]);

    res.json({
      content,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get content by ID
router.get('/:id', async (req, res) => {
  try {
    const content = await Content.findById(req.params.id)
      .populate('uploader', 'username')
      .select('-uploaderIP');
    
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    res.json(content);
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete content
router.delete('/:id', auth, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    
    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    // Check if user owns the content or is admin
    if (content.uploader.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this content' });
    }

    // Delete associated files
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
    }

    await Content.findByIdAndDelete(req.params.id);
    
    // Update user stats
    if (content.uploader) {
      await User.findByIdAndUpdate(content.uploader, {
        $pull: { uploads: content._id },
        $inc: { 'stats.totalUploads': -1 }
      });
    }

    res.json({ message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;