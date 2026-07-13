/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, RotateCcw, Volume2, AlertCircle, Sparkles, HelpCircle, Flame, Clock } from 'lucide-react';
import { audioSystem } from '../../lib/audio';
import { UserSession } from '../../types';
import GlassPanel from '../../components/GlassPanel';

interface SpikeDefuseTrainerProps {
  userSession: UserSession | null;
  onOpenAuth: () => void;
  onRefreshStats: () => void;
}

type TrainerState = 'idle' | 'planting' | 'planted' | 'defusing' | 'success' | 'exploded';

export default function SpikeDefuseTrainer({ userSession, onOpenAuth, onRefreshStats }: SpikeDefuseTrainerProps) {
  const [gameState, setGameState] = useState<TrainerState>('idle');
  const [timePlanted, setTimePlanted] = useState<number>(0); // 0 to 45 seconds
  const [defuseProgress, setDefuseProgress] = useState<number>(0); // 0 to 7 seconds
  const [hasCheckpoint, setHasCheckpoint] = useState<boolean>(false);
  
  // Results statistics
  const [defuseScore, setDefuseScore] = useState<number>(0);
  const [startedDefuseAt, setStartedDefuseAt] = useState<number>(0);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [rating, setRating] = useState<string>('');
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Source-of-truth Refs for game loop and handlers to prevent lag/re-registering/closure bugs
  const gameStateRef = useRef<TrainerState>('idle');
  const timePlantedRef = useRef<number>(0);
  const defuseProgressRef = useRef<number>(0);
  const hasCheckpointRef = useRef<boolean>(false);

  // Synchronized state setters to update both state (for render) and refs (for immediate access in loop)
  const updateGameState = (newState: TrainerState) => {
    gameStateRef.current = newState;
    setGameState(newState);
  };

  const updateTimePlanted = (newVal: number) => {
    timePlantedRef.current = newVal;
    setTimePlanted(newVal);
  };

  const updateDefuseProgress = (newVal: number) => {
    defuseProgressRef.current = newVal;
    setDefuseProgress(newVal);
  };

  const updateHasCheckpoint = (newVal: boolean) => {
    hasCheckpointRef.current = newVal;
    setHasCheckpoint(newVal);
  };

  // Refs for animation loops and timers
  const requestRef = useRef<number | null>(null);
  const prevTimeRef = useRef<number | null>(null);
  const lastBeepTimeRef = useRef<number>(0);
  
  // Track if action keys are currently held to avoid duplicate event registering
  const isDefusingStateRef = useRef<boolean>(false);

  // Constants
  const TOTAL_PLANT_TIME = 45.0; // seconds
  const DEFUSE_REQUIRED = 7.0; // seconds
  const HALFWAY_CHECKPOINT = 3.5; // seconds

  const startRound = () => {
    audioSystem.playClick();
    updateGameState('planting');
    updateDefuseProgress(0);
    updateHasCheckpoint(false);
    updateTimePlanted(0);
    setErrorMsg('');
    setIsNewRecord(false);

    // Short plant delay animation
    setTimeout(() => {
      updateGameState('planted');
      prevTimeRef.current = performance.now();
      lastBeepTimeRef.current = 0;
      requestRef.current = requestAnimationFrame(updateGameLoop);
    }, 1500);
  };

  // Get beep parameters according to original timing
  const getBeepIntervalAndVolume = (elapsed: number) => {
    if (elapsed < 25) {
      return { interval: 1.0, pitch: 440, duration: 0.08, volume: 1.0 }; // 1 beep/s, standard A4
    } else if (elapsed < 35) {
      return { interval: 0.5, pitch: 523, duration: 0.08, volume: 1.1 }; // 2 beeps/s, C5
    } else if (elapsed < 40) {
      return { interval: 0.25, pitch: 659, duration: 0.08, volume: 1.25 }; // 4 beeps/s, E5
    } else {
      return { interval: 0.125, pitch: 880, duration: 0.06, volume: 1.4 }; // 8 beeps/s, A5
    }
  };

  // Beep triggers visual ripple and rumble
  const [beepTrigger, setBeepTrigger] = useState(false);

  // Primary animation loop for high precision 45-second countdown
  const updateGameLoop = (timeMs: number) => {
    if (gameStateRef.current !== 'planted' && gameStateRef.current !== 'defusing') {
      return;
    }

    if (!prevTimeRef.current) prevTimeRef.current = timeMs;
    const deltaSec = (timeMs - prevTimeRef.current) / 1000;
    prevTimeRef.current = timeMs;

    const nextTime = timePlantedRef.current + deltaSec;
    updateTimePlanted(nextTime);

    // Handle continuous spike beeps
    const { interval, pitch, duration, volume } = getBeepIntervalAndVolume(nextTime);
    if (nextTime - lastBeepTimeRef.current >= interval) {
      lastBeepTimeRef.current = nextTime;
      audioSystem.playSpikeBeep(pitch, duration, volume);
      
      // Keep state notification for any responsive rendering, but we removed visual flashes
      setBeepTrigger(true);
      setTimeout(() => setBeepTrigger(false), 50);
    }

    // Check for explosion
    if (nextTime >= TOTAL_PLANT_TIME) {
      triggerExplosion();
      return;
    }

    if (isDefusingStateRef.current) {
      const nextProgress = defuseProgressRef.current + deltaSec;
      updateDefuseProgress(nextProgress);

      if (nextProgress >= DEFUSE_REQUIRED) {
        triggerSuccess();
        return;
      }
      if (nextProgress >= HALFWAY_CHECKPOINT && !hasCheckpointRef.current) {
        updateHasCheckpoint(true);
        audioSystem.playSpikeBeep(1200, 0.2, 1.5); // double accent checkpoint indicator beep
      }
    }

    // Continue loop if game is still active
    if (gameStateRef.current === 'planted' || gameStateRef.current === 'defusing') {
      requestRef.current = requestAnimationFrame(updateGameLoop);
    }
  };

  const handleStartDefusal = () => {
    if (gameStateRef.current !== 'planted' && gameStateRef.current !== 'defusing') return;
    updateGameState('defusing');
    isDefusingStateRef.current = true;
    
    // Track started defuse metric once per round
    if (defuseProgressRef.current === 0 || (hasCheckpointRef.current && defuseProgressRef.current <= HALFWAY_CHECKPOINT)) {
      setStartedDefuseAt(timePlantedRef.current);
    }
  };

  const handleStopDefusal = () => {
    if (gameStateRef.current !== 'defusing') return;
    updateGameState('planted');
    isDefusingStateRef.current = false;

    // Reset defusal back to checkpoint or start
    if (hasCheckpointRef.current) {
      updateDefuseProgress(HALFWAY_CHECKPOINT);
    } else {
      updateDefuseProgress(0);
    }
  };

  const triggerExplosion = () => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    audioSystem.playExplosion();
    updateGameState('exploded');
    isDefusingStateRef.current = false;
  };

  const triggerSuccess = () => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    audioSystem.playSuccess();
    updateGameState('success');
    isDefusingStateRef.current = false;

    // Calculations
    const rem = TOTAL_PLANT_TIME - timePlantedRef.current;
    setRemainingTime(rem);

    // Score: max is 1000. Closer to 0 seconds left is higher score.
    const score = Math.round(Math.max(0, 1000 - (rem * 130)));
    setDefuseScore(score);

    // Rating determination
    let tier = 'Safe';
    if (rem < 0.1) tier = 'Perfect';
    else if (rem < 0.4) tier = 'Excellent';
    else if (rem < 1.0) tier = 'Great';
    else if (rem < 2.5) tier = 'Good';
    else if (rem < 5.0) tier = 'Safe';
    else tier = 'Risky';
    setRating(tier);

    // Check personal best
    if (userSession) {
      const localBest = localStorage.getItem(`pb_spike_${userSession.display_name.toLowerCase()}`);
      if (!localBest || score > Number(localBest)) {
        setIsNewRecord(true);
        localStorage.setItem(`pb_spike_${userSession.display_name.toLowerCase()}`, String(score));
      }
      submitSpikeScore(score, rem);
    }
  };

  const submitSpikeScore = async (score: number, rem: number) => {
    try {
      const payload = {
        display_name: userSession!.display_name,
        avatar_url: userSession!.avatar_url,
        game_mode: 'spike',
        score: score,
        remaining_time_ms: rem,
        defuse_score: score,
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
      setErrorMsg(err.message || 'Error syncing results');
    }
  };

  // Keyboard controls - run once on mount with stable refs to prevent missed events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === ' ' || e.key.toLowerCase() === 'e') {
        e.preventDefault();
        handleStartDefusal();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key.toLowerCase() === 'e') {
        e.preventDefault();
        handleStopDefusal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const timeLeft = Math.max(0, TOTAL_PLANT_TIME - timePlanted);
  const defusePct = (defuseProgress / DEFUSE_REQUIRED) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Offline Notice */}
      {!userSession && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-orange-500/5 border border-orange-500/20 text-orange-400">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>Spike Defuse statistics are currently in offline guest mode. Login to post scores!</span>
          </div>
          <button
            onClick={() => {
              audioSystem.playClick();
              onOpenAuth();
            }}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-orange-500 text-black hover:bg-orange-400 rounded-lg whitespace-nowrap active:scale-95 transition-all"
          >
            Sign In Now
          </button>
        </div>
      )}

      {/* Main Game Stage */}
      <div
        className={`
          relative w-full min-h-[440px] rounded-2xl border bg-zinc-950 p-6 flex flex-col items-center justify-center select-none overflow-hidden shadow-2xl transition-all duration-300
          border-zinc-800
          ${gameState === 'exploded' ? 'border-orange-500/60 shadow-[0_0_40px_rgba(249,115,22,0.2)] bg-orange-950/10 animate-shake' : ''}
          ${gameState === 'success' ? 'border-purple-500/60 shadow-[0_0_40px_rgba(168,85,247,0.2)] bg-purple-950/10' : ''}
        `}
      >
        {/* Background glow effects */}
        {gameState === 'planted' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-red-500/5 blur-3xl pointer-events-none" />
        )}
        {gameState === 'defusing' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none animate-pulse" />
        )}

        {/* STATE: IDLE */}
        {gameState === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6 max-w-md px-4"
          >
            <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
              {/* Spinning tech circles */}
              <div className="absolute inset-0 rounded-full border border-dashed border-zinc-700 animate-spin" style={{ animationDuration: '20s' }} />
              <div className="absolute inset-2 rounded-full border border-dotted border-purple-500/40 animate-spin" style={{ animationDuration: '10s', animationDirection: 'reverse' }} />
              <div className="relative p-4 rounded-full bg-zinc-900 border border-zinc-800 text-purple-400">
                <Shield className="w-10 h-10 animate-pulse" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black font-sans uppercase tracking-widest text-white">
                Spike Defuse Trainer
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Practice critical last-moment defuses. The spike explodes after exactly 45 seconds. Defusing takes 7 seconds, with progress saved at 3.5 seconds.
              </p>
            </div>

            <button
              onClick={startRound}
              className="px-6 py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase text-xs tracking-wider rounded-lg shadow-lg shadow-purple-600/30 active:scale-95 transition-all w-full"
            >
              Start Practice Match
            </button>
          </motion.div>
        )}

        {/* STATE: PLANTING (Intro animation) */}
        {gameState === 'planting' && (
          <motion.div
            key="planting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-4"
          >
            <div className="relative w-16 h-16 mx-auto">
              <span className="absolute inset-0 rounded-full border-4 border-zinc-800 border-t-purple-500 animate-spin" />
            </div>
            <div className="text-xs font-mono text-purple-400 uppercase tracking-widest animate-pulse">
              Spike deploying... mechanical legs locking...
            </div>
          </motion.div>
        )}

        {/* STATE: PLANTED & DEFUSING */}
        {(gameState === 'planted' || gameState === 'defusing') && (
          <div className="w-full max-w-md flex flex-col items-center space-y-8 z-10">
            {/* Top title */}
            <div className="text-center space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500">SPIKE ACTION IN PROGRESS</span>
              <h3 className="text-xl font-black font-sans tracking-tight text-red-500 animate-pulse uppercase">
                LISTEN TO THE BEEP
              </h3>
            </div>

            {/* Futuristic Spike device vector */}
            <div className="relative w-44 h-44 flex items-center justify-center">
              {/* Reactor Core Structure */}
              <svg viewBox="0 0 100 100" className="w-32 h-32 text-zinc-700 select-none">
                {/* Triangular mechanical legs */}
                <polygon points="50,15 80,75 20,75" fill="none" stroke="currentColor" strokeWidth="2.5" />
                <circle cx="50" cy="15" r="3" fill="#ef4444" />
                <circle cx="80" cy="75" r="3" fill="#ef4444" />
                <circle cx="20" cy="75" r="3" fill="#ef4444" />
                
                {/* Inner circular reactor energy */}
                <circle cx="50" cy="53" r="22" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="50" cy="53" r="14" fill="#18181b" stroke="#3f3f46" strokeWidth="2" />
                
                {/* Center Core LED */}
                <circle
                  cx="50"
                  cy="53"
                  r="8"
                  className={`transition-all duration-100 ${
                    gameState === 'defusing'
                      ? 'fill-cyan-400 shadow-[0_0_15px_#06b6d4] animate-pulse'
                      : 'fill-red-500'
                  }`}
                  style={{
                    filter: gameState === 'defusing' ? 'drop-shadow(0 0 6px var(--tw-shadow-color, #06b6d4))' : 'none'
                  }}
                />
              </svg>

              {/* Defuse overlay text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                {gameState === 'defusing' && (
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400 animate-pulse mt-8">DEFUSING</span>
                )}
              </div>
            </div>

            {/* Interaction Instructions */}
            <div className="text-center space-y-3 w-full">
              <button
                onMouseDown={handleStartDefusal}
                onMouseUp={handleStopDefusal}
                onMouseLeave={handleStopDefusal}
                onTouchStart={handleStartDefusal}
                onTouchEnd={handleStopDefusal}
                className={`
                  w-full py-4 rounded-xl border font-extrabold uppercase tracking-widest text-sm transition-all duration-150 active:scale-[0.98] select-none
                  ${
                    gameState === 'defusing'
                      ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                  }
                `}
              >
                {gameState === 'defusing' ? 'DEFUSING - HOLD ON' : 'HOLD MOUSE / SPACEBAR / E'}
              </button>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                * Defusal saves halfway! Release to pause. Tap to start.
              </p>
            </div>
          </div>
        )}

        {/* STATE: SUCCESS SCREEN */}
        {gameState === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6 max-w-md px-6 py-4"
          >
            {isNewRecord && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-yellow-400 text-[10px] font-black uppercase tracking-widest animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
                New High Score!
              </div>
            )}

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950/60 border border-emerald-500/20 px-3 py-1 rounded-full">SPIKE DEFUSED</span>
              <h2 className="text-3xl font-black uppercase text-white mt-4 tracking-wider">
                Defusal Success!
              </h2>
            </div>

            {/* Stats list */}
            <div className="bg-zinc-900/60 rounded-xl border border-zinc-800 p-4 divide-y divide-zinc-800/80 font-mono text-xs">
              <div className="flex justify-between py-2">
                <span className="text-zinc-500">STARTED DEFUSE AT</span>
                <span className="text-white font-bold">{startedDefuseAt.toFixed(2)}s</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-zinc-500">TIME REMAINING</span>
                <span className="text-cyan-400 font-bold">{remainingTime.toFixed(3)}s</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-zinc-500">ACCURACY SCORE</span>
                <span className="text-purple-400 font-bold">{defuseScore} / 1000</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-zinc-500">RATING TIER</span>
                <span className={`font-black uppercase tracking-wider ${
                  rating === 'Perfect' ? 'text-amber-400' : rating === 'Excellent' ? 'text-purple-400' : 'text-cyan-400'
                }`}>{rating}</span>
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-orange-400 font-bold">{errorMsg}</p>
            )}

            <button
              onClick={startRound}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase text-xs tracking-wider rounded-lg transition-all w-full flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Try Next Round
            </button>
          </motion.div>
        )}

        {/* STATE: EXPLODED SCREEN */}
        {gameState === 'exploded' && (
          <motion.div
            key="exploded"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6 max-w-md px-6 py-4"
          >
            <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mx-auto text-orange-500 animate-ping">
              <Clock className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest bg-orange-950/60 border border-orange-500/20 px-3 py-1 rounded-full">SPIKE DETONATED</span>
              <h2 className="text-3xl font-black uppercase text-white mt-4 tracking-wider">
                Detonation! Too Late
              </h2>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed pt-2">
                The countdown hit 45.0 seconds before the defuse completion finished. Make sure to hold down and stay focused.
              </p>
            </div>

            <button
              onClick={startRound}
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase text-xs tracking-wider rounded-lg transition-all w-full flex items-center justify-center gap-2 border border-zinc-700"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Deploy Another Spike
            </button>
          </motion.div>
        )}
      </div>

      {/* Manual / FAQ Card */}
      <GlassPanel glowColor="purple" className="p-4 flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider mb-1">Clutch Defusing Ratings</h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Valorant rounds last 45 seconds. Defusal takes exactly 7 seconds total. Since it saves halfway at 3.5s, the ultimate clutch starting moment is at <b>38.00 seconds</b> (without checkpoint) or <b>41.50 seconds</b> (with checkpoint!). The closer you start to this edge without failing, the higher score you earn!
          </p>
        </div>
      </GlassPanel>
    </div>
  );
}
