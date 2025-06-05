import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/config';
import toast from 'react-hot-toast';

const Upload = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    contentType: 'art',
    tags: '',
    author: '',
    rating: 'T',
    warnings: [],
    isNSFW: false
  });
  const [file, setFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const contentTypes = [
    { value: 'art', label: 'Art/Illustration' },
    { value: 'fic', label: 'Fanfiction' }
  ];

  const ratings = [
    { value: 'G', label: 'General Audiences' },
    { value: 'PG', label: 'Parental Guidance' },
    { value: 'T', label: 'Teen and Up' },
    { value: 'M', label: 'Mature' },
    { value: 'E', label: 'Explicit' }
  ];

  const warningOptions = [
    { value: 'NSFW', label: 'NSFW Content' },
    { value: 'Gore', label: 'Graphic Violence/Gore' },
    { value: 'Noncon', label: 'Non-Consensual Content' },
    { value: 'Kink', label: 'Kink/Fetish Content' },
    { value: 'Other', label: 'Other (specify in description)' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'warnings') {
        const updatedWarnings = checked 
          ? [...formData.warnings, value]
          : formData.warnings.filter(w => w !== value);
        setFormData({
          ...formData,
          warnings: updatedWarnings
        });
      } else {
        setFormData({
          ...formData,
          [name]: checked
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Create preview for images
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setFilePreview(e.target.result);
        reader.readAsDataURL(selectedFile);
      } else {
        setFilePreview(null);
      }
      
      // Clear file error
      if (errors.file) {
        setErrors({ ...errors, file: '' });
      }
    }
  };

  const handleThumbnailChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setThumbnailFile(selectedFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setThumbnailPreview(e.target.result);
      reader.readAsDataURL(selectedFile);
      
      // Clear thumbnail error
      if (errors.thumbnailFile) {
        setErrors({ ...errors, thumbnailFile: '' });
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    // File validation
    if (!file) {
      newErrors.file = 'Please select a file to upload';
    } else {
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        newErrors.file = 'File size must be less than 50MB';
      }
      
      // Validate file type based on content type
      if (formData.contentType === 'art') {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
          newErrors.file = 'Art files must be PNG, JPG, JPEG, or GIF';
        }
      } else if (formData.contentType === 'fic') {
        const allowedTypes = ['text/plain', 'text/markdown', 'application/pdf'];
        const allowedExtensions = ['.txt', '.md', '.pdf'];
        const hasValidType = allowedTypes.includes(file.type);
        const hasValidExtension = allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
        
        if (!hasValidType && !hasValidExtension) {
          newErrors.file = 'Fanfiction files must be TXT, MD, or PDF';
        }
      }
    }

    // Thumbnail validation (optional)
    if (thumbnailFile) {
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
      if (!allowedTypes.includes(thumbnailFile.type)) {
        newErrors.thumbnailFile = 'Thumbnail must be PNG, JPG, JPEG, or GIF';
      }
      
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (thumbnailFile.size > maxSize) {
        newErrors.thumbnailFile = 'Thumbnail size must be less than 10MB';
      }
    }

    // Description validation (optional but if provided, check length)
    if (formData.description && formData.description.length > 2000) {
      newErrors.description = 'Description must be less than 2000 characters';
    }

    // Author validation (optional but if provided, check length)
    if (formData.author && formData.author.length > 100) {
      newErrors.author = 'Author name must be less than 100 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Create FormData for file upload
      const uploadData = new FormData();
      
      // Add file
      uploadData.append('file', file);
      
      // Add form fields
      uploadData.append('title', formData.title);
      uploadData.append('contentType', formData.contentType);
      uploadData.append('description', formData.description || '');
      uploadData.append('author', formData.author || '');
      uploadData.append('rating', formData.rating);
      uploadData.append('isNSFW', formData.isNSFW);
      
      // Add tags
      if (formData.tags) {
        const processedTags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        uploadData.append('tags', processedTags.join(','));
      }
      
      // Add warnings
      if (formData.warnings.length > 0) {
        formData.warnings.forEach(warning => {
          uploadData.append('warnings', warning);
        });
      }
      
      // Add thumbnail if provided
      if (thumbnailFile) {
        uploadData.append('thumbnail', thumbnailFile);
      }

      const response = await axios.post('/api/content/upload', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          // You could add a progress bar here
          console.log(`Upload Progress: ${percentCompleted}%`);
        }
      });
      
      if (response.data) {
        toast.success('Content uploaded successfully!');
        navigate(`/content/${response.data.content._id}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.message || 'Upload failed. Please try again.';
      
      // Handle specific validation errors from server
      if (error.response?.data?.errors) {
        const serverErrors = {};
        error.response.data.errors.forEach(err => {
          serverErrors[err.path || err.param || 'general'] = err.msg || err.message;
        });
        setErrors(serverErrors);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Upload Your Fanwork
          </h1>
          <p className="text-gray-600">
            Share your Rick and Morty creations with the community
          </p>
        </div>

        {/* Upload Form */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter a catchy title for your work"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Describe your work, inspiration, or any relevant details"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Content Type */}
            <div>
              <label htmlFor="contentType" className="block text-sm font-medium text-gray-700 mb-2">
                Content Type *
              </label>
              <select
                id="contentType"
                name="contentType"
                value={formData.contentType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {contentTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* File Upload */}
            <div>
              <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
                Upload File *
              </label>
              <input
                type="file"
                id="file"
                name="file"
                onChange={handleFileChange}
                accept={formData.contentType === 'art' ? 'image/*' : '.txt,.md,.pdf'}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.file ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.file && (
                <p className="mt-1 text-sm text-red-600">{errors.file}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                {formData.contentType === 'art' 
                  ? 'Upload your artwork (PNG, JPG, JPEG, GIF - max 50MB)'
                  : 'Upload your fanfiction (TXT, MD, PDF - max 50MB)'
                }
              </p>
              
              {/* File Preview */}
              {filePreview && (
                <div className="mt-3">
                  <img 
                    src={filePreview} 
                    alt="Preview" 
                    className="max-w-xs max-h-48 rounded-md border"
                  />
                </div>
              )}
              {file && !filePreview && (
                <div className="mt-3 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">
                    📄 {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                </div>
              )}
            </div>

            {/* Author */}
            <div>
              <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-2">
                Author (Optional)
              </label>
              <input
                type="text"
                id="author"
                name="author"
                value={formData.author}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.author ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Your name or pseudonym"
              />
              {errors.author && (
                <p className="mt-1 text-sm text-red-600">{errors.author}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Leave blank to post anonymously
              </p>
            </div>

            {/* Rating */}
            <div>
              <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-2">
                Content Rating *
              </label>
              <select
                id="rating"
                name="rating"
                value={formData.rating}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {ratings.map(rating => (
                  <option key={rating.value} value={rating.value}>
                    {rating.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Content Warnings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Warnings (Optional)
              </label>
              <div className="space-y-2">
                {warningOptions.map(warning => (
                  <label key={warning.value} className="flex items-center">
                    <input
                      type="checkbox"
                      name="warnings"
                      value={warning.value}
                      checked={formData.warnings.includes(warning.value)}
                      onChange={handleChange}
                      className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{warning.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* NSFW Toggle */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isNSFW"
                  checked={formData.isNSFW}
                  onChange={handleChange}
                  className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Mark as NSFW (Not Safe For Work)
                </span>
              </label>
              <p className="mt-1 text-sm text-gray-500">
                Check this if your content contains mature themes
              </p>
            </div>

            {/* Thumbnail Upload (Optional) */}
            <div>
              <label htmlFor="thumbnailFile" className="block text-sm font-medium text-gray-700 mb-2">
                Custom Thumbnail (Optional)
              </label>
              <input
                type="file"
                id="thumbnailFile"
                name="thumbnailFile"
                onChange={handleThumbnailChange}
                accept="image/*"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.thumbnailFile ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.thumbnailFile && (
                <p className="mt-1 text-sm text-red-600">{errors.thumbnailFile}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Upload a custom thumbnail image (PNG, JPG, JPEG, GIF - max 10MB). For art, a thumbnail will be auto-generated if not provided.
              </p>
              
              {/* Thumbnail Preview */}
              {thumbnailPreview && (
                <div className="mt-3">
                  <img 
                    src={thumbnailPreview} 
                    alt="Thumbnail Preview" 
                    className="max-w-xs max-h-32 rounded-md border"
                  />
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                Tags (Optional)
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="rick, morty, portal gun, dimension c-137"
              />
              <p className="mt-1 text-sm text-gray-500">
                Separate tags with commas. Use relevant Rick and Morty characters, locations, or themes.
              </p>
            </div>

            {/* Guidelines */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                Content Guidelines
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Ensure your content is Rick and Morty related</li>
                <li>• Only upload your own original work or content you have permission to share</li>
                <li>• Choose appropriate content ratings and warnings</li>
                <li>• Provide accurate descriptions and relevant tags</li>
                <li>• Respect community standards and be considerate of other users</li>
                <li>• File size limits: 50MB for content files, 10MB for thumbnails</li>
              </ul>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/browse')}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </div>
                ) : (
                  'Upload Content'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Need Help?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Supported File Types:</h4>
              <ul className="space-y-1">
                <li><strong>Art:</strong> PNG, JPG, JPEG, GIF</li>
                <li><strong>Fanfiction:</strong> TXT, MD, PDF</li>
                <li><strong>Thumbnails:</strong> PNG, JPG, JPEG, GIF</li>
                <li><strong>Max Size:</strong> 50MB (content), 10MB (thumbnails)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Tips for Success:</h4>
              <ul className="space-y-1">
                <li>• Use descriptive, engaging titles</li>
                <li>• Add relevant tags for discoverability</li>
                <li>• Choose appropriate content ratings</li>
                <li>• Write detailed descriptions</li>
                <li>• Use content warnings when appropriate</li>
                <li>• Engage with the community</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;