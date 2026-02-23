import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function PlayerDashboard() {
  const { user, isPlayer } = useAuth();
  const [stats, setStats] = useState(null);
  const [messages, setMessages] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    if (isPlayer) {
      fetchData();
    }
  }, [isPlayer]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsData, messagesData, bookingsData, unreadData] = await Promise.all([
        api.getMyStats().catch(() => null),
        api.getMessages('inbox', { limit: 20 }).catch(() => []),
        api.getMyBookings({ upcoming: true, limit: 5 }).catch(() => []),
        api.getUnreadMessageCount().catch(() => ({ unread_count: 0 })),
      ]);
      setStats(statsData);
      setMessages(messagesData || []);
      setBookings(bookingsData || []);
      setUnreadCount(unreadData?.unread_count || 0);
    } catch (error) {
      console.error('Error fetching player data:', error);
    }
    setLoading(false);
  };

  const handleReadMessage = async (message) => {
    setSelectedMessage(message);
    if (!message.is_read) {
      try {
        await api.markMessageRead(message.id);
        setMessages(messages.map(m => 
          m.id === message.id ? { ...m, is_read: true } : m
        ));
        setUnreadCount(Math.max(0, unreadCount - 1));
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!selectedMessage || !replyText.trim()) return;
    
    setSendingReply(true);
    try {
      await api.sendMessage({
        receiver_id: selectedMessage.sender_id,
        subject: selectedMessage.subject.startsWith('Re:') 
          ? selectedMessage.subject 
          : `Re: ${selectedMessage.subject}`,
        content: replyText,
        message_type: 'general'
      });
      setReplyText('');
      setSelectedMessage(null);
      alert('Reply sent successfully!');
      fetchData();
    } catch (error) {
      alert('Failed to send reply: ' + error.message);
    } finally {
      setSendingReply(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!isPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🚫</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">This page is for players only.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 rounded-2xl p-8 mb-8 text-white shadow-lg">
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
            <div className="w-24 h-24 bg-white bg-opacity20 rounded-full flex items-center justify border-white border-center border-4-opacity-30">
              <span className="text-5xl font-bold">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {user?.full_name || user?.username}
              </h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                <span className="px-3 py-1 bg-white bg-opacity20 rounded-full text-sm font-medium">
                  🎾 {user?.username}
                </span>
                <span className="px-3 py-1 bg-white bg-opacity20 rounded-full text-sm font-medium capitalize">
                  📊 {user?.skill_level}
                </span>
                {unreadCount > 0 && (
                  <span className="px-3 py-1 bg-red-500 rounded-full text-sm font-medium animate-pulse">
                    💬 {unreadCount} new message{unreadCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Points</p>
                <p className="text-2xl font-bold text-green-600">{stats?.ranking_points || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🏆</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Matches</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total_matches || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🎾</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Wins</p>
                <p className="text-2xl font-bold text-green-600">{stats?.wins || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Win Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.win_rate?.toFixed(1) || 0}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📈</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-8 overflow-hidden">
          <div className="flex overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: '🏠' },
              { id: 'profile', label: 'Profile', icon: '👤' },
              { id: 'messages', label: 'Messages', icon: '💬', badge: unreadCount },
              { id: 'bookings', label: 'Bookings', icon: '📅' },
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

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Performance Overview</h2>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-green-50 rounded-xl">
                      <p className="text-3xl font-bold text-green-600">{stats?.wins || 0}</p>
                      <p className="text-sm text-gray-600">Wins</p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-xl">
                      <p className="text-3xl font-bold text-red-600">{stats?.losses || 0}</p>
                      <p className="text-sm text-gray-600">Losses</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-xl">
                      <p className="text-3xl font-bold text-purple-600">{stats?.win_rate?.toFixed(0) || 0}%</p>
                      <p className="text-sm text-gray-600">Win Rate</p>
                    </div>
                  </div>
                  
                  {stats?.recent_performance && stats.recent_performance.length > 0 && (
                    <div className="mt-6">
                      <p className="text-sm text-gray-500 mb-3">Recent Form</p>
                      <div className="flex flex-wrap gap-2">
                        {stats.recent_performance.map((result, index) => (
                          <div
                            key={index}
                            className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                              result === 'W' 
                                ? 'bg-green-100 text-green-600 border-2 border-green-200' 
                                : 'bg-red-100 text-red-600 border-2 border-red-200'
                            }`}
                          >
                            {result === 'W' ? 'W' : 'L'}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Upcoming Bookings */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Upcoming Bookings</h2>
                    <button 
                      onClick={() => setActiveTab('bookings')}
                      className="text-sm text-green-600 hover:text-green-700 font-medium"
                    >
                      View All →
                    </button>
                  </div>
                  {bookings.length > 0 ? (
                    <div className="space-y-3">
                      {bookings.slice(0, 3).map((booking) => (
                        <div key={booking.id} className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                          <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mr-4">
                            <span className="text-white text-xl">🎾</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{booking.court?.name || 'Court Booking'}</h3>
                            <p className="text-sm text-gray-500">
                              {new Date(booking.start_time).toLocaleDateString('en-US', { 
                                weekday: 'short', month: 'short', day: 'numeric' 
                              })} at {new Date(booking.start_time).toLocaleTimeString([], { 
                                hour: '2-digit', minute: '2-digit' 
                              })}
                            </p>
                          </div>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            booking.status === 'confirmed' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-3xl">📅</span>
                      </div>
                      <p className="text-gray-500">No upcoming bookings</p>
                      <button className="mt-2 text-green-600 hover:text-green-700 font-medium">
                        Book a Court →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">My Profile</h2>
                <div className="space-y-6">
                  <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mr-4">
                      <span className="text-2xl font-bold text-green-600">
                        {user?.username?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{user?.username}</h3>
                      <p className="text-sm text-gray-500">Your nickname</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Full Name</p>
                      <p className="font-medium text-gray-900">{user?.full_name || 'Not provided'}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Email</p>
                      <p className="font-medium text-gray-900">{user?.email}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Phone</p>
                      <p className="font-medium text-gray-900">{user?.phone || 'Not provided'}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Skill Level</p>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium capitalize">
                        {user?.skill_level}
                      </span>
                    </div>
                  </div>
                  
                  {user?.bio && (
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Bio</p>
                      <p className="text-gray-700">{user.bio}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'bookings' && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">My Bookings</h2>
                {bookings.length > 0 ? (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <div key={booking.id} className="flex items-center p-5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center mr-4">
                          <span className="text-white text-2xl">🎾</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900">{booking.court?.name || 'Court Booking'}</h3>
                          <p className="text-sm text-gray-500">
                            {new Date(booking.start_time).toLocaleDateString('en-US', { 
                              weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                            })} at {new Date(booking.start_time).toLocaleTimeString([], { 
                              hour: '2-digit', minute: '2-digit' 
                            })}
                          </p>
                        </div>
                        <span className={`px-4 py-2 text-sm font-medium rounded-full ${
                          booking.status === 'confirmed' 
                            ? 'bg-green-100 text-green-700' 
                            : booking.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-4xl">📅</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings yet</h3>
                    <p className="text-gray-500 mb-4">Book a court to start playing!</p>
                    <button className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                      Browse Courts
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar - Messages */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md overflow-hidden sticky top-24">
              <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                <h2 className="font-bold text-lg flex items-center">
                  <span className="mr-2">💬</span> Messages
                  {unreadCount > 0 && (
                    <span className="ml-auto bg-white text-green-600 px-2 py-0.5 rounded-full text-xs">
                      {unreadCount}
                    </span>
                  )}
                </h2>
              </div>
              
              {activeTab !== 'messages' && (
                <div className="p-4">
                  <button 
                    onClick={() => setActiveTab('messages')}
                    className="w-full py-3 bg-green-50 text-green-600 rounded-xl font-medium hover:bg-green-100 transition-colors"
                  >
                    View Messages →
                  </button>
                </div>
              )}

              {activeTab === 'messages' && (
                <div className="flex flex-col" style={{ maxHeight: '600px' }}>
                  {/* Message List */}
                  <div className="flex-1 overflow-y-auto">
                    {messages.length > 0 ? messages.map((message) => (
                      <button
                        key={message.id}
                        onClick={() => handleReadMessage(message)}
                        className={`w-full p-4 text-left border-b hover:bg-gray-50 transition-colors ${
                          !message.is_read ? 'bg-blue-50' : ''
                        } ${selectedMessage?.id === message.id ? 'bg-gray-100' : ''}`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <span className="font-medium text-gray-900 truncate">
                            {message.sender?.username || 'Unknown'}
                          </span>
                          <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                            {formatDate(message.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{message.subject}</p>
                        {!message.is_read && (
                          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mt-2"></span>
                        )}
                      </button>
                    )) : (
                      <div className="p-8 text-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <span className="text-2xl">📭</span>
                        </div>
                        <p className="text-gray-500 text-sm">No messages yet</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Message Detail */}
                  {selectedMessage && (
                    <div className="border-t p-4 bg-gray-50">
                      <div className="mb-3">
                        <h4 className="font-bold text-gray-900">{selectedMessage.subject}</h4>
                        <p className="text-xs text-gray-500">
                          From: {selectedMessage.sender?.username} • {formatDate(selectedMessage.created_at)}
                        </p>
                      </div>
                      <p className="text-sm text-gray-700 mb-4 whitespace-pre-wrap">{selectedMessage.content}</p>
                      
                      <form onSubmit={handleReply}>
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="w-full p-3 border rounded-lg mb-2 text-sm"
                          rows="2"
                          placeholder="Write a reply..."
                          required
                        ></textarea>
                        <button
                          type="submit"
                          disabled={sendingReply}
                          className="w-full py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 transition-colors"
                        >
                          {sendingReply ? 'Sending...' : 'Send Reply'}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlayerDashboard;
