// Firebase API Service for Lawn Tennis Academy
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  setDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../firebase';
import { updateEmail, updatePassword, updateProfile, signInWithEmailAndPassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

class FirebaseApiService {
  // Helper to get current user ID
  getCurrentUserId() {
    return auth.currentUser?.uid;
  }

  // Helper to convert Firestore Timestamp to ISO string
  convertTimestamp(timestamp) {
    if (!timestamp) return null;
    if (timestamp.toDate) {
      return timestamp.toDate().toISOString();
    }
    if (timestamp instanceof Date) {
      return timestamp.toISOString();
    }
    return timestamp;
  }

  // Helper to sanitize data - convert any timestamps to strings
  sanitizeData(data) {
    if (!data) return data;
    if (typeof data !== 'object') return data;
    
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === 'object' && value.toDate) {
        // It's a Firestore Timestamp
        sanitized[key] = this.convertTimestamp(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => this.sanitizeData(item));
      } else if (typeof value === 'object') {
        sanitized[key] = this.sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  // ==================== USERS ====================
  
    
  async getMe() {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');
    
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) throw new Error('User not found');
    
    return { id: userDoc.id, ...userDoc.data() };
  }

  async getAllUsers(params = {}) {
    const { limit: limitCount = 50 } = params;
    
    // Get all users and sort in JavaScript (avoids index requirement)
    const q = query(collection(db, 'users'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Sort by username
    users.sort((a, b) => (a.username || '').localeCompare(b.username || ''));
    
    return users;
  }

  async updateUserStatus(userId, isActive) {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      is_active: isActive,
      updatedAt: serverTimestamp()
    });
    
    const updatedDoc = await getDoc(userRef);
    return { id: updatedDoc.id, ...updatedDoc.data() };
  }

  async updateUserRole(userId, newRole) {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role: newRole,
      updatedAt: serverTimestamp()
    });
    
    const updatedDoc = await getDoc(userRef);
    return { id: updatedDoc.id, ...updatedDoc.data() };
  }

  async deleteUser(userId) {
    await deleteDoc(doc(db, 'users', userId));
    return true;
  }

  async getUser(userId) {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) throw new Error('User not found');
    return { id: userDoc.id, ...userDoc.data() };
  }

  async getPlayers(params = {}) {
    const { limit: limitCount = 50, skill_level, search } = params;
    
    // Get all users and filter in JavaScript (avoids index requirement)
    const q = query(
      collection(db, 'users'),
      orderBy('ranking_points', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    let players = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Filter to show all users who are not coaches or admins (players and unknown roles)
    players = players.filter(p => p.role !== 'coach' && p.role !== 'admin');
    
    // Filter by skill level if provided
    if (skill_level) {
      players = players.filter(p => p.skill_level === skill_level);
    }
    
    // Filter by search if provided
    if (search) {
      const searchLower = search.toLowerCase();
      players = players.filter(p => 
        p.username?.toLowerCase().includes(searchLower) ||
        p.email?.toLowerCase().includes(searchLower)
      );
    }
    
    return players;
  }

  async getCoaches() {
    // Get all users and filter by role in JavaScript (avoids index requirement)
    const q = query(
      collection(db, 'users'),
      orderBy('ranking_points', 'desc'),
      limit(50)
    );
    
    const querySnapshot = await getDocs(q);
    const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Filter to only coaches
    return users.filter(p => p.role === 'coach');
  }

  async updateUser(userId, userData) {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...userData,
      updatedAt: serverTimestamp()
    });
    
    const updatedDoc = await getDoc(userRef);
    return { id: updatedDoc.id, ...updatedDoc.data() };
  }

  async updateProfile(userData) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');
    
    const firebaseUser = auth.currentUser;
    
    // Update Firebase Auth profile (display name)
    if (userData.username && firebaseUser) {
      await updateProfile(firebaseUser, {
        displayName: userData.username
      });
    }
    
    // Update email if provided
    if (userData.email && firebaseUser && userData.email !== firebaseUser.email) {
      await updateEmail(firebaseUser, userData.email);
    }
    
    // Update Firestore user document (except password)
    const { password, ...dataWithoutPassword } = userData;
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...dataWithoutPassword,
      updatedAt: serverTimestamp()
    });
    
    const updatedDoc = await getDoc(userRef);
    return { id: updatedDoc.id, ...updatedDoc.data() };
  }

  async changePassword(currentPassword, newPassword) {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) throw new Error('Not authenticated');
    
    // Validate current password is provided
    if (!currentPassword) {
      throw new Error('Please enter your current password');
    }
    
    try {
      // Try to re-authenticate user with current password
      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
    } catch (authError) {
      // If re-authentication fails, provide specific error message
      if (authError.code === 'auth/invalid-credential' || authError.code === 'auth/wrong-password' || authError.code === 'auth/invalid-email') {
        throw new Error('Current password is incorrect. Please verify your password and try again.');
      }
      // For other errors, log but continue (user is already authenticated)
      console.warn('Re-authentication note:', authError.message);
    }
    
    // Change the password
    await updatePassword(firebaseUser, newPassword);
    return true;
  }

  async uploadProfilePicture(file) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');
    
    // Upload to Firebase Storage
    const storageRef = ref(storage, `profile_pictures/${userId}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    // Update user document
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      profile_picture: downloadURL,
      updatedAt: serverTimestamp()
    });
    
    // Update Firebase Auth profile
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      await updateProfile(firebaseUser, {
        photoURL: downloadURL
      });
    }
    
    return downloadURL;
  }

  async getPlayerStatistics(playerId) {
    console.log('Getting player statistics for:', playerId);
    const statsDoc = await getDoc(doc(db, 'player_statistics', playerId));
    if (!statsDoc.exists()) {
      console.log('No stats found for player:', playerId);
      return null;
    }
    const stats = { id: statsDoc.id, ...statsDoc.data() };
    console.log('Stats retrieved:', stats);
    // Sanitize to convert any timestamps to strings
    return this.sanitizeData(stats);
  }

  async createPlayerStatistics(playerId, statsData) {
    const statsRef = doc(db, 'player_statistics', playerId);
    await setDoc(statsRef, {
      ...statsData,
      playerId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: statsRef.id, ...statsData };
  }

  async getPlayerStats(playerId) {
    const statsRef = doc(db, 'player_statistics', playerId);
    const statsDoc = await getDoc(statsRef);
    if (statsDoc.exists()) {
      return { id: statsDoc.id, ...statsDoc.data() };
    }
    return null;
  }

  async updatePlayerStatistics(playerId, statsData) {
    console.log('Updating player statistics for:', playerId, 'with data:', statsData);
    const statsRef = doc(db, 'player_statistics', playerId);
    const statsDoc = await getDoc(statsRef);
    
    if (statsDoc.exists()) {
      await updateDoc(statsRef, {
        ...statsData,
        updatedAt: serverTimestamp()
      });
    } else {
      await setDoc(statsRef, {
        ...statsData,
        playerId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    console.log('Stats updated successfully for:', playerId);
    return { id: playerId, ...statsData };
  }

  // ==================== COURTS ====================

  async getCourts(params = {}) {
    const { limit: limitCount = 100, club_id, court_type, available } = params;
    
    let constraints = [orderBy('name', 'asc'), limit(limitCount)];
    
    const querySnapshot = await getDocs(query(collection(db, 'courts'), ...constraints));
    let courts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Filter locally for complex conditions
    if (club_id) {
      courts = courts.filter(c => c.club_id === club_id);
    }
    if (court_type) {
      courts = courts.filter(c => c.court_type === court_type);
    }
    
    return courts;
  }

  async getCourt(courtId) {
    const courtDoc = await getDoc(doc(db, 'courts', courtId));
    if (!courtDoc.exists()) throw new Error('Court not found');
    return { id: courtDoc.id, ...courtDoc.data() };
  }

  async createCourt(courtData) {
    const docRef = await addDoc(collection(db, 'courts'), {
      ...courtData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...courtData };
  }

  async updateCourt(courtId, courtData) {
    const courtRef = doc(db, 'courts', courtId);
    await updateDoc(courtRef, {
      ...courtData,
      updatedAt: serverTimestamp()
    });
    const updatedDoc = await getDoc(courtRef);
    return { id: updatedDoc.id, ...updatedDoc.data() };
  }

  async deleteCourt(courtId) {
    await deleteDoc(doc(db, 'courts', courtId));
  }

  async updateCourtStatus(courtId, isAvailable) {
    const courtRef = doc(db, 'courts', courtId);
    await updateDoc(courtRef, {
      is_available: isAvailable,
      updatedAt: serverTimestamp()
    });
    const updatedDoc = await getDoc(courtRef);
    return { id: updatedDoc.id, ...updatedDoc.data() };
  }

  // ==================== BOOKINGS ====================

  async getMyBookings(params = {}) {
    const userId = this.getCurrentUserId();
    if (!userId) return [];

    const { limit: limitCount = 100 } = params;
    
    // Get all bookings for user and sort in JavaScript (avoids index requirement)
    const q = query(collection(db, 'bookings'), where('user_id', '==', userId), limit(100));
    
    const querySnapshot = await getDocs(q);
    const bookings = [];
    
    for (const docSnap of querySnapshot.docs) {
      const booking = { id: docSnap.id, ...docSnap.data() };
      if (booking.is_read === undefined) booking.is_read = false;
      if (booking.court_id) {
        const courtDoc = await getDoc(doc(db, 'courts', booking.court_id));
        if (courtDoc.exists()) {
          booking.court = { id: courtDoc.id, ...courtDoc.data() };
        }
      }
      bookings.push(booking);
    }
    
    return bookings.slice(0, limitCount);
  }

  subscribeToMyBookings(params = {}, callback) {
    const userId = this.getCurrentUserId();
    if (!userId) return () => {};

    const { limit: limitCount = 100 } = params;

    const q = query(collection(db, 'bookings'), where('user_id', '==', userId), limit(100));

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const bookings = [];
      for (const docSnap of querySnapshot.docs) {
        const booking = { id: docSnap.id, ...docSnap.data() };
        if (booking.is_read === undefined) booking.is_read = false;
        if (booking.court_id) {
          const courtDoc = await getDoc(doc(db, 'courts', booking.court_id));
          if (courtDoc.exists()) {
            booking.court = { id: courtDoc.id, ...courtDoc.data() };
          }
        }
        bookings.push(booking);
      }
      callback(bookings.slice(0, limitCount));
    });

    return unsubscribe;
  }

  async getAvailableSlots(courtId, date) {
    // Get all bookings for this court and filter in JavaScript (avoids index requirement)
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Get all bookings for this court
    const q = query(collection(db, 'bookings'), where('court_id', '==', courtId), limit(100));
    
    const querySnapshot = await getDocs(q);
    const bookings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Filter by date range and status in JavaScript
    return bookings.filter(b => {
      const bookingTime = new Date(b.start_time);
      return bookingTime >= startOfDay && 
             bookingTime <= endOfDay && 
             b.status === 'confirmed';
    });
  }

  async createBooking(bookingData) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');
    
    const docRef = await addDoc(collection(db, 'bookings'), {
      ...bookingData,
      user_id: userId,
      status: 'confirmed',
      payment_status: 'unpaid',
      payment_method: '',
      payment_phone: '',
      payment_reference: '',
      is_read: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { id: docRef.id, ...bookingData };
  }

  async updateBooking(bookingId, bookingData) {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      ...bookingData,
      updatedAt: serverTimestamp()
    });
    const updatedDoc = await getDoc(bookingRef);
    return { id: updatedDoc.id, ...updatedDoc.data() };
  }

  async cancelBooking(bookingId) {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      status: 'cancelled',
      updatedAt: serverTimestamp()
    });
  }

  async markBookingAsRead(bookingId) {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      is_read: true,
      updatedAt: serverTimestamp()
    });
  }

  async submitBookingPayment(bookingId, paymentMethod, paymentPhone, paymentReference) {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      payment_method: paymentMethod,
      payment_status: 'pending',
      payment_phone: paymentPhone,
      payment_reference: paymentReference,
      payment_submitted_at: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return true;
  }

  async approveBookingPayment(bookingId) {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      payment_status: 'paid',
      payment_confirmed_at: serverTimestamp(),
      status: 'confirmed',
      updatedAt: serverTimestamp()
    });
    return true;
  }

  async rejectBookingPayment(bookingId) {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      payment_status: 'rejected',
      payment_rejected_at: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return true;
  }

  async confirmBookingPayment(bookingId, paymentMethod, paymentPhone, paymentReference) {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {

      payment_status: 'pending',

      payment_method: paymentMethod,
      payment_status: 'paid',
      payment_phone: paymentPhone,
      payment_reference: paymentReference,
      payment_confirmed_at: null,
      status: 'pending_payment',
      updatedAt: serverTimestamp()
    });
    return true;
  }

  async approveBookingPayment(bookingId) {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      payment_status: 'paid',
      payment_confirmed_at: serverTimestamp(),
      status: 'confirmed',
      updatedAt: serverTimestamp()
    });
    return true;
  }

  async rejectBookingPayment(bookingId) {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      payment_status: 'rejected',
      payment_confirmed_at: null,
      status: 'payment_rejected',
      updatedAt: serverTimestamp()
    });
    return true;
  }

  async getAllBookings(params = {}) {
    const { limit: limitCount = 50 } = params;
    
    // Get all bookings and sort in JavaScript (avoids index requirement)
    const q = query(collection(db, 'bookings'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    const bookings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Get user and court details for each booking
    const detailedBookings = [];
    for (const booking of bookings) {
      if (booking.user_id) {
        const userDoc = await getDoc(doc(db, 'users', booking.user_id));
        if (userDoc.exists()) {
          booking.user = { id: userDoc.id, ...userDoc.data() };
        }
      }
      if (booking.court_id) {
        const courtDoc = await getDoc(doc(db, 'courts', booking.court_id));
        if (courtDoc.exists()) {
          booking.court = { id: courtDoc.id, ...courtDoc.data() };
        }
      }
      detailedBookings.push(booking);
    }
    
    // Sort by start time
    detailedBookings.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
    
    return detailedBookings;
  }

  async getAllTournaments(params = {}) {
    const { limit: limitCount = 50 } = params;
    
    // Get all tournaments and sort in JavaScript (avoids index requirement)
    const q = query(collection(db, 'tournaments'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    let tournaments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Get participant counts for each tournament in parallel (only approved registrations)
    const countPromises = tournaments.map(t => this.getApprovedParticipantCount(t.id));
    const counts = await Promise.all(countPromises);
    
    tournaments = tournaments.map((tournament, index) => ({
      ...tournament,
      participant_count: counts[index]
    }));
    
    // Sort by start date
    tournaments.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
    
    return tournaments;
  }

  // ==================== TOURNAMENTS ====================

  async getActiveTournaments() {
    // Get all tournaments and filter in JavaScript (avoids index requirement)
    const q = query(collection(db, 'tournaments'), limit(50));
    const querySnapshot = await getDocs(q);
    const now = new Date();
    let tournaments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Get participant counts for each tournament in parallel (only approved registrations)
    const countPromises = tournaments.map(t => this.getApprovedParticipantCount(t.id));
    const counts = await Promise.all(countPromises);
    
    tournaments = tournaments.map((tournament, index) => ({
      ...tournament,
      participant_count: counts[index]
    }));
    
    // Filter active tournaments (status = 'active' or 'draft' and start_date >= now)
    return tournaments.filter(t => 
      (t.status === 'active' || t.status === 'draft') && 
      new Date(t.start_date) >= now
    ).sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
  }

  async getApprovedParticipantCount(tournamentId) {
    try {
      // Use a simple query without compound where clauses to avoid index requirement
      const q = query(collection(db, 'tournament_registrations'), limit(500));
      const snapshot = await getDocs(q);
      const registrations = snapshot.docs.map(doc => doc.data());
      // Filter in JavaScript - only count approved registrations for this tournament
      return registrations.filter(r => r.tournament_id === tournamentId && r.status === 'approved').length;
    } catch (error) {
      console.error('Error getting participant count:', error);
      return 0;
    }
  }

  async getTournaments(params = {}) {
    const { limit: limitCount = 50, status } = params;
    
    // Get all tournaments and filter in JavaScript (avoids index requirement)
    const q = query(collection(db, 'tournaments'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    let tournaments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Filter by status
    if (status) {
      tournaments = tournaments.filter(t => t.status === status);
    }
    
    // Sort by start date
    tournaments.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
    
    return tournaments;
  }

  async getTournament(tournamentId) {
    const tournamentDoc = await getDoc(doc(db, 'tournaments', tournamentId));
    if (!tournamentDoc.exists()) throw new Error('Tournament not found');
    return { id: tournamentDoc.id, ...tournamentDoc.data() };
  }

  async createTournament(tournamentData) {
    const docRef = await addDoc(collection(db, 'tournaments'), {
      ...tournamentData,
      status: 'draft',
      participant_count: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...tournamentData };
  }

  async publishTournament(tournamentId) {
    const tournamentRef = doc(db, 'tournaments', tournamentId);
    await updateDoc(tournamentRef, {
      status: 'active',
      published_at: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return true;
  }

  async updateTournament(tournamentId, tournamentData) {
    const tournamentRef = doc(db, 'tournaments', tournamentId);
    await updateDoc(tournamentRef, {
      ...tournamentData,
      updatedAt: serverTimestamp()
    });
    const updatedDoc = await getDoc(tournamentRef);
    return { id: updatedDoc.id, ...updatedDoc.data() };
  }

  async deleteTournament(tournamentId) {
    await deleteDoc(doc(db, 'tournaments', tournamentId));
    return true;
  }

  async completeTournament(tournamentId) {
    const tournamentRef = doc(db, 'tournaments', tournamentId);
    await updateDoc(tournamentRef, {
      status: 'completed',
      completed_at: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return true;
  }

  async createMatch(matchData) {
    // Check if user is authenticated
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated. Please log in again.');
    }
    
    console.log('Creating match with user:', currentUser.email);
    console.log('Match data:', matchData);
    
    try {
      const docRef = await addDoc(collection(db, 'matches'), {
        ...matchData,
        status: 'scheduled',
        created_by: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('Match created successfully with ID:', docRef.id);
      return { id: docRef.id, ...matchData };
    } catch (error) {
      console.error('Error creating match:', error);
      throw error;
    }
  }

  async getTournamentMatches(tournamentId) {
    try {
      console.log('Fetching matches for tournament:', tournamentId);
      
      // Simple query without orderBy to avoid index issues
      const q = query(
        collection(db, 'matches'),
        where('tournament_id', '==', tournamentId)
      );
      const querySnapshot = await getDocs(q);
      const matches = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      console.log('Found matches:', matches.length);
      
      // Get player and court details for each match
      const detailedMatches = [];
      for (const match of matches) {
        const detailedMatch = { ...match };
        
        // Fetch player 1 details
        if (match.player1_id) {
          try {
            const player1Doc = await getDoc(doc(db, 'users', match.player1_id));
            if (player1Doc.exists()) {
              detailedMatch.player1 = { id: player1Doc.id, ...player1Doc.data() };
            }
          } catch (error) {
            console.warn('Error fetching player1:', error);
          }
        }
        
        // Fetch player 2 details
        if (match.player2_id) {
          try {
            const player2Doc = await getDoc(doc(db, 'users', match.player2_id));
            if (player2Doc.exists()) {
              detailedMatch.player2 = { id: player2Doc.id, ...player2Doc.data() };
            }
          } catch (error) {
            console.warn('Error fetching player2:', error);
          }
        }
        
        // Fetch court details
        if (match.court_id) {
          try {
            const courtDoc = await getDoc(doc(db, 'courts', match.court_id));
            if (courtDoc.exists()) {
              detailedMatch.court = { id: courtDoc.id, ...courtDoc.data() };
            }
          } catch (error) {
            console.warn('Error fetching court:', error);
          }
        }
        
        detailedMatches.push(detailedMatch);
      }
      
      return detailedMatches;
    } catch (error) {
      console.error('Error fetching tournament matches:', error);
      throw error;
    }
  }

  async registerForTournament(tournamentId) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');
    
    const tournamentRef = doc(db, 'tournaments', tournamentId);
    const tournamentDoc = await getDoc(tournamentRef);
    
    if (!tournamentDoc.exists()) throw new Error('Tournament not found');
    
    const tournamentData = tournamentDoc.data();
    
    // Check if user is already registered
    const existingRegistrationQuery = query(
      collection(db, 'tournament_registrations'),
      where('tournament_id', '==', tournamentId),
      where('user_id', '==', userId)
    );
    const existingRegistrationSnapshot = await getDocs(existingRegistrationQuery);
    
    if (!existingRegistrationSnapshot.empty) {
      throw new Error('You are already registered for this tournament');
    }
    
    // Get user info for notification
    const userDoc = await getDoc(doc(db, 'users', userId));
    const playerName = userDoc.exists() ? userDoc.data().username : 'A player';
    
    // Create tournament_registrations collection with pending payment
    const registrationRef = await addDoc(collection(db, 'tournament_registrations'), {
      tournament_id: tournamentId,
      user_id: userId,
      status: 'pending_payment',
      payment_status: 'unpaid',
      payment_method: '',
      payment_phone: '',
      payment_reference: '',
      registered_at: serverTimestamp()
    });
    
    // Notify coaches about new registration
    try {
      await this.notifyCoachesOfRegistration(playerName, tournamentData.name, registrationRef.id);
    } catch (e) {
      console.warn('Could not notify coaches:', e);
    }
  }

  async getTournamentParticipants(tournamentId) {
    // Get all registrations for this tournament
    const q = query(
      collection(db, 'tournament_registrations'),
      where('tournament_id', '==', tournamentId)
    );
    
    const snapshot = await getDocs(q);
    const registrations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (registrations.length === 0) return [];
    
    // Fetch all user details in parallel
    const userPromises = registrations.map(reg => 
      getDoc(doc(db, 'users', reg.user_id))
    );
    const userDocs = await Promise.all(userPromises);
    
    // Build the result array
    const participants = [];
    for (let i = 0; i < registrations.length; i++) {
      const reg = registrations[i];
      const userDoc = userDocs[i];
      if (userDoc && userDoc.exists()) {
        const userData = userDoc.data();
        const sanitizedReg = this.sanitizeData(reg);
        participants.push({
          id: sanitizedReg.id,
          user_id: sanitizedReg.user_id,
          username: userData.username,
          email: userData.email,
          full_name: userData.full_name || userData.username,
          status: sanitizedReg.status,
          payment_status: sanitizedReg.payment_status,
          payment_phone: sanitizedReg.payment_phone,
          payment_reference: sanitizedReg.payment_reference,
          registered_at: sanitizedReg.registered_at,
          user: { id: userDoc.id, ...userData }
        });
      }
    }
    
    return participants;
  }

  async confirmTournamentPayment(registrationId, paymentMethod, paymentPhone, paymentReference) {
    const registrationRef = doc(db, 'tournament_registrations', registrationId);
    await updateDoc(registrationRef, {
      payment_method: paymentMethod,
      payment_phone: paymentPhone,
      payment_reference: paymentReference,
      payment_status: 'pending',
      payment_submitted_at: serverTimestamp(),
      status: 'pending_payment'
    });
    return true;
  }

  // Submit payment intent - creates a pending registration that will be approved by admin
  async submitTournamentPaymentIntent(tournamentId, paymentMethod, paymentPhone, paymentReference) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');
    
    const tournamentRef = doc(db, 'tournaments', tournamentId);
    const tournamentDoc = await getDoc(tournamentRef);
    
    if (!tournamentDoc.exists()) throw new Error('Tournament not found');
    
    const tournamentData = tournamentDoc.data();
    
    // Check if user already has a pending payment for this tournament
    const existingQuery = query(
      collection(db, 'tournament_registrations'),
      where('tournament_id', '==', tournamentId),
      where('user_id', '==', userId)
    );
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      const existingReg = existingSnapshot.docs[0].data();
      // If already approved, user is already registered
      if (existingReg.status === 'approved') {
        throw new Error('You are already registered for this tournament');
      }
      // If pending payment, update the payment details
      const existingRegId = existingSnapshot.docs[0].id;
      await updateDoc(doc(db, 'tournament_registrations', existingRegId), {
        payment_method: paymentMethod,
        payment_phone: paymentPhone,
        payment_reference: paymentReference,
        payment_status: 'pending',
        payment_submitted_at: serverTimestamp(),
        status: 'pending_payment'
      });
      return existingRegId;
    }
    
    // Get user info for notification
    const userDoc = await getDoc(doc(db, 'users', userId));
    const playerName = userDoc.exists() ? userDoc.data().username : 'A player';
    
    // Create registration with payment details - status is pending_payment
    // Admin will approve this to complete registration
    const registrationRef = await addDoc(collection(db, 'tournament_registrations'), {
      tournament_id: tournamentId,
      user_id: userId,
      status: 'pending_payment',
      payment_status: 'pending',
      payment_method: paymentMethod,
      payment_phone: paymentPhone,
      payment_reference: paymentReference,
      payment_submitted_at: serverTimestamp(),
      registered_at: serverTimestamp()
    });
    
    // Notify coaches about new payment submission
    try {
      await this.notifyCoachesOfRegistration(playerName, tournamentData.name, registrationRef.id);
    } catch (e) {
      console.warn('Could not notify coaches:', e);
    }
    
    return registrationRef.id;
  }

  // Alias for registerForTournament for compatibility
  async joinTournament(tournamentId) {
    return this.registerForTournament(tournamentId);
  }

  async approveTournamentRegistration(registrationId) {
    const registrationRef = doc(db, 'tournament_registrations', registrationId);
    const registrationDoc = await getDoc(registrationRef);
    
    if (!registrationDoc.exists()) throw new Error('Registration not found');
    
    const registrationData = registrationDoc.data();
    
    // Get tournament name for notification
    const tournamentDoc = await getDoc(doc(db, 'tournaments', registrationData.tournament_id));
    const tournamentName = tournamentDoc.exists() ? tournamentDoc.data().name : 'the tournament';
    
    // Update registration status to approved and payment to paid
    await updateDoc(registrationRef, {
      status: 'approved',
      payment_status: 'paid',
      approved_at: serverTimestamp(),
      payment_confirmed_at: serverTimestamp()
    });
    
    // Notify player of approval
    try {
      await this.notifyPlayerOfApproval(registrationData.user_id, tournamentName, 'approved');
    } catch (e) {
      console.warn('Could not notify player:', e);
    }
    
    return true;
  }

  async rejectTournamentRegistration(registrationId, reason) {
    const registrationRef = doc(db, 'tournament_registrations', registrationId);
    const registrationDoc = await getDoc(registrationRef);
    
    if (!registrationDoc.exists()) throw new Error('Registration not found');
    
    const registrationData = registrationDoc.data();
    
    // Get tournament name for notification
    const tournamentDoc = await getDoc(doc(db, 'tournaments', registrationData.tournament_id));
    const tournamentName = tournamentDoc.exists() ? tournamentDoc.data().name : 'the tournament';
    
    await updateDoc(registrationRef, {
      status: 'rejected',
      payment_status: 'rejected',
      rejection_reason: reason || 'Payment not verified',
      rejected_at: serverTimestamp()
    });
    
    // Notify player of rejection
    try {
      await this.notifyPlayerOfApproval(registrationData.user_id, tournamentName, 'rejected');
    } catch (e) {
      console.warn('Could not notify player:', e);
    }
    
    return true;
  }

  async getTournamentRegistrations(tournamentId, status) {
    let constraints = [where('tournament_id', '==', tournamentId)];
    if (status) {
      constraints.push(where('status', '==', status));
    }
    
    const q = query(collection(db, 'tournament_registrations'), ...constraints);
    const snapshot = await getDocs(q);
    const registrations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Get user details for each registration
    const detailedRegistrations = [];
    for (const reg of registrations) {
      const userDoc = await getDoc(doc(db, 'users', reg.user_id));
      if (userDoc.exists()) {
        detailedRegistrations.push({
          id: reg.id,
          user_id: reg.user_id,
          username: userDoc.data().username,
          email: userDoc.data().email,
          full_name: userDoc.data().full_name,
          status: reg.status,
          payment_status: reg.payment_status,
          payment_phone: reg.payment_phone,
          payment_reference: reg.payment_reference,
          registered_at: reg.registered_at
        });
      }
    }
    
    return detailedRegistrations;
  }

  async getMyTournamentRegistrations() {
    const userId = this.getCurrentUserId();
    if (!userId) return [];
    
    const q = query(
      collection(db, 'tournament_registrations'),
      where('user_id', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    const registrations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (registrations.length === 0) return [];
    
    // Fetch all tournament details in parallel
    const tournamentPromises = registrations.map(reg => 
      getDoc(doc(db, 'tournaments', reg.tournament_id))
    );
    const tournamentDocs = await Promise.all(tournamentPromises);
    
    // Build the result array
    const myTournaments = [];
    for (let i = 0; i < registrations.length; i++) {
      const reg = registrations[i];
      const tournamentDoc = tournamentDocs[i];
      if (tournamentDoc && tournamentDoc.exists()) {
        const sanitizedReg = this.sanitizeData(reg);
        const sanitizedTournament = this.sanitizeData(tournamentDoc.data());
        myTournaments.push({
          registration_id: sanitizedReg.id,
          tournament_id: sanitizedReg.tournament_id,
          status: sanitizedReg.status,
          payment_status: sanitizedReg.payment_status,
          payment_phone: sanitizedReg.payment_phone,
          payment_reference: sanitizedReg.payment_reference,
          registered_at: sanitizedReg.registered_at,
          tournament: { id: tournamentDoc.id, ...sanitizedTournament }
        });
      }
    }
    
    return myTournaments;
  }

  // ==================== MATCHES ====================

  async getMatches(params = {}) {
    const { tournament_id } = params;
    
    // Get all matches (avoid index requirement)
    const q = query(collection(db, 'matches'), limit(200));
    
    const querySnapshot = await getDocs(q);
    let matches = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Filter by tournament_id if provided
    if (tournament_id) {
      matches = matches.filter(m => m.tournament_id === tournament_id);
    }
    
    // Get unique player IDs
    const playerIds = new Set();
    matches.forEach(m => {
      if (m.player1_id) playerIds.add(m.player1_id);
      if (m.player2_id) playerIds.add(m.player2_id);
    });
    
    // Fetch player details
    const playerDocs = {};
    for (const playerId of playerIds) {
      const playerDoc = await getDoc(doc(db, 'users', playerId));
      if (playerDoc.exists()) {
        playerDocs[playerId] = { id: playerDoc.id, ...playerDoc.data() };
      }
    }
    
    // Add player details to matches
    matches = matches.map(m => ({
      ...m,
      player1: m.player1_id ? playerDocs[m.player1_id] : null,
      player2: m.player2_id ? playerDocs[m.player2_id] : null
    }));
    
    // Sort by date
    matches.sort((a, b) => new Date(b.created_at || b.scheduled_time) - new Date(a.created_at || a.scheduled_time));
    
    return matches;
  }

  async getMyMatches() {
    const userId = this.getCurrentUserId();
    if (!userId) return [];
    
    // Get matches without orderBy (avoid index requirement), sort in JavaScript
    const q = query(collection(db, 'matches'), limit(100));
    
    const querySnapshot = await getDocs(q);
    
    // Filter matches where user is player1 or player2
    const matches = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(m => m.player1_id === userId || m.player2_id === userId);
    
    // Sort by date
    matches.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    return matches;
  }

  async createMatch(matchData) {
    const docRef = await addDoc(collection(db, 'matches'), {
      ...matchData,
      status: 'scheduled',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...matchData };
  }

  // ==================== MESSAGES ====================

  async getMessages(folder, params = {}) {
    const userId = this.getCurrentUserId();
    if (!userId) return [];
    
    const { limit: limitCount = 10 } = params;
    
    try {
      // Create proper queries based on folder to respect Firestore rules
      let q;
      if (folder === 'inbox') {
        // Query messages where current user is the receiver
        q = query(
          collection(db, 'messages'),
          where('receiver_id', '==', userId),
          orderBy('created_at', 'desc'),
          limit(limitCount || 10)
        );
      } else {
        // Query messages where current user is the sender
        q = query(
          collection(db, 'messages'),
          where('sender_id', '==', userId),
          orderBy('created_at', 'desc'),
          limit(limitCount || 10)
        );
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
    } catch (error) {
      console.error('Error fetching messages:', error);
      // Fallback: try to get all messages if specific query fails
      try {
        const fallbackQ = query(collection(db, 'messages'), limit(50));
        const fallbackSnapshot = await getDocs(fallbackQ);
        let allMessages = fallbackSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Filter by folder
        if (folder === 'inbox') {
          allMessages = allMessages.filter(m => m.receiver_id === userId);
        } else {
          allMessages = allMessages.filter(m => m.sender_id === userId);
        }
        return allMessages;
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        return [];
      }
    }
  }
    
    
  async sendMessage(messageData) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');
    
    // Get sender info for notification
    const userDoc = await getDoc(doc(db, 'users', userId));
    const sender = userDoc.exists() ? userDoc.data() : {};
    
    console.log('Firebase sendMessage - userId:', userId, 'messageData:', messageData);
    
    try {
      const docRef = await addDoc(collection(db, 'messages'), {
        ...messageData,
        sender_id: userId,
        is_read: false,
        created_at: serverTimestamp()
      });
      
      // Create notification for the receiver
      await this.createNotification(
        messageData.receiver_id,
        `New Message from ${sender.username || 'Someone'}`,
        messageData.subject,
        'message'
      );
      
      console.log('Message created with ID:', docRef.id);
      return { id: docRef.id, ...messageData };
    } catch (error) {
      console.error('Error creating message in Firestore:', error);
      throw error;
    }
  }

  // ==================== NOTIFICATIONS ====================
  
  async createNotification(userId, title, message, type = 'general') {
    await addDoc(collection(db, 'notifications'), {
      user_id: userId,
      title,
      message,
      type,
      is_read: false,
      created_at: serverTimestamp()
    });
  }

  async notifyCoachesOfRegistration(playerName, tournamentName, registrationId) {
    // Get all coaches
    const coachesQuery = query(
      collection(db, 'users'),
      where('role', '==', 'coach')
    );
    const coachesSnapshot = await getDocs(coachesQuery);
    
    // Create notification for each coach
    for (const coachDoc of coachesSnapshot.docs) {
      await addDoc(collection(db, 'notifications'), {
        user_id: coachDoc.id,
        title: 'New Tournament Registration',
        message: `${playerName} has registered for ${tournamentName}. Please review and approve.`,
        type: 'tournament_registration',
        reference_id: registrationId,
        is_read: false,
        created_at: serverTimestamp()
      });
    }
  }

  async notifyPlayerOfApproval(playerId, tournamentName, status) {
    await this.createNotification(
      playerId,
      `Tournament Registration ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      `Your registration for ${tournamentName} has been ${status}. ${status === 'approved' ? 'Good luck!' : 'Please contact the coach for more information.'}`,
      'tournament_approval'
    );
  }

  async markMessageAsRead(messageId) {
    const messageRef = doc(db, 'messages', messageId);
    await updateDoc(messageRef, {
      is_read: true
    });
  }

  // ==================== TRAINING SESSIONS ====================

  async getTrainingSessions(params = {}) {
    const { upcoming = false, limit: limitCount = 10 } = params;
    
    // Get all sessions and filter in JavaScript (avoids index requirement)
    const q = query(collection(db, 'training_sessions'), limit(50));
    const querySnapshot = await getDocs(q);
    let sessions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Filter upcoming
    if (upcoming) {
      const now = new Date();
      sessions = sessions.filter(s => new Date(s.scheduled_date) >= now);
    }
    
    // Sort by scheduled date
    sessions.sort((a, b) => upcoming 
      ? new Date(a.scheduled_date) - new Date(b.scheduled_date)
      : new Date(b.scheduled_date) - new Date(a.scheduled_date)
    );
    
    return sessions.slice(0, limitCount);
  }

  async createTrainingSession(sessionData) {
    const docRef = await addDoc(collection(db, 'training_sessions'), {
      ...sessionData,
      current_participants: 0,
      status: 'scheduled',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...sessionData };
  }

  // ==================== ANNOUNCEMENTS ====================

  async getAnnouncements(params = {}) {
    const { active_only = false, limit: limitCount = 10 } = params;
    const userId = this.getCurrentUserId();
    
    // Get all announcements and filter in JavaScript (avoids index requirement)
    const q = query(collection(db, 'announcements'), limit(50));
    const querySnapshot = await getDocs(q);
    let announcements = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Filter active only
    if (active_only) {
      announcements = announcements.filter(a => a.is_active === true);
    }
    
    // Sort by created date
    announcements.sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt));
    
    const enriched = announcements.map((a) => {
      const readBy = Array.isArray(a.read_by) ? a.read_by : [];
      return {
        ...a,
        is_read: userId ? readBy.includes(userId) : false
      };
    });
    
    return enriched.slice(0, limitCount);
  }

  subscribeToAnnouncements(params = {}, callback) {
    const { active_only = false, limit: limitCount = 10 } = params;
    const userId = this.getCurrentUserId();
    if (!userId) return () => {};

    const q = query(collection(db, 'announcements'), limit(50));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let announcements = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (active_only) {
        announcements = announcements.filter(a => a.is_active === true);
      }
      announcements.sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt));
      const enriched = announcements.map((a) => {
        const readBy = Array.isArray(a.read_by) ? a.read_by : [];
        return {
          ...a,
          is_read: readBy.includes(userId)
        };
      });
      callback(enriched.slice(0, limitCount));
    });

    return unsubscribe;
  }

  async createAnnouncement(announcementData) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');
    
    // Get sender info
    const userDoc = await getDoc(doc(db, 'users', userId));
    const sender = userDoc.exists() ? userDoc.data() : {};
    
    const docRef = await addDoc(collection(db, 'announcements'), {
      ...announcementData,
      is_active: true,
      read_by: [],
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
    
    // Create notifications for all users
    await this.notifyAllUsers(
      announcementData.title || 'New Announcement',
      announcementData.content || 'Check announcements for details',
      'announcement'
    );
    
    return { id: docRef.id, ...announcementData };
  }

  async markAnnouncementAsRead(announcementId) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');
    const announcementRef = doc(db, 'announcements', announcementId);
    await updateDoc(announcementRef, {
      read_by: arrayUnion(userId),
      updated_at: serverTimestamp()
    });
  }

  async deleteAnnouncement(announcementId) {
    // Check if user is admin or coach
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');
    
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userRole = userDoc.exists() ? userDoc.data().role : null;
    const isCoachOrAdmin = userRole === 'coach' || userRole === 'admin' || userDoc.data()?.email === 'johnmakumi106@gmail.com';
    
    if (!isCoachOrAdmin) {
      throw new Error('Only coaches and admins can delete announcements');
    }
    
    const announcementRef = doc(db, 'announcements', announcementId);
    await deleteDoc(announcementRef);
  }

  // ==================== NOTIFICATIONS ====================

  async notifyAllUsers(title, message, type = 'general') {
    // Get all users
    const usersQuery = query(collection(db, 'users'), limit(1000));
    const usersSnapshot = await getDocs(usersQuery);
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Create notification for each user (except the sender)
    const currentUserId = this.getCurrentUserId();
    
    for (const user of users) {
      if (user.id !== currentUserId) {
        await this.createNotification(user.id, title, message, type);
      }
    }
  }

  async getNotifications(params = {}) {
    const userId = this.getCurrentUserId();
    if (!userId) return [];
    
    const { limit: limitCount = 10 } = params;
    
    // Get all notifications for user and sort in JavaScript (avoids index requirement)
    const q = query(collection(db, 'notifications'), where('user_id', '==', userId), limit(50));
    
    const querySnapshot = await getDocs(q);
    const notifications = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Sort by created_at descending
    notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    return notifications.slice(0, limitCount);
  }

  subscribeToNotifications(params = {}, callback) {
    const userId = this.getCurrentUserId();
    if (!userId) return () => {};

    const { limit: limitCount = 10 } = params;

    const q = query(collection(db, 'notifications'), where('user_id', '==', userId), limit(50));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notifications = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      callback(notifications.slice(0, limitCount));
    });

    return unsubscribe;
  }

  async getUnreadNotificationsCount() {
    const userId = this.getCurrentUserId();
    if (!userId) return 0;
    
    // Get all notifications for user and filter in JavaScript (avoids index requirement)
    const q = query(collection(db, 'notifications'), where('user_id', '==', userId), limit(100));
    
    const querySnapshot = await getDocs(q);
    const notifications = querySnapshot.docs.map(doc => doc.data());
    const unreadCount = notifications.filter(n => n.is_read === false).length;
    return { unread_count: unreadCount };
  }

  async markNotificationAsRead(notificationId) {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      is_read: true
    });
  }

  async deleteNotification(notificationId) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');
    
    // First check if the notification belongs to the user
    const notificationRef = doc(db, 'notifications', notificationId);
    const notificationDoc = await getDoc(notificationRef);
    
    if (!notificationDoc.exists()) {
      throw new Error('Notification not found');
    }
    
    const notificationData = notificationDoc.data();
    
    // Check if user owns this notification
    if (notificationData.user_id !== userId) {
      throw new Error('You can only delete your own notifications');
    }
    
    await deleteDoc(notificationRef);
  }

  // ==================== LEADERBOARD ====================

  async getLeaderboard(params = {}) {
    const { limit: limitCount = 10, skill_level } = params;
    
    // Get all users and filter/sort in JavaScript (avoids index requirement)
    const q = query(collection(db, 'users'), limit(100));
    
    const querySnapshot = await getDocs(q);
    let leaderboard = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Filter by role
    leaderboard = leaderboard.filter(p => p.role === 'player');
    
    // Filter by skill level if provided
    if (skill_level) {
      leaderboard = leaderboard.filter(p => p.skill_level === skill_level);
    }
    
    // Sort by ranking points
    leaderboard.sort((a, b) => (b.ranking_points || 0) - (a.ranking_points || 0));
    
    // Apply limit
    return leaderboard.slice(0, limitCount);
  }

  // ==================== CLUBS ====================

  async getClubs() {
    const q = query(collection(db, 'clubs'), orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async getClub(clubId) {
    const clubDoc = await getDoc(doc(db, 'clubs', clubId));
    if (!clubDoc.exists()) throw new Error('Club not found');
    return { id: clubDoc.id, ...clubDoc.data() };
  }

  // ==================== COACH PANEL ====================

  async getCoachDashboard() {
    // Get all users and count players
    const usersQ = query(collection(db, 'users'), limit(100));
    const usersSnapshot = await getDocs(usersQ);
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const players = users.filter(u => u.role !== 'coach' && u.role !== 'admin');
    
    // Get upcoming sessions
    const sessionsQ = query(collection(db, 'training_sessions'), limit(50));
    const sessionsSnapshot = await getDocs(sessionsQ);
    const allSessions = sessionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const upcomingSessions = allSessions.filter(s => new Date(s.scheduled_date) >= new Date());
    
    return {
      total_players: players.length,
      upcoming_sessions: upcomingSessions.length,
      pending_messages: 0
    };
  }

  async getCoachPlayers(params = {}) {
    return this.getPlayers(params);
  }

  // ==================== STATS ====================

  async getMyStats() {
    const userId = this.getCurrentUserId();
    if (!userId) return null;
    
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return null;
    
    const userData = userDoc.data();
    const matches = await this.getMyMatches();
    
    const wins = matches.filter(m => m.winner_id === userId).length;
    const losses = matches.filter(m => m.winner_id !== userId && m.status === 'completed').length;
    const totalMatches = wins + losses;
    const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;
    
    return {
      user: userData,
      total_matches: totalMatches,
      wins,
      losses,
      win_rate: winRate,
      ranking_points: userData.ranking_points || 0
    };
  }

  async getAdminStats() {
    try {
      // Get all collections for system-wide stats
      const [usersSnapshot, courtsSnapshot, tournamentsSnapshot, bookingsSnapshot, matchesSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'users'), limit(1000))),
        getDocs(query(collection(db, 'courts'), limit(100))),
        getDocs(query(collection(db, 'tournaments'), limit(100))),
        getDocs(query(collection(db, 'bookings'), limit(1000))),
        getDocs(query(collection(db, 'matches'), limit(1000)))
      ]);

      const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const courts = courtsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const tournaments = tournamentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const bookings = bookingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const matches = matchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Calculate stats
      const totalUsers = users.length;
      const totalCourts = courts.length;
      const totalTournaments = tournaments.length;
      const totalBookings = bookings.length;
      const totalMatches = matches.length;
      
      const activeCourts = courts.filter(c => c.is_available).length;
      const activeTournaments = tournaments.filter(t => t.status === 'active').length;
      const completedTournaments = tournaments.filter(t => t.status === 'completed').length;
      const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
      const completedMatches = matches.filter(m => m.status === 'completed').length;

      const players = users.filter(u => u.role === 'player').length;
      const coaches = users.filter(u => u.role === 'coach').length;
      const admins = users.filter(u => u.role === 'admin').length;

      return {
        total_users: totalUsers,
        total_courts: totalCourts,
        total_tournaments: totalTournaments,
        total_bookings: totalBookings,
        total_matches: totalMatches,
        active_courts: activeCourts,
        active_tournaments: activeTournaments,
        completed_tournaments: completedTournaments,
        confirmed_bookings: confirmedBookings,
        completed_matches: completedMatches,
        players,
        coaches,
        admins
      };
    } catch (error) {
      console.error('Error getting admin stats:', error);
      return null;
    }
  }

  async getAdminDashboard() {
    // Get dashboard data from Firestore
    try {
      const [usersSnapshot, courtsSnapshot, tournamentsSnapshot, bookingsSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'users'), limit(1000))),
        getDocs(query(collection(db, 'courts'), limit(100))),
        getDocs(query(collection(db, 'tournaments'), limit(100))),
        getDocs(query(collection(db, 'bookings'), limit(1000)))
      ]);

      const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const courts = courtsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const tournaments = tournamentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const bookings = bookingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const activeTournaments = tournaments.filter(t => t.status === 'active');
      const recentBookings = bookings.slice(0, 5);

      return {
        total_users: users.length,
        total_courts: courts.length,
        total_bookings: bookings.length,
        active_tournaments: activeTournaments.length,
        recent_bookings: recentBookings,
        active_tournaments_list: activeTournaments
      };
    } catch (error) {
      console.error('Error getting admin dashboard:', error);
      return null;
    }
  }

  async getAdminUsers(params = {}) {
    const { limit: limitCount = 20 } = params;
    try {
      const q = query(collection(db, 'users'), limit(limitCount));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting admin users:', error);
      return [];
    }
  }

  async getStaffStats() {
    const usersQ = query(collection(db, 'users'), limit(100));
    const usersSnapshot = await getDocs(usersQ);
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const courtsQ = query(collection(db, 'courts'), limit(100));
    const courtsSnapshot = await getDocs(courtsQ);
    
    const tournamentsQ = query(collection(db, 'tournaments'), limit(100));
    const tournamentsSnapshot = await getDocs(tournamentsQ);
    const tournaments = tournamentsSnapshot.docs.map(doc => doc.data());
    
    return {
      total_players: users.filter(u => u.role !== 'coach' && u.role !== 'admin').length,
      total_courts: courtsSnapshot.size,
      active_tournaments: tournaments.filter(t => t.status === 'active').length
    };
  }
}

const api = new FirebaseApiService();
export default api;
