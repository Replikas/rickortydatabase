import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState('all');
  const [hasSearched, setHasSearched] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get search query from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const query = urlParams.get('q');
    const type = urlParams.get('type') || 'all';
    
    if (query) {
      setSearchQuery(query);
      setSearchType(type);
      performSearch(query, type);
    }
  }, [location.search]);
  
  const performSearch = async (query, type = 'all') => {
    if (!query.trim()) return;
    
    setLoading(true);
    setHasSearched(true);
    
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${type}`);
      const data = await response.json();
      
      if (response.ok) {
        setSearchResults(data.results || []);
      } else {
        console.error('Search failed:', data.message);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // Update URL with search parameters
    navigate(`/search?q=${encodeURIComponent(searchQuery)}&type=${searchType}`);
  };
  
  const handleResultClick = (result) => {
    if (result.type === 'content') {
      navigate(`/browse?id=${result._id}`);
    } else if (result.type === 'character') {
      navigate(`/characters?id=${result._id}`);
    } else if (result.type === 'episode') {
      navigate(`/episodes?id=${result._id}`);
    } else if (result.type === 'location') {
      navigate(`/locations?id=${result._id}`);
    }
  };
  
  const getResultTypeIcon = (type) => {
    switch (type) {
      case 'content':
        return '🎨';
      case 'character':
        return '👤';
      case 'episode':
        return '📺';
      case 'location':
        return '🌍';
      default:
        return '🔍';
    }
  };
  
  const getResultTypeLabel = (type) => {
    switch (type) {
      case 'content':
        return 'Content';
      case 'character':
        return 'Character';
      case 'episode':
        return 'Episode';
      case 'location':
        return 'Location';
      default:
        return 'Result';
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
              🔍 Search the Rick & Morty Database
            </h1>
            
            {/* Search Form */}
            <form onSubmit={handleSearch} className="mb-8">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for content, characters, episodes, locations..."
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div className="md:w-48">
                  <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="all">All Results</option>
                    <option value="content">Content Only</option>
                    <option value="characters">Characters Only</option>
                    <option value="episodes">Episodes Only</option>
                    <option value="locations">Locations Only</option>
                  </select>
                </div>
                
                <button
                  type="submit"
                  disabled={loading || !searchQuery.trim()}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors duration-200"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </form>
            
            {/* Loading State */}
            {loading && (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            )}
            
            {/* Search Results */}
            {!loading && hasSearched && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Search Results
                    {searchQuery && (
                      <span className="text-gray-600 dark:text-gray-400 font-normal">
                        {' '}for "{searchQuery}"
                      </span>
                    )}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                  </p>
                </div>
                
                {searchResults.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🤷‍♂️</div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      No Results Found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      We couldn't find anything matching your search. Try different keywords or check your spelling.
                    </p>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-md mx-auto">
                      <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                        Search Tips:
                      </h4>
                      <ul className="text-sm text-blue-700 dark:text-blue-300 text-left space-y-1">
                        <li>• Try broader or more specific terms</li>
                        <li>• Check for typos in your search</li>
                        <li>• Use character names, episode titles, or content tags</li>
                        <li>• Try searching in different categories</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {searchResults.map((result, index) => (
                      <div
                        key={index}
                        onClick={() => handleResultClick(result)}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200"
                      >
                        <div className="flex items-start gap-4">
                          <div className="text-2xl">
                            {getResultTypeIcon(result.type)}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {result.title || result.name}
                              </h3>
                              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                                {getResultTypeLabel(result.type)}
                              </span>
                            </div>
                            
                            {result.description && (
                              <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-2">
                                {result.description}
                              </p>
                            )}
                            
                            {result.author && (
                              <p className="text-gray-500 dark:text-gray-500 text-sm">
                                by {result.author}
                              </p>
                            )}
                            
                            {result.tags && result.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {result.tags.slice(0, 5).map((tag, tagIndex) => (
                                  <span
                                    key={tagIndex}
                                    className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {result.tags.length > 5 && (
                                  <span className="text-gray-500 dark:text-gray-500 text-xs">
                                    +{result.tags.length - 5} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Initial State */}
            {!hasSearched && !loading && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Search the Database
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Find fan content, characters, episodes, and locations from the Rick and Morty universe.
                </p>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-2xl mb-2">🎨</div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Fan Content</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Artwork and fanfiction from the community
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-2xl mb-2">👤</div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Characters</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Rick, Morty, and all your favorite characters
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-2xl mb-2">📺</div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Episodes</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Information about episodes and seasons
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-2xl mb-2">🌍</div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Locations</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Dimensions and places across the multiverse
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Search;