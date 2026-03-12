import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function Dashboard() {
  const { user, isAdmin, isCoach } = useAuth();
  const [searchParams] = useSearchParams();
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Use different API calls based on user role
      const promises = [
        api.getMyBookings({ upcoming: true, limit: 5 }),
        api.getNotifications({ limit: 10 }),
      ];

      // Add appropriate stats call based on user role
      if (isAdmin || isCoach) {
        promises.unshift(api.getAdminStats()); // Add admin stats for coaches and admins
      } else {
        promises.unshift(api.getMyStats()); // Use personal stats for players
      }

      const [statsData, bookingsData, notificationsData] = await Promise.all(promises);
      setStats(statsData);
      setBookings(bookingsData || []);
      setNotifications(notificationsData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-tennis-green border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-tennis-green to-tennis-green-dark rounded-xl p-6 mb-8 text-white">
          <h1 className="text-3xl font-bold">
            Welcome back, {user?.username}! 🎾
          </h1>
          <p className="mt-2 text-green-100">
            {user?.role === 'admin' && 'Manage your tennis court platform'}
            {user?.role === 'coach' && 'Manage your coaching sessions'}
            {user?.role === 'player' && 'Ready to play some tennis?'}
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'text-tennis-green border-b-2 border-tennis-green'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === 'messages'
                  ? 'text-tennis-green border-b-2 border-tennis-green'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📢 Messages & Announcements
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'messages' ? (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">📢 Messages & Announcements</h2>
            {notifications.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No messages or announcements yet.</p>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      notification.is_read
                        ? 'bg-gray-50 border-gray-300'
                        : 'bg-blue-50 border-blue-500'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{notification.subject}</h3>
                        <p className="text-sm text-gray-600 mt-1">{notification.content}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          From: {notification.sender?.username || 'System'} •{' '}
                          {new Date(notification.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                          New
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {(isAdmin || isCoach) ? (
            // Admin/Coach Overview Stats
            <>
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Users</p>
                    <p className="text-3xl font-bold text-tennis-green">{stats?.totalUsers || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-tennis-green rounded-full flex items-center justify-center">
                    <span className="text-white text-xl">👥</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Courts</p>
                    <p className="text-3xl font-bold text-blue-600">{stats?.totalCourts || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xl">🏟️</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active Tournaments</p>
                    <p className="text-3xl font-bold text-purple-600">{stats?.activeTournaments || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xl">🏆</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Bookings</p>
                    <p className="text-3xl font-bold text-orange-600">{stats?.totalBookings || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xl">📅</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Player Personal Stats
            <>
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Ranking Points</p>
                    <p className="text-3xl font-bold text-tennis-green">{stats?.ranking_points || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-tennis-green rounded-full flex items-center justify-center">
                    <span className="text-white text-xl">🏆</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Matches Played</p>
                    <p className="text-3xl font-bold text-gray-900">{stats?.total_matches || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xl">🎾</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Wins</p>
                    <p className="text-3xl font-bold text-green-600">{stats?.wins || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xl">✓</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Win Rate</p>
                    <p className="text-3xl font-bold text-gray-900">{stats?.win_rate?.toFixed(1) || 0}%</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xl">📊</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            to="/courts"
            className="bg-white rounded-xl shadow-md p-6 card-hover flex items-center space-x-4"
          >
            <div className="w-12 h-12 bg-tennis-green rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏟️</span>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Book a Court</h3>
              <p className="text-sm text-gray-500">Find and book available courts</p>
            </div>
          </Link>

          {/* Tournament quick action kept for players */}

          {/* Leaderboard quick action removed */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Bookings */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Upcoming Bookings</h2>
              <Link to="/my-bookings" className="text-tennis-green hover:text-tennis-green-dark text-sm">
                View All →
              </Link>
            </div>
            {bookings.length > 0 ? (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-tennis-green rounded-lg flex items-center justify-center mr-3">
                      <span className="text-white">🎾</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{booking.court?.name || 'Court'}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(booking.start_time).toLocaleDateString()} at{' '}
                        {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No upcoming bookings</p>
            )}
          </div>

          {/* Recent matches block removed – “My Matches” hidden */}
        </div>

        {/* Performance Chart */}
        {stats?.recent_performance && stats.recent_performance.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mt-8">
            <h2 className="text-xl font-bold mb-4">Recent Performance</h2>
            <div className="flex items-center space-x-2">
              {stats.recent_performance.map((result, index) => (
                <div
                  key={index}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                    result === 'W' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}
                >
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin Section removed – admins use UnifiedStaffPanel only */}
      </div>
    </div>
  );
}

export default Dashboard;
