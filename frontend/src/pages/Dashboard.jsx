import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function Dashboard() {
  const { user, isAdmin, isCoach } = useAuth();
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsData, bookingsData, matchesData] = await Promise.all([
        api.getMyStats(),
        api.getMyBookings({ upcoming: true, limit: 5 }),
        api.getMyMatches({ limit: 5 }),
      ]);
      setStats(statsData);
      setBookings(bookingsData || []);
      setMatches(matchesData || []);
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
        </div>

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

          <Link
            to="/tournaments"
            className="bg-white rounded-xl shadow-md p-6 card-hover flex items-center space-x-4"
          >
            <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏆</span>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Join Tournament</h3>
              <p className="text-sm text-gray-500">Compete in tournaments</p>
            </div>
          </Link>

          <Link
            to="/leaderboard"
            className="bg-white rounded-xl shadow-md p-6 card-hover flex items-center space-x-4"
          >
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
            <div>
              <h3 className="font-semibold text-lg">View Rankings</h3>
              <p className="text-sm text-gray-500">See top players</p>
            </div>
          </Link>
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

          {/* Recent Matches */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Recent Matches</h2>
            </div>
            {matches.length > 0 ? (
              <div className="space-y-4">
                {matches.map((match) => (
                  <div key={match.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{match.player1?.username}</span>
                        <span className="text-gray-500">vs</span>
                        <span className="font-medium">{match.player2?.username}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(match.scheduled_time || match.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {match.winner_id && (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        match.winner_id === user?.id ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {match.winner_id === user?.id ? 'Won' : 'Lost'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No matches yet</p>
            )}
          </div>
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

        {/* Admin Section */}
        {isAdmin && (
          <div className="mt-8 bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Admin Panel</h2>
            <Link
              to="/admin"
              className="inline-block bg-tennis-green text-white px-4 py-2 rounded-lg hover:bg-tennis-green-dark"
            >
              Go to Admin Dashboard →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
