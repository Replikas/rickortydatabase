import React from 'react';

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              About Rick & Morty Database
            </h1>
            
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Welcome to the Rick & Morty Database, a community-driven platform dedicated to 
                celebrating the incredible universe of Rick and Morty through fan-created content.
              </p>
              
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Our Mission
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                We provide a centralized hub where fans can discover, share, and celebrate 
                Rick and Morty fanworks including artwork, fanfiction, and other creative content. 
                Our platform is built by fans, for fans.
              </p>
              
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                What You Can Find Here
              </h2>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-6 space-y-2">
                <li>High-quality fan art and illustrations</li>
                <li>Creative fanfiction stories</li>
                <li>Character information and episode guides</li>
                <li>Location details from the Rick and Morty universe</li>
                <li>Community discussions and interactions</li>
              </ul>
              
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Content Policy
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                We maintain a focus on cartoon and animated content only. Our automated systems 
                help ensure that all uploaded artwork maintains the animated aesthetic that makes 
                Rick and Morty special.
              </p>
              
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Community Guidelines
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                We're committed to maintaining a respectful and inclusive community. All users 
                must be 18+ to participate, and we expect everyone to treat fellow fans with 
                respect and kindness.
              </p>
              
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Get Involved
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Ready to join our community? You can:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-6 space-y-2">
                <li>Browse our extensive collection of fanworks</li>
                <li>Create an account to upload your own content</li>
                <li>Interact with other fans through comments and discussions</li>
                <li>Discover new artists and writers in the community</li>
              </ul>
              
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mt-8">
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                  Wubba Lubba Dub Dub!
                </h3>
                <p className="text-green-700 dark:text-green-300">
                  Thanks for being part of our interdimensional community of Rick and Morty fans. 
                  Together, we're building the ultimate repository of fan creativity!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;