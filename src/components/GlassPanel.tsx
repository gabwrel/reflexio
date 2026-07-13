/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode } from 'react';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  glowColor?: 'cyan' | 'purple' | 'orange' | 'none';
  id?: string;
  onClick?: () => void;
  hoverable?: boolean;
  key?: string | number;
}

export default function GlassPanel({
  children,
  className = '',
  glowColor = 'none',
  id,
  onClick,
  hoverable = false,
}: GlassPanelProps) {
  const glowClasses = {
    none: '',
    cyan: 'border-white/10 hover:border-[#00f2ff]/50 shadow-[0_0_20px_rgba(0,242,255,0.1)]',
    purple: 'border-white/10 hover:border-[#bc13fe]/50 shadow-[0_0_20px_rgba(188,19,254,0.1)]',
    orange: 'border-white/10 hover:border-[#ff4e00]/50 shadow-[0_0_20px_rgba(255,78,0,0.1)]',
  };

  const hoverEffect = hoverable
    ? 'hover:bg-white/[0.05] transition-all duration-300 cursor-pointer'
    : '';

  return (
    <div
      id={id}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-none border border-white/10
        bg-white/[0.03] backdrop-blur-md text-white px-6 py-6
        ${glowClasses[glowColor]}
        ${hoverEffect}
        ${className}
      `}
    >
      {/* Decorative inner gradient line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
      
      {/* Subtle background glow dot */}
      {glowColor !== 'none' && (
        <div
          className={`
            absolute -top-12 -right-12 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-30
            ${glowColor === 'cyan' ? 'bg-[#00f2ff]' : ''}
            ${glowColor === 'purple' ? 'bg-[#bc13fe]' : ''}
            ${glowColor === 'orange' ? 'bg-[#ff4e00]' : ''}
          `}
        />
      )}
      
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
