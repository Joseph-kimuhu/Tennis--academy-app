import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

function PlayerDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTournaments, setActiveTournaments] = useState([]);
  const [courts, setCourts] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [myStats, setMyStats] = useState(null);
  const [detailedStats, setDetailedStats] = useState(null);
  const [messages, setMessages] = useState([]);
  const [trainingSessions, setTrainingSessions] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [myMatches, setMyMatches] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'dashboard');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [messageForm, setMessageForm] = useState({ receiver_id: '', subject: '', content: '', message_type: 'general' });
  const [sendingMessage, setSendingMessage] = useState(false);
  const [coaches, setCoaches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [enrollingSession, setEnrollingSession] = useState(null);
  const [myTournaments, setMyTournaments] = useState([]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchData();
    }
  }, [isAuthenticated, user]);

  const fetchData = async () => {
    try {
      const [tournamentsData, courtsData, bookingsData, statsData, messagesData, sessionsData, announcementsData, matchesData, leaderboardData, coachesData, playersData, adminsData, allUsersData, notificationsData, detailedStatsData, myTournamentsData] = await Promise.all([
        api.getActiveTournaments().catch(() => []),
        api.getCourts({ limit: 6 }).catch(() => []),
        api.getMyBookings().catch(() => []),
        api.getMyStats().catch(() => null),
        api.getMessages('inbox', { limit: 10 }).catch(() => []),
        api.getTrainingSessions({ upcoming: true, limit: 10 }).catch(() => []),
        api.getAnnouncements({ active_only: true, limit: 5 }).catch(() => []),
        api.getMyMatches().catch(() => []),
        api.getLeaderboard({ limit: 10 }).catch(() => []),
        api.getCoaches().catch(() => []),
        api.getPlayers({ limit: 50, role: 'player' }).catch(() => []),
        api.getPlayers({ limit: 50, role: 'admin' }).catch(() => []),
        api.getAllUsers({ limit: 100 }).catch(() => []), // Fallback to get all users
        api.getNotifications({ limit: 10 }).catch(() => []),
        user ? api.getPlayerStatistics(user.id).catch(() => null) : Promise.resolve(null),
        user ? api.getMyTournamentRegistrations().catch(() => []) : Promise.resolve([])
      ]);

      setActiveTournaments(tournamentsData || []);
      setCourts(courtsData || []);
      setMyBookings(bookingsData || []);
      setMyStats(statsData);
      setDetailedStats(detailedStatsData);
      setMessages(messagesData || []);
      setTrainingSessions(sessionsData || []);
      setAnnouncements(announcementsData || []);
      setMyMatches(matchesData || []);
      setLeaderboard(leaderboardData || []);
      setCoaches(coachesData || []);
      setPlayers(playersData?.filter(p => p.id !== user?.id) || []);
      // Only show John Makumi as recipient
      const allAdmins = [...(adminsData || []), ...(coachesData || [])];
      console.log('All admins details:', allAdmins.map(admin => ({ 
        id: admin.id, 
        username: admin.username, 
        email: admin.email, 
        role: admin.role 
      })));
      
      const johnMakumi = allAdmins.filter(user => 
        user.email === 'johnmakumi106@gmail.com' || 
        user.username === 'johnmakumi' ||
        user.email?.toLowerCase() === 'johnmakumi106@gmail.com' ||
        user.username?.toLowerCase() === 'johnmakumi'
      );
      // Temporarily show all admins for debugging, will switch to johnMakumi only after we find him
      setAdmins(johnMakumi.length > 0 ? johnMakumi : allAdmins);
      console.log('John Makumi found:', johnMakumi);
      console.log('Setting admins to:', johnMakumi.length > 0 ? johnMakumi : allAdmins);
      setNotifications(notificationsData || []);
      setMyTournaments(myTournamentsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }

    setLoading(false);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    setSendingMessage(true);
    try {
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

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Welcome back, {user?.username}! 🎾</h1>
              <p className="text-green-100">Ready to dominate the court today?</p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-3">
              <button
                onClick={() => setShowStatsModal(true)}
                className="px-6 py-3 bg-white text-green-600 rounded-xl font-semibold hover:bg-green-50 transition-colors shadow-md flex items-center"
              >
                <span className="mr-2">📊</span> My Stats
              </button>
              <button
                onClick={() => setShowMessageModal(true)}
                className="px-6 py-3 bg-white text-green-600 rounded-xl font-semibold hover:bg-green-50 transition-colors shadow-md flex items-center"
              >
                <span className="mr-2">✉️</span> Message Coach
              </button>
              <Link
                to="/courts"
                className="px-6 py-3 bg-green-700/50 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center"
              >
                <span className="mr-2">🏟️</span> Book Court
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Matches Played</p>
                <p className="text-3xl font-bold text-gray-900">{myStats?.matches_played || 0}</p>
              </div>
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🎾</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Wins</p>
                <p className="text-3xl font-bold text-green-600">{myStats?.wins || user?.wins || 0}</p>
              </div>
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🏆</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Ranking Points</p>
                <p className="text-3xl font-bold text-blue-600">{user?.ranking_points || 0}</p>
              </div>
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Skill Level</p>
                <p className="text-2xl font-bold text-orange-600 capitalize">{user?.skill_level || 'Beginner'}</p>
              </div>
              <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-8 overflow-hidden">
          <div className="flex overflow-x-auto">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
              { id: 'bookings', label: 'My Bookings', icon: '📅', badge: myBookings.length },
              { id: 'tournaments', label: 'Tournaments', icon: '🏆' },
              { id: 'training', label: 'Training', icon: '🎾' },
              { id: 'matches', label: 'My Matches', icon: '⚔️' },
              { id: 'messages', label: 'Messages', icon: '✉️', badge: messages.filter(m => !m.is_read).length },
              { id: 'leaderboard', label: 'Leaderboard', icon: '🏅' },
              { id: 'announcements', label: 'Announcements', icon: '📢', badge: announcements.length },
              { id: 'notifications', label: 'Notifications', icon: '🔔', badge: notifications.filter(n => !n.is_read).length },
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
                {tab.badge > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {tab.badge}
                  </span>
                )}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* My Tournaments */}
            {myTournaments.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900">My Tournaments</h2>
                  <Link to="/tournaments" className="text-green-600 hover:text-green-700 text-sm font-medium">View All →</Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myTournaments.slice(0, 3).map((reg) => (
                    <div key={reg.registration_id} className="border-2 border-gray-200 rounded-xl p-4 hover:border-green-300 transition-colors">
                      <div className="font-semibold text-lg mb-2">{reg.tournament?.name || 'Tournament'}</div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                          reg.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {reg.payment_status === 'paid' ? '✅ Paid' : '⏳ Payment Pending'}
                        </span>
                        <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                          reg.status === 'approved' ? 'bg-green-100 text-green-800' :
                          reg.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {reg.status === 'approved' ? '✅ Approved' : 
                           reg.status === 'rejected' ? '❌ Rejected' : 
                           reg.status === 'pending_payment' ? '⏳ Pending Payment' : '⏳ Pending'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        📅 {reg.tournament?.start_date ? new Date(reg.tournament.start_date).toLocaleDateString() : 'TBD'}
                      </div>
                      <div className="text-sm text-gray-600">
                        💰 Entry: {reg.tournament?.entry_fee || 0} KES
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link to="/courts" className="bg-green-50 border-2 border-green-200 rounded-xl p-6 hover:bg-green-100 transition-all hover:scale-105">
                  <div className="text-3xl mb-3">🏟️</div>
                  <div className="font-bold text-green-800 text-lg">Book a Court</div>
                  <div className="text-sm text-green-600 mt-1">Reserve your perfect court</div>
                </Link>
                <Link to="/tournaments" className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 hover:bg-blue-100 transition-all hover:scale-105">
                  <div className="text-3xl mb-3">🏆</div>
                  <div className="font-bold text-blue-800 text-lg">Join Tournament</div>
                  <div className="text-sm text-blue-600 mt-1">Compete and win prizes</div>
                </Link>
                <Link to="/profile" className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6 hover:bg-purple-100 transition-all hover:scale-105">
                  <div className="text-3xl mb-3">👤</div>
                  <div className="font-bold text-purple-800 text-lg">Update Profile</div>
                  <div className="text-sm text-purple-600 mt-1">Manage your account</div>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Upcoming Bookings */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Upcoming Bookings</h2>
                  <button onClick={() => setActiveTab('bookings')} className="text-green-600 hover:text-green-700 text-sm font-medium">View All →</button>
                </div>
                <div className="space-y-3">
                  {myBookings.slice(0, 3).map((booking) => (
                    <div key={booking.id} className="border-2 border-gray-200 rounded-xl p-4 hover:border-green-300 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-lg">{booking.court?.name || 'Court'}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            📅 {new Date(booking.start_time).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-600">
                            ⏰ {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {myBookings.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-5xl mb-3">📅</div>
                      <div className="text-gray-500 mb-2">No bookings yet</div>
                      <Link to="/courts" className="text-green-600 hover:text-green-700 font-medium">
                        Book your first court →
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Available Courts */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Available Courts</h2>
                  <Link to="/courts" className="text-green-600 hover:text-green-700 text-sm font-medium">View All →</Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {courts.slice(0, 4).map((court) => (
                    <div key={court.id} className="border-2 border-gray-200 rounded-xl overflow-hidden hover:border-green-300 transition-colors">
                      {/* Court Image */}
                      {court.image_url ? (
                        <img 
                          src={court.image_url} 
                          alt={court.name}
                          className="w-full h-32 object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="w-full h-32 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center"
                        style={{ display: court.image_url ? 'none' : 'flex' }}
                      >
                        <span className="text-white text-4xl">🏟️</span>
                      </div>
                      
                      {/* Court Info */}
                      <div className="p-4">
                        <div className="font-semibold text-lg mb-1">{court.name}</div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>🏷️ {court.court_type || 'Hard Court'}</div>
                          <div>📍 {court.location || 'Main Facility'}</div>
                          <div>💰 {court.price_per_hour || 0} KES/hr</div>
                          <div className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${
                            court.is_available 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {court.is_available ? '✅ Available' : '❌ Occupied'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {courts.length === 0 && (
                    <div className="col-span-2 text-center py-8">
                      <div className="text-5xl mb-3">🏟️</div>
                      <div className="text-gray-500 mb-2">No courts available</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Messages */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Messages</h2>
                  <button onClick={() => setActiveTab('messages')} className="text-green-600 hover:text-green-700 text-sm font-medium">View All →</button>
                </div>
                <div className="space-y-3">
                  {messages.slice(0, 3).map((message) => (
                    <div 
                      key={message.id} 
                      onClick={async () => {
                        if (!message.is_read) {
                          try {
                            await api.markMessageAsRead(message.id);
                            message.is_read = true;
                            setMessages([...messages]);
                          } catch (error) {
                            console.error('Error marking message as read:', error);
                          }
                        }
                      }}
                      className={`p-4 rounded-xl border-2 cursor-pointer hover:shadow-md transition-shadow ${
                        !message.is_read ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'
                      }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{message.sender?.username}</span>
                        <span className="text-xs text-gray-400">{formatDate(message.created_at || message.createdAt)}</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800">{message.subject}</p>
                      <p className="text-sm text-gray-600 truncate mt-1">{message.content}</p>
                    </div>
                  ))}
                  {messages.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-5xl mb-3">📭</div>
                      <div className="text-gray-500">No messages yet</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Active Tournaments */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Active Tournaments</h2>
                <button onClick={() => setActiveTab('tournaments')} className="text-green-600 hover:text-green-700 text-sm font-medium">View All →</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {activeTournaments.slice(0, 3).map((tournament) => (
                  <div key={tournament.id} className="border-2 border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-semibold text-lg">{tournament.name}</div>
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-medium">
                        {tournament.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1 mb-3">
                      <div>📅 {new Date(tournament.start_date).toLocaleDateString()}</div>
                      <div>👥 {tournament.participant_count || 0} players</div>
                      <div>💰 {tournament.entry_fee || 0} KES</div>
                    </div>
                    {(() => {
                      const isRegistered = myTournaments.some(reg => reg.tournament?.id === tournament.id);
                      return (
                        <button
                          onClick={async () => {
                            try {
                              await api.registerForTournament(tournament.id);
                              alert('Successfully registered for tournament!');
                              fetchData();
                            } catch (error) {
                              alert('Failed to register: ' + error.message);
                            }
                          }}
                          disabled={isRegistered}
                          className={`w-full px-4 py-2 rounded-lg font-medium ${
                            isRegistered 
                              ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                              : 'bg-green-500 text-white hover:bg-green-600'
                          }`}
                        >
                          {isRegistered ? 'Already Registered' : 'Register Now'}
                        </button>
                      );
                    })()}
                  </div>
                ))}
                {activeTournaments.length === 0 && (
                  <div className="col-span-3 text-center py-12">
                    <div className="text-5xl mb-3">🏆</div>
                    <div className="text-gray-500">No active tournaments</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Training Tab */}
        {activeTab === 'training' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Available Training Sessions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trainingSessions.map((session) => (
                  <div key={session.id} className="border-2 border-gray-200 rounded-xl p-4 hover:border-green-300 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-semibold text-lg">{session.title}</div>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${session.status === 'completed' ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'}`}>
                        {session.status || 'active'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1 mb-3">
                      <div>📅 {formatDate(session.scheduled_date)}</div>
                      <div>⏱️ {session.duration_minutes} minutes</div>
                      <div>👥 {session.current_participants || 0}/{session.max_participants || 4} participants</div>
                      {session.session_type && <div>🎾 {session.session_type}</div>}
                    </div>
                    {session.description && (
                      <p className="text-sm text-gray-600 mb-3">{session.description}</p>
                    )}
                    <button
                      onClick={() => {
                        setEnrollingSession(session);
                        setShowSessionModal(true);
                      }}
                      className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
                    >
                      View Details
                    </button>
                  </div>
                ))}
                {trainingSessions.length === 0 && (
                  <div className="col-span-3 text-center py-12">
                    <div className="text-5xl mb-3">🎾</div>
                    <div className="text-gray-500">No training sessions available</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Players Tab */}
        {activeTab === 'players' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Other Players ({players.length})</h2>
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
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-green-600 font-bold">
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
                        <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-700 capitalize font-medium">
                          {player.skill_level || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-green-600">{player.ranking_points || 0}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-green-600 font-medium">{player.wins || 0}</span>
                        <span className="text-gray-400 mx-1">/</span>
                        <span className="text-red-600 font-medium">{player.losses || 0}</span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setMessageForm({ receiver_id: player.id, subject: '', content: '', message_type: 'general' });
                            setShowMessageModal(true);
                          }}
                          className="px-3 py-1.5 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium transition-colors"
                        >
                          ✉️ Message
                        </button>
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
                  <p className="text-gray-500">No other players found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Notifications</h2>
            <div className="space-y-3">
              {notifications.length > 0 ? notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  onClick={async () => {
                    if (!notification.is_read) {
                      try {
                        await api.markNotificationAsRead(notification.id);
                        notification.is_read = true;
                        setNotifications([...notifications]);
                      } catch (error) {
                        console.error('Error marking notification as read:', error);
                      }
                    }
                  }}
                  className={`p-4 rounded-xl cursor-pointer hover:shadow-md transition-shadow ${!notification.is_read ? 'bg-green-50 border-l-4 border-green-500' : 'bg-gray-50'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {!notification.is_read && <span className="w-2 h-2 bg-green-500 rounded-full"></span>}
                      <div>
                        <p className="font-medium">{notification.title || 'Notification'}</p>
                        <p className="text-xs text-gray-500">{formatDate(notification.created_at)}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{notification.message || notification.content}</p>
                </div>
              )) : (
                <div className="text-center py-12">
                  <div className="text-5xl mb-3">🔔</div>
                  <div className="text-gray-500">No notifications yet</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Inbox</h2>
              <button
                onClick={() => setShowMessageModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-md"
              >
                + Compose
              </button>
            </div>
            <div className="space-y-3">
              {messages.length > 0 ? messages.map((message) => (
                <div 
                  key={message.id} 
                  onClick={async () => {
                    if (!message.is_read) {
                      try {
                        await api.markMessageAsRead(message.id);
                        message.is_read = true;
                        setMessages([...messages]);
                      } catch (error) {
                        console.error('Error marking message as read:', error);
                      }
                    }
                  }}
                  className={`p-4 rounded-xl cursor-pointer hover:shadow-md transition-shadow ${!message.is_read ? 'bg-green-50 border-l-4 border-green-500' : 'bg-gray-50'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {!message.is_read && <span className="w-2 h-2 bg-green-500 rounded-full"></span>}
                      <div>
                        <p className="font-medium">{message.sender?.username || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">To: {message.receiver?.username}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{formatDate(message.created_at || message.createdAt)}</span>
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

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Send Message</h3>
            <form onSubmit={handleSendMessage}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                <select
                  value={messageForm.receiver_id}
                  onChange={(e) => setMessageForm({ ...messageForm, receiver_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                >
                  <option value="">Select recipient...</option>
                  {admins.map((admin) => (
                    <option key={admin.id} value={admin.id}>{admin.username} ({admin.role === 'coach' ? 'Coach' : 'Admin'})</option>
                  ))}
                  {admins.length === 0 && (
                    <option value="" disabled>No admin or coach available</option>
                  )}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={messageForm.subject}
                  onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Message Type</label>
                <select
                  value={messageForm.message_type}
                  onChange={(e) => setMessageForm({ ...messageForm, message_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="general">General</option>
                  <option value="urgent">Urgent</option>
                  <option value="feedback">Feedback</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  value={messageForm.content}
                  onChange={(e) => setMessageForm({ ...messageForm, content: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  rows="4"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowMessageModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingMessage}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium disabled:opacity-50"
                >
                  {sendingMessage ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {showStatsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">My Detailed Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{detailedStats?.serves || 0}</div>
                <div className="text-sm text-gray-600">Total Serves</div>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{detailedStats?.aces || 0}</div>
                <div className="text-sm text-gray-600">Aces</div>
              </div>
              <div className="bg-red-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{detailedStats?.double_faults || 0}</div>
                <div className="text-sm text-gray-600">Double Faults</div>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{detailedStats?.first_serve_percentage || 0}%</div>
                <div className="text-sm text-gray-600">First Serve %</div>
              </div>
              <div className="bg-yellow-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{detailedStats?.second_serve_points_won || 0}%</div>
                <div className="text-sm text-gray-600">2nd Serve Won</div>
              </div>
              <div className="bg-indigo-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-indigo-600">{detailedStats?.break_points_saved || 0}</div>
                <div className="text-sm text-gray-600">Break Pts Saved</div>
              </div>
              <div className="bg-orange-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{detailedStats?.total_games || 0}</div>
                <div className="text-sm text-gray-600">Total Games</div>
              </div>
              <div className="bg-teal-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-teal-600">{detailedStats?.total_sets || 0}</div>
                <div className="text-sm text-gray-600">Total Sets</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-sm text-gray-600 mb-1">Win Streak</div>
                <div className="text-xl font-bold text-green-600">{detailedStats?.winning_streak || 0}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-sm text-gray-600 mb-1">Loss Streak</div>
                <div className="text-xl font-bold text-red-600">{detailedStats?.losing_streak || 0}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-sm text-gray-600 mb-1">Longest Win Streak</div>
                <div className="text-xl font-bold text-green-600">{detailedStats?.longest_win_streak || 0}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-sm text-gray-600 mb-1">Longest Loss Streak</div>
                <div className="text-xl font-bold text-red-600">{detailedStats?.longest_lose_streak || 0}</div>
              </div>
            </div>
            {detailedStats?.coach_notes && (
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Coach Notes</div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-gray-700">
                  {detailedStats.coach_notes}
                </div>
              </div>
            )}
            <button
              onClick={() => setShowStatsModal(false)}
              className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Session Modal */}
      {showSessionModal && enrollingSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">{enrollingSession.title}</h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">{formatDate(enrollingSession.scheduled_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium">{enrollingSession.duration_minutes} minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Participants:</span>
                <span className="font-medium">{enrollingSession.current_participants || 0}/{enrollingSession.max_participants || 4}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium capitalize">{enrollingSession.session_type || 'general'}</span>
              </div>
              {enrollingSession.description && (
                <div>
                  <span className="text-gray-600">Description:</span>
                  <p className="mt-1 text-gray-800">{enrollingSession.description}</p>
                </div>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowSessionModal(false);
                  setEnrollingSession(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export default PlayerDashboard;
