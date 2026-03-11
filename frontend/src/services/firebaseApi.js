// Firebase API Service for Lawn Tennis Academy
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
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

  // ==================== USERS ====================
  
  async getMe() {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');
    
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) throw new Error('User not found');
    
    return { id: userDoc.id, ...userDoc.data() };
  }

  async getUser(userId) {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) throw new Error('User not found');
    return { id: userDoc.id, ...userDoc.data() };
  }

  async getPlayers(params = {}) {
    const { limit: limitCount = 50, skill_level, search } = params;
    
    let q = collection(db, 'users');
    const constraints = [where('role', '==', 'player')];
    
    if (skill_level) {
      constraints.push(where('skill_level', '==', skill_level));
    }
    
    constraints.push(orderBy('ranking_points', 'desc'));
    constraints.push(limit(limitCount));
    
    const querySnapshot = await getDocs(query(...constraints));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async getCoaches() {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'coach'),
      orderBy('ranking_points', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
    
    // Re-authenticate user with current password
    const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
    await reauthenticateWithCredential(firebaseUser, credential);
    
    // Now change the password
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
    const statsDoc = await getDoc(doc(db, 'player_statistics', playerId));
    if (!statsDoc.exists()) return null;
    return { id: statsDoc.id, ...statsDoc.data() };
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

  async updatePlayerStatistics(playerId, statsData) {
    const statsRef = doc(db, 'player_statistics', playerId);
    await updateDoc(statsRef, {
      ...statsData,
      updatedAt: serverTimestamp()
    });
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

  // ==================== BOOKINGS ====================

  async getMyBookings() {
    const userId = this.getCurrentUserId();
    if (!userId) return [];
    
    const q = query(
      collection(db, 'bookings'),
      where('user_id', '==', userId),
      orderBy('start_time', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const bookings = [];
    
    for (const docSnap of querySnapshot.docs) {
      const booking = { id: docSnap.id, ...docSnap.data() };
      if (booking.court_id) {
        const courtDoc = await getDoc(doc(db, 'courts', booking.court_id));
        if (courtDoc.exists()) {
          booking.court = { id: courtDoc.id, ...courtDoc.data() };
        }
      }
      bookings.push(booking);
    }
    
    return bookings;
  }

  async getAvailableSlots(courtId, date) {
    // Get all bookings for this court on this date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const q = query(
      collection(db, 'bookings'),
      where('court_id', '==', courtId),
      where('start_time', '>=', startOfDay.toISOString()),
      where('start_time', '<=', endOfDay.toISOString()),
      where('status', '==', 'confirmed')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async createBooking(bookingData) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');
    
    const docRef = await addDoc(collection(db, 'bookings'), {
      ...bookingData,
      user_id: userId,
      status: 'confirmed',
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

  // ==================== TOURNAMENTS ====================

  async getActiveTournaments() {
    const now = new Date().toISOString();
    const q = query(
      collection(db, 'tournaments'),
      where('status', '==', 'active'),
      where('start_date', '>=', now),
      orderBy('start_date', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async getTournaments(params = {}) {
    const { limit: limitCount = 50, status } = params;
    
    let constraints = [orderBy('start_date', 'desc'), limit(limitCount)];
    
    if (status) {
      constraints = [where('status', '==', status), ...constraints];
    }
    
    const querySnapshot = await getDocs(query(collection(db, 'tournaments'), ...constraints));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

  async updateTournament(tournamentId, tournamentData) {
    const tournamentRef = doc(db, 'tournaments', tournamentId);
    await updateDoc(tournamentRef, {
      ...tournamentData,
      updatedAt: serverTimestamp()
    });
    const updatedDoc = await getDoc(tournamentRef);
    return { id: updatedDoc.id, ...updatedDoc.data() };
  }

  async registerForTournament(tournamentId) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');
    
    const tournamentRef = doc(db, 'tournaments', tournamentId);
    const tournamentDoc = await getDoc(tournamentRef);
    
    if (!tournamentDoc.exists()) throw new Error('Tournament not found');
    
    // Add user to participants
    await updateDoc(tournamentRef, {
      participants: arrayUnion(userId),
      participant_count: increment(1),
      updatedAt: serverTimestamp()
    });
    
    // Create tournament_registrations collection
    await addDoc(collection(db, 'tournament_registrations'), {
      tournament_id: tournamentId,
      user_id: userId,
      status: 'registered',
      registered_at: serverTimestamp()
    });
  }

  // ==================== MATCHES ====================

  async getMyMatches() {
    const userId = this.getCurrentUserId();
    if (!userId) return [];
    
    const q = query(
      collection(db, 'matches'),
      where('player1_id', '==', userId),
      orderBy('created_at', 'desc')
    );
    
    const q2 = query(
      collection(db, 'matches'),
      where('player2_id', '==', userId),
      orderBy('created_at', 'desc')
    );
    
    const [snapshot1, snapshot2] = await Promise.all([getDocs(q), getDocs(q2)]);
    
    const matches = [
      ...snapshot1.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      ...snapshot2.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    ];
    
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
    
    let q;
    if (folder === 'inbox') {
      q = query(
        collection(db, 'messages'),
        where('receiver_id', '==', userId),
        orderBy('created_at', 'desc'),
        limit(limitCount)
      );
    } else {
      q = query(
        collection(db, 'messages'),
        where('sender_id', '==', userId),
        orderBy('created_at', 'desc'),
        limit(limitCount)
      );
    }
    
    const querySnapshot = await getDocs(q);
    const messages = [];
    
    for (const docSnap of querySnapshot.docs) {
      const message = { id: docSnap.id, ...docSnap.data() };
      
      // Get sender info
      if (message.sender_id) {
        const senderDoc = await getDoc(doc(db, 'users', message.sender_id));
        if (senderDoc.exists()) {
          message.sender = { id: senderDoc.id, ...senderDoc.data() };
        }
      }
      
      // Get receiver info
      if (message.receiver_id) {
        const receiverDoc = await getDoc(doc(db, 'users', message.receiver_id));
        if (receiverDoc.exists()) {
          message.receiver = { id: receiverDoc.id, ...receiverDoc.data() };
        }
      }
      
      messages.push(message);
    }
    
    return messages;
  }

  async sendMessage(messageData) {
    const userId = this.getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');
    
    const docRef = await addDoc(collection(db, 'messages'), {
      ...messageData,
      sender_id: userId,
      is_read: false,
      createdAt: serverTimestamp()
    });
    
    return { id: docRef.id, ...messageData };
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
    
    let constraints = [orderBy('scheduled_date', upcoming ? 'asc' : 'desc'), limit(limitCount)];
    
    if (upcoming) {
      const now = new Date().toISOString();
      constraints = [where('scheduled_date', '>=', now), ...constraints];
    }
    
    const querySnapshot = await getDocs(query(collection(db, 'training_sessions'), ...constraints));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
    
    let constraints = [orderBy('created_at', 'desc'), limit(limitCount)];
    
    if (active_only) {
      constraints = [where('is_active', '==', true), ...constraints];
    }
    
    const querySnapshot = await getDocs(query(collection(db, 'announcements'), ...constraints));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async createAnnouncement(announcementData) {
    const docRef = await addDoc(collection(db, 'announcements'), {
      ...announcementData,
      is_active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...announcementData };
  }

  // ==================== NOTIFICATIONS ====================

  async getNotifications(params = {}) {
    const userId = this.getCurrentUserId();
    if (!userId) return [];
    
    const { limit: limitCount = 10 } = params;
    
    const q = query(
      collection(db, 'notifications'),
      where('user_id', '==', userId),
      orderBy('created_at', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async getUnreadNotificationsCount() {
    const userId = this.getCurrentUserId();
    if (!userId) return 0;
    
    const q = query(
      collection(db, 'notifications'),
      where('user_id', '==', userId),
      where('is_read', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  }

  async markNotificationAsRead(notificationId) {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      is_read: true
    });
  }

  // ==================== LEADERBOARD ====================

  async getLeaderboard(params = {}) {
    const { limit: limitCount = 10, skill_level } = params;
    
    let q = query(
      collection(db, 'users'),
      where('role', '==', 'player'),
      orderBy('ranking_points', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    let leaderboard = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (skill_level) {
      leaderboard = leaderboard.filter(p => p.skill_level === skill_level);
    }
    
    return leaderboard;
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
    const q = query(collection(db, 'users'), where('role', '==', 'player'));
    const playersSnapshot = await getDocs(q);
    const players = playersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const sessionsQ = query(
      collection(db, 'training_sessions'),
      where('scheduled_date', '>=', new Date().toISOString())
    );
    const sessionsSnapshot = await getDocs(sessionsQ);
    const upcomingSessions = sessionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
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
}

const api = new FirebaseApiService();
export default api;
