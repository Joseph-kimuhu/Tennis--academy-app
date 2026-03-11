import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

function PlayerDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [activeTournaments, setActiveTournaments] = useState([]);
  const [courts, setCourts] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [myStats, setMyStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchData();
    }
  }, [isAuthenticated, user]);

  const fetchData = async () => {
    try {
      const [tournamentsData, courtsData, bookingsData, statsData] = await Promise.all([
        api.getActiveTournaments(),
        api.getCourts({ limit: 6 }),
        api.getMyBookings(),
        api.getMyStats()
      ]);

      setActiveTournaments(tournamentsData || []);
      setCourts(courtsData || []);
      setMyBookings(bookingsData || []);
      setMyStats(statsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-tennis-green border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in</h1>
          <Link to="/login" className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600">
            Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.username}!</h1>
              <p className="text-green-100">Ready to play some tennis? 🎾</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{myStats?.matches_played || 0}</div>
              <div className="text-green-100">Matches Played</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">🏆</div>
              <div>
                <div className="text-2xl font-bold text-green-600">{myStats?.wins || 0}</div>
                <div className="text-gray-600">Wins</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">📊</div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{myStats?.ranking_points || 0}</div>
                <div className="text-gray-600">Ranking Points</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">📅</div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{myBookings.length}</div>
                <div className="text-gray-600">Upcoming Bookings</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl mr-4">🎯</div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{user?.skill_level || 'Beginner'}</div>
                <div className="text-gray-600">Skill Level</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/courts" className="bg-green-50 border border-green-200 rounded-lg p-4 hover:bg-green-100 transition-colors">
              <div className="text-2xl mb-2">🏟️</div>
              <div className="font-semibold text-green-800">Book a Court</div>
              <div className="text-sm text-green-600">Find and reserve your perfect court</div>
            </Link>
            <Link to="/tournaments" className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:bg-blue-100 transition-colors">
              <div className="text-2xl mb-2">🏆</div>
              <div className="font-semibold text-blue-800">Join Tournament</div>
              <div className="text-sm text-blue-600">Compete and win prizes</div>
            </Link>
            <Link to="/profile" className="bg-purple-50 border border-purple-200 rounded-lg p-4 hover:bg-purple-100 transition-colors">
              <div className="text-2xl mb-2">👤</div>
              <div className="font-semibold text-purple-800">Update Profile</div>
              <div className="text-sm text-purple-600">Manage your account</div>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Bookings */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">My Bookings</h2>
              <Link to="/my-bookings" className="text-green-600 hover:text-green-700 text-sm">View All</Link>
            </div>
            <div className="space-y-3">
              {myBookings.slice(0, 3).map((booking) => (
                <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{booking.court?.name || 'Court'}</div>
                      <div className="text-sm text-gray-600">
                        {new Date(booking.start_time).toLocaleDateString()} at{' '}
                        {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
              {myBookings.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📅</div>
                  <div>No bookings yet</div>
                  <Link to="/courts" className="text-green-600 hover:text-green-700 text-sm mt-2 inline-block">
                    Book your first court
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Active Tournaments */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Active Tournaments</h2>
              <Link to="/tournaments" className="text-green-600 hover:text-green-700 text-sm">View All</Link>
            </div>
            <div className="space-y-3">
              {activeTournaments.slice(0, 3).map((tournament) => (
                <div key={tournament.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{tournament.name}</div>
                      <div className="text-sm text-gray-600">
                        {new Date(tournament.start_date).toLocaleDateString()} • {tournament.participant_count || 0} players
                      </div>
                    </div>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {tournament.status}
                    </span>
                  </div>
                </div>
              ))}
              {activeTournaments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🏆</div>
                  <div>No active tournaments</div>
                  <div className="text-sm text-gray-400">Check back later for new competitions</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Available Courts */}
        <div className="bg-white rounded-lg shadow p-6 mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Available Courts</h2>
            <Link to="/courts" className="text-green-600 hover:text-green-700 text-sm">View All</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {courts.filter(c => c.is_available).slice(0, 3).map((court) => (
              <div key={court.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold">{court.name}</div>
                  <span className="text-xs bg-green-100 text-green-800 rounded-full">Available</span>
                </div>
                <div className="text-sm text-gray-600">
                  <div>Type: {court.court_type}</div>
                  <div>Price: {court.price_per_hour} KES/hr</div>
                  <div>{court.is_indoor ? '🏠 Indoor' : '☀️ Outdoor'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlayerDashboard;

