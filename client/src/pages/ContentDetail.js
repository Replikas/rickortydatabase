import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/config';

const ContentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/content/${id}`);
        setContent(response.data);
      } catch (err) {
        console.error('Error fetching content:', err);
        setError('Content not found or failed to load');
        toast.error('Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchContent();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="text-xl">Loading content...</p>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-red-400">Content Not Found</h1>
          <p className="text-xl mb-8">{error || 'The requested content could not be found.'}</p>
          <button
            onClick={() => navigate('/browse')}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition duration-200"
          >
            Back to Browse
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRatingColor = (rating) => {
    const colors = {
      'G': 'bg-green-500',
      'PG': 'bg-blue-500',
      'T': 'bg-yellow-500',
      'M': 'bg-orange-500',
      'E': 'bg-red-500',
      'XXX': 'bg-purple-500'
    };
    return colors[rating] || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/browse')}
            className="text-green-400 hover:text-green-300 mb-4 flex items-center"
          >
            ← Back to Browse
          </button>
          <h1 className="text-4xl font-bold mb-2">{content.title}</h1>
          <p className="text-gray-400">by {content.author}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Content Display */}
          <div className="lg:col-span-2">
            {content.contentType === 'art' ? (
              <div className="bg-gray-800 rounded-lg p-6">
                <img
                  src={content.fileUrl}
                  alt={content.title}
                  className="w-full h-auto rounded-lg shadow-lg"
                  onError={(e) => {
                    e.target.src = '/placeholder-image.png';
                  }}
                />
                {content.metadata && (
                  <div className="mt-4 text-sm text-gray-400">
                    <p>Dimensions: {content.metadata.width} × {content.metadata.height}</p>
                    <p>Format: {content.metadata.format?.toUpperCase()}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 mb-4">
                    This is a fanfiction file. 
                    <a 
                      href={content.fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-green-400 hover:text-green-300 underline ml-1"
                    >
                      Download to read
                    </a>
                  </p>
                  {content.metadata && content.metadata.wordCount && (
                    <p className="text-sm text-gray-400">
                      Word Count: {content.metadata.wordCount.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Rating */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">Rating</h3>
              <span className={`inline-block px-3 py-1 rounded-full text-white font-semibold ${getRatingColor(content.rating)}`}>
                {content.rating}
              </span>
            </div>

            {/* Tags */}
            {content.tags && content.tags.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {content.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-green-600 text-white px-2 py-1 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {content.warnings && content.warnings.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-2">Content Warnings</h3>
                <div className="flex flex-wrap gap-2">
                  {content.warnings.map((warning, index) => (
                    <span
                      key={index}
                      className="bg-red-600 text-white px-2 py-1 rounded-full text-sm"
                    >
                      {warning}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {content.description && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-gray-300 whitespace-pre-wrap">{content.description}</p>
              </div>
            )}

            {/* Upload Info */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">Upload Info</h3>
              <div className="text-sm text-gray-400 space-y-1">
                <p>Uploaded: {formatDate(content.createdAt)}</p>
                <p>Type: {content.contentType === 'art' ? 'Artwork' : 'Fanfiction'}</p>
                {content.fileSize && (
                  <p>File Size: {(content.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentDetail;