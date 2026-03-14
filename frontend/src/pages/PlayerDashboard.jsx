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
  const [trainingSessions, setTrainingSessions] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'dashboard');
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [enrollingSession, setEnrollingSession] = useState(null);
  const [myTournaments, setMyTournaments] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ paymentMethod: 'mpesa', phone: '', reference: '' });
  const [payingTournament, setPayingTournament] = useState(null);
  const [showBookingPaymentModal, setShowBookingPaymentModal] = useState(false);
  const [payingBooking, setPayingBooking] = useState(null);
  const [bookingPaymentForm, setBookingPaymentForm] = useState({
    paymentMethod: '',
    phone: '',
    reference: ''
  });

  // Utility functions
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    fetchData();

    const unsubs = [];
    if (api.subscribeToMyBookings) {
      unsubs.push(api.subscribeToMyBookings({ limit: 100 }, setMyBookings));
    }
    if (api.subscribeToAnnouncements) {
      unsubs.push(api.subscribeToAnnouncements({ active_only: true, limit: 5 }, setAnnouncements));
    }
    if (api.subscribeToNotifications) {
      unsubs.push(api.subscribeToNotifications({ limit: 10 }, setNotifications));
    }

    return () => {
      unsubs.forEach((unsub) => {
        if (typeof unsub === 'function') unsub();
      });
    };
  }, [isAuthenticated, user]);

  const fetchData = async () => {
    try {
      const [
        tournamentsData,
        courtsData,
        bookingsData,
        statsData,
        sessionsData,
        announcementsData,
        notificationsData,
        detailedStatsData,
        myTournamentsData,
      ] = await Promise.all([
        api.getActiveTournaments().catch(() => []),
        api.getCourts({ limit: 6 }).catch(() => []),
        api.getMyBookings().catch(() => []),
        api.getMyStats().catch(() => null),
        api.getTrainingSessions({ upcoming: true, limit: 10 }).catch(() => []),
        api.getAnnouncements({ active_only: true, limit: 5 }).catch(() => []),
        api.getNotifications({ limit: 10 }).catch(() => []),
        user ? api.getPlayerStatistics(user.id).catch(() => null) : Promise.resolve(null),
        user ? api.getMyTournamentRegistrations().catch(() => []) : Promise.resolve([]),
      ]);

      setActiveTournaments(tournamentsData || []);
      setCourts(courtsData || []);
      setMyBookings(bookingsData || []);
      setMyStats(statsData);
      setDetailedStats(detailedStatsData);
      setAnnouncements(announcementsData || []);
      setNotifications(notificationsData || []);
      setMyTournaments(myTournamentsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }

    setLoading(false);
  };

  const handleTournamentPayment = async (e) => {
    e.preventDefault();
    try {
      // Submit payment details - registration will be created after admin approves
      await api.submitTournamentPaymentIntent(
        payingTournament.id,
        paymentForm.paymentMethod,
        paymentForm.phone,
        paymentForm.reference
      );
      
      setShowPaymentModal(false);
      setPayingTournament(null);
      setPaymentForm({ paymentMethod: 'mpesa', phone: '', reference: '' });
      
      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg z-50';
      notification.innerHTML = `
        <div class="flex items-center gap-3">
          <span class="text-2xl"></span>
          <div>
            <p class="font-bold">Payment Submitted!</p>
            <p class="text-sm text-green-100">Admin will review and approve your registration shortly.</p>
          </div>
        </div>
      `;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 5000);
      
      fetchData();
    } catch (error) {
      console.error('Payment error:', error);
      alert('Error: ' + (error.message || 'Unknown error'));
    }
  };

  const startBookingPayment = (booking) => {
    setPayingBooking(booking);
    setBookingPaymentForm({
      paymentMethod: booking.payment_method || '',
      phone: booking.payment_phone || '',
      reference: booking.payment_reference || ''
    });
    setShowBookingPaymentModal(true);
  };

  const handleBookingPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!payingBooking) return;
    try {
      await api.submitBookingPayment(
        payingBooking.id,
        bookingPaymentForm.paymentMethod,
        bookingPaymentForm.phone,
        bookingPaymentForm.reference
      );
      setShowBookingPaymentModal(false);
      setPayingBooking(null);
      setBookingPaymentForm({ paymentMethod: '', phone: '', reference: '' });
      fetchData();
    } catch (error) {
      alert('Failed to submit payment: ' + (error.message || 'Unknown error'));
    }
  };

  const markNotificationRead = async (notificationId) => {
    try {
      await api.markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    if (!confirm('Delete this notification?')) return;
    try {
      await api.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const markAnnouncementRead = async (announcementId) => {
    try {
      await api.markAnnouncementAsRead(announcementId);
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === announcementId ? { ...a, is_read: true } : a))
      );
    } catch (error) {
      console.error('Error marking announcement as read:', error);
    }
  };

  const deleteAnnouncement = async (announcementId) => {
    if (!confirm('Delete this announcement?')) return;
    try {
      await api.deleteAnnouncement(announcementId);
      setAnnouncements((prev) => prev.filter((a) => a.id !== announcementId));
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert('Error: ' + (error.message || 'Could not delete announcement'));
    }
  };

  const markBookingRead = async (bookingId) => {
    try {
      await api.markBookingAsRead(bookingId);
      setMyBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, is_read: true } : b))
      );
    } catch (error) {
      console.error('Error marking booking as read:', error);
    }
  };

  const deleteBooking = async (bookingId) => {
    if (!confirm('Delete this booking? This will cancel it.')) return;
    try {
      await api.cancelBooking(bookingId);
      setMyBookings((prev) => prev.filter((b) => b.id !== bookingId));
    } catch (error) {
      alert('Failed to delete booking: ' + (error.message || 'Unknown error'));
    }
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
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Welcome back, {user?.username}!</h1>
                <p className="text-green-100">Ready to dominate the court today?</p>
              </div>
              <div className="mt-4 md:mt-0 flex space-x-3">
                <button
                  onClick={() => setShowStatsModal(true)}
                  className="px-6 py-3 bg-white text-green-600 rounded-xl font-semibold hover:bg-green-50 transition-colors shadow-md flex items-center"
                >
                  <span className="mr-2"></span> My Stats
                </button>
                <Link
                  to="/courts"
                  className="px-6 py-3 bg-green-700/50 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center"
                >
                  <span className="mr-2"></span> Book Court
                </Link>
              </div>
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Matches Played</p>
                <p className="text-3xl font-bold text-gray-900">{detailedStats?.total_matches || myStats?.total_matches || 0}</p>
              </div>
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl"></span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Wins</p>
                <p className="text-3xl font-bold text-green-600">{detailedStats?.wins || myStats?.wins || user?.wins || 0}</p>
              </div>
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl"></span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Losses</p>
                <p className="text-3xl font-bold text-red-600">{detailedStats?.losses || myStats?.losses || user?.losses || 0}</p>
              </div>
              <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl"></span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Ranking Points</p>
                <p className="text-3xl font-bold text-blue-600">{detailedStats?.ranking_points || user?.ranking_points || 0}</p>
              </div>
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl"></span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Skill Level</p>
                <p className="text-2xl font-bold text-orange-600 capitalize">{detailedStats?.skill_level || user?.skill_level || 'Beginner'}</p>
              </div>
              <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl"></span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-8 overflow-hidden">
          <div className="flex overflow-x-auto">
            {[
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'bookings', label: 'My Bookings', badge: myBookings.filter(b => !b.is_read).length },
              { id: 'tournaments', label: 'Tournaments' },
              { id: 'training', label: 'Training' },
              { id: 'announcements', label: 'Announcements', badge: announcements.filter(a => !a.is_read).length },
              { id: 'notifications', label: 'Notifications', badge: notifications.filter(n => !n.is_read).length },
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
                          reg.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                          reg.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          reg.payment_status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {reg.payment_status === 'paid' ? 'Paid' :
                           reg.payment_status === 'pending' ? 'Payment Submitted' :
                           reg.payment_status === 'rejected' ? 'Payment Rejected' :
                           'Payment Not Submitted'}
                        </span>
                        <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                          reg.status === 'approved' ? 'bg-green-100 text-green-800' :
                          reg.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {reg.status === 'approved' ? 'Approved' : 
                           reg.status === 'rejected' ? 'Rejected' : 
                           reg.status === 'pending_payment' ? 'Pending Payment' : 'Pending'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {reg.tournament?.start_date ? new Date(reg.tournament.start_date).toLocaleDateString() : 'TBD'}
                      </div>
                      <div className="text-sm text-gray-600">
                        Entry: {reg.tournament?.entry_fee || 0} KES
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
                  <div className="text-3xl mb-3"></div>
                  <div className="font-bold text-green-800 text-lg">Book a Court</div>
                  <div className="text-sm text-green-600 mt-1">Reserve your perfect court</div>
                </Link>
                <Link to="/tournaments" className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 hover:bg-blue-100 transition-all hover:scale-105">
                  <div className="text-3xl mb-3"></div>
                  <div className="font-bold text-blue-800 text-lg">Join Tournament</div>
                  <div className="text-sm text-blue-600 mt-1">Compete and win prizes</div>
                </Link>
                <Link to="/profile" className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6 hover:bg-purple-100 transition-all hover:scale-105">
                  <div className="text-3xl mb-3"></div>
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
                    <div
                      key={booking.id}
                      className={`border-2 rounded-xl p-4 hover:border-green-300 transition-colors ${
                        booking.is_read ? 'border-gray-200 bg-gray-50' : 'border-gray-200'
                      }`}
                    >
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
                      <div className="mt-3 flex items-center gap-2">
                        {!booking.is_read && (
                          <button
                            onClick={() => markBookingRead(booking.id)}
                            className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Mark as read
                          </button>
                        )}
                        <button
                          onClick={() => deleteBooking(booking.id)}
                          className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
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
                        <span className="text-white text-4xl"></span>
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
                            {court.is_available ? 'Available' : 'Occupied'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {courts.length === 0 && (
                    <div className="col-span-2 text-center py-8">
                      <div className="text-5xl mb-3"></div>
                      <div className="text-gray-500 mb-2">No courts available</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Notifications */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
                  <button onClick={() => setActiveTab('notifications')} className="text-green-600 hover:text-green-700 text-sm font-medium">View All →</button>
                </div>
                <div className="space-y-3">
                  {notifications.slice(0, 3).map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`p-4 rounded-xl cursor-default hover:shadow-md transition-shadow ${!notification.is_read ? 'bg-green-50 border-l-4 border-green-500' : 'bg-gray-50'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          {!notification.is_read && <span className="w-2 h-2 bg-green-500 rounded-full"></span>}
                          <div>
                            <p className="font-medium">{notification.title || 'Notification'}</p>
                            <p className="text-xs text-gray-500">{formatDate(notification.created_at)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!notification.is_read && (
                            <button
                              onClick={() => markNotificationRead(notification.id)}
                              className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Mark as read
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{notification.message || notification.content}</p>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-5xl mb-3">🔔</div>
                      <div className="text-gray-500">No notifications yet</div>
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
                          onClick={() => {
                            setPayingTournament(tournament);
                            setShowPaymentModal(true);
                            setPaymentForm({ paymentMethod: 'mpesa', phone: '', reference: '' });
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

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">My Bookings</h2>
              <Link to="/courts" className="text-green-600 hover:text-green-700 text-sm font-medium">
                Book a Court →
              </Link>
            </div>
            {myBookings.length > 0 ? (
              <div className="space-y-4">
                {myBookings.map((booking) => {
                  const paymentStatus = booking.payment_status || 'unpaid';
                  return (
                    <div
                      key={booking.id}
                      className={`flex items-center p-4 rounded-xl border ${
                        booking.is_read ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mr-3">
                        <span className="text-green-700 text-xl">🎾</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{booking.court?.name || 'Court'}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(booking.start_time).toLocaleDateString()} •{" "}
                          {new Date(booking.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        {(booking.payment_method || booking.payment_phone || booking.payment_reference) && (
                          <p className="text-xs text-gray-500 mt-1">
                            {booking.payment_method ? `Method: ${booking.payment_method}` : ''}
                            {booking.payment_phone ? ` • Phone: ${booking.payment_phone}` : ''}
                            {booking.payment_reference ? ` • Ref: ${booking.payment_reference}` : ''}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 text-xs rounded-full font-medium ${
                            booking.status === "confirmed"
                              ? "bg-green-100 text-green-800"
                              : booking.status === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {booking.status}
                        </span>
                        <span
                          className={`px-3 py-1 text-xs rounded-full font-medium ${
                            paymentStatus === "paid"
                              ? "bg-green-100 text-green-800"
                              : paymentStatus === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : paymentStatus === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {paymentStatus}
                        </span>
                        {!booking.is_read && (
                          <button
                            onClick={() => markBookingRead(booking.id)}
                            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Mark as read
                          </button>
                        )}
                        <button
                          onClick={() => deleteBooking(booking.id)}
                          className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                        {booking.status !== "cancelled" && (paymentStatus === "unpaid" || paymentStatus === "rejected") && (
                          <button
                            onClick={() => startBookingPayment(booking)}
                            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Submit Payment
                          </button>
                        )}
                        {booking.status !== "cancelled" && paymentStatus === "pending" && (
                          <span className="px-3 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                            Awaiting Approval
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">📅</div>
                <div className="text-gray-500 mb-2">You have no bookings yet</div>
                <Link to="/courts" className="text-green-600 hover:text-green-700 font-medium">
                  Find a court →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Tournaments Tab */}
        {activeTab === 'tournaments' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Active Tournaments</h2>
                <Link to="/tournaments" className="text-green-600 hover:text-green-700 text-sm font-medium">
                  View All →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeTournaments.length > 0 ? (
                  activeTournaments.map((tournament) => {
                    const isRegistered = myTournaments.some(
                      (reg) => reg.tournament?.id === tournament.id
                    );
                    return (
                      <div
                        key={tournament.id}
                        className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-lg text-gray-900">
                              {tournament.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {tournament.location || "Main venue"}
                            </p>
                          </div>
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 font-medium">
                            {tournament.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1 mb-3">
                          <div>📅 {new Date(tournament.start_date).toLocaleDateString()}</div>
                          <div>👥 {tournament.participant_count || 0} players</div>
                          <div>💰 {tournament.entry_fee || 0} KES</div>
                        </div>
                        <button
                          onClick={() => {
                            setPayingTournament(tournament);
                            setShowPaymentModal(true);
                            setPaymentForm({ paymentMethod: 'mpesa', phone: '', reference: '' });
                          }}
                          disabled={isRegistered}
                          className={`w-full px-4 py-2 rounded-lg font-medium ${
                            isRegistered
                              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                              : "bg-green-500 text-white hover:bg-green-600"
                          }`}
                        >
                          {isRegistered ? "Already Registered" : "Register Now"}
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-3 text-center py-12">
                    <div className="text-5xl mb-3">🏆</div>
                    <div className="text-gray-500">No active tournaments right now</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Announcements</h2>
            <div className="space-y-4">
              {announcements.length > 0 ? (
                announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className={`border-l-4 p-4 rounded-lg ${
                      announcement.is_read
                        ? 'border-gray-300 bg-gray-50'
                        : 'border-green-500 bg-green-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-gray-900">
                        {announcement.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          {formatDate(announcement.created_at || announcement.createdAt)}
                        </span>
                        {!announcement.is_read && (
                          <button
                            onClick={() => markAnnouncementRead(announcement.id)}
                            className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Mark as read
                          </button>
                        )}
                        <button
                          onClick={() => deleteAnnouncement(announcement.id)}
                          className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-2">{announcement.content}</p>
                    {announcement.priority && (
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded-full ${
                          announcement.priority === "urgent"
                            ? "bg-red-100 text-red-800"
                            : announcement.priority === "high"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {announcement.priority}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="text-5xl mb-3">📢</div>
                  <div className="text-gray-500">No announcements yet</div>
                </div>
              )}
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

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Notifications</h2>
            <div className="space-y-3">
              {notifications.length > 0 ? notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-4 rounded-xl cursor-default hover:shadow-md transition-shadow ${!notification.is_read ? 'bg-green-50 border-l-4 border-green-500' : 'bg-gray-50'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {!notification.is_read && <span className="w-2 h-2 bg-green-500 rounded-full"></span>}
                      <div>
                        <p className="font-medium">{notification.title || 'Notification'}</p>
                        <p className="text-xs text-gray-500">{formatDate(notification.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!notification.is_read && (
                        <button
                          onClick={() => markNotificationRead(notification.id)}
                          className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Mark as read
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
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

      {/* Players Tab removed (no in-app messaging between players) */}
      </div>

      {/* Booking Payment Modal */}
      {showBookingPaymentModal && payingBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Submit Payment</h3>
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold">{payingBooking.court?.name || 'Court Booking'}</p>
              <p className="text-sm text-gray-600">
                {new Date(payingBooking.start_time).toLocaleDateString()} •{" "}
                {new Date(payingBooking.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
              <p className="text-sm text-gray-600 mt-1">Amount: {payingBooking.court?.price_per_hour || 0} KES</p>
            </div>
            <form onSubmit={handleBookingPaymentSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={bookingPaymentForm.paymentMethod}
                    onChange={(e) => setBookingPaymentForm({ ...bookingPaymentForm, paymentMethod: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  >
                    <option value="">Select payment method...</option>
                    <option value="mpesa">M-Pesa</option>
                    <option value="card">Card</option>
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone / Contact</label>
                  <input
                    type="text"
                    required
                    value={bookingPaymentForm.phone}
                    onChange={(e) => setBookingPaymentForm({ ...bookingPaymentForm, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., 0712345678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Reference</label>
                  <input
                    type="text"
                    required
                    value={bookingPaymentForm.reference}
                    onChange={(e) => setBookingPaymentForm({ ...bookingPaymentForm, reference: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., ABC123XYZ"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowBookingPaymentModal(false);
                    setPayingBooking(null);
                  }}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600"
                >
                  Submit Payment
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

      {/* Tournament Payment Modal */}
      {showPaymentModal && payingTournament && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl"></span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Complete Your Payment</h3>
              <p className="text-gray-600 mt-2">Tournament: <span className="font-bold">{payingTournament.name}</span></p>
              <p className="text-gray-600">Entry Fee: <span className="font-bold text-green-600 text-xl">{payingTournament.entry_fee || 0} KES</span></p>
            </div>
            
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
              <p className="font-bold text-blue-800 mb-3">📱 Payment Steps for M-Pesa:</p>
              <ol className="text-sm text-blue-700 space-y-2">
                <li className="flex items-start gap-2"><span className="font-bold">1.</span> Go to <strong>M-Pesa</strong> on your phone</li>
                <li className="flex items-start gap-2"><span className="font-bold">2.</span> Select <strong>Pay Bill</strong></li>
                <li className="flex items-start gap-2"><span className="font-bold">3.</span> Enter Business Number: <strong className="text-blue-900">0738839851</strong></li>
                <li className="flex items-start gap-2"><span className="font-bold">4.</span> Enter Amount: <strong className="text-blue-900">{payingTournament.entry_fee || 0}</strong> KES</li>
                <li className="flex items-start gap-2"><span className="font-bold">5.</span> Complete payment and enter reference below</li>
              </ol>
            </div>
            
            <form onSubmit={handleTournamentPayment}>
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">💰 Select Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setPaymentForm({ ...paymentForm, paymentMethod: 'mpesa' })} className={`py-3 px-4 rounded-xl font-bold border-2 ${paymentForm.paymentMethod === 'mpesa' ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-700 border-gray-300'}`}>M-Pesa</button>
                  <button type="button" onClick={() => setPaymentForm({ ...paymentForm, paymentMethod: 'card' })} className={`py-3 px-4 rounded-xl font-bold border-2 ${paymentForm.paymentMethod === 'card' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-300'}`}>Card</button>
                  <button type="button" onClick={() => setPaymentForm({ ...paymentForm, paymentMethod: 'bank' })} className={`py-3 px-4 rounded-xl font-bold border-2 ${paymentForm.paymentMethod === 'bank' ? 'bg-purple-500 text-white border-purple-500' : 'bg-white text-gray-700 border-gray-300'}`}>Bank</button>
                  <button type="button" onClick={() => setPaymentForm({ ...paymentForm, paymentMethod: 'cash' })} className={`py-3 px-4 rounded-xl font-bold border-2 ${paymentForm.paymentMethod === 'cash' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-700 border-gray-300'}`}>💵 Cash</button>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">📱 Phone Number Used</label>
                <input type="tel" value={paymentForm.phone} onChange={(e) => setPaymentForm({ ...paymentForm, phone: e.target.value })} placeholder="e.g., 254712345678" className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-lg" required />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">🔢 Transaction Reference</label>
                <input type="text" value={paymentForm.reference} onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })} placeholder="e.g., MPE123456789" className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-lg font-mono" required />
              </div>
              
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowPaymentModal(false); setPayingTournament(null); }} className="flex-1 px-6 py-4 bg-gray-200 text-gray-800 rounded-xl font-bold hover:bg-gray-300 text-lg">Cancel</button>
                <button type="submit" disabled={!paymentForm.phone || !paymentForm.reference} className="flex-1 px-6 py-4 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 text-lg disabled:bg-gray-300">Submit Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


export default PlayerDashboard;
