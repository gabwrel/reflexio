/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Shield, Zap, Trophy, User, LogIn, LogOut, Disc, Volume2 } from 'lucide-react';
import { UserSession } from '../types';
import { audioSystem } from '../lib/audio';
import SoundToggle from './SoundToggle';

interface NavbarProps {
  currentTab: 'landing' | 'classic' | 'spike' | 'leaderboard' | 'profile';
  setTab: (tab: 'landing' | 'classic' | 'spike' | 'leaderboard' | 'profile') => void;
  userSession: UserSession | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export default function Navbar({ currentTab, setTab, userSession, onOpenAuth, onLogout }: NavbarProps) {
  const tabs = [
    { id: 'landing', label: 'Home', icon: Disc },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  ] as const;

  const handleTabChange = (tabId: 'landing' | 'classic' | 'spike' | 'leaderboard' | 'profile') => {
    audioSystem.playHover();
    setTab(tabId);
  };

  return (
    <nav className="sticky top-0 z-40 bg-[#050505]/85 border-b border-white/10 backdrop-blur-md px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo */}
        <div
          onClick={() => handleTabChange('landing')}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="w-7 h-7 bg-[#00f2ff] rotate-45 flex items-center justify-center shadow-[0_0_15px_rgba(0,242,255,0.6)] group-hover:scale-110 transition-transform duration-300">
            <div className="w-3 h-3 bg-black"></div>
          </div>
          <span className="font-display font-black tracking-tighter italic text-xl uppercase text-white group-hover:text-cyan-400 transition-colors">
            REFLEX<span className="text-[#00f2ff] font-light">.IO</span>
          </span>
        </div>

        {/* Desktop Tabs */}
        <div className="hidden md:flex items-center gap-2">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`relative flex items-center gap-2 py-2 px-4 text-xs font-black italic uppercase tracking-wider transition-colors duration-200 ${
                  isActive ? 'text-[#00f2ff]' : 'text-white/60 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}

                {/* Animated active bottom border line or subtle backdrop */}
                {isActive && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute bottom-0 inset-x-4 h-0.5 bg-[#00f2ff] -z-10 shadow-[0_0_10px_#00f2ff]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}

          {/* Quick links to games */}
          <button
            onClick={() => handleTabChange('classic')}
            className={`relative flex items-center gap-1.5 py-2 px-4 text-xs font-black italic uppercase tracking-wider transition-colors duration-200 ${
              currentTab === 'classic' ? 'text-[#00f2ff]' : 'text-white/60 hover:text-[#00f2ff]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Classic Test
          </button>

          <button
            onClick={() => handleTabChange('spike')}
            className={`relative flex items-center gap-1.5 py-2 px-4 text-xs font-black italic uppercase tracking-wider transition-colors duration-200 ${
              currentTab === 'spike' ? 'text-purple-400' : 'text-white/60 hover:text-purple-400'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Spike Trainer
          </button>
        </div>

        {/* Right side controls (Sound + Auth) */}
        <div className="flex items-center gap-4">
          <SoundToggle />

          {userSession ? (
            <div className="flex items-center gap-3 border-l border-white/10 pl-4">
              {/* Profile Card trigger */}
              <button
                onClick={() => handleTabChange('profile')}
                className={`flex items-center gap-2 group p-1 pr-3 rounded-none border transition-all ${
                  currentTab === 'profile'
                    ? 'bg-[#00f2ff]/10 border-[#00f2ff]/40 text-[#00f2ff] shadow-[0_0_15px_rgba(0,242,255,0.15)]'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/80'
                }`}
              >
                <img
                  src={userSession.avatar_url}
                  alt={userSession.display_name}
                  className="w-7 h-7 rounded-none bg-black object-cover border border-white/10 group-hover:scale-105 transition-transform"
                />
                <span className="text-xs font-black italic uppercase tracking-wide max-w-[100px] truncate">
                  {userSession.display_name}
                </span>
              </button>

              {/* Logout button */}
              <button
                onClick={() => {
                  audioSystem.playClick();
                  onLogout();
                }}
                className="p-2 rounded-none border border-white/10 bg-white/5 text-white/60 hover:text-orange-400 hover:border-orange-500/20 hover:bg-orange-500/5 transition-all"
                title="Log out of profile"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                audioSystem.playClick();
                onOpenAuth();
              }}
              className="relative bg-[#00f2ff] text-black px-5 py-2.5 font-black text-xs italic uppercase skew-x-[-12deg] hover:bg-white transition-all shadow-[0_0_15px_rgba(0,242,255,0.45)] active:scale-95 group"
            >
              <span className="flex items-center gap-1.5 skew-x-[12deg]">
                <LogIn className="w-3.5 h-3.5" />
                <span>Login</span>
              </span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
