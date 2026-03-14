import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function Admin() {
  const { isAdmin } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashboardData, statsData, usersData] = await Promise.all([
        api.getAdminDashboard(),
        api.getAdminStats(),
        api.getAdminUsers({ limit: 20 }),
      ]);
      setDashboard(dashboardData);
      setStats(statsData);
      setUsers(usersData || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
    setLoading(false);
  };

  const handleUserAction = async (userId, action) => {
    try {
      if (action === 'verify') {
        await api.verifyUser(userId);
      } else if (action === 'activate') {
        await api.activateUser(userId);
      } else if (action === 'deactivate') {
        await api.deactivateUser(userId);
      } else if (action === 'promote') {
        await api.promoteToCoach(userId);
      } else if (action === 'demote') {
        await api.demoteToPlayer(userId);
      }
      fetchData();
    } catch (error) {
      alert(error.message);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600 mt-2">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your tennis court platform</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`pb-2 px-1 font-medium ${
              activeTab === 'dashboard'
                ? 'text-tennis-green border-b-2 border-tennis-green'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-2 px-1 font-medium ${
              activeTab === 'users'
                ? 'text-tennis-green border-b-2 border-tennis-green'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Users
          </button>
        </div>

        {activeTab === 'dashboard' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900">{dashboard?.total_users || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xl"></span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Courts</p>
                    <p className="text-3xl font-bold text-gray-900">{dashboard?.total_courts || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-tennis-green rounded-full flex items-center justify-center">
                    <span className="text-white text-xl"></span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Bookings</p>
                    <p className="text-3xl font-bold text-gray-900">{dashboard?.total_bookings || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xl"></span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active Tournaments</p>
                    <p className="text-3xl font-bold text-gray-900">{dashboard?.active_tournaments || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xl"></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">Revenue</h2>
              <p className="text-4xl font-bold text-tennis-green">
                ${dashboard?.total_revenue?.toFixed(2) || '0.00'}
              </p>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">Recent Registrations</h2>
                {dashboard?.recent_registrations?.length > 0 ? (
                  <div className="space-y-3">
                    {dashboard.recent_registrations.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-tennis-green rounded-full flex items-center justify-center">
                            <span className="text-white text-sm">
                              {user.username?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{user.username}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No recent registrations</p>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">Overview Stats</h2>
                {stats && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Users by Role</p>
                      <div className="flex space-x-4">
                        {Object.entries(stats.users_by_role || {}).map(([role, count]) => (
                          <div key={role} className="text-center">
                            <p className="text-2xl font-bold">{count}</p>
                            <p className="text-xs text-gray-500 capitalize">{role}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="pt-4 border-t">
                      <p className="text-sm text-gray-500 mb-2">This Week</p>
                      <div className="flex space-x-4">
                        <div>
                          <p className="text-2xl font-bold text-blue-600">{stats.new_users_this_week}</p>
                          <p className="text-xs text-gray-500">New Users</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-purple-600">{stats.new_bookings_this_week}</p>
                          <p className="text-xs text-gray-500">New Bookings</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold">All Users</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-tennis-green rounded-full flex items-center justify-center mr-3">
                            <span className="text-white text-sm">
                              {user.username?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{user.username}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 capitalize">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-tennis-green">{user.ranking_points}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          {!user.is_verified && (
                            <button
                              onClick={() => handleUserAction(user.id, 'verify')}
                              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                              Verify
                            </button>
                          )}
                          {user.role === 'player' && (
                            <button
                              onClick={() => handleUserAction(user.id, 'promote')}
                              className="px-2 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
                            >
                              Promote to Coach
                            </button>
                          )}
                          {user.role === 'coach' && (
                            <button
                              onClick={() => handleUserAction(user.id, 'demote')}
                              className="px-2 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
                            >
                              Demote to Player
                            </button>
                          )}
                          {user.is_active ? (
                            <button
                              onClick={() => handleUserAction(user.id, 'deactivate')}
                              className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUserAction(user.id, 'activate')}
                              className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                            >
                              Activate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;
