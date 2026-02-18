import React, { useState, useEffect } from 'react';
import api from '../services/api';

function Leaderboard() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await api.getLeaderboard(50);
      setPlayers(data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
    setLoading(false);
  };

  const getSkillLevelColor = (level) => {
    switch (level) {
      case 'advanced':
        return 'bg-red-100 text-red-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'beginner':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRankStyle = (rank) => {
    if (rank === 1) return 'bg-yellow-400 text-white';
    if (rank === 2) return 'bg-gray-300 text-gray-800';
    if (rank === 3) return 'bg-amber-600 text-white';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Leaderboard</h1>
          <p className="mt-2 text-gray-600">Top tennis players ranked by points</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-tennis-green border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading leaderboard...</p>
          </div>
        ) : players.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No players found</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {/* Top 3 */}
            {players.length >= 3 && (
              <div className="bg-gradient-to-r from-tennis-green to-tennis-green-dark p-6">
                <div className="flex items-end justify-center space-x-4">
                  {/* 2nd Place */}
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl font-bold text-gray-700">2</span>
                    </div>
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-3xl">
                        {players[1]?.profile_picture ? (
                          <img src={players[1].profile_picture} alt={players[1].username} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          players[1]?.username?.charAt(0).toUpperCase()
                        )}
                      </span>
                    </div>
                    <p className="font-semibold text-white">{players[1]?.username}</p>
                    <p className="text-sm text-green-200">{players[1]?.ranking_points} pts</p>
                  </div>

                  {/* 1st Place */}
                  <div className="text-center -mb-4">
                    <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-4xl">
                        {players[0]?.profile_picture ? (
                          <img src={players[0].profile_picture} alt={players[0].username} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          '👑'
                        )}
                      </span>
                    </div>
                    <p className="font-bold text-white text-lg">{players[0]?.username}</p>
                    <p className="text-sm text-yellow-200">{players[0]?.ranking_points} pts</p>
                  </div>

                  {/* 3rd Place */}
                  <div className="text-center">
                    <div className="w-16 h-16 bg-amber-600 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl font-bold text-white">3</span>
                    </div>
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-3xl">
                        {players[2]?.profile_picture ? (
                          <img src={players[2].profile_picture} alt={players[2].username} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          players[2]?.username?.charAt(0).toUpperCase()
                        )}
                      </span>
                    </div>
                    <p className="font-semibold text-white">{players[2]?.username}</p>
                    <p className="text-sm text-green-200">{players[2]?.ranking_points} pts</p>
                  </div>
                </div>
              </div>
            )}

            {/* Rest of the list */}
            <div className="divide-y">
              {players.slice(players.length >= 3 ? 3 : 0).map((player, index) => (
                <div
                  key={player.id}
                  className="flex items-center p-4 hover:bg-gray-50"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${getRankStyle(index + (players.length >= 3 ? 4 : 1))}`}>
                    <span className="font-semibold">{index + (players.length >= 3 ? 4 : 1)}</span>
                  </div>
                  <div className="w-10 h-10 bg-tennis-green rounded-full flex items-center justify-center mr-4">
                    {player.profile_picture ? (
                      <img src={player.profile_picture} alt={player.username} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-white font-semibold">
                        {player.username?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <p className="font-semibold">{player.username}</p>
                      {player.full_name && (
                        <span className="ml-2 text-sm text-gray-500">({player.full_name})</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getSkillLevelColor(player.skill_level)}`}>
                        {player.skill_level}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-tennis-green">{player.ranking_points}</p>
                    <p className="text-xs text-gray-500">points</p>
                  </div>
                  <div className="ml-6 text-right text-sm text-gray-500">
                    <p>
                      <span className="text-green-600 font-medium">{player.wins}W</span>
                      {' / '}
                      <span className="text-red-600 font-medium">{player.losses}L</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Summary */}
        {players.length > 0 && (
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <p className="text-2xl font-bold text-tennis-green">{players.length}</p>
              <p className="text-sm text-gray-500">Active Players</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <p className="text-2xl font-bold text-tennis-green">
                {players.reduce((sum, p) => sum + p.matches_played, 0)}
              </p>
              <p className="text-sm text-gray-500">Total Matches</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <p className="text-2xl font-bold text-tennis-green">
                {players.reduce((sum, p) => sum + p.wins, 0)}
              </p>
              <p className="text-sm text-gray-500">Total Wins</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Leaderboard;
