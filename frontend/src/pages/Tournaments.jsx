import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function Tournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', tournament_type: '' });
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [participants, setParticipants] = useState([]);
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
      
      const data = await api.getTournaments(params);
      setTournaments(data || []);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    }
    setLoading(false);
  };

  const handleTournamentSelect = async (tournament) => {
    setSelectedTournament(tournament);
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

    try {
      await api.joinTournament(tournamentId);
      alert('Successfully joined the tournament!');
      fetchTournaments();
      handleTournamentSelect(selectedTournament);
    } catch (error) {
      alert(error.message);
    }
  };

  const isParticipant = (tournamentId) => {
    return participants.some((p) => p.user?.id === user?.id);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Tournaments</h1>
          <p className="mt-2 text-gray-600">Compete with the best players</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-8">
          <div className="flex flex-wrap gap-4">
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-tennis-green focus:border-tennis-green"
            >
              <option value="">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={filter.tournament_type}
              onChange={(e) => setFilter({ ...filter, tournament_type: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-tennis-green focus:border-tennis-green"
            >
              <option value="">All Formats</option>
              <option value="knockout">Knockout</option>
              <option value="round_robin">Round Robin</option>
              <option value="league">League</option>
            </select>
          </div>
        </div>

        {/* Tournaments Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-tennis-green border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading tournaments...</p>
          </div>
        ) : tournaments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No tournaments found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((tournament) => (
              <div
                key={tournament.id}
                onClick={() => handleTournamentSelect(tournament)}
                className="bg-white rounded-xl shadow-md overflow-hidden card-hover cursor-pointer"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(tournament.status)}`}>
                      {tournament.status}
                    </span>
                    <span className="text-sm text-gray-500">
                      {tournament.participant_count || 0} players
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{tournament.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {tournament.description || 'No description available'}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-gray-500">Start: </span>
                      <span>{new Date(tournament.start_date).toLocaleDateString()}</span>
                    </div>
                    {tournament.prize_money > 0 && (
                      <span className="text-tennis-green font-semibold">
                        ${tournament.prize_money}
                      </span>
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                    <span className="capitalize">{tournament.tournament_type.replace('_', ' ')}</span>
                    <span>Entry: ${tournament.entry_fee}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tournament Details Modal */}
        {selectedTournament && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">{selectedTournament.name}</h2>
                  <button
                    onClick={() => setSelectedTournament(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-gray-500">Status</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedTournament.status)}`}>
                      {selectedTournament.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-gray-500">Format</span>
                    <span className="capitalize">{selectedTournament.tournament_type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-gray-500">Start Date</span>
                    <span>{new Date(selectedTournament.start_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-gray-500">End Date</span>
                    <span>{new Date(selectedTournament.end_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-gray-500">Entry Fee</span>
                    <span className="font-semibold">${selectedTournament.entry_fee}</span>
                  </div>
                  {selectedTournament.prize_money > 0 && (
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-gray-500">Prize Money</span>
                      <span className="text-tennis-green font-semibold">${selectedTournament.prize_money}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-gray-500">Participants</span>
                    <span>{selectedTournament.participant_count || 0} / {selectedTournament.max_participants || '∞'}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-500">Winner Points</span>
                    <span className="font-semibold">+{selectedTournament.winner_points}</span>
                  </div>
                </div>

                {/* Participants */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Participants</h3>
                  {participants.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {participants.map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-tennis-green rounded-full flex items-center justify-center">
                              <span className="text-white text-sm">
                                {p.user?.username?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="font-medium">{p.user?.username}</span>
                          </div>
                          <span className="text-sm text-gray-500 capitalize">
                            {p.user?.skill_level}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No participants yet</p>
                  )}
                </div>

                {/* Join Button */}
                {selectedTournament.status === 'upcoming' && (
                  <button
                    onClick={() => handleJoinTournament(selectedTournament.id)}
                    disabled={isParticipant(selectedTournament.id)}
                    className="w-full py-3 bg-tennis-green text-white rounded-lg hover:bg-tennis-green-dark disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isParticipant(selectedTournament.id) ? 'Already Joined' : 'Join Tournament'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Tournaments;
