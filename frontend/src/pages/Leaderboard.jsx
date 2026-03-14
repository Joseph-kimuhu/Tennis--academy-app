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
        return 'bg-gradient-to-r from-purple-600 to-purple-700 text-white';
      case 'intermediate':
        return 'bg-gradient-to-r from-tennis-green to-tennis-green-light text-white';
      case 'beginner':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return { bg: 'bg-gradient-to-br from-yellow-400 to-amber-500', icon: '#1', text: 'text-white' };
    if (rank === 2) return { bg: 'bg-gradient-to-br from-slate-300 to-slate-400', icon: '#2', text: 'text-slate-800' };
    if (rank === 3) return { bg: 'bg-gradient-to-br from-amber-600 to-amber-700', icon: '#3', text: 'text-white' };
    return { bg: 'bg-gradient-to-br from-tennis-green/10 to-tennis-green/20', icon: rank, text: 'text-tennis-green' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-tennis-green/5">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-tennis-green via-tennis-green to-tennis-green-light text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-4 tracking-tight drop-shadow-lg">Leaderboard</h1>
            <p className="text-xl text-white/95 font-medium max-w-2xl mx-auto drop-shadow">
              Top tennis players ranked by performance and points
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-tennis-green border-t-transparent"></div>
            <p className="mt-4 text-gray-600 text-lg">Loading leaderboard...</p>
          </div>
        ) : players.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-tennis">
            <div className="text-6xl mb-4">🎾</div>
            <p className="text-gray-600 text-lg">No players found</p>
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            {players.length >= 3 && (
              <div className="bg-white rounded-2xl shadow-tennis-lg overflow-hidden mb-8">
                <div className="bg-gradient-to-br from-tennis-green via-tennis-green-light to-emerald-600 p-8">
                  <div className="flex items-end justify-center gap-4 max-w-4xl mx-auto">
                    {/* 2nd Place */}
                    <div className="flex-1 max-w-[200px] text-center transform hover:scale-105 transition-transform">
                      <div className="relative inline-block mb-3">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl ring-4 ring-slate-300 overflow-hidden">
                          {players[1]?.profile_picture ? (
                            <img src={players[1].profile_picture} alt={players[1].username} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-3xl font-bold text-slate-400">
                              {players[1]?.username?.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-br from-slate-300 to-slate-400 rounded-full flex items-center justify-center shadow-lg border-2 border-white text-slate-800 font-bold">
                          <span className="text-lg">2</span>
                        </div>
                      </div>
                      <div className="bg-white/25 backdrop-blur-sm rounded-xl p-3 border border-white/30">
                        <p className="font-bold text-white text-base mb-1 truncate drop-shadow">{players[1]?.full_name || players[1]?.username}</p>
                        <p className="text-xs text-white/90 mb-2 truncate">@{players[1]?.username}</p>
                        <div className="inline-block px-3 py-1.5 bg-white/40 rounded-full shadow-lg">
                          <p className="font-bold text-white text-lg drop-shadow">{players[1]?.ranking_points}</p>
                          <p className="text-xs text-white/90">points</p>
                        </div>
                      </div>
                    </div>

                    {/* 1st Place */}
                    <div className="flex-1 max-w-[220px] text-center transform hover:scale-105 transition-transform">
                      <div className="relative inline-block mb-3">
                        <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-2xl ring-4 ring-yellow-400 ring-offset-2 ring-offset-white/50 overflow-hidden">
                          {players[0]?.profile_picture ? (
                            <img src={players[0].profile_picture} alt={players[0].username} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-5xl font-bold text-yellow-500">
                              {players[0]?.username?.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-xl animate-pulse border-2 border-white">
                          <span className="text-2xl"></span>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-yellow-400/40 to-amber-500/40 backdrop-blur-sm rounded-xl p-4 border-2 border-yellow-400/60 shadow-xl">
                        <p className="font-bold text-white text-lg mb-1 truncate drop-shadow">{players[0]?.full_name || players[0]?.username}</p>
                        <p className="text-sm text-white/95 mb-2 truncate">@{players[0]?.username}</p>
                        <div className="inline-block px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full shadow-xl">
                          <p className="font-bold text-white text-2xl drop-shadow">{players[0]?.ranking_points}</p>
                          <p className="text-xs text-white/95">points</p>
                        </div>
                      </div>
                    </div>

                    {/* 3rd Place */}
                    <div className="flex-1 max-w-[200px] text-center transform hover:scale-105 transition-transform">
                      <div className="relative inline-block mb-3">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl ring-4 ring-amber-600 overflow-hidden">
                          {players[2]?.profile_picture ? (
                            <img src={players[2].profile_picture} alt={players[2].username} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-3xl font-bold text-amber-600">
                              {players[2]?.username?.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-br from-amber-600 to-amber-700 rounded-full flex items-center justify-center shadow-lg border-2 border-white text-white font-bold">
                          <span className="text-lg">3</span>
                        </div>
                      </div>
                      <div className="bg-white/25 backdrop-blur-sm rounded-xl p-3 border border-white/30">
                        <p className="font-bold text-white text-base mb-1 truncate drop-shadow">{players[2]?.full_name || players[2]?.username}</p>
                        <p className="text-xs text-white/90 mb-2 truncate">@{players[2]?.username}</p>
                        <div className="inline-block px-3 py-1.5 bg-white/40 rounded-full shadow-lg">
                          <p className="font-bold text-white text-lg drop-shadow">{players[2]?.ranking_points}</p>
                          <p className="text-xs text-white/90">points</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Rankings List */}
            <div className="bg-white rounded-2xl shadow-tennis overflow-hidden mb-8">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">All Rankings</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {players.slice(players.length >= 3 ? 3 : 0).map((player, index) => {
                  const rank = index + (players.length >= 3 ? 4 : 1);
                  const badge = getRankBadge(rank);
                  return (
                    <div
                      key={player.id}
                      className="flex items-center p-5 hover:bg-gradient-to-r hover:from-green-50 hover:to-transparent transition-all"
                    >
                      <div className={`w-12 h-12 rounded-xl ${badge.bg} flex items-center justify-center mr-4 shadow-md`}>
                        <span className={`font-bold text-lg ${badge.text}`}>{badge.icon}</span>
                      </div>
                      <div className="w-14 h-14 rounded-full flex items-center justify-center mr-4 shadow-md ring-2 ring-gray-200">
                        {player.profile_picture ? (
                          <img src={player.profile_picture} alt={player.username} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-tennis-green to-tennis-green-light rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-xl">
                              {player.username?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-gray-900 text-lg">{player.full_name || player.username}</p>
                          {player.full_name && (
                            <span className="text-sm text-gray-500">@{player.username}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 text-xs font-bold rounded-full ${getSkillLevelColor(player.skill_level)} shadow-sm`}>
                            {player.skill_level === 'beginner' && '🌱 '}
                            {player.skill_level === 'intermediate' && '⭐ '}
                            {player.skill_level === 'advanced' && '🏆 '}
                            {player.skill_level?.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right mr-6">
                        <p className="font-bold text-2xl text-tennis-green">{player.ranking_points}</p>
                        <p className="text-xs text-gray-500 font-medium">points</p>
                      </div>
                      <div className="text-right bg-gray-50 rounded-lg px-4 py-2">
                        <p className="text-sm font-semibold">
                          <span className="text-green-600">{player.wins}W</span>
                          <span className="text-gray-400 mx-1">/</span>
                          <span className="text-red-600">{player.losses}L</span>
                        </p>
                        <p className="text-xs text-gray-500">Record</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-tennis p-6 text-center transform hover:scale-105 transition-transform">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-3xl">👥</span>
                </div>
                <p className="text-4xl font-bold text-gray-900 mb-2">{players.length}</p>
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Active Players</p>
              </div>
              <div className="bg-white rounded-2xl shadow-tennis p-6 text-center transform hover:scale-105 transition-transform">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-3xl">🎾</span>
                </div>
                <p className="text-4xl font-bold text-gray-900 mb-2">
                  {players.reduce((sum, p) => sum + p.matches_played, 0)}
                </p>
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Total Matches</p>
              </div>
              <div className="bg-white rounded-2xl shadow-tennis p-6 text-center transform hover:scale-105 transition-transform">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-3xl">✅</span>
                </div>
                <p className="text-4xl font-bold text-gray-900 mb-2">
                  {players.reduce((sum, p) => sum + p.wins, 0)}
                </p>
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Total Wins</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Leaderboard;
