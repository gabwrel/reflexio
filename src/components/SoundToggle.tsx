/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { audioSystem } from '../lib/audio';

export default function SoundToggle() {
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    // Sync state on load
    setMuted(audioSystem.getMute());
  }, []);

  const handleToggle = () => {
    const isNowMuted = audioSystem.toggleMute();
    setMuted(isNowMuted);
    
    // Play a brief success beep to confirm sound activation if unmuted
    if (!isNowMuted) {
      setTimeout(() => {
        audioSystem.playHover();
      }, 50);
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`
        flex items-center gap-2 px-3.5 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all duration-200
        ${
          muted
            ? 'bg-zinc-950/60 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
            : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.25)]'
        }
      `}
      title={muted ? 'Unmute game sounds' : 'Mute game sounds'}
    >
      {muted ? (
        <>
          <VolumeX className="w-3.5 h-3.5 animate-pulse" />
          <span>Muted</span>
        </>
      ) : (
        <>
          <Volume2 className="w-3.5 h-3.5" />
          <span>Audio On</span>
        </>
      )}
    </button>
  );
}
