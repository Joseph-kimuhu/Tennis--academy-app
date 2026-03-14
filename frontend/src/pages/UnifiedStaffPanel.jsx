import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';

function UnifiedStaffPanel() {
  const { user, isAdmin, isCoach, updateUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [userFilter, setUserFilter] = useState('all');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [courts, setCourts] = useState([]);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerStats, setPlayerStats] = useState(null);
  const [statsForm, setStatsForm] = useState({
    wins: 0,
    losses: 0,
    ranking_points: 0,
    skill_level: 'beginner',
    serves: 0, aces: 0, double_faults: 0, first_serve_percentage: 0,
    second_serve_points_won: 0, break_points_saved: 0, break_points_faced: 0,
    total_games: 0, total_sets: 0, total_matches: 0, winning_streak: 0,
    losing_streak: 0, longest_win_streak: 0, longest_lose_streak: 0, coach_notes: ''
  });
  const [savingStats, setSavingStats] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', priority: 'normal' });
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);
  const [loading, setLoading] = useState(true);
  const [systemSettings, setSystemSettings] = useState({
    max_booking_duration: 2,
    advance_booking_days: 7,
    max_participants: 32,
    auto_approve: true
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Utility functions
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const [showEditUser, setShowEditUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showAddCourt, setShowAddCourt] = useState(false);
  const [showEditCourt, setShowEditCourt] = useState(false);
  const [editingCourt, setEditingCourt] = useState(null);
  const [showAddTournament, setShowAddTournament] = useState(false);
  const [showEditTournament, setShowEditTournament] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);
  const [showAddMatch, setShowAddMatch] = useState(false);
  const [showTournamentMatches, setShowTournamentMatches] = useState(false);
  const [showTournamentRegistrations, setShowTournamentRegistrations] = useState(false);
  const [tournamentRegistrations, setTournamentRegistrations] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [tournamentMatches, setTournamentMatches] = useState([]);
  const [tournamentParticipants, setTournamentParticipants] = useState([]);
  const [newMatch, setNewMatch] = useState({
    player1_id: '',
    player2_id: '',
    tournament_id: '',
    scheduled_time: '',
    court_id: '',
    round: '1'
  });
  const [showAddBooking, setShowAddBooking] = useState(false);
    const [newCourt, setNewCourt] = useState({
    name: '',
    club_id: '',
    court_type: 'hard',
    is_indoor: false,
    description: '',
    price_per_hour: 0,
    location: '',
    image_url: '',
    image_file: null
  });
  const [newTournament, setNewTournament] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
    registration_deadline: '',
    max_participants: 16,
    entry_fee: 0,
    prize_money: 0,
    tournament_type: 'knockout'
  });
  const [newBooking, setNewBooking] = useState({
    user_id: '',
    court_id: '',
    start_time: '',
    end_time: '',
    notes: ''
  });

  // Coaches get full admin access
  const hasFullAccess = isAdmin || isCoach;

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAdmin || isCoach) {
      fetchData();
    }
  }, [isAdmin, isCoach]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData, bookingsData, tournamentsData, courtsData, announcementsData, notificationsData] = await Promise.all([
        api.getAdminStats().catch(() => ({ totalUsers: 0, totalBookings: 0, activeTournaments: 0, totalCourts: 0, totalTournaments: 0 })),
        api.getAllUsers({ limit: 20 }),
        api.getAllBookings({ limit: 200 }),
        api.getAllTournaments({ limit: 10 }),
        api.getCourts({ limit: 10 }).catch(() => []),
        api.getAnnouncements({ active_only: true, limit: 20 }).catch(() => []),
        api.getNotifications({ limit: 20 }).catch(() => [])
      ]);
      
      // Fetch player statistics for all players and merge with user data
      const playersWithStats = await Promise.all(
        (usersData || []).map(async (user) => {
          if (user.role === 'player') {
            try {
              const playerStats = await api.getPlayerStatistics(user.id);
              if (playerStats) {
                return {
                  ...user,
                  ranking_points: playerStats.ranking_points || user.ranking_points || 0,
                  wins: playerStats.wins || user.wins || 0,
                  losses: playerStats.losses || user.losses || 0,
                  skill_level: playerStats.skill_level || user.skill_level || 'beginner'
                };
              }
            } catch (e) {
              console.log('No stats for player:', user.id);
            }
          }
          return user;
        })
      );
      
      setStats(statsData);
      setUsers(playersWithStats || []);
      setBookings(bookingsData || []);
      setTournaments(tournamentsData || []);
      setCourts(courtsData || []);
      setAnnouncements(announcementsData || []);
      setNotifications(notificationsData || []);
      
      // Load system settings
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../firebase');
        const settingsSnap = await getDoc(doc(db, 'system_settings', 'config'));
        if (settingsSnap.exists()) {
          setSystemSettings(settingsSnap.data());
        }
      } catch (e) {
        console.log('No system settings found, using defaults');
      }
    } catch (error) {
      console.error('Error fetching staff data:', error);
    }
    setLoading(false);
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      // Save system settings to Firestore
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      await setDoc(doc(db, 'system_settings', 'config'), systemSettings, { merge: true });
      
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings: ' + error.message);
    }
    setSavingSettings(false);
  };

  const handleSelectPlayer = async (player) => {
    setSelectedPlayer(player);
    try {
      const stats = await api.getPlayerStats(player.id).catch(() => null);
      if (stats) {
        setPlayerStats(stats);
        setStatsForm({
          wins: stats.wins || player.wins || 0,
          losses: stats.losses || player.losses || 0,
          ranking_points: stats.ranking_points || player.ranking_points || 0,
          skill_level: stats.skill_level || player.skill_level || 'beginner',
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
        setPlayerStats(null);
        setStatsForm({
          wins: player.wins || 0,
          losses: player.losses || 0,
          ranking_points: player.ranking_points || 0,
          skill_level: player.skill_level || 'beginner',
          serves: 0, aces: 0, double_faults: 0, first_serve_percentage: 0,
          second_serve_points_won: 0, break_points_saved: 0, break_points_faced: 0,
          total_games: 0, total_sets: 0, total_matches: 0, winning_streak: 0,
          losing_streak: 0, longest_win_streak: 0, longest_lose_streak: 0, coach_notes: ''
        });
      }
      setShowStatsModal(true);
    } catch (error) {
      console.error('Error fetching player stats:', error);
      setShowStatsModal(true);
    }
  };

  const handleSaveStats = async (e) => {
    e.preventDefault();
    setSavingStats(true);
    try {
      console.log('Saving stats for player:', selectedPlayer?.id, statsForm);
      await api.updatePlayerStatistics(selectedPlayer.id, statsForm);
      
      // Also update the user's document with wins, losses, ranking_points, skill_level
      const userUpdates = {};
      if (statsForm.total_matches !== undefined) userUpdates.matches = statsForm.total_matches;
      if (statsForm.wins !== undefined) userUpdates.wins = statsForm.wins;
      if (statsForm.losses !== undefined) userUpdates.losses = statsForm.losses;
      if (statsForm.ranking_points !== undefined) userUpdates.ranking_points = statsForm.ranking_points;
      if (statsForm.skill_level) userUpdates.skill_level = statsForm.skill_level;
      
      if (Object.keys(userUpdates).length > 0) {
        await api.updateProfile({ id: selectedPlayer.id, ...userUpdates });
      }
      
      setShowStatsModal(false);
      alert('Player statistics saved successfully!');
      fetchData(); // Refresh the players list
    } catch (error) {
      console.error('Error saving player stats:', error);
      alert('Failed to save player statistics: ' + error.message);
    }
    setSavingStats(false);
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementForm.title || !announcementForm.content) {
      alert('Please fill in all fields');
      return;
    }
    setSendingAnnouncement(true);
    try {
      // Create the announcement
      await api.createAnnouncement(announcementForm);
      
      // Get all players and create notifications for each
      const players = users.filter(u => u.role === 'player');
      for (const player of players) {
        await api.createNotification(player.id, announcementForm.title, announcementForm.content, 'announcement');
      }
      
      setShowAnnouncementModal(false);
      setAnnouncementForm({ title: '', content: '', priority: 'normal' });
      alert('Announcement sent to all players!');
      fetchData(); // Refresh announcements
    } catch (error) {
      console.error('Error creating announcement:', error);
      alert('Failed to create announcement: ' + error.message);
    }
    setSendingAnnouncement(false);
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await api.deleteAnnouncement(announcementId);
      setAnnouncements((prev) => prev.filter((a) => a.id !== announcementId));
      alert('Announcement deleted successfully');
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert('Failed to delete announcement: ' + (error.message || 'Unknown error'));
    }
  };

  const setActiveUserFilter = (filter) => {
    setUserFilter(filter);
  };

  const toggleUserStatus = async (userId, isActive) => {
    try {
      await api.updateUserStatus(userId, isActive);
      fetchData(); // Refresh data
    } catch (error) {
      alert('Failed to update user status: ' + (error.message || 'Unknown error'));
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      await api.updateUserRole(userId, newRole);
      fetchData(); // Refresh data
    } catch (error) {
      alert('Failed to update user role: ' + (error.message || 'Unknown error'));
    }
  };

  const deleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    try {
      await api.deleteUser(userId);
      fetchData(); // Refresh data
    } catch (error) {
      alert('Failed to delete user: ' + (error.message || 'Unknown error'));
    }
  };

  const startEditUser = (user) => {
    setEditingUser({
      id: user.id,
      email: user.email,
      username: user.username,
      full_name: user.full_name || '',
      role: user.role
    });
    setShowEditUser(true);
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      await api.updateUser(editingUser.id, {
        email: editingUser.email,
        username: editingUser.username,
        full_name: editingUser.full_name,
        role: editingUser.role
      });
      alert('User updated successfully!');
      setShowEditUser(false);
      setEditingUser(null);
      fetchData();
    } catch (error) {
      alert('Failed to update user: ' + (error.message || 'Unknown error'));
    }
  };

  
  const handleCreateCourt = async (e) => {
    e.preventDefault();
    try {
      let courtData = {
        ...newCourt,
        club_id: newCourt.club_id ? parseInt(newCourt.club_id, 10) : null,
        price_per_hour: parseFloat(newCourt.price_per_hour)
      };

      // Handle image upload if present
      if (newCourt.image_file) {
        const formData = new FormData();
        formData.append('file', newCourt.image_file);
        
        try {
          const uploadResponse = await fetch('/api/upload/court-image', {
            method: 'POST',
            body: formData
          });
          
          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json();
            courtData.image_url = uploadResult.image_url;
          }
        } catch (uploadError) {
          console.warn('Image upload failed, creating court without image:', uploadError);
        }
      }

      // Remove file from data before sending to API
      delete courtData.image_file;

      await api.createCourt(courtData);
      alert('Court created successfully!');
      setShowAddCourt(false);
      setNewCourt({ 
        name: '', 
        club_id: '', 
        court_type: 'hard', 
        is_indoor: false, 
        description: '', 
        price_per_hour: 0, 
        location: '', 
        image_url: '',
        image_file: null 
      });
      fetchData();
    } catch (error) {
      alert('Failed to create court: ' + (error.message || 'Unknown error'));
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPG, PNG, etc.)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image file must be less than 5MB');
        return;
      }

      setNewCourt({ ...newCourt, image_file: file });
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewCourt(prev => ({ ...prev, image_url: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateTournament = async (e) => {
    e.preventDefault();
    try {
      const tournamentData = {
        ...newTournament,
        start_date: newTournament.start_date ? new Date(newTournament.start_date).toISOString() : null,
        end_date: newTournament.end_date ? new Date(newTournament.end_date).toISOString() : null,
        registration_deadline: newTournament.registration_deadline ? new Date(newTournament.registration_deadline).toISOString() : null,
        max_participants: parseInt(newTournament.max_participants),
        entry_fee: parseFloat(newTournament.entry_fee),
        prize_money: parseFloat(newTournament.prize_money)
      };
      await api.createTournament(tournamentData);
      alert('Tournament created successfully!');
      setShowAddTournament(false);
      setNewTournament({ name: '', description: '', start_date: '', end_date: '', location: '', registration_deadline: '', max_participants: 16, entry_fee: 0, prize_money: 0, tournament_type: 'knockout' });
      fetchData();
    } catch (error) {
      alert('Failed to create tournament: ' + (error.message || 'Unknown error'));
    }
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    try {
      const bookingData = {
        ...newBooking,
        user_id: parseInt(newBooking.user_id),
        court_id: parseInt(newBooking.court_id),
        start_time: new Date(newBooking.start_time).toISOString(),
        end_time: new Date(newBooking.end_time).toISOString()
      };
      await api.createBooking(bookingData);
      alert('Booking created successfully!');
      setShowAddBooking(false);
      setNewBooking({ user_id: '', court_id: '', start_time: '', end_time: '', notes: '' });
      fetchData();
    } catch (error) {
      alert('Failed to create booking: ' + (error.message || 'Unknown error'));
    }
  };

  const handleApproveBookingPayment = async (bookingId) => {
    try {
      await api.approveBookingPayment(bookingId);
      alert('Payment approved successfully!');
      fetchData();
    } catch (error) {
      alert('Failed to approve payment: ' + (error.message || 'Unknown error'));
    }
  };

  const handleRejectBookingPayment = async (bookingId) => {
    if (!confirm('Reject this payment? The player can resubmit.')) {
      return;
    }
    try {
      await api.rejectBookingPayment(bookingId);
      alert('Payment rejected.');
      fetchData();
    } catch (error) {
      alert('Failed to reject payment: ' + (error.message || 'Unknown error'));
    }
  };

  const publishTournament = async (tournamentId) => {
    if (!confirm('Are you sure you want to publish this tournament? It will become visible to all players.')) {
      return;
    }
    try {
      await api.publishTournament(tournamentId);
      alert('Tournament published successfully!');
      fetchData();
    } catch (error) {
      alert('Failed to publish tournament: ' + (error.message || 'Unknown error'));
    }
  };

  const toggleCourtStatus = async (courtId, isAvailable) => {
    try {
      await api.updateCourtStatus(courtId, isAvailable);
      fetchData();
    } catch (error) {
      alert('Failed to update court status: ' + (error.message || 'Unknown error'));
    }
  };

  const deleteCourt = async (courtId) => {
    if (!confirm('Are you sure you want to delete this court? This action cannot be undone and will affect all future bookings.')) {
      return;
    }
    try {
      await api.deleteCourt(courtId);
      alert('Court deleted successfully!');
      fetchData();
    } catch (error) {
      alert('Failed to delete court: ' + (error.message || 'Unknown error'));
    }
  };

  const startEditCourt = (court) => {
    setEditingCourt({
      id: court.id,
      name: court.name,
      club_id: court.club_id || '',
      court_type: court.court_type || 'hard',
      is_indoor: court.is_indoor || false,
      description: court.description || '',
      price_per_hour: court.price_per_hour || 0,
      location: court.location || '',
      image_url: court.image_url || ''
    });
    setShowEditCourt(true);
  };

  const handleEditCourt = async (e) => {
    e.preventDefault();
    try {
      let courtData = {
        ...editingCourt,
        club_id: editingCourt.club_id ? parseInt(editingCourt.club_id, 10) : null,
        price_per_hour: parseFloat(editingCourt.price_per_hour)
      };

      await api.updateCourt(editingCourt.id, courtData);
      alert('Court updated successfully!');
      setShowEditCourt(false);
      setEditingCourt(null);
      fetchData();
    } catch (error) {
      alert('Failed to update court: ' + (error.message || 'Unknown error'));
    }
  };

  const startEditTournament = (tournament) => {
    setEditingTournament({
      id: tournament.id,
      name: tournament.name,
      description: tournament.description || '',
      start_date: tournament.start_date ? new Date(tournament.start_date).toISOString().split('T')[0] : '',
      end_date: tournament.end_date ? new Date(tournament.end_date).toISOString().split('T')[0] : '',
      location: tournament.location || '',
      registration_deadline: tournament.registration_deadline ? new Date(tournament.registration_deadline).toISOString().split('T')[0] : '',
      max_participants: tournament.max_participants || 16,
      entry_fee: tournament.entry_fee || 0,
      prize_money: tournament.prize_money || 0,
      tournament_type: tournament.tournament_type || 'knockout'
    });
    setShowEditTournament(true);
  };

  const handleEditTournament = async (e) => {
    e.preventDefault();
    try {
      const tournamentData = {
        ...editingTournament,
        start_date: editingTournament.start_date ? new Date(editingTournament.start_date).toISOString() : null,
        end_date: editingTournament.end_date ? new Date(editingTournament.end_date).toISOString() : null,
        registration_deadline: editingTournament.registration_deadline ? new Date(editingTournament.registration_deadline).toISOString() : null,
        max_participants: parseInt(editingTournament.max_participants),
        entry_fee: parseFloat(editingTournament.entry_fee),
        prize_money: parseFloat(editingTournament.prize_money)
      };

      await api.updateTournament(editingTournament.id, tournamentData);
      alert('Tournament updated successfully!');
      setShowEditTournament(false);
      setEditingTournament(null);
      fetchData();
    } catch (error) {
      alert('Failed to update tournament: ' + (error.message || 'Unknown error'));
    }
  };

  const deleteTournament = async (tournamentId) => {
    if (!confirm('Are you sure you want to delete this tournament? This action cannot be undone.')) {
      return;
    }
    try {
      await api.deleteTournament(tournamentId);
      alert('Tournament deleted successfully!');
      fetchData();
    } catch (error) {
      alert('Failed to delete tournament: ' + (error.message || 'Unknown error'));
    }
  };

  const completeTournament = async (tournamentId) => {
    if (!confirm('Are you sure you want to mark this tournament as completed? This will end the tournament.')) {
      return;
    }
    try {
      await api.completeTournament(tournamentId);
      alert('Tournament completed successfully!');
      fetchData();
    } catch (error) {
      alert('Failed to complete tournament: ' + (error.message || 'Unknown error'));
    }
  };

  const startAddMatch = async (tournament) => {
    // First check if there are players registered for this tournament
    try {
      const participants = await api.getTournamentParticipants(tournament.id);
      // Filter for approved players (payment has been approved by admin)
      const approvedPlayers = participants.filter(p => p.status === 'approved');
      
      if (approvedPlayers.length < 2) {
        alert('You need at least 2 players with approved payments to create a match.\n\nCurrent approved players: ' + approvedPlayers.length + '\n\nPlayers must first register and have their payment approved before matches can be created.');
        return;
      }
      
      setSelectedTournament(tournament);
      setTournamentParticipants(approvedPlayers);
      setNewMatch({
        player1_id: '',
        player2_id: '',
        tournament_id: tournament.id,
        scheduled_time: '',
        court_id: '',
        round: '1'
      });
      setShowAddMatch(true);
    } catch (error) {
      console.error('Error checking registrations:', error);
      alert('Failed to check tournament registrations. Please try again.');
    }
  };

  const viewTournamentRegistrations = async (tournament) => {
    try {
      const registrations = await api.getTournamentParticipants(tournament.id);
      // Get user details for each registration
      const registrationsWithDetails = await Promise.all(
        registrations.map(async (reg) => {
          try {
            const userDoc = await api.getUser(reg.user_id);
            return {
              ...reg,
              user: userDoc
            };
          } catch (e) {
            return { ...reg, user: { username: 'Unknown', email: '' } };
          }
        })
      );
      setTournamentRegistrations(registrationsWithDetails);
      setSelectedTournament(tournament);
      setShowTournamentRegistrations(true);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      alert('Failed to load tournament registrations');
    }
  };

  const handleApproveTournamentPayment = async (registrationId) => {
    try {
      await api.approveTournamentRegistration(registrationId);
      alert('Payment approved successfully!');
      // Refresh registrations
      if (selectedTournament) {
        viewTournamentRegistrations(selectedTournament);
      }
    } catch (error) {
      alert('Failed to approve payment: ' + (error.message || 'Unknown error'));
    }
  };

  const handleRejectTournamentPayment = async (registrationId) => {
    if (!confirm('Are you sure you want to reject this payment? This will remove the player from the tournament.')) {
      return;
    }
    try {
      await api.rejectTournamentRegistration(registrationId);
      alert('Payment rejected and registration removed.');
      // Refresh registrations
      if (selectedTournament) {
        viewTournamentRegistrations(selectedTournament);
      }
    } catch (error) {
      alert('Failed to reject payment: ' + (error.message || 'Unknown error'));
    }
  };

  const handleCreateMatch = async (e) => {
    e.preventDefault();
    try {
      const matchData = {
        ...newMatch,
        scheduled_time: new Date(newMatch.scheduled_time).toISOString()
      };
      await api.createMatch(matchData);
      alert('Match created successfully!');
      setShowAddMatch(false);
      setNewMatch({
        player1_id: '',
        player2_id: '',
        tournament_id: '',
        scheduled_time: '',
        court_id: '',
        round: '1'
      });
      fetchData();
    } catch (error) {
      alert('Failed to create match: ' + (error.message || 'Unknown error'));
    }
  };

  const viewTournamentMatches = async (tournament) => {
    try {
      console.log('Opening matches for tournament:', tournament.name);
      const matches = await api.getTournamentMatches(tournament.id);
      setTournamentMatches(matches);
      setSelectedTournament(tournament);
      setShowTournamentMatches(true);
    } catch (error) {
      console.error('Error in viewTournamentMatches:', error);
      
      // More specific error messages
      if (error.code === 'permission-denied') {
        alert('Permission denied. Please make sure Firebase security rules are deployed correctly.');
      } else if (error.message) {
        alert('Failed to load tournament matches: ' + error.message);
      } else {
        alert('Failed to load tournament matches. Please try again.');
      }
    }
  };

  if (!isAdmin && !isCoach) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl"></span>
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
                Staff Management Panel
              </h1>
              <p className="text-green-100">
                {isAdmin ? 'Administrator Access' : 'Coach Access (Full Admin Privileges)'}
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <button
                onClick={fetchData}
                className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/30 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-8 overflow-hidden">
          <div className="flex overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'players', label: 'Players' },
              { id: 'announcements', label: 'Announcements' },
              { id: 'users', label: 'Users' },
              { id: 'bookings', label: 'Bookings' },
              { id: 'tournaments', label: 'Tournaments' },
              { id: 'courts', label: 'Courts' },
              { id: 'coaching', label: 'Coaching' },
              { id: 'system', label: 'System' }
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
                    <span className="text-3xl"></span>
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

          {activeTab === 'players' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Player Management</h2>
              <p className="text-gray-600 mb-6">Manage and view all players in the system</p>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="pb-3 font-semibold text-gray-900">Player</th>
                      <th className="pb-3 font-semibold text-gray-900">Skill Level</th>
                      <th className="pb-3 font-semibold text-gray-900">Points</th>
                      <th className="pb-3 font-semibold text-gray-900">W/L</th>
                      <th className="pb-3 font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.filter(u => u.role === 'player').map((player) => (
                      <tr key={player.id} className="border-b border-gray-100">
                        <td className="py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                              {player.username?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{player.username}</p>
                              <p className="text-sm text-gray-500">{player.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-700 capitalize font-medium">
                            {player.skill_level || 'beginner'}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className="font-bold text-green-600">{player.ranking_points || 0}</span>
                        </td>
                        <td className="py-4">
                          <span className="text-green-600 font-medium">{player.wins || 0}</span>
                          <span className="text-gray-400 mx-1">/</span>
                          <span className="text-red-600 font-medium">{player.losses || 0}</span>
                        </td>
                        <td className="py-4">
                        <button
                          onClick={() => handleSelectPlayer(player)}
                          className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors"
                        >
                          Stats
                        </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.filter(u => u.role === 'player').length === 0 && (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">🎾</span>
                    </div>
                    <p className="text-gray-500">No players found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Messages tab removed to disable in-app staff messaging */}

          {activeTab === 'announcements' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Announcements</h2>
                <button
                  onClick={() => setShowAnnouncementModal(true)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium shadow-md"
                >
                  + New Announcement
                </button>
              </div>
              <div className="space-y-4">
                {announcements.length > 0 ? announcements.map((announcement) => (
                  <div key={announcement.id} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg">{announcement.title}</h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeleteAnnouncement(announcement.id)}
                          className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                        <span className={`px-3 py-1 text-xs rounded-full ${
                          announcement.priority === 'urgent' ? 'bg-red-100 text-red-800' : 
                          announcement.priority === 'high' ? 'bg-orange-100 text-orange-800' : 
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {announcement.priority || 'normal'}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-2">{announcement.content}</p>
                    <p className="text-xs text-gray-400">
                      Posted: {announcement.created_at ? new Date(announcement.created_at).toLocaleDateString() : 'Recently'}
                    </p>
                  </div>
                )) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl"></span>
                    </div>
                    <p className="text-gray-500">No announcements yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">All Users</h2>
              <div className="mb-6 flex flex-wrap gap-3">
                <button
                  onClick={() => setActiveUserFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    userFilter === 'all' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  All Users
                </button>
                <button
                  onClick={() => setActiveUserFilter('player')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    userFilter === 'player' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Players
                </button>
                <button
                  onClick={() => setActiveUserFilter('coach')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    userFilter === 'coach' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Coaches
                </button>
                <button
                  onClick={() => setActiveUserFilter('admin')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    userFilter === 'admin' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Admins
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="pb-3 font-semibold text-gray-900">User</th>
                      <th className="pb-3 font-semibold text-gray-900">Email</th>
                      <th className="pb-3 font-semibold text-gray-900">Role</th>
                      <th className="pb-3 font-semibold text-gray-900">Status</th>
                      <th className="pb-3 font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users
                      .filter(user => userFilter === 'all' || user.role === userFilter)
                      .map((user) => (
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
                            user.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.is_active !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-4">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => startEditUser(user)}
                              className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                              Edit
                            </button>
                            {hasFullAccess && (
                              <>
                                <button 
                                  onClick={() => {
                                    const newRole = user.role === 'player' ? 'coach' : user.role === 'coach' ? 'admin' : 'player';
                                    updateUserRole(user.id, newRole);
                                  }}
                                  className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
                                >
                                  Role
                                </button>
                                <button 
                                  onClick={() => toggleUserStatus(user.id, !user.is_active)}
                                  className="px-3 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600"
                                >
                                  {user.is_active !== false ? 'Disable' : 'Enable'}
                                </button>
                                <button 
                                  onClick={() => deleteUser(user.id)}
                                  className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                                >
                                  Delete
                                </button>
                              </>
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

          {activeTab === 'bookings' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">All Bookings</h2>
                <button
                  onClick={() => setShowAddBooking(true)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
                >
                  + Add Booking
                </button>
              </div>
              <div className="space-y-4">
                {bookings.map((booking) => {
                  const paymentStatus = booking.payment_status || 'unpaid';
                  return (
                    <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-semibold">{booking.court?.name || 'Court Booking'}</p>
                          <p className="text-gray-600">User: {booking.user?.username}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(booking.start_time).toLocaleDateString()} at{' '}
                            {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {booking.payment_method && (
                            <p className="text-sm text-gray-500">Method: {booking.payment_method}</p>
                          )}
                          {booking.payment_phone && (
                            <p className="text-sm text-gray-500">Phone: {booking.payment_phone}</p>
                          )}
                          {booking.payment_reference && (
                            <p className="text-sm text-gray-500">Ref: {booking.payment_reference}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 text-sm rounded-full ${
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                            booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {booking.status}
                          </span>
                          <span className={`px-3 py-1 text-sm rounded-full ml-2 ${
                            paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                            paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            paymentStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {paymentStatus}
                          </span>
                          <p className="text-lg font-bold text-green-600 mt-2">{booking.court?.price_per_hour} KES</p>
                        </div>
                      </div>
                      {booking.status !== 'cancelled' && (
                        <div className="flex gap-2 mt-4">
                          {paymentStatus === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApproveBookingPayment(booking.id)}
                                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectBookingPayment(booking.id)}
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {paymentStatus === 'unpaid' && (
                            <span className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-700">
                              Awaiting Payment
                            </span>
                          )}
                          {paymentStatus === 'rejected' && (
                            <span className="px-3 py-1 text-sm rounded-full bg-red-100 text-red-800">
                              Payment Rejected
                            </span>
                          )}
                          <button
                            onClick={() => api.cancelBooking(booking.id).then(fetchData)}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm"
                          >
                            Cancel Booking
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'tournaments' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">All Tournaments</h2>
                <button
                  onClick={() => setShowAddTournament(true)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
                >
                  + Add Tournament
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tournaments.map((tournament) => (
                  <div key={tournament.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold">{tournament.name}</h3>
                      <span className={`px-3 py-1 text-sm rounded-full ${
                        tournament.status === 'active' ? 'bg-green-100 text-green-800' : 
                        tournament.status === 'completed' ? 'bg-gray-100 text-gray-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {tournament.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4">{tournament.description}</p>
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Start Date</p>
                        <p className="font-medium">{new Date(tournament.start_date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Participants</p>
                        <p className="font-medium">{tournament.participant_count || 0} players</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                    <div className="flex gap-2">
                      {tournament.status === 'draft' && (
                        <button
                          onClick={() => publishTournament(tournament.id)}
                          className="flex-1 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                        >
                          Publish Tournament
                        </button>
                      )}
                      <button 
                        onClick={() => startEditTournament(tournament)}
                        className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                      >
                        Edit
                      </button>
                      {tournament.status === 'active' && (
                        <button 
                          onClick={() => completeTournament(tournament.id)}
                          className="flex-1 px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
                        >
                          Complete
                        </button>
                      )}
                      {(tournament.status === 'draft' || tournament.status === 'active' || tournament.status === 'completed') && (
                        <button 
                          onClick={() => deleteTournament(tournament.id)}
                          className="flex-1 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {tournament.status === 'active' && (
                        <button 
                          onClick={() => startAddMatch(tournament)}
                          className="flex-1 px-3 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 text-sm"
                        >
                          + Add Match
                        </button>
                      )}
                      {(tournament.status === 'active' || tournament.status === 'completed') && (
                        <button 
                          onClick={() => viewTournamentMatches(tournament)}
                          className="flex-1 px-3 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 text-sm"
                        >
                          View Matches
                        </button>
                      )}
                      {(tournament.status === 'draft' || tournament.status === 'active') && (
                        <button 
                          onClick={() => viewTournamentRegistrations(tournament)}
                          className="flex-1 px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm"
                        >
                          📋 Registrations
                        </button>
                      )}
                    </div>
                  </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'courts' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Court Management</h2>
                <button
                  onClick={() => setShowAddCourt(true)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
                >
                  + Add Court
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courts.map((court) => (
                  <div key={court.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold">{court.name}</h3>
                      <span className={`px-3 py-1 text-sm rounded-full ${
                        court.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {court.is_available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    {court.image_url && (
                      <div className="mb-4">
                        <img 
                          src={court.image_url} 
                          alt={court.name}
                          className="w-full h-40 object-cover rounded-lg"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <p><strong>Type:</strong> <span className="capitalize">{court.court_type}</span></p>
                      <p><strong>Location:</strong> {court.is_indoor ? '🏠 Indoor' : '☀️ Outdoor'}</p>
                      {court.location && <p><strong>Address:</strong> {court.location}</p>}
                      <p><strong>Price:</strong> {court.price_per_hour} KES/hour</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => startEditCourt(court)}
                        className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => toggleCourtStatus(court.id, !court.is_available)}
                        className="flex-1 px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm"
                      >
                        {court.is_available ? 'Close' : 'Open'}
                      </button>
                      <button 
                        onClick={() => deleteCourt(court.id)}
                        className="flex-1 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'coaching' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Coaching Management</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Coaching Sessions */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Recent Coaching Sessions</h3>
                  <div className="space-y-3">
                    {bookings.slice(0, 5).map((booking) => (
                      <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{booking.user?.username || 'Player'}</p>
                            <p className="text-sm text-gray-500">{booking.court?.name || 'Court'}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(booking.start_time).toLocaleDateString()} at{' '}
                              {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <span className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            {booking.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Coach Performance */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Coach Performance</h3>
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-3xl">👥</span>
                        <span className="text-sm text-blue-600 font-bold">Total</span>
                      </div>
                      <p className="text-3xl font-bold text-blue-600">{users.filter(u => u.role === 'player').length}</p>
                      <p className="text-gray-600">Active Players</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-3xl">📅</span>
                        <span className="text-sm text-green-600 font-bold">This Month</span>
                      </div>
                      <p className="text-3xl font-bold text-green-600">{bookings.length}</p>
                      <p className="text-gray-600">Sessions</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-3xl">⭐</span>
                        <span className="text-sm text-purple-600 font-bold">Average</span>
                      </div>
                      <p className="text-3xl font-bold text-purple-600">4.8</p>
                      <p className="text-gray-600">Player Rating</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">System Management</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Courts</span>
                      <span className="font-medium">{courts.length}</span>
                    </div>
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">User Distribution</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Players</span>
                      <span className="font-medium">{users.filter(u => u.role === 'player').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Coaches</span>
                      <span className="font-medium">{users.filter(u => u.role === 'coach').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Admins</span>
                      <span className="font-medium">{users.filter(u => u.role === 'admin').length}</span>
                    </div>
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button 
                      onClick={() => alert('Report generation coming soon!')}
                      className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Generate Report
                    </button>
                    <button 
                      onClick={() => alert('Database backup coming soon!')}
                      className="w-full px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                    >
                      Backup Database
                    </button>
                    <button 
                      onClick={() => alert('Data sync coming soon!')}
                      className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                    >
                      Sync Data
                    </button>
                  </div>
                </div>
              </div>

              {/* System Settings */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">System Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Booking Settings</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Max booking duration</span>
                        <select 
                          className="px-3 py-1 border border-gray-300 rounded text-sm"
                          value={systemSettings.max_booking_duration}
                          onChange={(e) => setSystemSettings({...systemSettings, max_booking_duration: parseInt(e.target.value) })}
                        >
                          <option value={2}>2 hours</option>
                          <option value={3}>3 hours</option>
                          <option value={4}>4 hours</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Advance booking days</span>
                        <input 
                          type="number" 
                          className="px-3 py-1 border border-gray-300 rounded text-sm w-20" 
                          value={systemSettings.advance_booking_days}
                          onChange={(e) => setSystemSettings({...systemSettings, advance_booking_days: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Tournament Settings</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Max participants</span>
                        <input 
                          type="number" 
                          className="px-3 py-1 border border-gray-300 rounded text-sm w-20" 
                          value={systemSettings.max_participants}
                          onChange={(e) => setSystemSettings({...systemSettings, max_participants: parseInt(e.target.value) })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Auto-approve</span>
                        <input 
                          type="checkbox" 
                          className="w-4 h-4"
                          checked={systemSettings.auto_approve}
                          onChange={(e) => setSystemSettings({...systemSettings, auto_approve: e.target.checked })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <button 
                    onClick={handleSaveSettings}
                    disabled={savingSettings}
                    className="px-6 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50"
                  >
                    {savingSettings ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      
      {/* Edit User Modal */}
      {showEditUser && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit User</h2>
            <form onSubmit={handleEditUser}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editingUser.full_name}
                    onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={editingUser.username}
                    onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="player">Player</option>
                    <option value="coach">Coach</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditUser(false);
                    setEditingUser(null);
                  }}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600"
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Court Modal */}
      {showAddCourt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full max-h-screen overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Court</h2>
            <form onSubmit={handleCreateCourt}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Court Name *</label>
                  <input
                    type="text"
                    required
                    value={newCourt.name}
                    onChange={(e) => setNewCourt({ ...newCourt, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., Center Court 1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Court Type *</label>
                  <select
                    value={newCourt.court_type}
                    onChange={(e) => setNewCourt({ ...newCourt, court_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="hard">Hard Court</option>
                    <option value="clay">Clay Court</option>
                    <option value="grass">Grass Court</option>
                    <option value="carpet">Carpet Court</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={newCourt.location}
                    onChange={(e) => setNewCourt({ ...newCourt, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., Main Building, Floor 2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price per Hour (KES) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={newCourt.price_per_hour}
                    onChange={(e) => setNewCourt({ ...newCourt, price_per_hour: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., 500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newCourt.description}
                    onChange={(e) => setNewCourt({ ...newCourt, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    rows="3"
                    placeholder="Court description and features..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Court Image</label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    />
                    <p className="text-xs text-gray-500">Upload a photo of the court (JPG, PNG, max 5MB)</p>
                    
                    {/* Image Preview */}
                    {newCourt.image_url && (
                      <div className="mt-3">
                        <img
                          src={newCourt.image_url}
                          alt="Court preview"
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                        <p className="text-xs text-green-600 mt-1">✓ Image selected</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_indoor"
                    checked={newCourt.is_indoor}
                    onChange={(e) => setNewCourt({ ...newCourt, is_indoor: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="is_indoor" className="text-sm font-medium text-gray-700">
                    Indoor Court
                  </label>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddCourt(false)}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600"
                >
                  Add Court
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Court Modal */}
      {showEditCourt && editingCourt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full max-h-screen overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Court</h2>
            <form onSubmit={handleEditCourt}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Court Name *</label>
                  <input
                    type="text"
                    required
                    value={editingCourt.name}
                    onChange={(e) => setEditingCourt({ ...editingCourt, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., Center Court 1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Court Type *</label>
                  <select
                    value={editingCourt.court_type}
                    onChange={(e) => setEditingCourt({ ...editingCourt, court_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="hard">Hard Court</option>
                    <option value="clay">Clay Court</option>
                    <option value="grass">Grass Court</option>
                    <option value="carpet">Carpet Court</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <select
                    value={editingCourt.is_indoor ? 'indoor' : 'outdoor'}
                    onChange={(e) => setEditingCourt({ ...editingCourt, is_indoor: e.target.value === 'indoor' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="outdoor">☀️ Outdoor</option>
                    <option value="indoor">🏠 Indoor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={editingCourt.location}
                    onChange={(e) => setEditingCourt({ ...editingCourt, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., 123 Main St, City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price per Hour (KES) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="100"
                    value={editingCourt.price_per_hour}
                    onChange={(e) => setEditingCourt({ ...editingCourt, price_per_hour: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., 1000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={editingCourt.description}
                    onChange={(e) => setEditingCourt({ ...editingCourt, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    rows={3}
                    placeholder="e.g., Premium hard court with professional lighting"
                  />
                </div>
                {editingCourt.image_url && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Image</label>
                    <div className="relative">
                      <img 
                        src={editingCourt.image_url} 
                        alt="Current court image"
                        className="w-full h-32 object-cover rounded-lg"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (optional)</label>
                  <input
                    type="url"
                    value={editingCourt.image_url || ''}
                    onChange={(e) => setEditingCourt({ ...editingCourt, image_url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="https://example.com/court-image.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter a URL to update the court image</p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditCourt(false)}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600"
                >
                  Update Court
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Tournament Modal */}
      {showAddTournament && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full max-h-screen overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Tournament</h2>
            <form onSubmit={handleCreateTournament}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tournament Name *</label>
                  <input
                    type="text"
                    required
                    value={newTournament.name}
                    onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., Summer Championship 2024"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newTournament.description}
                    onChange={(e) => setNewTournament({ ...newTournament, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    rows="3"
                    placeholder="Tournament description..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={newTournament.location}
                    onChange={(e) => setNewTournament({ ...newTournament, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., Tennis Club Main Courts"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                    <input
                      type="date"
                      required
                      value={newTournament.start_date}
                      onChange={(e) => setNewTournament({ ...newTournament, start_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={newTournament.end_date}
                      onChange={(e) => setNewTournament({ ...newTournament, end_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Deadline</label>
                  <input
                    type="date"
                    value={newTournament.registration_deadline}
                    onChange={(e) => setNewTournament({ ...newTournament, registration_deadline: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants</label>
                    <input
                      type="number"
                      min="2"
                      value={newTournament.max_participants}
                      onChange={(e) => setNewTournament({ ...newTournament, max_participants: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Entry Fee (KES)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newTournament.entry_fee}
                      onChange={(e) => setNewTournament({ ...newTournament, entry_fee: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prize Money (KES)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newTournament.prize_money}
                    onChange={(e) => setNewTournament({ ...newTournament, prize_money: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tournament Type</label>
                  <select
                    value={newTournament.tournament_type}
                    onChange={(e) => setNewTournament({ ...newTournament, tournament_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="knockout">Knockout</option>
                    <option value="round_robin">Round Robin</option>
                    <option value="league">League</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddTournament(false)}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600"
                >
                  Add Tournament
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Tournament Modal */}
      {showEditTournament && editingTournament && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full max-h-screen overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Tournament</h2>
            <form onSubmit={handleEditTournament}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tournament Name *</label>
                  <input
                    type="text"
                    required
                    value={editingTournament.name}
                    onChange={(e) => setEditingTournament({ ...editingTournament, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., Summer Championship 2024"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={editingTournament.description}
                    onChange={(e) => setEditingTournament({ ...editingTournament, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    rows={3}
                    placeholder="Tournament description and details"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                  <input
                    type="text"
                    required
                    value={editingTournament.location}
                    onChange={(e) => setEditingTournament({ ...editingTournament, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., John Tennis Academy"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                    <input
                      type="date"
                      required
                      value={editingTournament.start_date}
                      onChange={(e) => setEditingTournament({ ...editingTournament, start_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                    <input
                      type="date"
                      required
                      value={editingTournament.end_date}
                      onChange={(e) => setEditingTournament({ ...editingTournament, end_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Deadline</label>
                  <input
                    type="date"
                    value={editingTournament.registration_deadline}
                    onChange={(e) => setEditingTournament({ ...editingTournament, registration_deadline: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants</label>
                    <input
                      type="number"
                      min="2"
                      value={editingTournament.max_participants}
                      onChange={(e) => setEditingTournament({ ...editingTournament, max_participants: parseInt(e.target.value) || 16 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Entry Fee (KES)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editingTournament.entry_fee}
                      onChange={(e) => setEditingTournament({ ...editingTournament, entry_fee: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prize Money (KES)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingTournament.prize_money}
                    onChange={(e) => setEditingTournament({ ...editingTournament, prize_money: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tournament Type</label>
                  <select
                    value={editingTournament.tournament_type}
                    onChange={(e) => setEditingTournament({ ...editingTournament, tournament_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="knockout">Knockout</option>
                    <option value="round_robin">Round Robin</option>
                    <option value="league">League</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditTournament(false)}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600"
                >
                  Update Tournament
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Booking Modal */}
      {showAddBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full max-h-screen overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Booking</h2>
            <form onSubmit={handleCreateBooking}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User *</label>
                  <select
                    required
                    value={newBooking.user_id}
                    onChange={(e) => setNewBooking({ ...newBooking, user_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select User</option>
                    {users.filter(u => u.role === 'player').map(user => (
                      <option key={user.id} value={user.id}>
                        {user.username} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Court *</label>
                  <select
                    required
                    value={newBooking.court_id}
                    onChange={(e) => setNewBooking({ ...newBooking, court_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select Court</option>
                    {courts.filter(c => c.is_available).map(court => (
                      <option key={court.id} value={court.id}>
                        {court.name} - {court.price_per_hour} KES/hr
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                    <input
                      type="datetime-local"
                      required
                      value={newBooking.start_time}
                      onChange={(e) => setNewBooking({ ...newBooking, start_time: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                    <input
                      type="datetime-local"
                      required
                      value={newBooking.end_time}
                      onChange={(e) => setNewBooking({ ...newBooking, end_time: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={newBooking.notes}
                    onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    rows="3"
                    placeholder="Booking notes..."
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddBooking(false)}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600"
                >
                  Add Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Match Modal */}
      {showAddMatch && selectedTournament && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full max-h-screen overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Match - {selectedTournament.name}</h2>
            <form onSubmit={handleCreateMatch}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Player 1 *</label>
                  <select
                    required
                    value={newMatch.player1_id}
                    onChange={(e) => setNewMatch({ ...newMatch, player1_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select Player 1</option>
                    {tournamentParticipants.map(player => (
                      <option key={player.user_id} value={player.user_id}>{player.username}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Player 2 *</label>
                  <select
                    required
                    value={newMatch.player2_id}
                    onChange={(e) => setNewMatch({ ...newMatch, player2_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select Player 2</option>
                    {tournamentParticipants.map(player => (
                      <option key={player.user_id} value={player.user_id}>{player.username}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Round</label>
                  <select
                    value={newMatch.round}
                    onChange={(e) => setNewMatch({ ...newMatch, round: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="1">Round 1</option>
                    <option value="2">Round 2</option>
                    <option value="3">Round 3</option>
                    <option value="4">Semi-Final</option>
                    <option value="5">Final</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Court *</label>
                  <select
                    required
                    value={newMatch.court_id}
                    onChange={(e) => setNewMatch({ ...newMatch, court_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select Court</option>
                    {courts.filter(c => c.is_available).map(court => (
                      <option key={court.id} value={court.id}>{court.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={newMatch.scheduled_time}
                    onChange={(e) => setNewMatch({ ...newMatch, scheduled_time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddMatch(false)}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600"
                >
                  Create Match
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Tournament Matches Modal */}
      {showTournamentMatches && selectedTournament && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Matches - {selectedTournament.name}</h2>
              <button
                onClick={() => setShowTournamentMatches(false)}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              {tournamentMatches.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No matches created yet for this tournament.</p>
                  <button
                    onClick={() => {
                      setShowTournamentMatches(false);
                      startAddMatch(selectedTournament);
                    }}
                    className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    Create First Match
                  </button>
                </div>
              ) : (
                tournamentMatches.map((match) => (
                  <div key={match.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">Round {match.round}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(match.scheduled_time).toLocaleDateString()} at{' '}
                          {new Date(match.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 text-sm rounded-full ${
                          match.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          match.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {match.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <p className="font-medium">{match.player1?.username || 'Player 1'}</p>
                          <p className="text-sm text-gray-500">vs</p>
                          <p className="font-medium">{match.player2?.username || 'Player 2'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Court: {match.court?.name || 'TBD'}</p>
                        {match.winner_id && (
                          <p className="text-sm font-medium text-green-600">
                            Winner: {match.winner_id === match.player1_id ? match.player1?.username : match.player2?.username}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tournament Registrations Modal */}
      {showTournamentRegistrations && selectedTournament && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Registrations - {selectedTournament.name}
              </h2>
              <button
                onClick={() => setShowTournamentRegistrations(false)}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200"
              >
                ✕
              </button>
            </div>
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>💡 Instructions:</strong> Review player registrations below. Approve payments for players who have submitted payment. Only players with approved payments can participate in tournament matches.
              </p>
            </div>
            <div className="space-y-4">
              {tournamentRegistrations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">👥</div>
                  <p className="text-gray-500 text-lg">No players have registered for this tournament yet.</p>
                  <p className="text-gray-400 text-sm mt-2">Players can register from the Tournaments page.</p>
                </div>
              ) : (
                tournamentRegistrations.map((reg) => (
                  <div key={reg.id} className={`border-2 rounded-xl p-4 ${
                    reg.payment_status === 'paid' ? 'border-green-300 bg-green-50' : 
                    reg.payment_status === 'pending' ? 'border-orange-300 bg-orange-50' : 
                    'border-blue-300 bg-blue-50'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-tennis-green to-tennis-green-light text-white rounded-full flex items-center justify-center font-bold text-lg">
                          {reg.user?.username?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-lg">{reg.user?.username || 'Unknown Player'}</p>
                          <p className="text-sm text-gray-500">{reg.user?.email || ''}</p>
                          <p className="text-xs text-gray-400">
                            Registered: {reg.registered_at ? (typeof reg.registered_at === 'object' && reg.registered_at.toDate ? reg.registered_at.toDate().toLocaleDateString() : new Date(reg.registered_at).toLocaleDateString()) : 'Just now'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-4 py-2 text-sm font-bold rounded-full ${
                          reg.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 
                          reg.payment_status === 'pending' ? 'bg-orange-100 text-orange-800' : 
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {reg.payment_status === 'paid' ? '✅ Approved' : 
                           reg.payment_status === 'pending' ? '⏳ Pending' : 
                           '📝 Not Paid'}
                        </span>
                      </div>
                    </div>
                    {(reg.payment_status === 'pending' || reg.payment_status === 'pending_payment' || !reg.payment_status || reg.payment_status === '') && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        {reg.payment_status === 'pending' || reg.payment_status === 'pending_payment' ? (
                          <>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">Payment Method</p>
                                <p className="font-medium">{reg.payment_method || 'Not specified'}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Phone</p>
                                <p className="font-medium">{reg.payment_phone || 'Not specified'}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-gray-500">Transaction Reference</p>
                                <p className="font-medium">{reg.payment_reference || 'Not specified'}</p>
                              </div>
                            </div>
                            <div className="flex gap-3 mt-4">
                              <button
                                onClick={() => handleApproveTournamentPayment(reg.id)}
                                className="flex-1 py-2 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600"
                              >
                                ✅ Approve Payment
                              </button>
                              <button
                                onClick={() => handleRejectTournamentPayment(reg.id)}
                                className="flex-1 py-2 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600"
                              >
                                ❌ Reject Payment
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-blue-700 mb-3">
                              📝 Player registered but hasn't submitted payment details yet.
                            </p>
                            <div className="flex gap-3">
                              <button
                                onClick={() => handleApproveTournamentPayment(reg.id)}
                                className="flex-1 py-2 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600"
                              >
                                ✅ Approve Anyway
                              </button>
                              <button
                                onClick={() => handleRejectTournamentPayment(reg.id)}
                                className="flex-1 py-2 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600"
                              >
                                ❌ Reject
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                    {reg.payment_status === 'paid' && (
                      <div className="mt-4 pt-4 border-t border-green-200">
                        <p className="text-sm text-green-700">
                          ✓ Payment approved. This player is eligible to participate in tournament matches.
                        </p>
                      </div>
                    )}
                    {!reg.payment_status && (
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <p className="text-sm text-blue-700">
                          📝 Player has registered but has not submitted payment yet. Ask them to complete payment.
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            {tournamentRegistrations.length > 0 && (
              <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                <div className="flex justify-between text-sm flex-wrap gap-2">
                  <span className="text-gray-600">Total: <strong>{tournamentRegistrations.length}</strong></span>
                  <span className="text-green-600">✅ Approved: <strong>{tournamentRegistrations.filter(r => r.payment_status === 'paid').length}</strong></span>
                  <span className="text-orange-600">⏳ Pending: <strong>{tournamentRegistrations.filter(r => r.payment_status === 'pending').length}</strong></span>
                  <span className="text-blue-600">📝 Not Paid: <strong>{tournamentRegistrations.filter(r => !r.payment_status || (r.payment_status !== 'paid' && r.payment_status !== 'pending')).length}</strong></span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Message modal removed – staff messaging disabled */}

      {/* Stats Modal */}
      {showStatsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Player Statistics</h3>
                <p className="text-sm text-gray-500">{selectedPlayer?.username}</p>
              </div>
              <button
                onClick={() => setShowStatsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveStats}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Wins</label>
                  <input
                    type="number"
                    value={statsForm.wins}
                    onChange={(e) => setStatsForm({ ...statsForm, wins: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Losses</label>
                  <input
                    type="number"
                    value={statsForm.losses}
                    onChange={(e) => setStatsForm({ ...statsForm, losses: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Ranking Points</label>
                  <input
                    type="number"
                    value={statsForm.ranking_points}
                    onChange={(e) => setStatsForm({ ...statsForm, ranking_points: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Skill Level</label>
                  <select
                    value={statsForm.skill_level}
                    onChange={(e) => setStatsForm({ ...statsForm, skill_level: e.target.value })}
                    className="w-full p-2 border rounded-lg text-sm"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="professional">Professional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Serves</label>
                  <input
                    type="number"
                    value={statsForm.serves}
                    onChange={(e) => setStatsForm({ ...statsForm, serves: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Aces</label>
                  <input
                    type="number"
                    value={statsForm.aces}
                    onChange={(e) => setStatsForm({ ...statsForm, aces: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Double Faults</label>
                  <input
                    type="number"
                    value={statsForm.double_faults}
                    onChange={(e) => setStatsForm({ ...statsForm, double_faults: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">First Serve %</label>
                  <input
                    type="number"
                    value={statsForm.first_serve_percentage}
                    onChange={(e) => setStatsForm({ ...statsForm, first_serve_percentage: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">2nd Serve Won %</label>
                  <input
                    type="number"
                    value={statsForm.second_serve_points_won}
                    onChange={(e) => setStatsForm({ ...statsForm, second_serve_points_won: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Break Pts Saved</label>
                  <input
                    type="number"
                    value={statsForm.break_points_saved}
                    onChange={(e) => setStatsForm({ ...statsForm, break_points_saved: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Break Pts Faced</label>
                  <input
                    type="number"
                    value={statsForm.break_points_faced}
                    onChange={(e) => setStatsForm({ ...statsForm, break_points_faced: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Total Games</label>
                  <input
                    type="number"
                    value={statsForm.total_games}
                    onChange={(e) => setStatsForm({ ...statsForm, total_games: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Total Sets</label>
                  <input
                    type="number"
                    value={statsForm.total_sets}
                    onChange={(e) => setStatsForm({ ...statsForm, total_sets: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Total Matches</label>
                  <input
                    type="number"
                    value={statsForm.total_matches}
                    onChange={(e) => setStatsForm({ ...statsForm, total_matches: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Winning Streak</label>
                  <input
                    type="number"
                    value={statsForm.winning_streak}
                    onChange={(e) => setStatsForm({ ...statsForm, winning_streak: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Losing Streak</label>
                  <input
                    type="number"
                    value={statsForm.losing_streak}
                    onChange={(e) => setStatsForm({ ...statsForm, losing_streak: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Coach Notes</label>
                <textarea
                  value={statsForm.coach_notes}
                  onChange={(e) => setStatsForm({ ...statsForm, coach_notes: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Add notes about this player's performance..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowStatsModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingStats}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium disabled:opacity-50"
                >
                  {savingStats ? 'Saving...' : 'Save Statistics'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">New Announcement</h3>
              <button
                onClick={() => setShowAnnouncementModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">This announcement will be sent to ALL players as a notification.</p>
            <form onSubmit={handleCreateAnnouncement}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Announcement title"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={announcementForm.priority}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, priority: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={announcementForm.content}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  rows="4"
                  placeholder="Write your announcement..."
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAnnouncementModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingAnnouncement}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium disabled:opacity-50"
                >
                  {sendingAnnouncement ? 'Sending...' : 'Send to All Players'}
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
