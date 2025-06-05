import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-green-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-white text-xl font-bold">Rick & Morty DB</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Link to="/" className="text-white hover:text-green-200 px-3 py-2 rounded-md">
              Home
            </Link>
            <Link to="/browse" className="text-white hover:text-green-200 px-3 py-2 rounded-md">
              Browse
            </Link>
            <Link to="/search" className="text-white hover:text-green-200 px-3 py-2 rounded-md">
              Search
            </Link>
            {user ? (
              <>
                <Link to="/upload" className="text-white hover:text-green-200 px-3 py-2 rounded-md">
                  Upload
                </Link>
                <Link to="/profile" className="text-white hover:text-green-200 px-3 py-2 rounded-md">
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-white hover:text-green-200 px-3 py-2 rounded-md"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-white hover:text-green-200 px-3 py-2 rounded-md">
                  Login
                </Link>
                <Link to="/register" className="text-white hover:text-green-200 px-3 py-2 rounded-md">
                  Register
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white hover:text-green-200 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link to="/" className="text-white hover:text-green-200 block px-3 py-2 rounded-md">
                Home
              </Link>
              <Link to="/browse" className="text-white hover:text-green-200 block px-3 py-2 rounded-md">
                Browse
              </Link>
              <Link to="/search" className="text-white hover:text-green-200 block px-3 py-2 rounded-md">
                Search
              </Link>
              {user ? (
                <>
                  <Link to="/upload" className="text-white hover:text-green-200 block px-3 py-2 rounded-md">
                    Upload
                  </Link>
                  <Link to="/profile" className="text-white hover:text-green-200 block px-3 py-2 rounded-md">
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-white hover:text-green-200 block px-3 py-2 rounded-md w-full text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-white hover:text-green-200 block px-3 py-2 rounded-md">
                    Login
                  </Link>
                  <Link to="/register" className="text-white hover:text-green-200 block px-3 py-2 rounded-md">
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;