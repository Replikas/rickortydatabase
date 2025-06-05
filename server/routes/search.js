const express = require('express');
const { query, validationResult } = require('express-validator');
const Content = require('../models/Content');
const User = require('../models/User');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Advanced search
router.get('/', optionalAuth, [
  query('q')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
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
    .custom((value) => {
      if (value) {
        const ratings = value.split(',');
        const validRatings = ['G', 'PG', 'T', 'M', 'E', 'XXX'];
        if (!ratings.every(rating => validRatings.includes(rating))) {
          throw new Error('Invalid rating');
        }
      }
      return true;
    }),
  query('sortBy')
    .optional()
    .isIn(['newest', 'oldest', 'popular', 'views', 'relevance'])
    .withMessage('Invalid sort option'),
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format for dateFrom'),
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format for dateTo')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      q,
      page = 1,
      limit = 20,
      contentType,
      rating,
      tags,
      warnings,
      author,
      sortBy = 'relevance',
      dateFrom,
      dateTo,
      showNSFW = 'false',
      minLikes,
      maxLikes,
      minViews,
      maxViews
    } = req.query;

    // Build aggregation pipeline
    const pipeline = [];

    // Match stage
    const matchStage = { isActive: true };
    
    if (contentType) matchStage.contentType = contentType;
    
    if (rating) {
      const ratingArray = rating.split(',');
      matchStage.rating = { $in: ratingArray };
    }
    
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase());
      matchStage.tags = { $in: tagArray };
    }
    
    if (warnings) {
      const warningArray = warnings.split(',');
      matchStage.warnings = { $in: warningArray };
    }
    
    if (showNSFW !== 'true') {
      matchStage.isNSFW = false;
    }
    
    if (author) {
      matchStage.author = { $regex: author, $options: 'i' };
    }
    
    if (dateFrom || dateTo) {
      matchStage.createdAt = {};
      if (dateFrom) matchStage.createdAt.$gte = new Date(dateFrom);
      if (dateTo) matchStage.createdAt.$lte = new Date(dateTo);
    }
    
    if (minLikes || maxLikes) {
      matchStage.likes = {};
      if (minLikes) matchStage.likes.$gte = parseInt(minLikes);
      if (maxLikes) matchStage.likes.$lte = parseInt(maxLikes);
    }
    
    if (minViews || maxViews) {
      matchStage.views = {};
      if (minViews) matchStage.views.$gte = parseInt(minViews);
      if (maxViews) matchStage.views.$lte = parseInt(maxViews);
    }

    // Text search
    if (q) {
      matchStage.$text = { $search: q };
    }

    pipeline.push({ $match: matchStage });

    // Add score for text search relevance
    if (q) {
      pipeline.push({
        $addFields: {
          score: { $meta: 'textScore' }
        }
      });
    }

    // Lookup uploader info
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'uploader',
        foreignField: '_id',
        as: 'uploaderInfo',
        pipeline: [
          { $project: { username: 1, displayName: 1, avatar: 1 } }
        ]
      }
    });

    // Sort stage
    let sortStage = {};
    switch (sortBy) {
      case 'oldest':
        sortStage = { createdAt: 1 };
        break;
      case 'popular':
        sortStage = { likes: -1, createdAt: -1 };
        break;
      case 'views':
        sortStage = { views: -1, createdAt: -1 };
        break;
      case 'relevance':
        if (q) {
          sortStage = { score: { $meta: 'textScore' }, createdAt: -1 };
        } else {
          sortStage = { createdAt: -1 };
        }
        break;
      default:
        sortStage = { createdAt: -1 };
    }
    pipeline.push({ $sort: sortStage });

    // Facet for pagination and total count
    pipeline.push({
      $facet: {
        data: [
          { $skip: (parseInt(page) - 1) * parseInt(limit) },
          { $limit: parseInt(limit) },
          {
            $project: {
              uploaderIP: 0,
              'uploaderInfo.email': 0,
              'uploaderInfo.password': 0
            }
          }
        ],
        totalCount: [
          { $count: 'count' }
        ]
      }
    });

    const [result] = await Content.aggregate(pipeline);
    const content = result.data;
    const total = result.totalCount[0]?.count || 0;

    res.json({
      content,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      searchInfo: {
        query: q,
        filters: {
          contentType,
          rating: rating?.split(','),
          tags: tags?.split(','),
          warnings: warnings?.split(','),
          author,
          dateRange: dateFrom || dateTo ? { from: dateFrom, to: dateTo } : null,
          showNSFW: showNSFW === 'true'
        },
        sortBy
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error during search' });
  }
});

// Get popular tags
router.get('/tags/popular', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const popularTags = await Content.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 },
          artCount: {
            $sum: { $cond: [{ $eq: ['$contentType', 'art'] }, 1, 0] }
          },
          ficCount: {
            $sum: { $cond: [{ $eq: ['$contentType', 'fic'] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) },
      {
        $project: {
          tag: '$_id',
          count: 1,
          artCount: 1,
          ficCount: 1,
          _id: 0
        }
      }
    ]);

    res.json({ tags: popularTags });
  } catch (error) {
    console.error('Get popular tags error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search suggestions/autocomplete
router.get('/suggestions', [
  query('q')
    .notEmpty()
    .isLength({ min: 1, max: 50 })
    .withMessage('Query is required and must be less than 50 characters'),
  query('type')
    .optional()
    .isIn(['tags', 'authors', 'titles'])
    .withMessage('Type must be tags, authors, or titles')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { q, type = 'all', limit = 10 } = req.query;
    const suggestions = {};

    if (type === 'tags' || type === 'all') {
      const tagSuggestions = await Content.aggregate([
        { $match: { isActive: true } },
        { $unwind: '$tags' },
        {
          $match: {
            tags: { $regex: q, $options: 'i' }
          }
        },
        {
          $group: {
            _id: '$tags',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: parseInt(limit) },
        {
          $project: {
            tag: '$_id',
            count: 1,
            _id: 0
          }
        }
      ]);
      suggestions.tags = tagSuggestions;
    }

    if (type === 'authors' || type === 'all') {
      const authorSuggestions = await Content.aggregate([
        { $match: { isActive: true, author: { $regex: q, $options: 'i' } } },
        {
          $group: {
            _id: '$author',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: parseInt(limit) },
        {
          $project: {
            author: '$_id',
            count: 1,
            _id: 0
          }
        }
      ]);
      suggestions.authors = authorSuggestions;
    }

    if (type === 'titles' || type === 'all') {
      const titleSuggestions = await Content.find({
        isActive: true,
        title: { $regex: q, $options: 'i' }
      })
      .select('title contentType createdAt')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
      
      suggestions.titles = titleSuggestions.map(content => ({
        title: content.title,
        contentType: content.contentType,
        id: content._id
      }));
    }

    res.json({ suggestions });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get search statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await Content.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalContent: { $sum: 1 },
          totalArt: {
            $sum: { $cond: [{ $eq: ['$contentType', 'art'] }, 1, 0] }
          },
          totalFics: {
            $sum: { $cond: [{ $eq: ['$contentType', 'fic'] }, 1, 0] }
          },
          totalLikes: { $sum: '$likes' },
          totalViews: { $sum: '$views' },
          nsfwContent: {
            $sum: { $cond: ['$isNSFW', 1, 0] }
          },
          averageLikes: { $avg: '$likes' },
          averageViews: { $avg: '$views' }
        }
      }
    ]);

    const ratingStats = await Content.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const recentUploads = await Content.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
      { $limit: 30 }
    ]);

    res.json({
      general: stats[0] || {
        totalContent: 0,
        totalArt: 0,
        totalFics: 0,
        totalLikes: 0,
        totalViews: 0,
        nsfwContent: 0,
        averageLikes: 0,
        averageViews: 0
      },
      ratingDistribution: ratingStats,
      recentActivity: recentUploads
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Similar content recommendations
router.get('/:id/similar', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const content = await Content.findById(req.params.id);
    if (!content || !content.isActive) {
      return res.status(404).json({ message: 'Content not found' });
    }

    // Find similar content based on tags and content type
    const similarContent = await Content.find({
      _id: { $ne: content._id },
      isActive: true,
      contentType: content.contentType,
      $or: [
        { tags: { $in: content.tags } },
        { rating: content.rating },
        { warnings: { $in: content.warnings } }
      ]
    })
    .populate('uploader', 'username displayName')
    .select('-uploaderIP')
    .sort({ likes: -1, createdAt: -1 })
    .limit(parseInt(limit));

    res.json({ similarContent });
  } catch (error) {
    console.error('Get similar content error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;