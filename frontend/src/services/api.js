const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiService {
  constructor() {
    this.baseUrl = API_URL;
  }

  getToken() {
    return localStorage.getItem('access_token');
  }

  setTokens(accessToken, refreshToken) {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        this.clearTokens();
        window.location.href = '/login';
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
        throw new Error(error.detail || 'Request failed');
      }

      return response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth
  async login(email, password) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setTokens(data.access_token, data.refresh_token);
    return data;
  }

  async register(userData) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getMe() {
    return this.request('/api/auth/me');
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) throw new Error('No refresh token');

    const data = await this.request('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    this.setTokens(data.access_token, data.refresh_token);
    return data;
  }

  logout() {
    this.clearTokens();
  }

  // Users
  async getUsers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/users?${query}`);
  }

  async getPlayers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/users/players?${query}`);
  }

  async getCoaches(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/users/coaches?${query}`);
  }

  async getLeaderboard(limit = 50) {
    return this.request(`/api/users/leaderboard?limit=${limit}`);
  }

  async getUser(userId) {
    return this.request(`/api/users/${userId}`);
  }

  async updateUser(userData) {
    return this.request('/api/users/me', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async uploadProfilePicture(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = this.getToken();
    const response = await fetch(`${this.baseUrl}/api/users/me/profile-picture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to upload profile picture' }));
      throw new Error(error.detail || 'Failed to upload profile picture');
    }
    
    return response.json();
  }

  async removeProfilePicture() {
    const token = this.getToken();
    const response = await fetch(`${this.baseUrl}/api/users/me/profile-picture`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to remove profile picture' }));
      throw new Error(error.detail || 'Failed to remove profile picture');
    }
    
    return this.getMe();
  }

  async getMyStats() {
    return this.request('/api/users/me/stats');
  }

  async getUserStats(userId) {
    return this.request(`/api/users/${userId}/stats`);
  }

  // Courts
  async getCourts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/courts?${query}`);
  }

  async getCourt(courtId) {
    return this.request(`/api/courts/${courtId}`);
  }

  async getCourtAvailability(courtId, date) {
    const query = date ? `?date=${date.toISOString()}` : '';
    return this.request(`/api/courts/${courtId}/availability${query}`);
  }

  async createCourt(courtData) {
    return this.request('/api/courts/', {
      method: 'POST',
      body: JSON.stringify(courtData),
    });
  }

  async updateCourt(courtId, courtData) {
    return this.request(`/api/courts/${courtId}`, {
      method: 'PUT',
      body: JSON.stringify(courtData),
    });
  }

  async deleteCourt(courtId) {
    return this.request(`/api/courts/${courtId}`, {
      method: 'DELETE',
    });
  }

  // Clubs
  async getClubs() {
    return this.request('/api/clubs');
  }

  async getClub(clubId) {
    return this.request(`/api/clubs/${clubId}`);
  }

  // Bookings
  async getBookings(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/bookings?${query}`);
  }

  async getMyBookings(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/bookings/my-bookings?${query}`);
  }

  async getBooking(bookingId) {
    return this.request(`/api/bookings/${bookingId}`);
  }

  async createBooking(bookingData) {
    return this.request('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  async updateBooking(bookingId, bookingData) {
    return this.request(`/api/bookings/${bookingId}`, {
      method: 'PUT',
      body: JSON.stringify(bookingData),
    });
  }

  async cancelBooking(bookingId) {
    return this.request(`/api/bookings/${bookingId}/cancel`, {
      method: 'POST',
    });
  }

  async confirmBooking(bookingId) {
    return this.request(`/api/bookings/${bookingId}/confirm`, {
      method: 'POST',
    });
  }

  // Tournaments
  async getTournaments(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/tournaments?${query}`);
  }

  async getActiveTournaments() {
    return this.request('/api/tournaments/active');
  }

  async getTournament(tournamentId) {
    return this.request(`/api/tournaments/${tournamentId}`);
  }

  async createTournament(tournamentData) {
    return this.request('/api/tournaments/', {
      method: 'POST',
      body: JSON.stringify(tournamentData),
    });
  }

  async updateTournament(tournamentId, tournamentData) {
    return this.request(`/api/tournaments/${tournamentId}`, {
      method: 'PUT',
      body: JSON.stringify(tournamentData),
    });
  }

  async deleteTournament(tournamentId) {
    return this.request(`/api/tournaments/${tournamentId}`, {
      method: 'DELETE',
    });
  }

  async joinTournament(tournamentId) {
    return this.request(`/api/tournaments/${tournamentId}/join/`, {
      method: 'POST',
    });
  }

  async leaveTournament(tournamentId) {
    return this.request(`/api/tournaments/${tournamentId}/leave/`, {
      method: 'POST',
    });
  }

  async getTournamentParticipants(tournamentId) {
    return this.request(`/api/tournaments/${tournamentId}/participants`);
  }

  async startTournament(tournamentId) {
    return this.request(`/api/tournaments/${tournamentId}/start`, {
      method: 'POST',
    });
  }

  // Matches
  async getMatches(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/matches?${query}`);
  }

  async getMyMatches(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/matches/my-matches?${query}`);
  }

  async getMatch(matchId) {
    return this.request(`/api/matches/${matchId}`);
  }

  async createMatch(matchData) {
    return this.request('/api/matches', {
      method: 'POST',
      body: JSON.stringify(matchData),
    });
  }

  async updateMatch(matchId, matchData) {
    return this.request(`/api/matches/${matchId}`, {
      method: 'PUT',
      body: JSON.stringify(matchData),
    });
  }

  async updateMatchScore(matchId, player1Score, player2Score, winnerId) {
    return this.request(`/api/matches/${matchId}/score?player1_score=${player1Score}&player2_score=${player2Score}&winner_id=${winnerId}`, {
      method: 'POST',
    });
  }

  // Coaching Sessions
  async getCoachingSessions(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/coaching?${query}`);
  }

  async getMyCoachingSessions(asCoach = false) {
    return this.request(`/api/coaching/my-sessions?as_coach=${asCoach}`);
  }

  async getCoachingSession(sessionId) {
    return this.request(`/api/coaching/${sessionId}`);
  }

  async createCoachingSession(sessionData) {
    return this.request('/api/coaching', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  async updateCoachingSession(sessionId, sessionData) {
    return this.request(`/api/coaching/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(sessionData),
    });
  }

  async deleteCoachingSession(sessionId) {
    return this.request(`/api/coaching/${sessionId}`, {
      method: 'DELETE',
    });
  }

  // Admin
  async getAdminDashboard() {
    return this.request('/api/admin/dashboard');
  }

  async getAdminUsers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/admin/users?${query}`);
  }

  async verifyUser(userId) {
    return this.request(`/api/admin/users/${userId}/verify`, {
      method: 'POST',
    });
  }

  async activateUser(userId) {
    return this.request(`/api/admin/users/${userId}/activate`, {
      method: 'POST',
    });
  }

  async deactivateUser(userId) {
    return this.request(`/api/admin/users/${userId}/deactivate`, {
      method: 'POST',
    });
  }

  async getAdminStats() {
    return this.request('/api/admin/stats/overview');
  }

  async promoteToCoach(userId) {
    return this.request(`/api/admin/users/${userId}/promote-to-coach`, {
      method: 'POST',
    });
  }

  async demoteToPlayer(userId) {
    return this.request(`/api/admin/users/${userId}/demote-to-player`, {
      method: 'POST',
    });
  }

  // Coach Panel
  async getCoachDashboard() {
    return this.request('/api/coach-panel/dashboard');
  }

  async getCoachPlayers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/coach-panel/players?${query}`);
  }

  async getCoachPlayer(playerId) {
    return this.request(`/api/coach-panel/players/${playerId}`);
  }

  async getPlayerStatistics(playerId) {
    return this.request(`/api/coach-panel/players/${playerId}/statistics`);
  }

  async createPlayerStatistics(playerId, statsData) {
    return this.request(`/api/coach-panel/players/${playerId}/statistics`, {
      method: 'POST',
      body: JSON.stringify(statsData),
    });
  }

  async updatePlayerStatistics(playerId, statsData) {
    return this.request(`/api/coach-panel/players/${playerId}/statistics`, {
      method: 'PUT',
      body: JSON.stringify(statsData),
    });
  }

  async sendMessage(messageData) {
    return this.request('/api/coach-panel/messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  async getMessages(folder = 'inbox', params = {}) {
    const query = new URLSearchParams({ ...params, folder }).toString();
    return this.request(`/api/coach-panel/messages?${query}`);
  }

  async getMessage(messageId) {
    return this.request(`/api/coach-panel/messages/${messageId}`);
  }

  async markMessageRead(messageId) {
    return this.request(`/api/coach-panel/messages/${messageId}/read`, {
      method: 'PUT',
    });
  }

  async deleteMessage(messageId) {
    return this.request(`/api/coach-panel/messages/${messageId}`, {
      method: 'DELETE',
    });
  }

  async getUnreadMessageCount() {
    return this.request('/api/coach-panel/messages/unread/count');
  }

  // Training Sessions
  async getTrainingSessions(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/coach-panel/training-sessions?${query}`);
  }

  async createTrainingSession(sessionData) {
    return this.request('/api/coach-panel/training-sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  async updateTrainingSession(sessionId, sessionData) {
    return this.request(`/api/coach-panel/training-sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(sessionData),
    });
  }

  async deleteTrainingSession(sessionId) {
    return this.request(`/api/coach-panel/training-sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  // Announcements
  async getAnnouncements(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/coach-panel/announcements?${query}`);
  }

  async createAnnouncement(announcementData) {
    return this.request('/api/coach-panel/announcements', {
      method: 'POST',
      body: JSON.stringify(announcementData),
    });
  }

  async updateAnnouncement(announcementId, announcementData) {
    return this.request(`/api/coach-panel/announcements/${announcementId}`, {
      method: 'PUT',
      body: JSON.stringify(announcementData),
    });
  }

  async deleteAnnouncement(announcementId) {
    return this.request(`/api/coach-panel/announcements/${announcementId}`, {
      method: 'DELETE',
    });
  }

  // Notifications
  async getNotifications(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/users/notifications?${query}`);
  }

  async getUnreadNotificationsCount() {
    return this.request('/api/users/notifications/unread-count');
  }

  async markNotificationRead(messageId) {
    return this.request(`/api/users/notifications/${messageId}/read`, {
      method: 'PUT',
    });
  }

  // Player Announcements - directly from coach
  async getPlayerAnnouncements(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/users/announcements?${query}`);
  }

  async getPlayerAnnouncementsCount() {
    return this.request('/api/users/announcements/unread-count');
  }

  // Progress Reports
  async getPlayerProgressReports(playerId, params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/coach-panel/players/${playerId}/progress-reports?${query}`);
  }

  async createProgressReport(reportData) {
    return this.request('/api/coach-panel/progress-reports', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  }

  async deleteProgressReport(reportId) {
    return this.request(`/api/coach-panel/progress-reports/${reportId}`, {
      method: 'DELETE',
    });
  }

  // Events
  async getEvents(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/events?${query}`);
  }

  async getEvent(eventId) {
    return this.request(`/api/events/${eventId}`);
  }

  async createEvent(eventData) {
    return this.request('/api/events/', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  async updateEvent(eventId, eventData) {
    return this.request(`/api/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  }

  async deleteEvent(eventId) {
    return this.request(`/api/events/${eventId}`, {
      method: 'DELETE',
    });
  }

  async registerForEvent(eventId) {
    return this.request(`/api/events/${eventId}/register`, {
      method: 'POST',
    });
  }

  async getEventParticipants(eventId) {
    return this.request(`/api/events/${eventId}/participants`);
  }

  // Staff Management
  async createStaffAccount(staffData) {
    return this.request('/api/staff/register', {
      method: 'POST',
      body: JSON.stringify(staffData),
    });
  }

  async getStaffStats() {
    return this.request('/api/staff/stats');
  }

  async getAllUsers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/staff/users?${query}`);
  }

  async getPlayers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/staff/players?${query}`);
  }

  async getAllBookings(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/bookings?${query}`);
  }

  async getAllTournaments(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/tournaments?${query}`);
  }

  async updateUserRole(userId, newRole) {
    return this.request(`/api/staff/users/${userId}/role?new_role=${newRole}`, {
      method: 'PUT',
    });
  }

  async updateUserStatus(userId, isActive) {
    return this.request(`/api/staff/users/${userId}/status?is_active=${isActive}`, {
      method: 'PUT',
    });
  }

  async deleteUser(userId) {
    return this.request(`/api/staff/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async updateUser(userId, userData) {
    return this.request(`/api/staff/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }
}

export const api = new ApiService();
export default api;
