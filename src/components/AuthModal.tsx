/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, LogIn, Sparkles, Mail } from 'lucide-react';
import { UserSession } from '../types';
import { audioSystem } from '../lib/audio';
import { supabase } from '../utils/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (session: UserSession) => void;
  userEmail?: string; // Automatically inject user email if available
}

export default function AuthModal({ isOpen, onClose, onLoginSuccess, userEmail }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'guest' | 'google'>('guest');
  const [guestName, setGuestName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGuestPlay = (e: React.FormEvent) => {
    e.preventDefault();
    audioSystem.playClick();
    if (!guestName.trim()) {
      setError('Please enter a player name.');
      return;
    }

    if (guestName.length < 2 || guestName.length > 15) {
      setError('Name must be between 2 and 15 characters.');
      return;
    }

    setIsLoading(true);
    setError('');

    // Simulate short network speed
    setTimeout(() => {
      const guestId = `guest_${Math.random().toString(36).substring(2, 11)}`;
      const newSession: UserSession = {
        id: guestId,
        display_name: guestName.trim(),
        avatar_url: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(guestName.trim())}`,
        is_guest: true,
        created_at: new Date().toISOString(),
      };
      onLoginSuccess(newSession);
      setIsLoading(false);
      onClose();
    }, 800);
  };

  const handleGoogleLogin = async () => {
    audioSystem.playClick();
    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Google.');
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          {/* Backdrop closing */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0"
          />

          {/* Modal Box */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.15 }}
            className="relative w-full max-w-md overflow-hidden bg-[#050505] border border-white/10 rounded-none p-6 text-white shadow-2xl"
          >
            {/* Riot style accent corner stripes */}
            <div className="absolute top-0 right-0 w-16 h-[2px] bg-[#00f2ff] shadow-[0_0_10px_#00f2ff]" />
            <div className="absolute top-0 right-0 w-[2px] h-16 bg-[#00f2ff] shadow-[0_0_10px_#00f2ff]" />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <LogIn className="w-5 h-5 text-[#00f2ff]" />
                <h3 className="text-xl font-black font-display italic tracking-tighter uppercase text-white">
                  JOIN PLATFORM
                </h3>
              </div>
              <button
                onClick={() => {
                  audioSystem.playClick();
                  onClose();
                }}
                className="p-1 rounded-none text-white/40 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex bg-black/40 p-1 rounded-none mb-6 border border-white/10">
              <button
                onClick={() => {
                  audioSystem.playClick();
                  setActiveTab('guest');
                  setError('');
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-black italic rounded-none uppercase transition-all duration-200 ${
                  activeTab === 'guest'
                    ? 'bg-[#00f2ff] text-black shadow-lg font-bold'
                    : 'text-white/40 hover:text-white'
                }`}
              >
                <User className="w-4 h-4" />
                GUEST PLAY
              </button>
              <button
                onClick={() => {
                  audioSystem.playClick();
                  setActiveTab('google');
                  setError('');
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-black italic rounded-none uppercase transition-all duration-200 ${
                  activeTab === 'google'
                    ? 'bg-[#bc13fe] text-white shadow-lg font-bold'
                    : 'text-white/40 hover:text-white'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                GOOGLE SYNC
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 text-xs font-black text-[#ff4e00] bg-[#ff4e00]/10 border border-[#ff4e00]/20 px-3 py-2 rounded-none uppercase italic tracking-wider"
              >
                {error}
              </motion.div>
            )}

            {/* Forms */}
            {activeTab === 'guest' ? (
              <form onSubmit={handleGuestPlay} className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase text-white/40 tracking-wider mb-2">
                    PLAYER NICKNAME
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="e.g. TenZ_Warmup"
                      disabled={isLoading}
                      maxLength={15}
                      className="w-full bg-white/[0.02] border border-white/10 focus:border-[#00f2ff] rounded-none px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none transition-colors font-sans"
                      required
                    />
                    <div className="absolute right-3 top-3 text-white/30 text-xs">
                      {guestName.length}/15
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-white/40 leading-relaxed uppercase tracking-wide">
                  * Guest players do not require a Google account. You can compete immediately, and your best records will appear on the live global leaderboards!
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full relative bg-[#00f2ff] hover:bg-white text-black font-black uppercase italic tracking-widest text-xs py-4 px-4 skew-x-[-12deg] transition-all duration-150 cursor-pointer disabled:opacity-50"
                >
                  <span className="flex items-center justify-center gap-2 skew-x-[12deg]">
                    <span>{isLoading ? 'CREATING DOSSIER...' : 'ENTER ARENA'}</span>
                  </span>
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="text-center py-6 px-4 bg-white/[0.02] border border-white/5 space-y-4">
                  <div className="w-12 h-12 bg-[#bc13fe]/10 rounded-full flex items-center justify-center mx-auto border border-[#bc13fe]/20">
                    <Sparkles className="w-6 h-6 text-[#bc13fe] animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black uppercase tracking-wider text-white">Google Client Sync</h4>
                    <p className="text-xs text-white/40 leading-relaxed uppercase tracking-wider">
                      Saves your profile, avatar, and highscore records securely in our Supabase cloud database.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full relative bg-[#bc13fe] hover:bg-white text-white hover:text-black font-black uppercase italic tracking-widest text-xs py-4 px-4 skew-x-[-12deg] transition-all duration-150 cursor-pointer disabled:opacity-50"
                >
                  <span className="flex items-center justify-center gap-2 skew-x-[12deg]">
                    <Sparkles className="w-4 h-4" />
                    <span>{isLoading ? 'OPENING GOOGLE SIGN-IN...' : 'SIGN IN WITH GOOGLE'}</span>
                  </span>
                </button>

                <div className="text-[10px] text-white/40 leading-relaxed uppercase tracking-wide text-center">
                  * Opens a secure Google popup window. No passwords or credentials are shared with the trainer.
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
