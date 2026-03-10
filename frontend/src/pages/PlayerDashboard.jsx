import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function PlayerDashboard() {
  const { user, isPlayer, updateUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [messages, setMessages] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profilePicture, setProfilePicture] = useState(user?.profile_picture || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    skill_level: user?.skill_level || 'beginner'
  });

  useEffect(() => {
    if (isPlayer) {
      fetchData();
    }
  }, [isPlayer]);

  useEffect(() => {
    setProfilePicture(user?.profile_picture || '');
    setProfileForm({
      full_name: user?.full_name || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      skill_level: user?.skill_level || 'beginner'
    });
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const updatedUser = await api.updateUser(profileForm);
      updateUser(updatedUser);
      setEditingProfile(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfilePictureUpdate = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const updatedUser = await api.updateUser({ profile_picture: profilePicture });
      updateUser(updatedUser);
      setEditingProfile(false);
      alert('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error updating profile picture:', error);
      alert('Failed to update profile picture');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }
    
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Invalid file type. Please upload a PNG, JPG, GIF, or WEBP image.');
      return;
    }
    
    setUploadingFile(true);
    try {
      const result = await api.uploadProfilePicture(file);
      const fullImageUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${result.profile_picture}`;
      await api.updateUser({ profile_picture: fullImageUrl });
      const updatedUser = await api.getMe();
      updateUser(updatedUser);
      setProfilePicture(fullImageUrl);
      alert('Profile picture uploaded successfully!');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Failed to upload profile picture: ' + (error.message || 'Unknown error'));
    } finally {
      setUploadingFile(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsData, messagesData, bookingsData, unreadData, announcementsData] = await Promise.all([
        api.getMyStats().catch(() => null),
        api.getMessages('inbox', { limit: 20 }).catch(() => []),
        api.getMyBookings({ upcoming: true, limit: 5 }).catch(() => []),
        api.getUnreadMessageCount().catch(() => ({ unread_count: 0 })),
        api.getPlayerAnnouncements({ active_only: true, limit: 10 }).catch(() => []),
      ]);
      setStats(statsData);
      setMessages(messagesData || []);
      setBookings(bookingsData || []);
      setUnreadCount(unreadData?.unread_count || 0);
      setAnnouncements(announcementsData || []);
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
        receiver_id: parseInt(selectedMessage.sender_id, 10),
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
            <div className="relative w-24 h-24 bg-white/20 rounded-full flex items-center justify-center border-4 border-white/30 overflow-hidden">
              {user?.profile_picture ? (
                <img 
                  src={user.profile_picture} 
                  alt={user.username} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-5xl font-bold">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {user?.full_name || user?.username}
              </h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                  🎾 {user?.username}
                </span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium capitalize">
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
              { id: 'announcements', label: 'Announcements', icon: '📢', badge: announcements.length > 0 ? announcements.length : null },
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

                {/* Recent Announcements */}
                {announcements.length > 0 && (
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-gray-900">Recent Announcements</h2>
                      <button 
                        onClick={() => setActiveTab('announcements')}
                        className="text-sm text-green-600 hover:text-green-700 font-medium"
                      >
                        View All →
                      </button>
                    </div>
                    <div className="space-y-3">
                      {announcements.slice(0, 2).map((announcement) => (
                        <div 
                          key={announcement.id} 
                          className={`p-4 rounded-xl border-l-4 ${
                            announcement.priority === 'urgent' 
                              ? 'bg-red-50 border-red-500' 
                              : announcement.priority === 'high'
                              ? 'bg-orange-50 border-orange-500'
                              : 'bg-blue-50 border-blue-500'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                            {announcement.priority === 'urgent' && (
                              <span className="px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">URGENT</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{announcement.content}</p>
                          <p className="text-xs text-gray-500 mt-2">{formatDate(announcement.created_at)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-tennis-green to-tennis-green-light p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">My Profile</h2>
                    {!editingProfile ? (
                      <button
                        onClick={() => setEditingProfile(true)}
                        className="px-6 py-2 bg-white text-tennis-green rounded-lg hover:bg-gray-100 transition-colors text-sm font-semibold shadow-md"
                      >
                        ✏️ Edit Profile
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setProfileForm({
                            full_name: user?.full_name || '',
                            phone: user?.phone || '',
                            bio: user?.bio || '',
                            skill_level: user?.skill_level || 'beginner'
                          });
                          setEditingProfile(false);
                        }}
                        className="px-6 py-2 bg-white text-tennis-green rounded-lg hover:bg-gray-100 transition-colors text-sm font-semibold shadow-md"
                      >
                        ✓ Done
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  {/* Profile Picture Section */}
                  <div className="flex flex-col items-center mb-8 p-6 bg-gradient-to-br from-gray-50 to-green-50 rounded-2xl border-2 border-green-100">
                    <div className="relative w-32 h-32 mb-4">
                      {user?.profile_picture ? (
                        <img 
                          src={user.profile_picture} 
                          alt={user.username} 
                          className="w-full h-full object-cover rounded-full border-4 border-white shadow-xl ring-4 ring-tennis-green/20"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-tennis-green to-tennis-green-light rounded-full flex items-center justify-center border-4 border-white shadow-xl ring-4 ring-tennis-green/20">
                          <span className="text-5xl font-bold text-white">
                            {user?.username?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{user?.full_name || user?.username}</h3>
                    <p className="text-sm text-gray-500 mb-4">@{user?.username}</p>
                    
                    <div className="w-full max-w-md">
                      <div className="border-2 border-dashed border-tennis-green/30 rounded-xl p-6 text-center hover:border-tennis-green hover:bg-white transition-all bg-white/50">
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileUpload(e.target.files[0]);
                            }
                          }}
                          className="hidden"
                          id="profile-picture-input"
                          disabled={uploadingFile}
                        />
                        <label
                          htmlFor="profile-picture-input"
                          className="cursor-pointer block"
                        >
                          <div className="text-4xl mb-2">📸</div>
                          <p className="text-sm text-gray-700 font-semibold">
                            {uploadingFile ? '⏳ Uploading...' : 'Click to upload photo'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            PNG, JPG, GIF, WEBP (max 5MB)
                          </p>
                        </label>
                      </div>
                      {user?.profile_picture && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (confirm('Remove your profile picture?')) {
                              setProfileLoading(true);
                              try {
                                await api.removeProfilePicture();
                                const updatedUser = await api.getMe();
                                updateUser(updatedUser);
                                setProfilePicture('');
                                alert('Profile picture removed!');
                              } catch (error) {
                                alert('Failed to remove profile picture');
                              } finally {
                                setProfileLoading(false);
                              }
                            }
                          }}
                          className="mt-3 w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium text-sm"
                        >
                          🗑️ Remove Photo
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Profile Form */}
                  {editingProfile ? (
                    <form onSubmit={handleProfileUpdate} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                          <input
                            type="text"
                            value={profileForm.full_name}
                            onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-tennis-green focus:border-tennis-green transition-all"
                            placeholder="Enter your full name"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                          <input
                            type="tel"
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-tennis-green focus:border-tennis-green transition-all"
                            placeholder="+254 XXX XXX XXX"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Skill Level</label>
                        <select
                          value={profileForm.skill_level}
                          onChange={(e) => setProfileForm({ ...profileForm, skill_level: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-tennis-green focus:border-tennis-green transition-all"
                        >
                          <option value="beginner">🌱 Beginner</option>
                          <option value="intermediate">⭐ Intermediate</option>
                          <option value="advanced">🏆 Advanced</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
                        <textarea
                          value={profileForm.bio}
                          onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                          rows="4"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-tennis-green focus:border-tennis-green transition-all"
                          placeholder="Tell us about yourself, your tennis journey, achievements..."
                        />
                      </div>
                      
                      <div className="flex gap-3 pt-4">
                        <button
                          type="submit"
                          disabled={profileLoading}
                          className="flex-1 py-4 bg-gradient-to-r from-tennis-green to-tennis-green-light text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 transform hover:scale-[1.02]"
                        >
                          {profileLoading ? '⏳ Saving...' : '💾 Save Changes'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setProfileForm({
                              full_name: user?.full_name || '',
                              phone: user?.phone || '',
                              bio: user?.bio || '',
                              skill_level: user?.skill_level || 'beginner'
                            });
                            setEditingProfile(false);
                          }}
                          className="px-8 py-4 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                        >
                          ✕ Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200 shadow-sm">
                          <p className="text-xs text-blue-600 uppercase tracking-wide mb-2 font-bold flex items-center gap-2">
                            <span>👤</span> Username
                          </p>
                          <p className="font-bold text-gray-900 text-xl">@{user?.username}</p>
                        </div>
                        
                        <div className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-purple-200 shadow-sm">
                          <p className="text-xs text-purple-600 uppercase tracking-wide mb-2 font-bold flex items-center gap-2">
                            <span>📛</span> Full Name
                          </p>
                          <p className="font-bold text-gray-900 text-xl">{user?.full_name || 'Not set'}</p>
                        </div>
                        
                        <div className="p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-200 shadow-sm">
                          <p className="text-xs text-green-600 uppercase tracking-wide mb-2 font-bold flex items-center gap-2">
                            <span>📧</span> Email
                          </p>
                          <p className="font-bold text-gray-900 text-lg break-all">{user?.email}</p>
                        </div>
                        
                        <div className="p-5 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border-2 border-orange-200 shadow-sm">
                          <p className="text-xs text-orange-600 uppercase tracking-wide mb-2 font-bold flex items-center gap-2">
                            <span>📱</span> Phone
                          </p>
                          <p className="font-bold text-gray-900 text-xl">{user?.phone || 'Not set'}</p>
                        </div>
                        
                        <div className="p-5 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border-2 border-yellow-200 shadow-sm">
                          <p className="text-xs text-yellow-700 uppercase tracking-wide mb-2 font-bold flex items-center gap-2">
                            <span>🎯</span> Skill Level
                          </p>
                          <span className="inline-block px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white rounded-full text-sm font-bold capitalize shadow-md">
                            {user?.skill_level === 'beginner' && '🌱 '}
                            {user?.skill_level === 'intermediate' && '⭐ '}
                            {user?.skill_level === 'advanced' && '🏆 '}
                            {user?.skill_level}
                          </span>
                        </div>
                        
                        <div className="p-5 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl border-2 border-pink-200 shadow-sm">
                          <p className="text-xs text-pink-600 uppercase tracking-wide mb-2 font-bold flex items-center gap-2">
                            <span>🎾</span> Role
                          </p>
                          <span className="inline-block px-4 py-2 bg-gradient-to-r from-tennis-green to-tennis-green-light text-white rounded-full text-sm font-bold capitalize shadow-md">
                            {user?.role}
                          </span>
                        </div>
                      </div>
                      
                      {user?.bio ? (
                        <div className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl border-2 border-indigo-200 shadow-sm">
                          <p className="text-xs text-indigo-600 uppercase tracking-wide mb-3 font-bold flex items-center gap-2">
                            <span>📝</span> Bio
                          </p>
                          <p className="text-gray-800 leading-relaxed text-lg">{user.bio}</p>
                        </div>
                      ) : (
                        <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300 text-center">
                          <div className="text-5xl mb-3">✍️</div>
                          <p className="text-gray-600 font-medium mb-2">No bio added yet</p>
                          <p className="text-gray-500 text-sm">Click "Edit Profile" to tell us about yourself!</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'announcements' && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Coach Announcements</h2>
                {announcements.length > 0 ? (
                  <div className="space-y-4">
                    {announcements.map((announcement) => (
                      <div 
                        key={announcement.id} 
                        className={`p-5 rounded-xl border-l-4 transition-all hover:shadow-md ${
                          announcement.priority === 'urgent' 
                            ? 'bg-red-50 border-red-500' 
                            : announcement.priority === 'high'
                            ? 'bg-orange-50 border-orange-500'
                            : 'bg-blue-50 border-blue-500'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-lg text-gray-900">{announcement.title}</h3>
                          {announcement.priority === 'urgent' && (
                            <span className="px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full">URGENT</span>
                          )}
                          {announcement.priority === 'high' && (
                            <span className="px-2 py-1 text-xs font-bold text-white bg-orange-500 rounded-full">HIGH</span>
                          )}
                        </div>
                        <p className="text-gray-600 mb-3 whitespace-pre-wrap">{announcement.content}</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <span className="mr-3">📅 {formatDate(announcement.created_at)}</span>
                          {announcement.expires_at && (
                            <span>⏰ Expires: {new Date(announcement.expires_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">📢</span>
                    </div>
                    <p className="text-gray-500">No announcements from your coach yet.</p>
                  </div>
                )}
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
