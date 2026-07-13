/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RefreshCw, Calendar, Clock, Zap, Shield, Search, ArrowRight, Sparkles } from 'lucide-react';
import { ScoreEntry } from '../types';
import { audioSystem } from '../lib/audio';
import GlassPanel from './GlassPanel';

interface LeaderboardProps {
  currentUsername?: string;
  onSelectUser?: (username: string) => void;
}

export default function Leaderboard({ currentUsername, onSelectUser }: LeaderboardProps) {
  const [gameMode, setGameMode] = useState<'classic' | 'spike'>('classic');
  const [period, setPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchScores = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setIsRefreshing(true);

      const res = await fetch(`/api/leaderboard?mode=${gameMode}&period=${period}`);
      if (!res.ok) throw new Error('Could not download leaderboards');
      const data = await res.json();
      setScores(data);
    } catch (error) {
      console.error('Error fetching scores:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchScores();
    // Live Leaderboard Polling - poll every 10 seconds to simulate real-time updates!
    const interval = setInterval(() => {
      fetchScores(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [gameMode, period]);

  const filteredScores = scores.filter(s =>
    s.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Divide scores into top 3 (podium) and rest
  const topThree = filteredScores.slice(0, 3);
  const remaining = filteredScores.slice(3);

  // Rearrange topThree as: [Silver (2nd), Gold (1st), Bronze (3rd)] for beautiful podium layout
  const podiumOrder = [];
  if (topThree[1]) podiumOrder.push({ ...topThree[1], rank: 2 });
  if (topThree[0]) podiumOrder.push({ ...topThree[0], rank: 1 });
  if (topThree[2]) podiumOrder.push({ ...topThree[2], rank: 3 });

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Filters bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] p-4 rounded-none border border-white/10 backdrop-blur-md">
        {/* Game Mode Toggle */}
        <div className="flex gap-2 bg-black/40 p-1 rounded-none border border-white/10 self-start md:self-auto">
          <button
            onClick={() => {
              audioSystem.playClick();
              setGameMode('classic');
            }}
            className={`flex items-center gap-2 py-1.5 px-4 text-xs font-black italic uppercase tracking-wider rounded-none transition-all duration-200 ${
              gameMode === 'classic'
                ? 'bg-[#00f2ff] text-black shadow-lg shadow-[#00f2ff]/20'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Classic Test
          </button>
          <button
            onClick={() => {
              audioSystem.playClick();
              setGameMode('spike');
            }}
            className={`flex items-center gap-2 py-1.5 px-4 text-xs font-black italic uppercase tracking-wider rounded-none transition-all duration-200 ${
              gameMode === 'spike'
                ? 'bg-[#bc13fe] text-white shadow-lg shadow-[#bc13fe]/30'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Spike Defuse
          </button>
        </div>

        {/* Time periods */}
        <div className="flex flex-wrap gap-2">
          {([
            { id: 'all', label: 'All-Time' },
            { id: 'month', label: 'Monthly' },
            { id: 'week', label: 'Weekly' },
            { id: 'today', label: 'Today' },
          ] as const).map((p) => (
            <button
              key={p.id}
              onClick={() => {
                audioSystem.playClick();
                setPeriod(p.id);
              }}
              className={`py-1 px-3 rounded-none text-[11px] font-black italic uppercase tracking-wider border transition-all duration-200 ${
                period === p.id
                  ? 'bg-white/10 border-white/25 text-white'
                  : 'bg-transparent border-transparent text-white/40 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Search & Status */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search player..."
              className="bg-black/40 border border-white/10 text-xs px-8 py-2 rounded-none text-white focus:outline-none focus:border-[#00f2ff] w-full md:w-44 transition-colors font-sans"
            />
          </div>

          <button
            onClick={() => {
              audioSystem.playClick();
              fetchScores();
            }}
            disabled={loading || isRefreshing}
            className={`p-2 rounded-none border border-white/10 bg-black/40 hover:bg-white/10 text-white/60 hover:text-white transition-colors disabled:opacity-50 ${
              isRefreshing ? 'animate-spin' : ''
            }`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Live indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-500/10 border border-green-500/30 rounded-none">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-green-400">Live</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 pt-12">
          <div className="h-44 bg-white/[0.02] border border-white/10 rounded-none animate-pulse flex items-center justify-center">
            <span className="text-white/40 text-xs font-mono uppercase tracking-widest">Compiling Leaderboards...</span>
          </div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <div className="space-y-8">
            {/* Podium display (Only visible if score records exist and no active query filter hides them) */}
            {podiumOrder.length > 0 && (
              <div className="grid grid-cols-3 gap-3 md:gap-6 pt-8 pb-4 max-w-2xl mx-auto items-end">
                {podiumOrder.map((user) => {
                  const isCurrentUser = currentUsername && user.display_name.toLowerCase() === currentUsername.toLowerCase();
                  
                  // Color highlights
                  const rankColors = {
                    1: {
                      gradient: 'from-amber-500/15 to-amber-600/5 border-amber-500/40',
                      text: 'text-amber-400',
                      badge: 'bg-amber-500 text-black shadow-lg shadow-amber-500/40',
                      height: 'h-40 md:h-48 border-t-2 border-t-amber-400',
                    },
                    2: {
                      gradient: 'from-slate-400/10 to-slate-500/5 border-slate-400/30',
                      text: 'text-slate-300',
                      badge: 'bg-slate-400 text-black shadow-lg shadow-slate-400/30',
                      height: 'h-32 md:h-38',
                    },
                    3: {
                      gradient: 'from-amber-800/10 to-amber-900/5 border-amber-800/30',
                      text: 'text-amber-700',
                      badge: 'bg-amber-700 text-white shadow-lg shadow-amber-800/30',
                      height: 'h-24 md:h-30',
                    },
                  }[user.rank as 1 | 2 | 3];

                  return (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (4 - user.rank) * 0.1, type: 'spring', stiffness: 100 }}
                      className="flex flex-col items-center"
                    >
                      {/* Avatar */}
                      <div className="relative mb-3 group cursor-pointer" onClick={() => onSelectUser?.(user.display_name)}>
                        <div className={`absolute -inset-1 bg-gradient-to-r rounded-none blur-sm opacity-0 group-hover:opacity-70 transition duration-500 ${
                          user.rank === 1 ? 'from-amber-400 to-yellow-300' : 'from-zinc-500 to-zinc-700'
                        }`} />
                        <img
                          src={user.avatar_url}
                          alt={user.display_name}
                          className={`relative w-12 h-12 md:w-16 md:h-16 rounded-none bg-black border-2 object-cover ${
                            user.rank === 1 ? 'border-amber-400' : user.rank === 2 ? 'border-slate-400' : 'border-amber-700'
                          }`}
                        />
                        <span className={`absolute -bottom-1 -right-1 flex items-center justify-center w-5 h-5 rounded-none text-[10px] font-black font-mono ${rankColors.badge}`}>
                          {user.rank}
                        </span>
                      </div>

                      {/* Display Name */}
                      <span
                        onClick={() => onSelectUser?.(user.display_name)}
                        className={`text-xs md:text-sm font-black uppercase tracking-wider truncate max-w-[100px] text-center block cursor-pointer hover:underline ${
                          isCurrentUser ? 'text-[#00f2ff] underline' : 'text-white/95'
                        }`}
                      >
                        {user.display_name}
                      </span>

                      {/* Score Value */}
                      <span className={`text-[11px] md:text-xs font-mono font-black mt-1 mb-3 ${rankColors.text}`}>
                        {gameMode === 'classic' ? `${user.score}ms` : `Score: ${user.score}`}
                      </span>

                      {/* Pedestal platform */}
                      <div className={`w-full bg-gradient-to-t rounded-none border border-b-0 flex flex-col justify-between p-3 text-center shadow-inner ${rankColors.height} ${rankColors.gradient}`}>
                        <div className="text-[9px] font-display text-white/40 font-black tracking-widest mt-2 uppercase">
                          {user.rank === 1 ? 'CHAMPION' : user.rank === 2 ? 'CONTENDER' : 'CHALLENGER'}
                        </div>
                        {gameMode === 'spike' && user.remaining_time_ms !== undefined && (
                          <div className="text-[10px] font-mono text-white/80 mt-auto leading-relaxed">
                            <span className="block text-[8px] text-white/30 uppercase font-black tracking-wider">Clutch Remaining</span>
                            {user.remaining_time_ms.toFixed(3)}s
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* List rankings table */}
            <div className="bg-white/[0.01] border border-white/10 rounded-none overflow-hidden shadow-xl backdrop-blur-md">
              <div className="grid grid-cols-12 px-6 py-4 border-b border-white/10 text-[10px] font-black text-white/40 uppercase tracking-wider">
                <div className="col-span-2">Rank</div>
                <div className="col-span-6">Player Name</div>
                <div className="col-span-4 text-right">
                  {gameMode === 'classic' ? 'Reaction Time' : 'Defusal Score'}
                </div>
              </div>

              {filteredScores.length === 0 ? (
                <div className="px-6 py-12 text-center text-white/40 text-xs font-mono uppercase tracking-wider">
                  No records matching search query.
                </div>
              ) : (
                <div className="divide-y divide-white/5 max-h-[350px] overflow-y-auto custom-scrollbar">
                  {filteredScores.map((user, idx) => {
                    const rank = idx + 1;
                    const isCurrentUser = currentUsername && user.display_name.toLowerCase() === currentUsername.toLowerCase();

                    return (
                      <div
                        key={user.id}
                        onClick={() => onSelectUser?.(user.display_name)}
                        className={`grid grid-cols-12 px-6 py-3 items-center text-xs transition-colors hover:bg-white/[0.02] cursor-pointer ${
                          isCurrentUser ? 'bg-[#00f2ff]/5 border-l-2 border-l-[#00f2ff]' : ''
                        }`}
                      >
                        {/* Rank */}
                        <div className="col-span-2 font-display font-black italic text-white/60">
                          {rank === 1 ? (
                            <span className="text-amber-400 font-black">#01</span>
                          ) : rank === 2 ? (
                            <span className="text-slate-300 font-black">#02</span>
                          ) : rank === 3 ? (
                            <span className="text-amber-750 font-black">#03</span>
                          ) : (
                            <span>#{rank < 10 ? `0${rank}` : rank}</span>
                          )}
                        </div>

                        {/* Player Column */}
                        <div className="col-span-6 flex items-center gap-3">
                          <img
                             src={user.avatar_url}
                             alt={user.display_name}
                             className="w-7 h-7 rounded-none bg-black object-cover border border-white/10"
                          />
                          <div className="truncate pr-4">
                            <span className={`font-black uppercase tracking-wide hover:underline ${
                              isCurrentUser ? 'text-[#00f2ff] underline font-black' : 'text-white/90'
                            }`}>
                              {user.display_name}
                            </span>
                            <span className={`ml-2 text-[9px] font-black px-1.5 py-0.25 rounded-none border uppercase tracking-widest ${
                              user.is_guest 
                                ? 'bg-white/5 text-white/40 border-white/10' 
                                : 'bg-[#bc13fe]/20 text-[#bc13fe] border-[#bc13fe]/30'
                            }`}>
                              {user.is_guest ? 'Guest' : 'Pro'}
                            </span>
                          </div>
                        </div>

                        {/* Metrics score columns */}
                        <div className="col-span-4 text-right font-display font-black italic">
                          {gameMode === 'classic' ? (
                            <span className="text-[#00f2ff]">{user.score} ms</span>
                          ) : (
                            <div className="flex flex-col items-end">
                              <span className="text-[#bc13fe]">{user.score}</span>
                              {user.remaining_time_ms !== undefined && (
                                <span className="text-[10px] text-white/40 font-mono tracking-tighter not-italic">
                                  +{user.remaining_time_ms.toFixed(3)}s left
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
