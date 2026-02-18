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
    return this.request('/api/courts', {
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
    return this.request('/api/tournaments', {
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
    return this.request(`/api/tournaments/${tournamentId}/join`, {
      method: 'POST',
    });
  }

  async leaveTournament(tournamentId) {
    return this.request(`/api/tournaments/${tournamentId}/leave`, {
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
}

export const api = new ApiService();
export default api;
