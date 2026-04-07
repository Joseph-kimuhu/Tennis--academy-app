import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function Navbar() {
  const { user, isAuthenticated, isAdmin, isCoach, isPlayer, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadNotifications();
      // Poll for new notifications every 10 seconds for real-time updates
      const interval = setInterval(fetchUnreadNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const fetchUnreadNotifications = async () => {
    try {
      const data = await api.getUnreadNotificationsCount();
      setUnreadNotifications(data.unread_count || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: '/courts', label: 'Courts' },
    { path: '/tournaments', label: 'Tournaments' },
  ];

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              <img 
                src="/jta-logo.svg" 
                alt="EPIC TENNIS ACADEMY Logo" 
                className="w-10 h-10 rounded-xl"
              />
              <span className="font-bold text-xl text-gray-900 hidden sm:block">EPIC TENNIS ACADEMY</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(link.path) 
                    ? 'bg-[#2E7D32] text-white' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-[#2E7D32]'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {isAuthenticated && isPlayer && (
              <Link
                to="/player-dashboard"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive('/player-dashboard')
                    ? 'bg-[#2E7D32] text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-[#2E7D32]'
                }`}
              >
                Dashboard
              </Link>
            )}

            
            {isAdmin && (
              <Link
                to="/staff-panel"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive('/staff-panel') 
                    ? 'bg-[#2E7D32] text-white' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-[#2E7D32]'
                }`}
              >
                Admin Panel
              </Link>
            )}

          </div>

          {/* Auth Buttons / Profile */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated && (
              <div className="relative">
                <button
                  onClick={() => {
                    if (isAdmin || isCoach) {
                      navigate('/staff-panel?tab=announcements');
                    } else {
                      navigate('/player-dashboard?tab=notifications');
                    }
                  }}
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors relative"
                  title="Notifications"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                  )}
                </button>
              </div>
            )}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-[#2E7D32]">
                    {user?.profile_picture ? (
                      <img 
                        src={user.profile_picture} 
                        alt={user.username} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-semibold text-sm">
                        {user?.username?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user?.username}</span>
                  <svg 
                    className={`w-4 h-4 text-gray-500 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`}
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-slideIn">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.full_name || user?.username}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-[#2E7D32] text-white text-xs rounded-full capitalize">
                        {user?.role}
                      </span>
                    </div>
                    <Link
                      to={isAdmin ? "/staff-panel" : "/player-dashboard"}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <span className="mr-2">📊</span>
                      Dashboard
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/staff-panel"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <span className="mr-2">⚙️</span>
                        Admin
                      </Link>
                    )}
                    {(isCoach || isAdmin) && (
                      <Link
                        to="/staff-panel"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <span className="mr-2">🏅</span>
                        Coach Panel
                      </Link>
                    )}
                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <span className="mr-2">👤</span>
                        Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <span className="mr-2">🚪</span>
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#2E7D32] transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 bg-[#2E7D32] text-white text-sm font-medium rounded-xl hover:bg-[#1B5E20] transition-colors shadow-md hover:shadow-lg"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg
                className="h-6 w-6 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="px-4 py-3 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`block px-4 py-3 rounded-lg text-sm font-medium ${
                  isActive(link.path) 
                    ? 'bg-[#2E7D32] text-white' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated && (
              <>
                {isPlayer && (
                  <Link
                    to="/player-dashboard"
                    className={`block px-4 py-3 rounded-lg text-sm font-medium ${
                      isActive('/player-dashboard')
                        ? 'bg-[#2E7D32] text-white'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    to="/staff-panel"
                    className={`block px-4 py-3 rounded-lg text-sm font-medium ${
                      isActive('/staff-panel') || isActive('/admin') 
                        ? 'bg-[#2E7D32] text-white' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                {(isCoach || isAdmin) && (
                  <Link
                    to="/staff-panel"
                    className={`block px-4 py-3 rounded-lg text-sm font-medium ${
                      isActive('/staff-panel') || isActive('/coach-panel') 
                        ? 'bg-[#2E7D32] text-white' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Coach Panel
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </>
            )}
            {!isAuthenticated && (
              <div className="pt-2 space-y-2">
                <Link
                  to="/login"
                  className="block w-full text-center px-4 py-3 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block w-full text-center px-4 py-3 rounded-lg text-sm font-medium bg-[#2E7D32] text-white hover:bg-[#1B5E20]"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
