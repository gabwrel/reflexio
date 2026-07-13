/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Award, Zap, Shield, Flame, Gauge, Clock, Trophy, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { ProfileStats, Achievement } from '../types';
import { audioSystem } from '../lib/audio';
import GlassPanel from './GlassPanel';

interface ProfileCardProps {
  displayName: string;
}

export default function ProfileCard({ displayName }: ProfileCardProps) {
  const [profile, setProfile] = useState<ProfileStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/profile/${encodeURIComponent(displayName)}`);
      if (!res.ok) throw new Error('Could not download trainer profile');
      const data = await res.json();
      setProfile(data.profile);
      setAchievements(data.achievements);
    } catch (err: any) {
      setError(err.message || 'Error downloading statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [displayName]);

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Zap':
        return <Zap className="w-5 h-5 text-yellow-400" />;
      case 'Flame':
        return <Flame className="w-5 h-5 text-orange-500 animate-pulse" />;
      case 'Gauge':
        return <Gauge className="w-5 h-5 text-cyan-400" />;
      case 'Shield':
        return <Shield className="w-5 h-5 text-purple-400" />;
      case 'Clock':
        return <Clock className="w-5 h-5 text-pink-400" />;
      default:
        return <Award className="w-5 h-5 text-zinc-400" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <GlassPanel glowColor="cyan" className="animate-pulse rounded-none border border-white/10">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="w-24 h-24 rounded-none bg-white/5" />
            <div className="space-y-3 flex-1">
              <div className="h-6 w-48 bg-white/5 rounded-none" />
              <div className="h-4 w-32 bg-white/5 rounded-none" />
            </div>
          </div>
        </GlassPanel>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <GlassPanel key={i} className="h-32 animate-pulse bg-white/[0.01] rounded-none border border-white/10" children={<div />} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <GlassPanel glowColor="orange" className="max-w-xl mx-auto text-center p-8 rounded-none border border-[#ff4e00]/20">
        <AlertCircle className="w-12 h-12 text-[#ff4e00] mx-auto mb-4" />
        <h3 className="text-xl font-black font-display italic uppercase tracking-tighter mb-2">Failed to load Profile</h3>
        <p className="text-white/40 text-sm mb-6">{error || 'No records found.'}</p>
        <button
          onClick={() => {
            audioSystem.playClick();
            fetchProfileData();
          }}
          className="inline-flex items-center gap-2 px-6 py-3 border border-white/20 hover:bg-white/10 text-white font-black text-xs uppercase tracking-wider skew-x-[-12deg] transition-all cursor-pointer"
        >
          <span className="flex items-center gap-2 skew-x-[12deg]">
            <RefreshCw className="w-4 h-4" />
            <span>RETRY DOWNLOAD</span>
          </span>
        </button>
      </GlassPanel>
    );
  }

  const unlockedCount = achievements.filter(a => a.unlockedAt !== null).length;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Upper card */}
      <GlassPanel glowColor="cyan" className="relative p-6 md:p-8 rounded-none border border-white/10">
        {/* Esports Corner Decoration */}
        <div className="absolute top-0 left-0 w-2 h-12 bg-[#00f2ff]" />
        <div className="absolute top-0 left-0 w-12 h-2 bg-[#00f2ff]" />

        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center text-center md:text-left justify-between">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative group">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-[#00f2ff] to-[#bc13fe] rounded-none blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                referrerPolicy="no-referrer"
                className="relative w-24 h-24 rounded-none bg-black border-2 border-[#00f2ff] object-cover"
              />
              <span className={`absolute -bottom-1 -right-1 text-[9px] font-black px-2 py-0.5 rounded-none border uppercase tracking-widest shadow-lg ${
                profile.is_guest 
                  ? 'bg-zinc-800 text-zinc-400 border-zinc-700' 
                  : 'bg-[#bc13fe] text-white border-[#bc13fe]/50 animate-pulse'
              }`}>
                {profile.is_guest ? 'GUEST' : 'PRO'}
              </span>
            </div>

            <div>
              <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                <h2 className="text-3xl font-black font-display italic tracking-tighter text-white uppercase">
                  {profile.display_name}
                </h2>
                {!profile.is_guest && profile.email && (
                  <span className="text-xs font-sans text-white/40 bg-white/5 px-2.5 py-0.5 rounded-none border border-white/10 self-center">
                    {profile.email}
                  </span>
                )}
              </div>
              <p className="text-xs text-white/30 font-display font-black tracking-widest uppercase italic">
                MEMBER SINCE {new Date(profile.created_at).toLocaleDateString()} • {profile.games_played} TOTAL MATCHES
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              audioSystem.playClick();
              fetchProfileData();
            }}
            className="p-2.5 rounded-none border border-white/10 bg-black/40 hover:bg-white/10 text-white/60 hover:text-white transition-colors self-center md:self-auto cursor-pointer"
            title="Reload statistics"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/10">
          <div className="bg-white/[0.01] p-4 rounded-none border border-white/10 text-center">
            <span className="block text-xs font-black text-white/35 uppercase tracking-wider mb-1">Classic PB</span>
            <span className="text-2xl font-black font-display italic text-[#00f2ff]">
              {profile.classic_best ? `${profile.classic_best}ms` : '--'}
            </span>
          </div>

          <div className="bg-white/[0.01] p-4 rounded-none border border-white/10 text-center">
            <span className="block text-xs font-black text-white/35 uppercase tracking-wider mb-1">Classic Avg</span>
            <span className="text-2xl font-black font-display italic text-white">
              {profile.classic_avg ? `${profile.classic_avg}ms` : '--'}
            </span>
          </div>

          <div className="bg-white/[0.01] p-4 rounded-none border border-white/10 text-center">
            <span className="block text-xs font-black text-white/35 uppercase tracking-wider mb-1">Spike High Score</span>
            <span className="text-2xl font-black font-display italic text-[#bc13fe]">
              {profile.spike_best_score ? `${profile.spike_best_score}` : '--'}
            </span>
          </div>

          <div className="bg-white/[0.01] p-4 rounded-none border border-white/10 text-center">
            <span className="block text-xs font-black text-white/35 uppercase tracking-wider mb-1">Spike Clutch PB</span>
            <span className="text-2xl font-black font-display italic text-pink-400">
              {profile.spike_best_remaining ? `${profile.spike_best_remaining.toFixed(3)}s` : '--'}
            </span>
          </div>
        </div>
      </GlassPanel>

      {/* Achievements section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#bc13fe]" />
            <h3 className="text-lg font-black font-display italic uppercase tracking-tighter text-white">
              Achievements
            </h3>
          </div>
          <span className="text-[10px] font-black text-white/60 bg-white/5 px-3 py-1 rounded-none border border-white/10 uppercase tracking-widest italic">
            {unlockedCount} / {achievements.length} UNLOCKED
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((ach) => {
            const isUnlocked = ach.unlockedAt !== null;
            return (
              <GlassPanel
                key={ach.id}
                glowColor={isUnlocked ? 'purple' : 'none'}
                className={`transition-all duration-300 rounded-none border ${
                  isUnlocked 
                    ? 'bg-white/[0.02] border-[#bc13fe]/30 shadow-[0_0_15px_rgba(188,19,254,0.05)]' 
                    : 'opacity-40 grayscale border-white/5 bg-white/[0.005]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-none border ${
                    isUnlocked 
                      ? 'bg-[#bc13fe]/10 border-[#bc13fe]/20 text-[#bc13fe] shadow-[0_0_10px_rgba(188,19,254,0.15)]' 
                      : 'bg-white/5 border-white/10 text-white/20'
                  }`}>
                    {getIconComponent(ach.icon)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`text-sm font-black uppercase tracking-wide truncate ${isUnlocked ? 'text-white' : 'text-white/30'}`}>
                        {ach.title}
                      </h4>
                      {isUnlocked && (
                        <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
                      )}
                    </div>
                    
                    <p className="text-xs text-white/50 leading-snug mb-3 min-h-[2rem] font-sans">
                      {ach.description}
                    </p>

                    <div className="flex justify-between items-center text-[10px] font-mono mt-2 pt-2 border-t border-white/5 uppercase font-bold">
                      <span className={isUnlocked ? 'text-[#bc13fe] font-black' : 'text-white/20'}>
                        {ach.metric}
                      </span>
                      {isUnlocked && ach.unlockedAt && (
                        <span className="text-white/35">
                          {new Date(ach.unlockedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </GlassPanel>
            );
          })}
        </div>
      </div>
    </div>
  );
}
