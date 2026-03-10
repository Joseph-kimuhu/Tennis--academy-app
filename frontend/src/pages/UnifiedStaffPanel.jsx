import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function UnifiedStaffPanel() {
  const { user, isAdmin, isCoach, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [newStaff, setNewStaff] = useState({
    email: '',
    username: '',
    full_name: '',
    password: '',
    role: 'coach'
  });

  useEffect(() => {
    if (isAdmin || isCoach) {
      fetchData();
    }
  }, [isAdmin, isCoach]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData, bookingsData, tournamentsData] = await Promise.all([
        api.getStaffStats().catch(() => ({ total_users: 0, total_bookings: 0, active_tournaments: 0 })),
        isAdmin ? api.getAllUsers({ limit: 20 }) : api.getPlayers({ limit: 20 }),
        api.getAllBookings({ limit: 10 }),
        api.getAllTournaments({ limit: 10 })
      ]);
      setStats(statsData);
      setUsers(usersData || []);
      setBookings(bookingsData || []);
      setTournaments(tournamentsData || []);
    } catch (error) {
      console.error('Error fetching staff data:', error);
    }
    setLoading(false);
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      await api.createStaffAccount(newStaff);
      alert('Staff account created successfully!');
      setShowCreateAccount(false);
      setNewStaff({ email: '', username: '', full_name: '', password: '', role: 'coach' });
      fetchData();
    } catch (error) {
      alert('Failed to create staff account: ' + (error.message || 'Unknown error'));
    }
  };

  if (!isAdmin && !isCoach) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🚫</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">This panel is for staff members only.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Loading staff panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 rounded-2xl p-8 mb-8 text-white shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {isAdmin ? 'Admin' : 'Coach'} Panel
              </h1>
              <p className="text-green-100">
                {isAdmin ? 'Manage the entire tennis academy' : 'Manage coaching and player development'}
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex gap-3">
              {isAdmin && (
                <button
                  onClick={() => setShowCreateAccount(true)}
                  className="px-6 py-3 bg-white text-green-600 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
                >
                  ➕ Create Staff Account
                </button>
              )}
              <button
                onClick={fetchData}
                className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-colors"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-8 overflow-hidden">
          <div className="flex overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'users', label: isAdmin ? 'Users' : 'Players', icon: '👥' },
              { id: 'bookings', label: 'Bookings', icon: '📅' },
              { id: 'tournaments', label: 'Tournaments', icon: '🏆' },
              ...(isAdmin ? [{ id: 'system', label: 'System', icon: '⚙️' }] : [])
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-max px-6 py-4 font-medium text-sm transition-all relative ${
                  activeTab === tab.id
                    ? 'text-green-600 bg-green-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-md p-6">
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl">👥</span>
                    <span className="text-sm text-blue-600 font-bold">Total</span>
                  </div>
                  <p className="text-3xl font-bold text-blue-600">{stats?.total_users || 0}</p>
                  <p className="text-gray-600">{isAdmin ? 'Users' : 'Players'}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl">📅</span>
                    <span className="text-sm text-green-600 font-bold">Total</span>
                  </div>
                  <p className="text-3xl font-bold text-green-600">{stats?.total_bookings || 0}</p>
                  <p className="text-gray-600">Bookings</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border-2 border-yellow-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl">🏆</span>
                    <span className="text-sm text-yellow-700 font-bold">Active</span>
                  </div>
                  <p className="text-3xl font-bold text-yellow-600">{stats?.active_tournaments || 0}</p>
                  <p className="text-gray-600">Tournaments</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl">🎾</span>
                    <span className="text-sm text-purple-600 font-bold">Role</span>
                  </div>
                  <p className="text-3xl font-bold text-purple-600 capitalize">{user?.role}</p>
                  <p className="text-gray-600">Your Role</p>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Bookings</h3>
                  <div className="space-y-3">
                    {bookings.slice(0, 5).map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{booking.user?.username || 'Unknown'}</p>
                          <p className="text-sm text-gray-500">{booking.court?.name || 'Court'}</p>
                        </div>
                        <span className={`px-3 py-1 text-xs rounded-full ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Tournaments</h3>
                  <div className="space-y-3">
                    {tournaments.slice(0, 5).map((tournament) => (
                      <div key={tournament.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{tournament.name}</p>
                          <p className="text-sm text-gray-500">{tournament.participant_count || 0} players</p>
                        </div>
                        <span className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          {tournament.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{isAdmin ? 'All Users' : 'Players'}</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="pb-3 font-semibold text-gray-900">User</th>
                      <th className="pb-3 font-semibold text-gray-900">Email</th>
                      <th className="pb-3 font-semibold text-gray-900">Role</th>
                      <th className="pb-3 font-semibold text-gray-900">Status</th>
                      {isAdmin && <th className="pb-3 font-semibold text-gray-900">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-gray-100">
                        <td className="py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                              {user.username?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{user.full_name || user.username}</p>
                              <p className="text-sm text-gray-500">@{user.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-gray-600">{user.email}</td>
                        <td className="py-4">
                          <span className="px-3 py-1 text-xs rounded-full capitalize bg-blue-100 text-blue-800">
                            {user.role}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className={`px-3 py-1 text-xs rounded-full ${
                            user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="py-4">
                            <div className="flex gap-2">
                              <button className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">
                                Edit
                              </button>
                              <button className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600">
                                Delete
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">All Bookings</h2>
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{booking.court?.name || 'Court Booking'}</p>
                        <p className="text-gray-600">User: {booking.user?.username}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(booking.start_time).toLocaleDateString()} at{' '}
                          {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 text-sm rounded-full ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {booking.status}
                        </span>
                        <p className="text-lg font-bold text-green-600 mt-2">{booking.court?.price_per_hour} KES</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'tournaments' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">All Tournaments</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tournaments.map((tournament) => (
                  <div key={tournament.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold">{tournament.name}</h3>
                      <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                        {tournament.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4">{tournament.description}</p>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-500">Start Date</p>
                        <p className="font-medium">{new Date(tournament.start_date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Participants</p>
                        <p className="font-medium">{tournament.participant_count || 0} players</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'system' && isAdmin && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">System Management</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Database Stats</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Users</span>
                      <span className="font-medium">{stats?.total_users || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Bookings</span>
                      <span className="font-medium">{stats?.total_bookings || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Active Tournaments</span>
                      <span className="font-medium">{stats?.active_tournaments || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                      Backup Database
                    </button>
                    <button className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                      Send Notifications
                    </button>
                    <button className="w-full px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">
                      Generate Reports
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Staff Account Modal */}
      {showCreateAccount && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Create Staff Account</h2>
              <button
                onClick={() => setShowCreateAccount(false)}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newStaff.full_name}
                  onChange={(e) => setNewStaff({ ...newStaff, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={newStaff.username}
                  onChange={(e) => setNewStaff({ ...newStaff, username: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={newStaff.password}
                  onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="coach">Coach</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateAccount(false)}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UnifiedStaffPanel;
