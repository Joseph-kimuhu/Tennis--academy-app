import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import TournamentBracket from '../components/TournamentBracket';

function Tournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', tournament_type: '' });
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [showBracket, setShowBracket] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ paymentMethod: '', phone: '', reference: '' });
  const [myTournaments, setMyTournaments] = useState([]);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    fetchTournaments();
  }, [filter]);

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.tournament_type) params.tournament_type = filter.tournament_type;
      
      const [tournamentsData, myTournamentsData] = await Promise.all([
        api.getTournaments(params),
        user ? api.getMyTournamentRegistrations().catch(() => []) : Promise.resolve([])
      ]);
      
      setTournaments(tournamentsData || []);
      setMyTournaments(myTournamentsData || []);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    }
    setLoading(false);
  };

  const handleTournamentSelect = async (tournament) => {
    setSelectedTournament(tournament);
    setShowBracket(false);
    try {
      const data = await api.getTournamentParticipants(tournament.id);
      setParticipants(data || []);
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  const handleJoinTournament = async (tournamentId) => {
    if (!isAuthenticated) {
      alert('Please login to join a tournament');
      return;
    }

    // Check if user is already registered
    const alreadyRegistered = participants.some(p => p.user_id === user?.id);
    if (alreadyRegistered) {
      alert('You are already registered for this tournament');
      return;
    }

    // Show payment modal FIRST - then do registration in background
    setShowPaymentModal(true);
    setPaymentForm({ paymentMethod: 'mpesa', phone: '', reference: '' });
    
    // Try to register in background - if it fails, we'll show error after payment
    try {
      await api.joinTournament(tournamentId);
      fetchTournaments();
      handleTournamentSelect(selectedTournament);
    } catch (error) {
      console.log('Registration in progress, payment will complete registration');
      // Don't show error - payment modal is open, user will complete registration with payment
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      // Find the user's registration
      const myRegistrations = participants.filter(p => p.user_id === user?.id);
      if (myRegistrations.length === 0) {
        alert('Registration not found');
        return;
      }
      
      const registrationId = myRegistrations[0].id;
      await api.confirmTournamentPayment(registrationId, paymentForm.paymentMethod, paymentForm.phone, paymentForm.reference);
      
      setShowPaymentModal(false);
      
      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-gradient-to-r from-tennis-green to-tennis-green-light text-white px-6 py-4 rounded-xl shadow-tennis-lg z-50 animate-slide-in';
      notification.innerHTML = `
        <div class="flex items-center gap-3">
          <span class="text-2xl">✅</span>
          <div>
            <p class="font-bold">Payment Submitted!</p>
            <p class="text-sm text-green-50">Your payment is being processed. Admin will review and approve shortly.</p>
          </div>
        </div>
      `;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.remove();
      }, 5000);
      
      handleTournamentSelect(selectedTournament);
    } catch (error) {
      alert(error.message);
    }
  };

  const isParticipant = () => {
    return participants.some((p) => p.user?.id === user?.id);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'ongoing':
        return 'bg-green-50 text-green-700 border border-green-200';
      case 'completed':
        return 'bg-gray-50 text-gray-700 border border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  const getTournamentIcon = (type) => {
    switch (type) {
      case 'knockout': return '🏆';
      case 'round_robin': return '🔄';
      case 'league': return '📊';
      default: return '🎾';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-tennis-green/5">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-tennis-green to-tennis-green-light text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-4 tracking-tight">🎾 Tournaments</h1>
            <p className="text-xl text-black font-medium max-w-2xl mx-auto">
              Compete with the best players and showcase your skills on the court
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-tennis p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-tennis-green focus:border-transparent transition-all"
              >
                <option value="">All Status</option>
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
              <select
                value={filter.tournament_type}
                onChange={(e) => setFilter({ ...filter, tournament_type: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-tennis-green focus:border-transparent transition-all"
              >
                <option value="">All Formats</option>
                <option value="knockout">🏆 Knockout</option>
                <option value="round_robin">🔄 Round Robin</option>
                <option value="league">📊 League</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tournaments Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-tennis-green border-t-transparent"></div>
            <p className="mt-4 text-gray-600 text-lg">Loading tournaments...</p>
          </div>
        ) : tournaments.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-tennis">
            <div className="text-6xl mb-4">🎾</div>
            <p className="text-gray-600 text-lg">No tournaments found</p>
            <p className="text-gray-500 text-sm mt-2">Check back later for upcoming competitions</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
            {tournaments.map((tournament) => (
              <div
                key={tournament.id}
                onClick={() => handleTournamentSelect(tournament)}
                className="bg-white rounded-2xl shadow-tennis hover:shadow-tennis-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:-translate-y-1"
              >
                <div className="h-2 bg-gradient-to-r from-tennis-green to-tennis-green-light"></div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(tournament.status)}`}>
                      {tournament.status.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-500 font-medium">
                      👥 {tournament.participant_count || 0} players
                    </span>
                  </div>
                  
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-3xl">{getTournamentIcon(tournament.tournament_type)}</span>
                    <h3 className="text-xl font-bold text-gray-900 flex-1">{tournament.name}</h3>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[40px]">
                    {tournament.description || 'Join this exciting tournament and compete for glory!'}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">📅 Start Date</span>
                      <span className="font-medium text-gray-900">
                        {new Date(tournament.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">🎯 Format</span>
                      <span className="font-medium text-gray-900 capitalize">
                        {tournament.tournament_type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="text-sm">
                      <span className="text-gray-500">Entry Fee</span>
                      <p className="font-bold text-tennis-green text-lg">{tournament.entry_fee} KES</p>
                    </div>
                    {tournament.prize_money > 0 && (
                      <div className="text-sm text-right">
                        <span className="text-gray-500">Prize Pool</span>
                        <p className="font-bold text-tennis-clay text-lg">{tournament.prize_money} KES</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tournament Details Modal */}
        {selectedTournament && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-gradient-to-r from-tennis-green to-tennis-green-light text-white p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{getTournamentIcon(selectedTournament.tournament_type)}</span>
                    <div>
                      <h2 className="text-3xl font-bold">{selectedTournament.name}</h2>
                      <p className="text-green-100 text-sm mt-1">
                        {selectedTournament.location || 'EPIC TENNIS ACADEMY Courts'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedTournament(null)}
                    className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-8 space-y-6">
                {/* Bracket Toggle Button */}
                <button
                  onClick={() => setShowBracket(!showBracket)}
                  className="w-full py-4 px-6 bg-gradient-to-r from-tennis-green to-tennis-green-light text-white rounded-xl font-semibold hover:shadow-tennis-lg transition-all transform hover:scale-[1.02] shadow-md"
                >
                  {showBracket ? '📋 Hide Tournament Bracket' : '🏆 View Tournament Bracket'}
                </button>

                {/* Bracket Display */}
                {showBracket && (
                  <div className="p-6 bg-gradient-to-br from-gray-50 to-green-50 rounded-xl border-2 border-green-100 shadow-inner">
                    <TournamentBracket tournamentId={selectedTournament.id} />
                  </div>
                )}

                {/* Tournament Details Grid */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-5 border border-blue-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700 font-semibold text-sm">📊 Status</span>
                      <span className={`px-4 py-1.5 text-xs font-bold rounded-full ${getStatusColor(selectedTournament.status)}`}>
                        {selectedTournament.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-5 border border-purple-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700 font-semibold text-sm">🎯 Format</span>
                      <span className="font-bold text-gray-900 capitalize text-sm">
                        {selectedTournament.tournament_type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-5 border border-green-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700 font-semibold text-sm">📅 Start Date</span>
                      <span className="font-bold text-gray-900 text-sm">
                        {new Date(selectedTournament.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-5 border border-orange-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700 font-semibold text-sm">🏁 End Date</span>
                      <span className="font-bold text-gray-900 text-sm">
                        {new Date(selectedTournament.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-tennis-green/20 to-tennis-green-light/20 rounded-xl p-5 border-2 border-tennis-green/30 shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-800 font-semibold text-sm">💰 Entry Fee</span>
                      <span className="font-bold text-tennis-green text-2xl">{selectedTournament.entry_fee} KES</span>
                    </div>
                  </div>

                  {selectedTournament.prize_money > 0 && (
                    <div className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl p-5 border-2 border-yellow-300 shadow-md">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-800 font-semibold text-sm">🏆 Prize Pool</span>
                        <span className="font-bold text-orange-600 text-2xl">{selectedTournament.prize_money} KES</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description Section */}
                {selectedTournament.description && (
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-sm">
                    <h4 className="font-bold text-gray-900 mb-3 text-lg flex items-center gap-2">
                      <span className="text-2xl">📝</span>
                      About This Tournament
                    </h4>
                    <p className="text-gray-700 leading-relaxed">{selectedTournament.description}</p>
                  </div>
                )}

                {/* Participants Section */}
                <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200 shadow-sm">
                  <h4 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
                    <span className="text-2xl">👥</span>
                    Participants
                    <span className="ml-auto bg-tennis-green text-white px-3 py-1 rounded-full text-sm font-bold">
                      {participants.length}
                    </span>
                  </h4>
                  {participants.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-2">
                      {participants.map((participant) => (
                        <div key={participant.id} className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow border border-gray-200">
                          <div className="w-12 h-12 bg-gradient-to-br from-tennis-green to-tennis-green-light text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md">
                            {participant.user?.full_name?.[0] || participant.user?.username?.[0] || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">
                              {participant.user?.full_name || participant.user?.username}
                            </p>
                            {participant.seed_number && (
                              <p className="text-xs text-tennis-green font-medium">Seed #{participant.seed_number}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-white rounded-xl border-2 border-dashed border-gray-300">
                      <div className="text-4xl mb-2">🎾</div>
                      <p className="text-gray-500 font-medium">No participants yet. Be the first to join!</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4 border-t-2 border-gray-200">
                  {isAuthenticated && user?.role === 'player' && (selectedTournament.status === 'upcoming' || selectedTournament.status === 'draft') && (
                    <button
                      onClick={() => handleJoinTournament(selectedTournament.id)}
                      disabled={isParticipant()}
                      className={`flex-1 py-4 px-6 rounded-xl font-bold text-lg transition-all shadow-md ${
                        isParticipant()
                          ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          : 'bg-gradient-to-r from-tennis-green to-tennis-green-light text-white hover:shadow-tennis-lg transform hover:scale-[1.02] hover:shadow-xl'
                      }`}
                    >
                      {isParticipant() ? '✅ Already Registered' : '🎾 Register for Tournament'}
                    </button>
                  )}
                  {!isAuthenticated && (selectedTournament.status === 'upcoming' || selectedTournament.status === 'draft') && (
                    <button
                      onClick={() => alert('Please login to register for tournaments')}
                      className="flex-1 py-4 px-6 bg-gradient-to-r from-tennis-green to-tennis-green-light text-white rounded-xl font-bold text-lg hover:shadow-tennis-lg transition-all transform hover:scale-[1.02] shadow-md"
                    >
                      🎾 Login to Register
                    </button>
                  )}
                  {isAuthenticated && user?.role !== 'player' && (selectedTournament.status === 'upcoming' || selectedTournament.status === 'draft') && (
                    <div className="flex-1 py-4 px-6 bg-gray-100 text-gray-600 rounded-xl font-semibold text-center border-2 border-gray-300">
                      ℹ️ Only players can register for tournaments
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedTournament(null)}
                    className="px-8 py-4 bg-gray-200 text-gray-800 rounded-xl font-bold hover:bg-gray-300 transition-all shadow-md hover:shadow-lg"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💳</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Complete Your Payment</h3>
              <p className="text-gray-600 mt-2">Tournament Entry Fee: <span className="font-bold text-green-600 text-xl">{selectedTournament?.entry_fee || 0} KES</span></p>
            </div>
            
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
              <p className="font-bold text-blue-800 mb-3">📱 Payment Steps for M-Pesa:</p>
              <ol className="text-sm text-blue-700 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="font-bold">1.</span> Go to <strong>M-Pesa</strong> on your phone
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">2.</span> Select <strong>Pay Bill</strong>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">3.</span> Enter Business Number: <strong className="text-blue-900">0738839851</strong>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">4.</span> Enter Amount: <strong className="text-blue-900">{selectedTournament?.entry_fee || 0}</strong> KES
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">5.</span> Enter your account number (any)
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">6.</span> Complete payment and enter the <strong>Transaction Reference</strong> below
                </li>
              </ol>
            </div>
            
            <form onSubmit={handlePaymentSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  💰 Select Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentForm({ ...paymentForm, paymentMethod: 'mpesa' })}
                    className={`py-3 px-4 rounded-xl font-bold border-2 transition-all ${
                      paymentForm.paymentMethod === 'mpesa' 
                        ? 'bg-green-500 text-white border-green-500' 
                        : 'bg-white text-gray-700 border-gray-300 hover:border-green-500'
                    }`}
                  >
                    📱 M-Pesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentForm({ ...paymentForm, paymentMethod: 'card' })}
                    className={`py-3 px-4 rounded-xl font-bold border-2 transition-all ${
                      paymentForm.paymentMethod === 'card' 
                        ? 'bg-blue-500 text-white border-blue-500' 
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                    }`}
                  >
                    💳 Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentForm({ ...paymentForm, paymentMethod: 'bank' })}
                    className={`py-3 px-4 rounded-xl font-bold border-2 transition-all ${
                      paymentForm.paymentMethod === 'bank' 
                        ? 'bg-purple-500 text-white border-purple-500' 
                        : 'bg-white text-gray-700 border-gray-300 hover:border-purple-500'
                    }`}
                  >
                    🏦 Bank
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentForm({ ...paymentForm, paymentMethod: 'cash' })}
                    className={`py-3 px-4 rounded-xl font-bold border-2 transition-all ${
                      paymentForm.paymentMethod === 'cash' 
                        ? 'bg-orange-500 text-white border-orange-500' 
                        : 'bg-white text-gray-700 border-gray-300 hover:border-orange-500'
                    }`}
                  >
                    💵 Cash
                  </button>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  {paymentForm.paymentMethod === 'mpesa' ? '📱 M-Pesa Phone Number Used' : '📞 Contact Phone Number'}
                </label>
                <input
                  type="tel"
                  value={paymentForm.phone}
                  onChange={(e) => setPaymentForm({ ...paymentForm, phone: e.target.value })}
                  placeholder={paymentForm.paymentMethod === 'mpesa' ? "e.g., 254712345678" : "Your phone number"}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Phone number you used to make the M-Pesa payment</p>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  🔢 M-Pesa Transaction Reference
                </label>
                <input
                  type="text"
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                  placeholder="e.g., MPE123456789"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg font-mono"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">The confirmation message you received from M-Pesa</p>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-6 py-4 bg-gray-200 text-gray-800 rounded-xl font-bold hover:bg-gray-300 transition-all text-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!paymentForm.paymentMethod || !paymentForm.phone || !paymentForm.reference}
                  className="flex-1 px-6 py-4 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-all text-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  ✅ Submit Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tournaments;
