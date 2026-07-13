/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Shield, GitBranch, Terminal } from 'lucide-react';
import { audioSystem } from '../lib/audio';

export default function Footer() {
  return (
    <footer className="bg-black/95 border-t border-white/10 backdrop-blur-md py-8 px-6 mt-16 text-white/40 text-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        {/* Left branding */}
        <div className="space-y-2">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <Shield className="w-4 h-4 text-[#00f2ff]" />
            <span className="font-black italic uppercase tracking-tighter text-white">
              REFLEX<span className="text-[#00f2ff]">TRAINER</span>
            </span>
          </div>
          <p className="max-w-xs text-white/35 font-sans uppercase text-[10px] tracking-wider">
            Esports-grade benchmarking suite designed for elite gamers and aspiring competitive champions.
          </p>
        </div>

        {/* Center credits */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 font-display font-black text-[10px] tracking-widest text-white/30 uppercase italic">
          <span className="flex items-center gap-1 justify-center">
            <Terminal className="w-3.5 h-3.5 text-[#bc13fe]" />
            VITE FULL-STACK ENGINE
          </span>
          <span className="hidden sm:inline">•</span>
          <span>STRICT ANTI-CHEAT CORE ACTIVE</span>
          <span className="hidden sm:inline">•</span>
          <span>HIGH PRECISION BENCHMARKS</span>
        </div>

        {/* Right copyright */}
        <div className="space-y-1 md:text-right font-display font-black uppercase text-[9px] tracking-widest text-white/30 italic">
          <p>© 2026 REFLEXTRAINER. ALL RIGHTS RESERVED.</p>
          <p className="text-white/20">INOFFICIAL TRAINING TOOL. NOT AFFILIATED WITH RIOT GAMES.</p>
        </div>
      </div>
    </footer>
  );
}
