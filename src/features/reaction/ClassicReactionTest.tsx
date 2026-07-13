/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, RotateCcw, Trophy, Users, Award, Zap, Shield, ArrowRight, Sparkles } from 'lucide-react';
import { audioSystem } from '../../lib/audio';
import { UserSession } from '../../types';
import GlassPanel from '../../components/GlassPanel';

interface ClassicReactionTestProps {
  userSession: UserSession | null;
  onOpenAuth: () => void;
  onRefreshStats: () => void;
}

type TestState = 'idle' | 'waiting' | 'early' | 'ready' | 'result' | 'saving';

export default function ClassicReactionTest({ userSession, onOpenAuth, onRefreshStats }: ClassicReactionTestProps) {
  const [gameState, setGameState] = useState<TestState>('idle');
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [personalBest, setPersonalBest] = useState<number | null>(null);
  const [globalAverage, setGlobalAverage] = useState<number>(215); // seed standard average
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const animationRef = useRef<number | null>(null);

  // Load personal best from localStorage or backend
  useEffect(() => {
    if (userSession) {
      // Fetch stats from localstorage as well as backup
      const localPB = localStorage.getItem(`pb_classic_${userSession.display_name.toLowerCase()}`);
      if (localPB) {
        setPersonalBest(Number(localPB));
      } else {
        // Retrieve from server stats
        fetch(`/api/profile/${encodeURIComponent(userSession.display_name)}`)
          .then(res => res.json())
          .then(data => {
            if (data?.profile?.classic_best) {
              setPersonalBest(data.profile.classic_best);
              localStorage.setItem(`pb_classic_${userSession.display_name.toLowerCase()}`, String(data.profile.classic_best));
            }
          })
          .catch(err => console.error(err));
      }
    }
  }, [userSession]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const handleScreenClick = () => {
    if (gameState === 'idle') {
      audioSystem.playClick();
      startTest();
    } else if (gameState === 'waiting') {
      // Clicked too early!
      audioSystem.playFailure();
      triggerEarlyClick();
    } else if (gameState === 'ready') {
      // Clicked in time!
      const endTime = performance.now();
      audioSystem.playClassicDing();
      calculateResult(endTime);
    } else if (gameState === 'result' || gameState === 'early') {
      audioSystem.playClick();
      startTest();
    }
  };

  const startTest = () => {
    setErrorMsg('');
    setIsNewRecord(false);
    setGameState('waiting');
    
    // Random delay between 2 and 6 seconds (2000ms - 6000ms)
    const delay = Math.random() * 4000 + 2000;
    
    timerRef.current = setTimeout(() => {
      triggerReady();
    }, delay);
  };

  const triggerEarlyClick = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setGameState('early');
  };

  const triggerReady = () => {
    startTimeRef.current = performance.now();
    setGameState('ready');
  };

  const calculateResult = (endTime: number) => {
    const timeTaken = Math.round((endTime - startTimeRef.current) * 10) / 10; // 0.1ms precision
    setReactionTime(timeTaken);
    setGameState('result');

    // Check personal best
    let checkPB = personalBest;
    if (personalBest === null || timeTaken < personalBest) {
      setIsNewRecord(true);
      setPersonalBest(timeTaken);
      if (userSession) {
        localStorage.setItem(`pb_classic_${userSession.display_name.toLowerCase()}`, String(timeTaken));
        audioSystem.playSuccess();
      }
    }

    // Submit score to database server if authenticated
    if (userSession) {
      submitScore(timeTaken);
    }
  };

  const submitScore = async (time: number) => {
    try {
      const payload = {
        display_name: userSession!.display_name,
        avatar_url: userSession!.avatar_url,
        game_mode: 'classic',
        score: time,
        reaction_time_ms: time,
        is_guest: userSession!.is_guest,
      };

      const res = await fetch('/api/leaderboard/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to sync score');
      }

      onRefreshStats();
    } catch (err: any) {
      setErrorMsg(err.message || 'Network synchronizer error');
    }
  };

  // Custom visual particles for the record celebration confetti
  const [particles, setParticles] = useState<Array<{
    id: number;
    startX: number;
    endX: number;
    startY: number;
    endY: number;
    color: string;
    size: number;
    height: number;
    isCircle: boolean;
    rotateStart: number;
    rotateEnd: number;
    duration: number;
    delay: number;
  }>>([]);

  useEffect(() => {
    if (isNewRecord && gameState === 'result') {
      const generated = Array.from({ length: 60 }).map((_, i) => {
        const startX = Math.random() * 100;
        const endX = startX + (Math.random() * 24 - 12);
        const size = Math.random() * 7 + 5;
        return {
          id: i,
          startX,
          endX,
          startY: -25,
          endY: 425,
          color: ['#00f2ff', '#bc13fe', '#f43f5e', '#eab308', '#10b981'][Math.floor(Math.random() * 5)],
          size,
          height: size * (Math.random() > 0.5 ? 1.5 : 1),
          isCircle: Math.random() > 0.5,
          rotateStart: Math.random() * 360,
          rotateEnd: Math.random() * 720 + 360,
          duration: Math.random() * 2.0 + 1.5,
          delay: Math.random() * 0.4,
        };
      });
      setParticles(generated);
    } else {
      setParticles([]);
    }
  }, [isNewRecord, gameState]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Intro alert if guest / not logged in */}
      {!userSession && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-orange-500/5 border border-orange-500/20 text-orange-400">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>Currently practicing in offline guest mode. Sign in to post on Leaderboards!</span>
          </div>
          <button
            onClick={() => {
              audioSystem.playClick();
              onOpenAuth();
            }}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-orange-500 text-black hover:bg-orange-400 rounded-lg shadow-lg shadow-orange-500/10 whitespace-nowrap active:scale-95 transition-all"
          >
            Sign In Now
          </button>
        </div>
      )}

      {/* Primary Interaction Screen */}
      <div
        id="reaction-stage"
        onClick={handleScreenClick}
        className={`
          relative w-full h-[400px] rounded-2xl border flex flex-col items-center justify-center text-center cursor-pointer select-none overflow-hidden transition-all duration-300 shadow-2xl
          ${
            gameState === 'idle'
              ? 'bg-gradient-to-br from-blue-900/60 to-zinc-950 border-blue-500/30 hover:border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.1)]'
              : gameState === 'waiting'
              ? 'bg-gradient-to-br from-red-950/80 to-zinc-950 border-red-500/40 cursor-wait'
              : gameState === 'early'
              ? 'bg-gradient-to-br from-orange-950/80 to-zinc-950 border-orange-500/40 animate-shake'
              : gameState === 'ready'
              ? 'bg-gradient-to-br from-emerald-600 to-emerald-900 border-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.3)]'
              : 'bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800'
          }
        `}
      >
        {/* Confetti celebration rain */}
        {isNewRecord && particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ 
              y: p.startY, 
              left: `${p.startX}%`, 
              rotate: p.rotateStart,
              opacity: 1
            }}
            animate={{ 
              y: p.endY, 
              left: `${p.endX}%`, 
              rotate: p.rotateEnd,
              opacity: [1, 1, 0.8, 0]
            }}
            transition={{ 
              duration: p.duration, 
              delay: p.delay,
              ease: 'linear',
              repeat: Infinity 
            }}
            className="absolute top-0 pointer-events-none z-20"
            style={{
              backgroundColor: p.color,
              width: p.size,
              height: p.height,
              borderRadius: p.isCircle ? '50%' : '1px',
            }}
          />
        ))}

        {/* State Renderers */}
        <AnimatePresence mode="wait">
          {gameState === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-4 px-6"
            >
              <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mx-auto mb-4 animate-bounce">
                <Zap className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-3xl font-black font-sans uppercase tracking-wider text-white">
                Classic Reaction Benchmark
              </h2>
              <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
                When the blue screen turns green, click as fast as you possibly can. Let's benchmark your neural speed.
              </p>
              <div className="inline-block mt-4 text-xs font-bold uppercase tracking-widest text-blue-400 border border-blue-500/30 px-4 py-2 rounded-lg bg-blue-500/5 animate-pulse">
                Click Screen to Start
              </div>
            </motion.div>
          )}

          {gameState === 'waiting' && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2"
            >
              <h2 className="text-4xl font-black tracking-widest text-red-400 uppercase animate-pulse">
                Wait for Green...
              </h2>
              <p className="text-xs font-mono text-red-500 uppercase tracking-widest">
                DO NOT CLICK YET
              </p>
            </motion.div>
          )}

          {gameState === 'early' && (
            <motion.div
              key="early"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4 px-6"
            >
              <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mx-auto text-orange-400 mb-2">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-black uppercase text-orange-400">
                Too Soon!
              </h2>
              <p className="text-sm text-zinc-400 max-w-sm mx-auto">
                You clicked before the screen turned green. Take a deep breath and try again.
              </p>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-lg text-zinc-300">
                <RotateCcw className="w-3.5 h-3.5" /> Click anywhere to restart
              </div>
            </motion.div>
          )}

          {gameState === 'ready' && (
            <motion.div
              key="ready"
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-1"
            >
              <h2 className="text-6xl font-black text-white uppercase tracking-wider drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]">
                CLICK!
              </h2>
              <p className="text-xs font-mono text-emerald-200 uppercase tracking-widest">
                RAPID ACTION NOW
              </p>
            </motion.div>
          )}

          {gameState === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5 px-6"
            >
              {isNewRecord && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-yellow-400 text-[10px] font-black uppercase tracking-widest animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" />
                  New Personal Record!
                </div>
              )}

              <div className="space-y-1">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">YOUR REFLEX SPEED</p>
                <h2 className="text-6xl md:text-7xl font-black font-mono text-cyan-400 tracking-tight drop-shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                  {reactionTime} <span className="text-2xl md:text-3xl font-bold text-zinc-400">ms</span>
                </h2>
              </div>

              {/* Stats Block */}
              <div className="flex gap-4 justify-center max-w-sm mx-auto pt-2">
                <div className="flex-1 bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-800 text-center">
                  <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Personal Best</span>
                  <span className="text-sm font-mono font-bold text-white">{personalBest ? `${personalBest}ms` : '--'}</span>
                </div>
                <div className="flex-1 bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-800 text-center">
                  <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Global Avg</span>
                  <span className="text-sm font-mono font-bold text-zinc-400">{globalAverage}ms</span>
                </div>
              </div>

              {errorMsg && (
                <p className="text-xs text-orange-400 font-semibold mt-2">{errorMsg}</p>
              )}

              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-cyan-500 hover:bg-cyan-400 text-black px-5 py-3 rounded-lg shadow-lg shadow-cyan-500/10 active:scale-95 transition-all">
                <RotateCcw className="w-3.5 h-3.5" /> Practice Again
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassPanel glowColor="cyan" className="p-4 flex items-start gap-3">
          <Trophy className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-1">Human Benchmark Stats</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              The median reaction time on Human Benchmark is approximately 215 milliseconds. Can you push your reflexes below the 150ms esports barrier?
            </p>
          </div>
        </GlassPanel>
        
        <GlassPanel glowColor="purple" className="p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-1">Strict Anti-Cheat Core</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Our backend calculates cryptographic limits. Hits below 65ms are flagged as impossible and discarded to preserve the competitive integrity of our leaderboards.
            </p>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
