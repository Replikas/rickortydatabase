import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Privacy Policy
            </h1>
            
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                This Privacy Policy describes how the Rick & Morty Database collects, uses, and protects your information when you use our platform.
              </p>
              
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                <p className="text-green-800 dark:text-green-200 font-semibold">
                  Last Updated: June 5, 2025
                </p>
                <p className="text-green-700 dark:text-green-300 text-sm mt-2">
                  We are committed to protecting your privacy and being transparent about our data practices.
                </p>
              </div>
              
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                1. Information We Collect
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Personal Information
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                When you create an account, we collect:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-2">
                <li>Username and email address</li>
                <li>Password (encrypted and stored securely)</li>
                <li>Profile information you choose to provide</li>
              </ul>
              
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Content Information
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                When you upload content, we collect:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-2">
                <li>Uploaded files (artwork, fanfiction)</li>
                <li>Content metadata (titles, descriptions, tags)</li>
                <li>Content ratings and warnings</li>
                <li>Upload timestamps and authorship information</li>
              </ul>
              
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Technical Information
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                We automatically collect certain technical information:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-6 space-y-2">
                <li>IP addresses and device information</li>
                <li>Browser type and version</li>
                <li>Usage patterns and platform interactions</li>
                <li>Error logs and performance data</li>
              </ul>
              
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                2. How We Use Your Information
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Platform Operation
              </h3>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-2">
                <li>Provide and maintain the platform services</li>
                <li>Process and display your uploaded content</li>
                <li>Enable user interactions and community features</li>
                <li>Authenticate users and maintain account security</li>
              </ul>
              
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Content Moderation
              </h3>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-2">
                <li>Automatically filter content using image classification</li>
                <li>Enforce community guidelines and terms of service</li>
                <li>Detect and prevent abuse or harmful content</li>
                <li>Maintain platform quality and safety standards</li>
              </ul>
              
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Platform Improvement
              </h3>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-6 space-y-2">
                <li>Analyze usage patterns to improve user experience</li>
                <li>Debug technical issues and optimize performance</li>
                <li>Develop new features and functionality</li>
                <li>Ensure platform security and stability</li>
              </ul>
              
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                3. Information Sharing
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Public Content
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Content you upload to the platform is intended to be public and will be visible to other users. This includes:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-2">
                <li>Your uploaded artwork and fanfiction</li>
                <li>Content titles, descriptions, and tags</li>
                <li>Your username as the content author</li>
                <li>Comments and interactions on content</li>
              </ul>
              
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Third-Party Services
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                We may share limited information with trusted third-party services that help us operate the platform, such as hosting providers and analytics services. These services are bound by confidentiality agreements and may only use your information to provide services to us.
              </p>
              
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                4. Data Security
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                We implement appropriate security measures to protect your personal information:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-6 space-y-2">
                <li>Encrypted password storage using industry-standard hashing</li>
                <li>Secure HTTPS connections for all data transmission</li>
                <li>Regular security updates and monitoring</li>
                <li>Access controls and authentication systems</li>
                <li>Automated content filtering to prevent harmful uploads</li>
              </ul>
              
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                5. Data Retention
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                We retain your information for as long as your account is active or as needed to provide services. If you delete your account, we will remove your personal information, though some content may remain if it has been shared publicly or is necessary for legal compliance.
              </p>
              
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                6. Your Rights and Choices
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Account Control
              </h3>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-2">
                <li>Update your profile information at any time</li>
                <li>Delete content you have uploaded</li>
                <li>Deactivate or delete your account</li>
                <li>Control privacy settings for your content</li>
              </ul>
              
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Data Access
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                You can request access to the personal information we have about you. Due to the nature of our platform, most of your data is already accessible through your account dashboard.
              </p>
              
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                7. Cookies and Tracking
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                We use cookies and similar technologies to maintain your login session, remember your preferences, and analyze platform usage. You can control cookie settings through your browser, though some features may not work properly if cookies are disabled.
              </p>
              
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                8. Age Restrictions
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Our platform is intended for users 18 years and older. We do not knowingly collect personal information from individuals under 18. If we become aware that we have collected personal information from someone under 18, we will take steps to delete that information.
              </p>
              
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                9. International Users
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Our platform is hosted and operated from various locations. By using the platform, you consent to the transfer and processing of your information in countries that may have different privacy laws than your country of residence.
              </p>
              
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                10. Changes to This Policy
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                We may update this Privacy Policy from time to time. We will notify users of any material changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. Your continued use of the platform after any changes constitutes acceptance of the new Privacy Policy.
              </p>
              
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                11. Contact Us
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                If you have any questions about this Privacy Policy or our data practices, please contact us through the platform.
              </p>
              
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6 mt-8">
                <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-2">
                  Your Privacy Matters
                </h3>
                <p className="text-purple-700 dark:text-purple-300">
                  We are committed to protecting your privacy and being transparent about how we handle your data. This policy reflects our dedication to maintaining a safe and trustworthy platform for the Rick and Morty fan community.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;