import React, { useState, useEffect } from 'react';
import api from '../services/api';

function TournamentBracket({ tournamentId }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
  }, [tournamentId]);

  const fetchMatches = async () => {
    try {
      const data = await api.getMatches({ tournament_id: tournamentId });
      setMatches(data || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
    setLoading(false);
  };

  const getRounds = () => {
    const rounds = {};
    matches.forEach((match) => {
      const round = match.round_number || 1;
      if (!rounds[round]) rounds[round] = [];
      rounds[round].push(match);
    });
    return rounds;
  };

  const getPlayerName = (player) => player?.full_name || player?.username || 'TBD';

  const getMatchStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-50 border-green-400';
      case 'in_progress': return 'bg-blue-50 border-blue-400';
      default: return 'bg-white border-gray-300';
    }
  };

  const getRoundName = (roundNum, totalRounds) => {
    if (roundNum == totalRounds) return 'Final';
    if (roundNum == totalRounds - 1) return 'Semi-Finals';
    if (roundNum == totalRounds - 2) return 'Quarter-Finals';
    return `Round ${roundNum}`;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-tennis-green border-t-transparent"></div>
        <p className="mt-2 text-gray-600">Loading bracket...</p>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No matches scheduled yet</p>
      </div>
    );
  }

  const rounds = getRounds();
  const roundNumbers = Object.keys(rounds).sort((a, b) => a - b);

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-6 min-w-max">
        {roundNumbers.map((roundNum) => (
          <div key={roundNum} className="flex flex-col gap-4 min-w-[300px]">
            <div className="text-center mb-2">
              <h3 className="text-lg font-bold text-gray-900 bg-gradient-to-r from-tennis-green to-tennis-green-light text-transparent bg-clip-text">
                {getRoundName(roundNum, roundNumbers.length)}
              </h3>
              <p className="text-xs text-gray-500 mt-1">{rounds[roundNum].length} matches</p>
            </div>
            {rounds[roundNum].map((match) => (
              <div key={match.id} className={`border-2 rounded-xl p-4 shadow-sm ${getMatchStatusColor(match.status)} transition-all hover:shadow-md`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-500">Match #{match.match_number}</span>
                  {match.scheduled_time && (
                    <span className="text-xs text-gray-500">
                      {new Date(match.scheduled_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
                
                <div className={`flex items-center justify-between p-3 rounded-lg mb-2 transition-all ${
                  match.winner_id === match.player1?.id 
                    ? 'bg-gradient-to-r from-green-100 to-green-50 border-2 border-green-400 shadow-sm' 
                    : 'bg-white border border-gray-200'
                }`}>
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-8 h-8 bg-tennis-green text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {getPlayerName(match.player1)[0]}
                    </div>
                    <span className="font-semibold text-gray-900 text-sm">{getPlayerName(match.player1)}</span>
                  </div>
                  <span className="font-bold text-lg text-gray-900 ml-2">{match.player1_score || '0'}</span>
                </div>
                
                <div className="text-center text-xs text-gray-400 font-semibold my-2">VS</div>
                
                <div className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                  match.winner_id === match.player2?.id 
                    ? 'bg-gradient-to-r from-green-100 to-green-50 border-2 border-green-400 shadow-sm' 
                    : 'bg-white border border-gray-200'
                }`}>
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-8 h-8 bg-tennis-green-light text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {getPlayerName(match.player2)[0]}
                    </div>
                    <span className="font-semibold text-gray-900 text-sm">{getPlayerName(match.player2)}</span>
                  </div>
                  <span className="font-bold text-lg text-gray-900 ml-2">{match.player2_score || '0'}</span>
                </div>

                {match.status === 'completed' && match.winner_id && (
                  <div className="mt-3 text-center">
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                      ✓ Winner: {match.winner_id === match.player1?.id ? getPlayerName(match.player1) : getPlayerName(match.player2)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TournamentBracket;
