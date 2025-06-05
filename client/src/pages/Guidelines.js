import React from 'react';

const Guidelines = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Community Guidelines
            </h1>
            
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Welcome to the Rick & Morty Database community! To ensure everyone has a 
                positive experience, please follow these guidelines when participating.
              </p>
              
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                🔞 Age Requirement
              </h2>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <p className="text-red-800 dark:text-red-200 font-semibold">
                  You must be 18 years or older to use this platform.
                </p>
                <p className="text-red-700 dark:text-red-300 text-sm mt-2">
                  By using this site, you confirm that you are at least 18 years old. 
                  We are not responsible for verifying ages beyond the honor system.
                </p>
              </div>
              
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                🎨 Content Guidelines
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Artwork Requirements
              </h3>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-2">
                <li><strong>Cartoon/Animated Content Only:</strong> We only accept cartoon-style artwork. Real photographs are automatically detected and removed.</li>
                <li><strong>Rick & Morty Related:</strong> Content should be related to the Rick and Morty universe, characters, or themes.</li>
                <li><strong>Original or Credited Work:</strong> Only upload your own work or properly credit the original artist.</li>
                <li><strong>Quality Standards:</strong> Ensure your uploads are clear, properly formatted, and of reasonable quality.</li>
              </ul>
              
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Content Ratings & Warnings
              </h3>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-6 space-y-2">
                <li><strong>Accurate Ratings:</strong> Use appropriate content ratings (G, PG, T, M, E, XXX)</li>
                <li><strong>Content Warnings:</strong> Add warnings for NSFW, Gore, Noncon, Kink, or other sensitive content</li>
                <li><strong>NSFW Content:</strong> Clearly mark adult content and ensure it complies with platform rules</li>
              </ul>
              
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                💬 Community Behavior
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Be Respectful
              </h3>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-2">
                <li>Treat all community members with respect and kindness</li>
                <li>Provide constructive feedback when commenting on content</li>
                <li>Respect different artistic styles and creative interpretations</li>
                <li>Use appropriate language in comments and descriptions</li>
              </ul>
              
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Prohibited Behavior
              </h3>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-6 space-y-2">
                <li>Harassment, bullying, or personal attacks</li>
                <li>Spam, excessive self-promotion, or irrelevant content</li>
                <li>Sharing personal information of other users</li>
                <li>Impersonating other users or creators</li>
                <li>Attempting to circumvent content filters or upload restrictions</li>
              </ul>
              
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                🏷️ Tagging & Organization
              </h2>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-6 space-y-2">
                <li><strong>Relevant Tags:</strong> Use accurate, relevant tags to help others discover your content</li>
                <li><strong>Tag Limits:</strong> Maximum of 20 tags per upload, each under 50 characters</li>
                <li><strong>Character Tags:</strong> Tag characters that appear prominently in your work</li>
                <li><strong>Content Type Tags:</strong> Use appropriate genre and style tags</li>
              </ul>
              
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                ⚖️ Enforcement
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Automated Systems
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Our platform uses automated image classification to detect and remove real photographs. 
                This system helps maintain our cartoon-only content policy.
              </p>
              
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Violations
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Violations of these guidelines may result in content removal, account warnings, 
                or account suspension depending on the severity and frequency of violations.
              </p>
              
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                📞 Support
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                If you have questions about these guidelines or need to report content that 
                violates our rules, please note that we currently do not provide direct support.
              </p>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mt-8">
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  Remember: Peace Among Worlds! ✌️
                </h3>
                <p className="text-blue-700 dark:text-blue-300">
                  These guidelines help us maintain a fun, creative, and respectful community 
                  for all Rick and Morty fans. Thanks for doing your part!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Guidelines;