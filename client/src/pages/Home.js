import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const Home = () => {
  const [stats, setStats] = useState(null);
  const [recentContent, setRecentContent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        // Set default data since backend is not available
        setStats({ totalContent: 0, totalUsers: 0, totalViews: 0 });
        setRecentContent([]);
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    };

    // Set a timeout to ensure loading doesn't hang
    const timer = setTimeout(() => {
      setLoading(false);
    }, 100);

    fetchHomeData();
    
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section with Rick and Morty Portal Theme */}
      <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-blue-900 overflow-hidden">
        {/* Portal-like Floating Elements */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Main Portal Effect */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 opacity-20">
            <div className="absolute inset-0 rounded-full border-4 border-green-400 animate-spin" style={{animationDuration: '8s'}}></div>
            <div className="absolute inset-4 rounded-full border-2 border-blue-400 animate-spin" style={{animationDuration: '6s', animationDirection: 'reverse'}}></div>
            <div className="absolute inset-8 rounded-full border border-cyan-400 animate-spin" style={{animationDuration: '4s'}}></div>
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-blue-500/10 to-cyan-500/10 rounded-full blur-xl animate-pulse"></div>
          </div>
          
          {/* Floating Portal Fragments */}
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-xl animate-pulse border border-green-400/30"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-lg animate-pulse border border-blue-400/30" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-gradient-to-br from-cyan-400/10 to-green-400/10 rounded-full blur-2xl animate-pulse border border-cyan-400/20" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-xl animate-pulse border border-green-400/30" style={{animationDelay: '0.5s'}}></div>
        </div>
        
        {/* Dimensional Grid Pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(34, 197, 94, 0.4) 1px, transparent 0)`,
          backgroundSize: '50px 50px'
        }}></div>
        
        {/* Sci-fi Scanlines */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(34, 197, 94, 0.1) 2px, rgba(34, 197, 94, 0.1) 4px)`,
        }}></div>
        
        <div className="relative flex flex-col items-center justify-center min-h-screen px-4 text-center">
          <div className="max-w-4xl mx-auto">
            {/* Portal-themed Glowing Title */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white relative">
              <span className="bg-gradient-to-r from-green-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg">
                Rick and Morty Database
              </span>
              <div className="absolute -inset-1 bg-gradient-to-r from-green-400/30 via-blue-400/30 to-cyan-400/30 blur-lg -z-10 opacity-70 animate-pulse"></div>
              {/* Portal Ring Effect */}
              <div className="absolute -inset-8 border border-green-400/20 rounded-full animate-spin" style={{animationDuration: '10s'}}></div>
            </h1>
            
            <p className="text-lg md:text-xl text-green-100 mb-8 leading-relaxed max-w-3xl mx-auto drop-shadow-md">
               A comprehensive database for Rick and Morty fan content. 
               Import, organize, and discover artwork and stories from the community.
             </p>
             
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/browse" 
                className="group relative bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-400 hover:to-blue-500 text-white px-8 py-3 rounded-xl text-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 border border-green-400/30"
              >
                <span className="relative z-10 flex items-center justify-center">
                  Browse Content
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-green-400/50 to-blue-500/50 rounded-xl blur opacity-0 group-hover:opacity-70 transition-opacity duration-300"></div>
              </Link>
              <Link 
                to="/upload" 
                className="group relative bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-400 hover:to-cyan-500 text-white px-8 py-3 rounded-xl text-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 border border-blue-400/30"
              >
                <span className="relative z-10 flex items-center justify-center">
                  Upload Content
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/50 to-cyan-500/50 rounded-xl blur opacity-0 group-hover:opacity-70 transition-opacity duration-300"></div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section - Interdimensional Lab Theme */}
      {stats && (
        <div className="relative py-16 bg-gradient-to-br from-slate-800 via-slate-900 to-green-900">
          {/* Lab Equipment Pattern */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `linear-gradient(45deg, rgba(34, 197, 94, 0.2) 25%, transparent 25%), linear-gradient(-45deg, rgba(59, 130, 246, 0.2) 25%, transparent 25%)`,
            backgroundSize: '80px 80px'
          }}></div>
          
          {/* Floating Lab Elements */}
          <div className="absolute top-10 right-10 w-32 h-32 border border-green-400/20 rounded-full animate-pulse"></div>
          <div className="absolute bottom-10 left-10 w-24 h-24 border border-blue-400/20 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
          
          <div className="relative max-w-7xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent drop-shadow-lg">
                Database Statistics
              </span>
            </h2>
            <p className="text-lg text-green-100 mb-12 max-w-2xl mx-auto">
              Current data and metrics from our content database.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="group relative bg-slate-800/80 backdrop-blur-sm border border-green-400/30 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-2xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                <div className="relative">
                  <div className="text-4xl font-bold text-green-400 mb-2">{stats.totalContent || 0}</div>
                  <div className="text-green-100 font-medium">Total Content</div>
                </div>
              </div>
              <div className="group relative bg-slate-800/80 backdrop-blur-sm border border-blue-400/30 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-2xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                <div className="relative">
                  <div className="text-4xl font-bold text-blue-400 mb-2">{stats.totalUsers || 0}</div>
                  <div className="text-blue-100 font-medium">Registered Users</div>
                </div>
              </div>
              <div className="group relative bg-slate-800/80 backdrop-blur-sm border border-cyan-400/30 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-green-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400/20 to-green-400/20 rounded-2xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                <div className="relative">
                  <div className="text-4xl font-bold text-cyan-400 mb-2">{stats.totalViews || 0}</div>
                  <div className="text-cyan-100 font-medium">Total Views</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Content Section */}
      <div className="relative py-16 bg-gradient-to-br from-white to-slate-50">
        {/* Subtle Background Elements */}
        <div className="absolute top-10 right-10 w-64 h-64 bg-gradient-to-br from-cyan-100/20 to-blue-100/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-gradient-to-br from-purple-100/20 to-pink-100/20 rounded-full blur-2xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-slate-700 to-cyan-700 bg-clip-text text-transparent">
                Latest Content
              </span>
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Check out the newest creations from our community.
            </p>
          </div>
          
          {recentContent.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentContent.map((content) => (
                <div key={content._id} className="group relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-200/50 transform hover:-translate-y-2">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-slate-50/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  {content.thumbnail && (
                    <div className="relative overflow-hidden rounded-t-2xl">
                      <img 
                        src={content.thumbnail} 
                        alt={content.title}
                        className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  )}
                  <div className="relative p-6">
                    <h3 className="text-xl font-semibold text-slate-800 mb-2 group-hover:text-indigo-700 transition-colors duration-200">
                      {content.title}
                    </h3>
                    <p className="text-slate-600 mb-4 line-clamp-3">
                      {content.description}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-600 font-medium">
                        {content.author?.username || 'Anonymous'}
                      </span>
                      <span className="text-slate-500">
                        {new Date(content.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="relative inline-block mb-6">
                <div className="text-6xl">📝</div>
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-200/30 to-purple-200/30 rounded-full blur-xl animate-pulse"></div>
              </div>
              <p className="text-xl text-slate-700 mb-4">No content yet!</p>
              <p className="text-slate-600 mb-8">Be the first to share something amazing.</p>
              <Link 
                to="/upload" 
                className="group relative inline-block bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <span className="relative z-10">Upload Content</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
              </Link>
            </div>
          )}

          <div className="text-center mt-16">
            <Link
              to="/browse"
              className="group relative inline-block bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 text-white px-12 py-4 rounded-2xl font-bold text-xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
            >
              <span className="relative z-10 flex items-center justify-center">
                Browse All Content
                <span className="ml-2 group-hover:translate-x-2 transition-transform inline-block">→</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500 rounded-2xl blur opacity-0 group-hover:opacity-60 transition-opacity duration-300"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-400 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </Link>
          </div>
        </div>
      </div>

      {/* What You Can Do Section - Rick's Garage Theme */}
      <div className="relative py-16 bg-gradient-to-br from-slate-900 via-green-900 to-slate-800">
        {/* Garage/Lab Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-green-400/10 to-blue-400/10 rounded-full blur-2xl animate-pulse border border-green-400/20" style={{animationDelay: '0s'}}></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse border border-blue-400/20" style={{animationDelay: '1s'}}></div>
          {/* Portal Gun Effect */}
          <div className="absolute top-1/2 right-10 w-16 h-16 border-2 border-green-400/30 rounded-full animate-spin" style={{animationDuration: '6s'}}></div>
        </div>
        
        {/* Sci-fi Grid */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>
        
        <div className="relative max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg">
                What You Can Do
              </span>
            </h2>
            <p className="text-lg text-green-100 max-w-2xl mx-auto">
               Import, organize, and share Rick and Morty content with the community.
             </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group relative text-center p-8 bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-green-400/30 transform hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-2xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-blue-500/20 border border-green-400/40 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <span className="text-2xl">🎨</span>
                </div>
                <h3 className="text-xl font-semibold text-green-100 mb-3 group-hover:text-green-400 transition-colors duration-200">Share Artwork</h3>
                <p className="text-green-200/80">
                  Upload and organize Rick and Morty artwork in one centralized location.
                </p>
              </div>
            </div>
            
            <div className="group relative text-center p-8 bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-400/30 transform hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-2xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/40 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <span className="text-2xl">📖</span>
                </div>
                <h3 className="text-xl font-semibold text-blue-100 mb-3 group-hover:text-blue-400 transition-colors duration-200">Import Stories</h3>
                <p className="text-blue-200/80">
                  Import and share fanfiction from AO3 and other platforms.
                </p>
              </div>
            </div>
            
            <div className="group relative text-center p-8 bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-cyan-400/30 transform hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-green-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400/20 to-green-400/20 rounded-2xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-green-500/20 border border-cyan-400/40 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <span className="text-2xl">🔍</span>
                </div>
                <h3 className="text-xl font-semibold text-cyan-100 mb-3 group-hover:text-cyan-400 transition-colors duration-200">Discover Content</h3>
                <p className="text-cyan-200/80">
                  Explore amazing creations from the Rick and Morty fan community.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;