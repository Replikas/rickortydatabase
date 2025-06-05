import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import axios from 'axios';

// Components
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import LoadingSpinner from './components/UI/LoadingSpinner';

// Pages
import Home from './pages/Home';
import Browse from './pages/Browse';
import Upload from './pages/Upload';
import ContentView from './pages/ContentView';
import Profile from './pages/Profile';
import Search from './pages/Search';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Settings from './pages/Settings';
import About from './pages/About';

// Context
const AuthContext = createContext();
const ThemeContext = createContext();

// Auth Provider
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Theme Provider
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Configure axios defaults
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Add auth token to requests
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('dark');
  const [showNSFW, setShowNSFW] = useState(false);

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load theme from localStorage
        const savedTheme = localStorage.getItem('theme') || 'dark';
        setTheme(savedTheme);
        document.documentElement.classList.toggle('dark', savedTheme === 'dark');

        // Load NSFW preference
        const savedNSFW = localStorage.getItem('showNSFW') === 'true';
        setShowNSFW(savedNSFW);

        // Check for existing auth token
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const response = await axios.get('/auth/me');
            setUser(response.data.user);
            
            // Update preferences from server
            if (response.data.user.preferences) {
              setShowNSFW(response.data.user.preferences.showNSFW);
              setTheme(response.data.user.preferences.theme);
              localStorage.setItem('showNSFW', response.data.user.preferences.showNSFW);
              localStorage.setItem('theme', response.data.user.preferences.theme);
              document.documentElement.classList.toggle('dark', response.data.user.preferences.theme === 'dark');
            }
          } catch (error) {
            console.error('Auth check failed:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.error('App initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Auth functions
  const login = async (credentials) => {
    try {
      const response = await axios.post('/auth/login', credentials);
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      // Update preferences
      if (userData.preferences) {
        setShowNSFW(userData.preferences.showNSFW);
        setTheme(userData.preferences.theme);
        localStorage.setItem('showNSFW', userData.preferences.showNSFW);
        localStorage.setItem('theme', userData.preferences.theme);
        document.documentElement.classList.toggle('dark', userData.preferences.theme === 'dark');
      }
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/auth/register', userData);
      const { token, user: newUser } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/';
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  // Theme functions
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    
    // Update on server if logged in
    if (user) {
      axios.put('/auth/preferences', { theme: newTheme }).catch(console.error);
    }
  };

  const toggleNSFW = () => {
    const newShowNSFW = !showNSFW;
    setShowNSFW(newShowNSFW);
    localStorage.setItem('showNSFW', newShowNSFW);
    
    // Update on server if logged in
    if (user) {
      axios.put('/auth/preferences', { showNSFW: newShowNSFW }).catch(console.error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      updateUser,
      isAuthenticated: !!user
    }}>
      <ThemeContext.Provider value={{
        theme,
        toggleTheme,
        showNSFW,
        toggleNSFW,
        isDark: theme === 'dark'
      }}>
        <Router>
          <div className={`min-h-screen transition-colors duration-200 ${
            theme === 'dark' 
              ? 'bg-gray-900 text-white' 
              : 'bg-gray-50 text-gray-900'
          }`}>
            <Navbar />
            
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/search" element={<Search />} />
                <Route path="/content/:id" element={<ContentView />} />
                <Route path="/upload" element={
                  user ? <Upload /> : <Navigate to="/login" replace />
                } />
                <Route path="/profile/:username" element={<Profile />} />
                <Route path="/settings" element={
                  user ? <Settings /> : <Navigate to="/login" replace />
                } />
                <Route path="/login" element={
                  !user ? <Login /> : <Navigate to="/" replace />
                } />
                <Route path="/register" element={
                  !user ? <Register /> : <Navigate to="/" replace />
                } />
                <Route path="/about" element={<About />} />
                <Route path="*" element={
                  <div className="container mx-auto px-4 py-16 text-center">
                    <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
                    <p className="text-gray-400 mb-8">The page you're looking for doesn't exist.</p>
                    <a href="/" className="text-green-400 hover:text-green-300 underline">
                      Go back home
                    </a>
                  </div>
                } />
              </Routes>
            </main>
            
            <Footer />
            
            <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: theme === 'dark' ? '#374151' : '#f9fafb',
                  color: theme === 'dark' ? '#f9fafb' : '#374151',
                  border: `1px solid ${theme === 'dark' ? '#4b5563' : '#d1d5db'}`
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: theme === 'dark' ? '#374151' : '#f9fafb'
                  }
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: theme === 'dark' ? '#374151' : '#f9fafb'
                  }
                }
              }}
            />
          </div>
        </Router>
      </ThemeContext.Provider>
    </AuthContext.Provider>
  );
}

export default App;