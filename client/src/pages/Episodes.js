import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const Episodes = () => {
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [seasonFilter, setSeasonFilter] = useState('');
  // const [page, setPage] = useState(1); // TODO: Implement pagination
  const [hasMore, setHasMore] = useState(true);

  const seasons = [1, 2, 3, 4, 5, 6, 7];

  useEffect(() => {
    fetchEpisodes(true);
  }, [searchTerm, seasonFilter]);

  const fetchEpisodes = async (reset = false) => {
    try {
      setLoading(true);
      // Set default empty data since backend is not available
      const newEpisodes = [];
      
      if (reset) {
        setEpisodes(newEpisodes);
        setPage(2);
      } else {
        setEpisodes(prev => [...prev, ...newEpisodes]);
        setPage(prev => prev + 1);
      }
      
      setHasMore(false); // No more data to load
    } catch (error) {
      console.error('Error fetching episodes:', error);
      if (reset) {
        setEpisodes([]);
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

  const handleSeasonChange = (season) => {
    setSeasonFilter(season);
    setPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSeasonFilter('');
    setPage(1);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchEpisodes(false);
    }
  };

  const parseEpisodeCode = (episode) => {
    const match = episode.match(/S(\d+)E(\d+)/);
    if (match) {
      return {
        season: parseInt(match[1]),
        episode: parseInt(match[2])
      };
    }
    return { season: 0, episode: 0 };
  };

  const getSeasonColor = (season) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-red-100 text-red-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800'
    ];
    return colors[(season - 1) % colors.length] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Rick and Morty Episodes
          </h1>
          <p className="text-gray-600">
            Browse all episodes from the Rick and Morty series
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          {/* Search Bar */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Episodes
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search by episode name..."
                className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Season Filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Filter by Season
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSeasonChange('')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  seasonFilter === ''
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All Seasons
              </button>
              {seasons.map(season => (
                <button
                  key={season}
                  onClick={() => handleSeasonChange(season.toString())}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    seasonFilter === season.toString()
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Season {season}
                </button>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          <div className="flex justify-end">
            <button
              onClick={clearFilters}
              className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Episodes Grid */}
        {loading && episodes.length === 0 ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : episodes.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {episodes.map((episode) => {
                const { season, episode: episodeNum } = parseEpisodeCode(episode.episode);
                return (
                  <div key={episode.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      {/* Episode Header */}
                      <div className="flex items-center justify-between mb-4">
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${getSeasonColor(season)}`}>
                          Season {season}
                        </span>
                        <span className="text-sm text-gray-500 font-mono">
                          {episode.episode}
                        </span>
                      </div>

                      {/* Episode Title */}
                      <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                        {episode.name}
                      </h3>

                      {/* Episode Info */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Air Date:</span>
                          <span className="text-sm text-gray-900 font-medium">
                            {episode.air_date}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Episode:</span>
                          <span className="text-sm text-gray-900 font-medium">
                            {episodeNum} of Season {season}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Characters:</span>
                          <span className="text-sm text-gray-900 font-medium">
                            {episode.characters?.length || 0}
                          </span>
                        </div>
                      </div>

                      {/* Episode URL */}
                      {episode.url && (
                        <div className="mb-4">
                          <span className="text-sm text-gray-600">Episode ID:</span>
                          <p className="text-sm text-gray-900 font-mono">
                            #{episode.id}
                          </p>
                        </div>
                      )}

                      {/* Action Button */}
                      <Link
                        to={`/episode/${episode.id}`}
                        className="block bg-green-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                      >
                        View Episode Details
                      </Link>
                    </div>
                  </div>
                );
              })}
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
                    'Load More Episodes'
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 110 2h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 110-2h4zM6 6v12h12V6H6zm3 3a1 1 0 112 0v6a1 1 0 11-2 0V9zm4 0a1 1 0 112 0v6a1 1 0 11-2 0V9z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No episodes found
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

export default Episodes;