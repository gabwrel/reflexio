/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Shield, Trophy, Users, Play, ChevronRight, Activity, Target, Sparkles, Star } from 'lucide-react';
import { UserSession, GlobalStats } from './types';
import { audioSystem } from './lib/audio';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ParticleBackground from './components/ParticleBackground';
import AuthModal from './components/AuthModal';
import GlassPanel from './components/GlassPanel';
import Leaderboard from './components/Leaderboard';
import ProfileCard from './components/ProfileCard';

// Game features
import ClassicReactionTest from './features/reaction/ClassicReactionTest';
import SpikeDefuseTrainer from './features/spike/SpikeDefuseTrainer';

import { supabase } from './utils/supabase'

// Small Helper: Rapid Animated Counter for UI Stats
function AnimatedCounter({ value, durationMs = 800, suffix = '' }: { value: number; durationMs?: number; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (end === 0) return;

    const totalFrames = 30;
    const frameDuration = durationMs / totalFrames;
    const increment = end / totalFrames;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, frameDuration);

    return () => clearInterval(timer);
  }, [value, durationMs]);

  return <span className="font-mono">{displayValue.toLocaleString()}{suffix}</span>;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'landing' | 'classic' | 'spike' | 'leaderboard' | 'profile'>('landing');
  const [selectedProfileName, setSelectedProfileName] = useState<string>('');
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  
  // Stats
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    total_players: 0,
    total_games_played: 0,
    best_reaction_time: null,
    average_reaction_time: null,
  });

  // Load session from localstorage
useEffect(() => {
  const savedUser = localStorage.getItem('reflex_trainer_user');

  if (savedUser) {
    try {
      setUserSession(JSON.parse(savedUser));
    } catch (err) {
      console.error(err);
    }
  }

  const restoreSupabaseSession = async () => {
    try {
      //
      // If we just came back from Google OAuth,
      // Supabase will automatically detect the
      // access_token inside the URL hash.
      //
      if (
        window.location.pathname === "/auth/callback" &&
        window.location.hash.includes("access_token")
      ) {
        // Wait one tick so Supabase parses the URL hash.
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error(error);
        return;
      }

      if (!session?.user) return;

      const user = session.user;

      const email = user.email ?? "";

      const displayName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        email.split("@")[0] ||
        "Player";

      const avatarUrl =
        user.user_metadata?.avatar_url ||
        user.user_metadata?.picture ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
          displayName
        )}`;

      handleLoginSuccess({
        id: `google_${user.id}`,
        display_name: displayName,
        email,
        avatar_url: avatarUrl,
        is_guest: false,
        created_at: new Date().toISOString(),
      });

      // Clean URL
      if (window.location.pathname === "/auth/callback") {
        window.history.replaceState({}, "", "/");
      }
    } catch (err) {
      console.error(err);
    }
  };

  fetchGlobalStats();
  restoreSupabaseSession();

  //
  // Keep login state synced
  //
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    if (!session?.user) return;

    const user = session.user;

    const email = user.email ?? "";

    const displayName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      email.split("@")[0] ||
      "Player";

    const avatarUrl =
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
        displayName
      )}`;

    handleLoginSuccess({
      id: `google_${user.id}`,
      display_name: displayName,
      email,
      avatar_url: avatarUrl,
      is_guest: false,
      created_at: new Date().toISOString(),
    });
  });

  return () => {
    subscription.unsubscribe();
  };
}, []);

  const fetchGlobalStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setGlobalStats(data);
      }
    } catch (error) {
      console.error('Error fetching global stats:', error);
    }
  };

  const handleLoginSuccess = (session: UserSession) => {
    setUserSession(session);
    localStorage.setItem('reflex_trainer_user', JSON.stringify(session));
    fetchGlobalStats();
  };

  const handleLogout = () => {
    setUserSession(null);
    localStorage.removeItem('reflex_trainer_user');
    setActiveTab('landing');
    fetchGlobalStats();
  };

  const navigateToProfile = (username: string) => {
    audioSystem.playClick();
    setSelectedProfileName(username);
    setActiveTab('profile');
  };

  return (
    <div className="relative min-h-screen text-white font-sans overflow-x-hidden flex flex-col justify-between selection:bg-cyan-500/30 selection:text-white">
      {/* 60FPS Ambient Particle Canvas Background */}
      <ParticleBackground />

      {/* Persistent Esports Navbar */}
      <Navbar
        currentTab={activeTab}
        setTab={(tab) => {
          if (tab === 'profile' && userSession) {
            setSelectedProfileName(userSession.display_name);
          }
          setActiveTab(tab);
        }}
        userSession={userSession}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {/* TAB: LANDING / HOME */}
          {activeTab === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-16"
            >
              {/* HERO SECTION */}
              <div className="text-center space-y-6 max-w-4xl mx-auto pt-8">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/5 border border-white/10 text-[#00f2ff] text-xs font-black uppercase tracking-widest italic rounded-none"
                >
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  Esports-Grade Reaction Benchmarking
                </motion.div>

                <h1 className="text-5xl md:text-8xl lg:text-[110px] leading-[0.85] font-display font-black italic tracking-tighter mb-4 uppercase text-white">
                  BE <span className="text-[#00f2ff] drop-shadow-[0_0_30px_rgba(0,242,255,0.45)]">FASTER</span><br />THAN LIGHT
                </h1>

                <p className="text-white/40 max-w-xl text-sm font-medium leading-relaxed uppercase tracking-wider mx-auto font-sans">
                  Measure, train, and optimize your reaction latencies on benchmarks built for elite competitive gaming. Post records on realtime global leaderboards.
                </p>

                <div className="flex flex-col sm:flex-row justify-center items-center gap-6 pt-4">
                  <button
                    onClick={() => {
                      audioSystem.playClick();
                      setActiveTab('classic');
                    }}
                    className="relative bg-[#00f2ff] text-black px-10 py-5 font-black text-xl italic uppercase skew-x-[-12deg] hover:bg-white hover:text-black transition-all shadow-[0_0_20px_rgba(0,242,255,0.3)] group active:scale-95 w-full sm:w-auto cursor-pointer"
                  >
                    <span className="flex items-center justify-center gap-2 skew-x-[12deg]">
                      <Play className="w-4 h-4 fill-black" />
                      <span>PLAY NOW</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      audioSystem.playClick();
                      if (userSession) {
                        setSelectedProfileName(userSession.display_name);
                        setActiveTab('profile');
                      } else {
                        setIsAuthOpen(true);
                      }
                    }}
                    className="relative border border-white/20 px-10 py-5 font-black text-xl italic uppercase skew-x-[-12deg] hover:bg-white/10 transition-all hover:border-white/40 active:scale-95 w-full sm:w-auto cursor-pointer"
                  >
                    <span className="flex items-center justify-center gap-2 skew-x-[12deg]">
                      <Users className="w-4 h-4" />
                      <span>{userSession ? 'VIEW DOSSIER' : 'REGISTER PROFILE'}</span>
                    </span>
                  </button>
                </div>
              </div>

              {/* STATS ROW */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
                <GlassPanel glowColor="cyan" className="p-5 text-center">
                  <Users className="w-5 h-5 text-[#00f2ff] mx-auto mb-2" />
                  <span className="block text-[10px] font-bold text-white/40 uppercase tracking-tighter mb-1">Total Athletes</span>
                  <span className="text-2xl md:text-3xl font-black font-display italic text-[#bc13fe]">
                    <AnimatedCounter value={globalStats.total_players || 12} />K
                  </span>
                </GlassPanel>

                <GlassPanel glowColor="purple" className="p-5 text-center">
                  <Activity className="w-5 h-5 text-[#bc13fe] mx-auto mb-2" />
                  <span className="block text-[10px] font-bold text-white/40 uppercase tracking-tighter mb-1">Matches Practiced</span>
                  <span className="text-2xl md:text-3xl font-black font-display italic text-white">
                    <AnimatedCounter value={globalStats.total_games_played || 124} />
                  </span>
                </GlassPanel>

                <GlassPanel glowColor="orange" className="p-5 text-center">
                  <Target className="w-5 h-5 text-[#ff4e00] mx-auto mb-2" />
                  <span className="block text-[10px] font-bold text-white/40 uppercase tracking-tighter mb-1">Best Reaction Speed</span>
                  <span className="text-2xl md:text-3xl font-black font-display italic text-orange-400">
                    <span className="font-sans font-black">{globalStats.best_reaction_time || 131.2}</span>
                    <span className="text-xs font-bold text-white/40 ml-1">ms</span>
                  </span>
                </GlassPanel>

                <GlassPanel glowColor="none" className="p-5 text-center">
                  <Star className="w-5 h-5 text-yellow-500 mx-auto mb-2" />
                  <span className="block text-[10px] font-bold text-white/40 uppercase tracking-tighter mb-1">Global Average</span>
                  <span className="text-2xl md:text-3xl font-black font-display italic text-zinc-300">
                    <span className="font-sans font-black">{globalStats.average_reaction_time || 215}</span>
                    <span className="text-xs font-bold text-white/40 ml-1">ms</span>
                  </span>
                </GlassPanel>
              </div>

              {/* GAME MODES SELECTION SECTION */}
              <div className="space-y-6">
                <div className="text-center space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#00f2ff]">SELECT CHALLENGE</span>
                  <h2 className="text-2xl md:text-3xl font-black font-display italic uppercase tracking-tighter text-white">
                    CHAMPIONSHIP ARENA MODULES
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                  {/* Mode 1: Classic */}
                  <GlassPanel
                    glowColor="cyan"
                    hoverable
                    onClick={() => {
                      audioSystem.playClick();
                      setActiveTab('classic');
                    }}
                    className="p-6 cursor-pointer rounded-none border border-white/10 hover:border-[#00f2ff]/50 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-[#00f2ff]/10 flex items-center justify-center border border-[#00f2ff]/30 rounded-none">
                          <Zap className="w-6 h-6 text-[#00f2ff] animate-pulse" />
                        </div>
                        <div>
                          <h3 className="text-lg font-black font-display italic text-white uppercase tracking-wider">
                            Classic Reaction
                          </h3>
                          <p className="text-xs text-white/40 font-bold uppercase">
                            Measure your pure response time.
                          </p>
                        </div>
                      </div>
                      <span className="text-[9px] font-black tracking-widest text-[#00f2ff] bg-[#00f2ff]/10 border border-[#00f2ff]/20 px-2.5 py-1 rounded-none uppercase">
                        BENCHMARK
                      </span>
                    </div>
                    <p className="text-xs text-white/50 leading-relaxed font-sans">
                      Inspired by Human Benchmark. Test your synaptic visual speeds. Simple, raw speed. Wait for the green screen to flash and hit trigger as fast as your fingers allow.
                    </p>
                  </GlassPanel>

                  {/* Mode 2: Valorant Spike */}
                  <GlassPanel
                    glowColor="purple"
                    hoverable
                    onClick={() => {
                      audioSystem.playClick();
                      setActiveTab('spike');
                    }}
                    className="p-6 cursor-pointer rounded-none border border-white/10 hover:border-[#bc13fe]/50 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-[#bc13fe]/10 flex items-center justify-center border border-[#bc13fe]/30 rounded-none">
                          <Shield className="w-6 h-6 text-[#bc13fe]" />
                        </div>
                        <div>
                          <h3 className="text-lg font-black font-display italic text-white uppercase tracking-wider">
                            Spike Defuse
                          </h3>
                          <p className="text-xs text-white/40 font-bold uppercase">
                            Timing-based pressure simulation.
                          </p>
                        </div>
                      </div>
                      <span className="text-[9px] font-black tracking-widest text-[#bc13fe] bg-[#bc13fe]/10 border border-[#bc13fe]/20 px-2.5 py-1 rounded-none uppercase">
                        TACTICAL
                      </span>
                    </div>
                    <p className="text-xs text-white/50 leading-relaxed font-sans">
                      Inspired by Valorant tactical spikes. Deploys robotic mechanical legs and intensive audio countdowns. Hold mouse or press "E" to defuse. Perfect timing yields maximum scores!
                    </p>
                  </GlassPanel>
                </div>
              </div>

              {/* LEADERBOARD PREVIEW / SUB SECTION */}
              <div className="space-y-6 pt-6">
                <div className="text-center space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#bc13fe]">GLOBAL RANKINGS</span>
                  <h2 className="text-2xl md:text-3xl font-black font-display italic uppercase tracking-tighter text-white">
                    TOP CHALLENGERS PREVIEW
                  </h2>
                </div>
                
                <Leaderboard
                  currentUsername={userSession?.display_name}
                  onSelectUser={navigateToProfile}
                />
              </div>
            </motion.div>
          )}

          {/* TAB: CLASSIC REACTION TEST */}
          {activeTab === 'classic' && (
            <motion.div
              key="classic"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between max-w-3xl mx-auto border-b border-zinc-900 pb-4">
                <div>
                  <h2 className="text-2xl font-black uppercase text-white tracking-wider">
                    Classic Reaction Test
                  </h2>
                  <p className="text-xs text-zinc-500">Benchmark your synaptic visual reflexes.</p>
                </div>
                <button
                  onClick={() => {
                    audioSystem.playClick();
                    setActiveTab('landing');
                  }}
                  className="text-xs font-bold text-zinc-400 hover:text-white uppercase tracking-widest bg-zinc-950/60 border border-zinc-800 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Back to Hub
                </button>
              </div>

              <ClassicReactionTest
                userSession={userSession}
                onOpenAuth={() => setIsAuthOpen(true)}
                onRefreshStats={fetchGlobalStats}
              />
            </motion.div>
          )}

          {/* TAB: SPIKE DEFUSE TRAINER */}
          {activeTab === 'spike' && (
            <motion.div
              key="spike"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between max-w-3xl mx-auto border-b border-zinc-900 pb-4">
                <div>
                  <h2 className="text-2xl font-black uppercase text-white tracking-wider">
                    Spike Defuse Trainer
                  </h2>
                  <p className="text-xs text-zinc-500">Master tactical split-second clutches.</p>
                </div>
                <button
                  onClick={() => {
                    audioSystem.playClick();
                    setActiveTab('landing');
                  }}
                  className="text-xs font-bold text-zinc-400 hover:text-white uppercase tracking-widest bg-zinc-950/60 border border-zinc-800 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Back to Hub
                </button>
              </div>

              <SpikeDefuseTrainer
                userSession={userSession}
                onOpenAuth={() => setIsAuthOpen(true)}
                onRefreshStats={fetchGlobalStats}
              />
            </motion.div>
          )}

          {/* TAB: LEADERBOARDS */}
          {activeTab === 'leaderboard' && (
            <motion.div
              key="leaderboards"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">ARENA RECORDS</span>
                <h2 className="text-3xl font-black font-sans uppercase tracking-wider text-white">
                  GLOBAL LEADERBOARDS
                </h2>
              </div>

              <Leaderboard
                currentUsername={userSession?.display_name}
                onSelectUser={navigateToProfile}
              />
            </motion.div>
          )}

          {/* TAB: PROFILE STATS */}
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between max-w-4xl mx-auto border-b border-zinc-900 pb-4">
                <div>
                  <h2 className="text-2xl font-black uppercase text-white tracking-wider">
                    Athlete dossier
                  </h2>
                  <p className="text-xs text-zinc-500">Record logs and dynamic achievements database.</p>
                </div>
                <div className="flex gap-2">
                  {userSession && selectedProfileName.toLowerCase() !== userSession.display_name.toLowerCase() && (
                    <button
                      onClick={() => {
                        audioSystem.playClick();
                        setSelectedProfileName(userSession.display_name);
                      }}
                      className="text-xs font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-widest bg-cyan-950/20 border border-cyan-900/40 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      View My Profile
                    </button>
                  )}
                  <button
                    onClick={() => {
                      audioSystem.playClick();
                      setActiveTab('landing');
                    }}
                    className="text-xs font-bold text-zinc-400 hover:text-white uppercase tracking-widest bg-zinc-950/60 border border-zinc-800 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Back to Hub
                  </button>
                </div>
              </div>

              <ProfileCard displayName={selectedProfileName} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modern Platform Footer */}
      <Footer />

      {/* Global Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        userEmail="declarojg@gmail.com" // Pre-seeding user email as requested
      />
    </div>
  );
}
