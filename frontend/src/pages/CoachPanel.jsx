import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function CoachPanel() {
  const { isAdmin, isCoach, user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [players, setPlayers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [trainingSessions, setTrainingSessions] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [courts, setCourts] = useState([]);
  const [clubs, setClubs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerStats, setPlayerStats] = useState(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showTournamentModal, setShowTournamentModal] = useState(false);
  const [showCourtModal, setShowCourtModal] = useState(false);

  const [messageForm, setMessageForm] = useState({ receiver_id: '', subject: '', content: '', message_type: 'general' });
  const [sessionForm, setSessionForm] = useState({
    title: '', description: '', scheduled_date: '', duration_minutes: 60, max_participants: 4, session_type: 'general'
  });
  const [announcementForm, setAnnouncementForm] = useState({
    title: '', content: '', priority: 'normal'
  });
  const [reportForm, setReportForm] = useState({
    player_id: '', title: '', content: '', rating: 5, strengths: '', areas_for_improvement: '', goals: ''
  });
  const [statsForm, setStatsForm] = useState({
    serves: 0, aces: 0, double_faults: 0, first_serve_percentage: 0,
    second_serve_points_won: 0, break_points_saved: 0, break_points_faced: 0,
    total_games: 0, total_sets: 0, total_matches: 0, winning_streak: 0,
    losing_streak: 0, longest_win_streak: 0, longest_lose_streak: 0, coach_notes: ''
  });
  const [sendingMessage, setSendingMessage] = useState(false);
  const [savingStats, setSavingStats] = useState(false);
  const [savingSession, setSavingSession] = useState(false);
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  const [savingReport, setSavingReport] = useState(false);
  const [savingTournament, setSavingTournament] = useState(false);
  const [savingCourt, setSavingCourt] = useState(false);


  // Form states for tournament and court
  const [tournamentForm, setTournamentForm] = useState({
    name: '', description: '', start_date: '', end_date: '', location: '', registration_deadline: '', max_participants: 16, entry_fee: 0, prize_money: 0, tournament_type: 'knockout'
  });
  const [courtForm, setCourtForm] = useState({
    name: '', club_id: '', court_type: 'hard', is_indoor: false, description: '', price_per_hour: 0
  });


  useEffect(() => {
    if (isCoach || isAdmin) {
      fetchData();
    }
  }, [isCoach, isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashboardData, playersData, messagesData, sessionsData, announcementsData, tournamentsData, courtsData, clubsData] = await Promise.all([
        api.getCoachDashboard().catch(() => null),
        api.getCoachPlayers({ limit: 100 }).catch(() => []),
        api.getMessages('inbox', { limit: 10 }).catch(() => []),
        api.getTrainingSessions({ upcoming: true, limit: 10 }).catch(() => []),
        api.getAnnouncements({ active_only: true, limit: 5 }).catch(() => []),
        api.getTournaments({ limit: 50 }).catch(() => []),
        api.getCourts({ limit: 100 }).catch(() => []),
        api.getClubs().catch(() => []),
      ]);
      setDashboard(dashboardData);
      setPlayers(playersData || []);
      setMessages(messagesData || []);
      setTrainingSessions(sessionsData || []);
      setAnnouncements(announcementsData || []);
      setTournaments(tournamentsData || []);
      setCourts(courtsData || []);
      setClubs(clubsData || []);
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
      // Convert receiver_id to integer since HTML select returns string
      const messageData = {
        ...messageForm,
        receiver_id: parseInt(messageForm.receiver_id, 10)
      };
      await api.sendMessage(messageData);
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
        await api.createPlayerStatistics(selectedPlayer.id, statsForm);
      }
      setShowStatsModal(false);
      alert('Statistics saved successfully!');
      fetchData();
    } catch (error) {
      console.error('Save stats error:', error);
      // If update fails because stats don't exist, try creating them
      if (error.message.includes('not found') || error.message.includes('404')) {
        try {
          await api.createPlayerStatistics(selectedPlayer.id, statsForm);
          setShowStatsModal(false);
          alert('Statistics created successfully!');
          fetchData();
        } catch (createError) {
          alert('Failed to save statistics: ' + createError.message);
        }
      } else {
        alert('Failed to save statistics: ' + error.message);
      }
    } finally {
      setSavingStats(false);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    setSavingSession(true);
    try {
      await api.createTrainingSession({
        ...sessionForm,
        scheduled_date: new Date(sessionForm.scheduled_date).toISOString()
      });
      setShowSessionModal(false);
      setSessionForm({ title: '', description: '', scheduled_date: '', duration_minutes: 60, max_participants: 4, session_type: 'general' });
      alert('Training session created successfully!');
      fetchData();
    } catch (error) {
      alert('Failed to create session: ' + error.message);
    } finally {
      setSavingSession(false);
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    setSavingAnnouncement(true);
    try {
      await api.createAnnouncement(announcementForm);
      setShowAnnouncementModal(false);
      setAnnouncementForm({ title: '', content: '', priority: 'normal' });
      alert('Announcement created successfully!');
      fetchData();
    } catch (error) {
      alert('Failed to create announcement: ' + error.message);
    } finally {
      setSavingAnnouncement(false);
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
              { id: 'training', label: 'Training', icon: '🎾' },
              { id: 'announcements', label: 'Announcements', icon: '📢' },
              { id: 'tournaments', label: 'Tournaments', icon: '🏆' },
              { id: 'courts', label: 'Courts', icon: '🎱' },
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

        {/* Training Sessions Tab */}
        {activeTab === 'training' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Training Sessions</h2>
                <button
                  onClick={() => setShowSessionModal(true)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
                >
                  + Schedule Session
                </button>
              </div>
              {trainingSessions.length > 0 ? (
                <div className="space-y-4">
                  {trainingSessions.map((session) => (
                    <div key={session.id} className="p-4 bg-green-50 rounded-xl border-l-4 border-green-500">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg">{session.title}</h3>
                          <p className="text-sm text-gray-600">{session.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span>📅 {new Date(session.scheduled_date).toLocaleDateString()}</span>
                            <span>⏰ {new Date(session.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span>⏱️ {session.duration_minutes} min</span>
                            <span className="capitalize">🏷️ {session.session_type}</span>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          session.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                          session.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {session.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-3xl">🎾</span>
                  </div>
                  <p className="text-gray-500">No training sessions scheduled</p>
                  <button
                    onClick={() => setShowSessionModal(true)}
                    className="mt-2 text-green-600 hover:text-green-700 font-medium"
                  >
                    Schedule your first session →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Announcements</h2>
                <button
                  onClick={() => setShowAnnouncementModal(true)}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-medium"
                >
                  + New Announcement
                </button>
              </div>
              {announcements.length > 0 ? (
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <div key={announcement.id} className={`p-4 rounded-xl border-l-4 ${
                      announcement.priority === 'urgent' ? 'bg-red-50 border-red-500' :
                      announcement.priority === 'high' ? 'bg-orange-50 border-orange-500' :
                      'bg-purple-50 border-purple-500'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg">{announcement.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{announcement.content}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            Posted on {new Date(announcement.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          announcement.priority === 'urgent' ? 'bg-red-500 text-white' :
                          announcement.priority === 'high' ? 'bg-orange-500 text-white' :
                          'bg-purple-500 text-white'
                        }`}>
                          {announcement.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-3xl">📢</span>
                  </div>
                  <p className="text-gray-500">No announcements yet</p>
                  <button
                    onClick={() => setShowAnnouncementModal(true)}
                    className="mt-2 text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Create your first announcement →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}


        {activeTab === 'tournaments' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Tournaments</h2>
              <button
                onClick={() => setShowTournamentModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                + Create Tournament
              </button>
            </div>
            {tournaments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tournaments.map((tournament) => (
                  <div key={tournament.id} className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg">{tournament.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{tournament.description}</p>
                        <div className="flex gap-4 mt-3 text-sm text-gray-500">
                          <span>📅 {new Date(tournament.start_date).toLocaleDateString()}</span>
                          <span>👥 {tournament.max_participants} players</span>
                          <span>💰 {tournament.entry_fee} KES</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          tournament.status === 'completed' ? 'bg-gray-500 text-white' :
                          tournament.status === 'in_progress' ? 'bg-green-500 text-white' :
                          'bg-blue-500 text-white'
                        }`}>
                          {tournament.status}
                        </span>
                        <button
                          onClick={async () => {
                            if (window.confirm('Are you sure you want to delete this tournament?')) {
                              try {
                                await api.deleteTournament(tournament.id);
                                fetchData();
                                alert('Tournament deleted successfully!');
                              } catch (error) {
                                alert('Failed to delete tournament: ' + error.message);
                              }
                            }
                          }}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl shadow-md">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl">🏆</span>
                </div>
                <p className="text-gray-500">No tournaments yet</p>
                <button
                  onClick={() => setShowTournamentModal(true)}
                  className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Create your first tournament →
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'courts' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Courts</h2>
              <button
                onClick={() => setShowCourtModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                + Add Court
              </button>
            </div>
            {courts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courts.map((court) => (
                  <div key={court.id} className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg">{court.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{court.club?.name || 'No academy'}</p>
                        <div className="flex gap-3 mt-3 text-sm text-gray-500">
                          <span>{court.is_indoor ? '🌳 Indoor' : '☀️ Outdoor'}</span>
                          <span>{court.court_type}</span>
                          <span>💰 {court.hourly_rate || court.price_per_hour} KES/hr</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        court.is_available ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                      }`}>
                        {court.is_available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl shadow-md">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl">🎱</span>
                </div>
                <p className="text-gray-500">No courts yet</p>
                <button
                  onClick={() => setShowCourtModal(true)}
                  className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Add your first court →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tournament Modal */}
      {showTournamentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center">
                  <span className="mr-2">🏆</span>
                  Create Tournament
                </h2>
                <button onClick={() => setShowTournamentModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">
                  ×
                </button>
              </div>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setSavingTournament(true);
              try {
                // Convert date strings to ISO datetime format
                const tournamentData = {
                  ...tournamentForm,
                  start_date: tournamentForm.start_date ? new Date(tournamentForm.start_date).toISOString() : null,
                  end_date: tournamentForm.end_date ? new Date(tournamentForm.end_date).toISOString() : null,
                  registration_deadline: tournamentForm.registration_deadline ? new Date(tournamentForm.registration_deadline).toISOString() : null,
                };
                await api.createTournament(tournamentData);
                setShowTournamentModal(false);
                setTournamentForm({ name: '', description: '', start_date: '', end_date: '', location: '', registration_deadline: '', max_participants: 16, entry_fee: 0, prize_money: 0, tournament_type: 'knockout' });
                fetchData();
                alert('Tournament created successfully!');
              } catch (error) {
                console.error('Tournament error:', error);
                const errorMsg = error.response?.data?.detail || error.message || 'Unknown error';
                alert('Failed to create tournament: ' + (typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg));
              } finally {
                setSavingTournament(false);
              }
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tournament Name *</label>
                <input type="text" required value={tournamentForm.name} onChange={(e) => setTournamentForm({...tournamentForm, name: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Summer Championship 2024" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={tournamentForm.description} onChange={(e) => setTournamentForm({...tournamentForm, description: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows={3} placeholder="Tournament description..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input type="date" required value={tournamentForm.start_date} onChange={(e) => setTournamentForm({...tournamentForm, start_date: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                  <input type="date" required value={tournamentForm.end_date} onChange={(e) => setTournamentForm({...tournamentForm, end_date: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input type="text" value={tournamentForm.location} onChange={(e) => setTournamentForm({...tournamentForm, location: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Tennis Academy Location" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants</label>
                  <input type="number" value={tournamentForm.max_participants} onChange={(e) => setTournamentForm({...tournamentForm, max_participants: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" min={2} max={128} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                  <select value={tournamentForm.tournament_type} onChange={(e) => setTournamentForm({...tournamentForm, tournament_type: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="knockout">Knockout</option>
                    <option value="round_robin">Round Robin</option>
                    <option value="league">League</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowTournamentModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  Cancel
                </button>
                <button type="submit" disabled={savingTournament} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {savingTournament ? 'Creating...' : 'Create Tournament'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Court Modal */}
      {showCourtModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center">
                  <span className="mr-2">🎱</span>
                  Add Court
                </h2>
                <button onClick={() => setShowCourtModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">
                  ×
                </button>
              </div>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setSavingCourt(true);
              try {
                const courtData = {
                  ...courtForm,
                  club_id: courtForm.club_id ? parseInt(courtForm.club_id, 10) : null,
                };
                await api.createCourt(courtData);
                setShowCourtModal(false);
                setCourtForm({ name: '', club_id: '', court_type: 'hard', is_indoor: false, description: '', price_per_hour: 0 });
                fetchData();
                alert('Court added successfully!');
              } catch (error) {
                alert('Failed to add court: ' + error.message);
              } finally {
                setSavingCourt(false);
              }
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Court Name *</label>
                <input type="text" required value={courtForm.name} onChange={(e) => setCourtForm({...courtForm, name: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Court 1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Academy *</label>
                <select required value={courtForm.club_id} onChange={(e) => setCourtForm({...courtForm, club_id: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Select an academy</option>
                  {clubs.map((club) => (
                    <option key={club.id} value={club.id}>{club.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Court Type</label>
                  <select value={courtForm.court_type} onChange={(e) => setCourtForm({...courtForm, court_type: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="hard">Hard</option>
                    <option value="clay">Clay</option>
                    <option value="grass">Grass</option>
                    <option value="carpet">Carpet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Indoor/Outdoor</label>
                  <select value={courtForm.is_indoor ? 'indoor' : 'outdoor'} onChange={(e) => setCourtForm({...courtForm, is_indoor: e.target.value === 'indoor'})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="outdoor">Outdoor</option>
                    <option value="indoor">Indoor</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price per Hour (KES)</label>
                  <input type="number" value={courtForm.price_per_hour} onChange={(e) => setCourtForm({...courtForm, price_per_hour: parseFloat(e.target.value)})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" min={0} />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowCourtModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  Cancel
                </button>
                <button type="submit" disabled={savingCourt} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {savingCourt ? 'Adding...' : 'Add Court'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {showStatsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center">
                  <span className="mr-2">📊</span>
                  Statistics - {selectedPlayer?.username}
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

      {/* Training Session Modal */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center">
                  <span className="mr-2">🎾</span>
                  Schedule Training Session
                </h2>
                <button onClick={() => setShowSessionModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">
                  ×
                </button>
              </div>
            </div>
            <form onSubmit={handleCreateSession} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Session Title</label>
                  <input
                    type="text"
                    value={sessionForm.title}
                    onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., Morning Practice"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={sessionForm.description}
                    onChange={(e) => setSessionForm({ ...sessionForm, description: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    rows="3"
                    placeholder="What will be covered in this session..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                    <input
                      type="datetime-local"
                      value={sessionForm.scheduled_date}
                      onChange={(e) => setSessionForm({ ...sessionForm, scheduled_date: e.target.value })}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                    <select
                      value={sessionForm.duration_minutes}
                      onChange={(e) => setSessionForm({ ...sessionForm, duration_minutes: parseInt(e.target.value) })}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value={30}>30 min</option>
                      <option value={60}>60 min</option>
                      <option value={90}>90 min</option>
                      <option value={120}>120 min</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Session Type</label>
                    <select
                      value={sessionForm.session_type}
                      onChange={(e) => setSessionForm({ ...sessionForm, session_type: e.target.value })}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="general">General</option>
                      <option value="technique">Technique</option>
                      <option value="fitness">Fitness</option>
                      <option value="match">Match Practice</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants</label>
                    <select
                      value={sessionForm.max_participants}
                      onChange={(e) => setSessionForm({ ...sessionForm, max_participants: parseInt(e.target.value) })}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value={1}>1 Player</option>
                      <option value={2}>2 Players</option>
                      <option value={4}>4 Players</option>
                      <option value={8}>8 Players</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowSessionModal(false)}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSession}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium disabled:opacity-50"
                >
                  {savingSession ? 'Creating...' : 'Create Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center">
                  <span className="mr-2">📢</span>
                  Create Announcement
                </h2>
                <button onClick={() => setShowAnnouncementModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">
                  ×
                </button>
              </div>
            </div>
            <form onSubmit={handleCreateAnnouncement} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={announcementForm.title}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Announcement title..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <textarea
                    value={announcementForm.content}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    rows="4"
                    placeholder="Write your announcement..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={announcementForm.priority}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, priority: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAnnouncementModal(false)}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAnnouncement}
                  className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-medium disabled:opacity-50"
                >
                  {savingAnnouncement ? 'Posting...' : 'Post Announcement'}
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
