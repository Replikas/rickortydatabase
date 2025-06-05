import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const Browse = () => {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    contentType: '',
    sortBy: 'createdAt',
    order: 'desc'
  });
  // const [page, setPage] = useState(1); // TODO: Implement pagination
  const [hasMore, setHasMore] = useState(true);

  const contentTypes = ['art', 'fanfiction', 'video', 'audio', 'other'];
  const sortOptions = [
    { value: 'createdAt', label: 'Newest' },
    { value: 'likes', label: 'Most Liked' },
    { value: 'views', label: 'Most Viewed' },
    { value: 'title', label: 'Title A-Z' }
  ];

  useEffect(() => {
    fetchContent(true);
  }, [filters]);

  const fetchContent = async (reset = false) => {
    try {
      setLoading(true);
      // Set default empty data since backend is not available
      const newContent = [];
      
      if (reset) {
        setContent(newContent);
        // setPage(2); // TODO: Implement pagination
      } else {
        setContent(prev => [...prev, ...newContent]);
        // setPage(prev => prev + 1); // TODO: Implement pagination
      }
      
      setHasMore(false); // No more content to load since backend is not available
    } catch (error) {
      console.error('Error fetching content:', error);
      if (reset) {
        setContent([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    // setPage(1); // TODO: Implement pagination
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchContent(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Browse Fanworks
          </h1>
          <p className="text-gray-600">
            Discover amazing Rick and Morty content from our community
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Content Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Type
              </label>
              <select
                value={filters.contentType}
                onChange={(e) => handleFilterChange('contentType', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Types</option>
                {contentTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order
              </label>
              <select
                value={filters.order}
                onChange={(e) => handleFilterChange('order', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        {loading && content.length === 0 ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : content.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {content.map((item) => (
                <div key={item._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  {item.thumbnailUrl && (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-green-600 font-medium bg-green-100 px-2 py-1 rounded">
                        {item.contentType}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        by {item.author?.username || 'Anonymous'}
                      </span>
                      <div className="flex items-center space-x-3 text-gray-500">
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          {item.likes || 0}
                        </span>
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {item.views || 0}
                        </span>
                      </div>
                    </div>
                    <Link
                      to={`/content/${item._id}`}
                      className="block mt-3 bg-green-600 text-white text-center py-2 rounded hover:bg-green-700 transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <LoadingSpinner size="sm" color="white" />
                      <span className="ml-2">Loading...</span>
                    </div>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No content found
            </h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your filters or check back later for new content.
            </p>
            <Link
              to="/upload"
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Be the first to upload content!
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Browse;