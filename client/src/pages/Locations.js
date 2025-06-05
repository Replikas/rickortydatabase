import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const Locations = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    dimension: ''
  });
  // const [page, setPage] = useState(1); // TODO: Implement pagination
  const [hasMore, setHasMore] = useState(true);

  const typeOptions = ['planet', 'cluster', 'space station', 'microverse', 'tv', 'resort', 'fantasy town', 'dream', 'dimension', 'unknown'];
  const dimensionOptions = ['dimension c-137', 'unknown', 'dimension 35-c', 'post-apocalyptic dimension', 'replacement dimension', 'cronenberg dimension', 'fantasy dimension'];

  useEffect(() => {
    fetchLocations(true);
  }, [searchTerm, filters]);

  const fetchLocations = async (reset = false) => {
    try {
      setLoading(true);
      // Set default empty data since backend is not available
      const newLocations = [];
      
      if (reset) {
        setLocations(newLocations);
        setPage(2);
      } else {
        setLocations(prev => [...prev, ...newLocations]);
        setPage(prev => prev + 1);
      }
      
      setHasMore(false); // No more data to load
    } catch (error) {
      console.error('Error fetching locations:', error);
      if (reset) {
        setLocations([]);
      }
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({ type: '', dimension: '' });
    setPage(1);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchLocations(false);
    }
  };

  const getTypeColor = (type) => {
    const typeColors = {
      'planet': 'bg-blue-100 text-blue-800',
      'cluster': 'bg-purple-100 text-purple-800',
      'space station': 'bg-gray-100 text-gray-800',
      'microverse': 'bg-green-100 text-green-800',
      'tv': 'bg-red-100 text-red-800',
      'resort': 'bg-yellow-100 text-yellow-800',
      'fantasy town': 'bg-pink-100 text-pink-800',
      'dream': 'bg-indigo-100 text-indigo-800',
      'dimension': 'bg-orange-100 text-orange-800'
    };
    return typeColors[type?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Rick and Morty Locations
          </h1>
          <p className="text-gray-600">
            Browse and discover locations from the Rick and Morty universe
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          {/* Search Bar */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Locations
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search by location name..."
                className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Types</option>
                {typeOptions.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Dimension Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dimension
              </label>
              <select
                value={filters.dimension}
                onChange={(e) => handleFilterChange('dimension', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Dimensions</option>
                {dimensionOptions.map(dimension => (
                  <option key={dimension} value={dimension}>
                    {dimension.charAt(0).toUpperCase() + dimension.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Locations Grid */}
        {loading && locations.length === 0 ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : locations.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locations.map((location) => (
                <div key={location.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    {/* Location Header */}
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${getTypeColor(location.type)}`}>
                        {location.type}
                      </span>
                      <span className="text-sm text-gray-500 font-mono">
                        ID: {location.id}
                      </span>
                    </div>

                    {/* Location Name */}
                    <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                      {location.name}
                    </h3>

                    {/* Location Info */}
                    <div className="space-y-3 mb-4">
                      <div>
                        <span className="text-sm text-gray-600 block">Dimension:</span>
                        <span className="text-sm text-gray-900 font-medium">
                          {location.dimension || 'Unknown'}
                        </span>
                      </div>
                      
                      <div>
                        <span className="text-sm text-gray-600 block">Type:</span>
                        <span className="text-sm text-gray-900 font-medium">
                          {location.type || 'Unknown'}
                        </span>
                      </div>
                      
                      <div>
                        <span className="text-sm text-gray-600 block">Residents:</span>
                        <span className="text-sm text-gray-900 font-medium">
                          {location.residents?.length || 0} characters
                        </span>
                      </div>
                    </div>

                    {/* Residents Preview */}
                    {location.residents && location.residents.length > 0 && (
                      <div className="mb-4">
                        <span className="text-sm text-gray-600 block mb-2">Notable Residents:</span>
                        <div className="text-sm text-gray-900">
                          {location.residents.length > 3 ? (
                            <span>
                              {location.residents.length} residents including Rick, Morty and others
                            </span>
                          ) : (
                            <span>
                              {location.residents.length} resident{location.residents.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <Link
                      to={`/location/${location.id}`}
                      className="block bg-green-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                    >
                      Explore Location
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
                    'Load More Locations'
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No locations found
            </h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your search terms or filters.
            </p>
            <button
              onClick={clearFilters}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Locations;