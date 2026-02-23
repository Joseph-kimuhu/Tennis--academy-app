import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function CoachPanel() {
  const { isAdmin, isCoach, user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [players, setPlayers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerStats, setPlayerStats] = useState(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageForm, setMessageForm] = useState({ receiver_id: '', subject: '', content: '', message_type: 'general' });
  const [statsForm, setStatsForm] = useState({
    serves: 0, aces: 0, double_faults: 0, first_serve_percentage: 0,
    second_serve_points_won: 0, break_points_saved: 0, break_points_faced: 0,
    total_games: 0, total_sets: 0, total_matches: 0, winning_streak: 0,
    losing_streak: 0, longest_win_streak: 0, longest_lose_streak: 0, coach_notes: ''
  });
  const [sendingMessage, setSendingMessage] = useState(false);
  const [savingStats, setSavingStats] = useState(false);

  useEffect(() => {
    if (isCoach || isAdmin) {
      fetchData();
    }
  }, [isCoach, isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashboardData, playersData, messagesData] = await Promise.all([
        api.getCoachDashboard().catch(() => null),
        api.getCoachPlayers({ limit: 100 }).catch(() => []),
        api.getMessages('inbox', { limit: 10 }).catch(() => []),
      ]);
      setDashboard(dashboardData);
      setPlayers(playersData || []);
      setMessages(messagesData || []);
    } catch (error) {
      console.error('Error fetching coach data:', error);
    }
    setLoading(false);
  };

  const handleSelectPlayer = async (player) => {
    setSelectedPlayer(player);
    try {
      const stats = await api.getPlayerStatistics(player.id).catch(() => null);
      setPlayerStats(stats);
      if (stats) {
        setStatsForm({
          serves: stats.serves || 0,
          aces: stats.aces || 0,
          double_faults: stats.double_faults || 0,
          first_serve_percentage: stats.first_serve_percentage || 0,
          second_serve_points_won: stats.second_serve_points_won || 0,
          break_points_saved: stats.break_points_saved || 0,
          break_points_faced: stats.break_points_faced || 0,
          total_games: stats.total_games || 0,
          total_sets: stats.total_sets || 0,
          total_matches: stats.total_matches || 0,
          winning_streak: stats.winning_streak || 0,
          losing_streak: stats.losing_streak || 0,
          longest_win_streak: stats.longest_win_streak || 0,
          longest_lose_streak: stats.longest_lose_streak || 0,
          coach_notes: stats.coach_notes || ''
        });
      } else {
        setStatsForm({
          serves: 0, aces: 0, double_faults: 0, first_serve_percentage: 0,
          second_serve_points_won: 0, break_points_saved: 0, break_points_faced: 0,
          total_games: 0, total_sets: 0, total_matches: 0, winning_streak: 0,
          losing_streak: 0, longest_win_streak: 0, longest_lose_streak: 0, coach_notes: ''
        });
      }
    } catch (error) {
      setPlayerStats(null);
    }
    setShowStatsModal(true);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    setSendingMessage(true);
    try {
      await api.sendMessage(messageForm);
      setShowMessageModal(false);
      setMessageForm({ receiver_id: '', subject: '', content: '', message_type: 'general' });
      alert('Message sent successfully!');
      fetchData();
    } catch (error) {
      alert('Failed to send message: ' + error.message);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSaveStats = async (e) => {
    e.preventDefault();
    setSavingStats(true);
    try {
      if (playerStats) {
        await api.updatePlayerStatistics(selectedPlayer.id, statsForm);
      } else {
        await api.createPlayerStatistics(selectedPlayer.id, { ...statsForm, player_id: selectedPlayer.id });
      }
      setShowStatsModal(false);
      alert('Statistics saved successfully!');
      fetchData();
    } catch (error) {
      alert('Failed to save statistics: ' + error.message);
    } finally {
      setSavingStats(false);
    }
  };

  const openMessageModal = (playerId = '') => {
    setMessageForm({ receiver_id: playerId, subject: '', content: '', message_type: 'general' });
    setShowMessageModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (!isCoach && !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🚫</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">This page is for coaches only.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Loading coach panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 rounded-2xl p-8 mb-8 text-white shadow-lg">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Coach Panel</h1>
              <p className="text-blue-100">Manage players, statistics, and communications</p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-3">
              <button
                onClick={() => openMessageModal()}
                className="px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors shadow-md flex items-center"
              >
                <span className="mr-2">✉️</span> Send Message
              </button>
              <button
                onClick={() => setActiveTab('players')}
                className="px-6 py-3 bg-blue-700 bg-opacity50 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center"
              >
                <span className="mr-2">👥</span> Players
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Players</p>
                <p className="text-3xl font-bold text-gray-900">{dashboard?.total_players || players.length}</p>
              </div>
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Messages</p>
                <p className="text-3xl font-bold text-gray-900">{dashboard?.pending_messages || 0}</p>
              </div>
              <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">✉️</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Upcoming Sessions</p>
                <p className="text-3xl font-bold text-gray-900">{dashboard?.upcoming_sessions || 0}</p>
              </div>
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-8 overflow-hidden">
          <div className="flex overflow-x-auto">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
              { id: 'players', label: 'Players', icon: '👥' },
              { id: 'messages', label: 'Messages', icon: '✉️', badge: messages.filter(m => !m.is_read).length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-max px-6 py-4 font-medium text-sm transition-all relative ${
                  activeTab === tab.id
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
                {tab.badge > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {tab.badge}
                  </span>
                )}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Players */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Players</h2>
              {players.slice(0, 5).map((player) => (
                <div key={player.id} className="flex items-center p-3 bg-gray-50 rounded-xl mb-2 hover:bg-gray-100 transition-colors">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-bold">
                      {player.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{player.username}</p>
                    <p className="text-xs text-gray-500 capitalize">{player.skill_level}</p>
                  </div>
                  <span className="text-sm font-semibold text-green-600">{player.ranking_points} pts</span>
                </div>
              ))}
              {players.length === 0 && (
                <p className="text-gray-500 text-center py-4">No players yet</p>
              )}
            </div>

            {/* Recent Messages */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Messages</h2>
              {messages.slice(0, 5).map((message) => (
                <div key={message.id} className={`p-3 rounded-xl mb-2 ${!message.is_read ? 'bg-blue-50' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{message.sender?.username}</span>
                    <span className="text-xs text-gray-400">{formatDate(message.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{message.subject}</p>
                </div>
              ))}
              {messages.length === 0 && (
                <p className="text-gray-500 text-center py-4">No messages yet</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'players' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">All Players ({players.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Player</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Skill Level</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">W/L Record</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {players.map((player) => (
                    <tr key={player.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-blue-600 font-bold">
                              {player.username?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{player.username}</p>
                            <p className="text-xs text-gray-500">{player.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-700 capitalize font-medium">
                          {player.skill_level}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-green-600">{player.ranking_points}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-green-600 font-medium">{player.wins}</span>
                        <span className="text-gray-400 mx-1">/</span>
                        <span className="text-red-600 font-medium">{player.losses}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleSelectPlayer(player)}
                            className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors"
                          >
                            📊 Stats
                          </button>
                          <button
                            onClick={() => openMessageModal(player.id)}
                            className="px-3 py-1.5 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium transition-colors"
                          >
                            ✉️ Message
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {players.length === 0 && (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">👥</span>
                  </div>
                  <p className="text-gray-500">No players found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Inbox</h2>
              <button
                onClick={() => openMessageModal()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
              >
                + Compose
              </button>
            </div>
            <div className="space-y-3">
              {messages.length > 0 ? messages.map((message) => (
                <div key={message.id} className={`p-4 rounded-xl ${!message.is_read ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-gray-50'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {!message.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
                      <div>
                        <p className="font-medium">{message.sender?.username || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">To: {message.receiver?.username}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{formatDate(message.created_at)}</span>
                  </div>
                  <h3 className="font-semibold mt-2">{message.subject}</h3>
                  <p className="text-sm text-gray-600 mt-1">{message.content}</p>
                </div>
              )) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">📭</span>
                  </div>
                  <p className="text-gray-500">No messages in inbox</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Stats Modal */}
      {showStatsModal && selectedPlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center">
                  <span className="mr-2">📊</span>
                  Statistics - {selectedPlayer.username}
                </h2>
                <button onClick={() => setShowStatsModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">
                  ×
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {playerStats ? 'Update existing statistics' : 'Create new statistics for this player'}
              </p>
            </div>
            <form onSubmit={handleSaveStats} className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { key: 'serves', label: 'Serves' },
                  { key: 'aces', label: 'Aces' },
                  { key: 'double_faults', label: 'Double Faults' },
                  { key: 'first_serve_percentage', label: '1st Serve %', type: 'number', step: '0.1' },
                  { key: 'second_serve_points_won', label: '2nd Serve Won' },
                  { key: 'break_points_saved', label: 'BP Saved' },
                  { key: 'break_points_faced', label: 'BP Faced' },
                  { key: 'total_games', label: 'Total Games' },
                  { key: 'total_sets', label: 'Total Sets' },
                  { key: 'total_matches', label: 'Total Matches' },
                  { key: 'winning_streak', label: 'Win Streak' },
                  { key: 'losing_streak', label: 'Lose Streak' },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="block text-xs text-gray-500 mb-1">{field.label}</label>
                    <input
                      type={field.type || 'number'}
                      step={field.step}
                      value={statsForm[field.key]}
                      onChange={(e) => setStatsForm({ 
                        ...statsForm, 
                        [field.key]: field.type === 'number' ? parseFloat(e.target.value) || 0 : parseInt(e.target.value) || 0 
                      })}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                ))}
              </div>
              <div className="mb-6">
                <label className="block text-sm text-gray-500 mb-1">Coach Notes</label>
                <textarea
                  value={statsForm.coach_notes}
                  onChange={(e) => setStatsForm({ ...statsForm, coach_notes: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Notes about this player's performance..."
                ></textarea>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowStatsModal(false)}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingStats}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium disabled:opacity-50"
                >
                  {savingStats ? 'Saving...' : 'Save Statistics'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center">
                  <span className="mr-2">✉️</span> Send Message
                </h2>
                <button onClick={() => setShowMessageModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">
                  ×
                </button>
              </div>
            </div>
            <form onSubmit={handleSendMessage} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">To (Player)</label>
                <select
                  value={messageForm.receiver_id}
                  onChange={(e) => setMessageForm({ ...messageForm, receiver_id: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a player</option>
                  {players.map((player) => (
                    <option key={player.id} value={player.id}>{player.username}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={messageForm.subject}
                  onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., You have a game next week!"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Message Type</label>
                <select
                  value={messageForm.message_type}
                  onChange={(e) => setMessageForm({ ...messageForm, message_type: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="general">General</option>
                  <option value="notification">Notification</option>
                  <option value="game_reminder">Game Reminder</option>
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={messageForm.content}
                  onChange={(e) => setMessageForm({ ...messageForm, content: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="4"
                  placeholder="Write your message to the player..."
                  required
                ></textarea>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowMessageModal(false)}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingMessage}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium disabled:opacity-50"
                >
                  {sendingMessage ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CoachPanel;
