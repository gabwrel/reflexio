/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Accessibility check: disable animation if user prefers reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      ctx.fillStyle = '#080810';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles: Array<{
      x: number;
      y: number;
      radius: number;
      color: string;
      speedX: number;
      speedY: number;
      alpha: number;
      decay: number;
    }> = [];

    // Colors that fit the theme: neon cyan, purple, and a touch of deep blue
    const colors = [
      'rgba(0, 242, 255, 0.4)',  // bold cyan
      'rgba(188, 19, 254, 0.35)', // bold purple
      'rgba(255, 78, 0, 0.25)',  // orange highlight
    ];

    const createParticle = (x?: number, y?: number) => {
      const pX = x ?? Math.random() * width;
      const pY = y ?? Math.random() * height;
      const radius = Math.random() * 2 + 1;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const speedX = (Math.random() - 0.5) * 0.4;
      const speedY = (Math.random() - 0.5) * 0.4;
      const alpha = Math.random() * 0.5 + 0.3;
      const decay = Math.random() * 0.002 + 0.001;

      return { x: pX, y: pY, radius, color, speedX, speedY, alpha, decay };
    };

    // Initialize initial particles
    const particleCount = Math.min(60, Math.floor((width * height) / 25000));
    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle());
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Create a deep background
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, width, height);

      // Draw beautiful glows
      // top right cyan glow
      const cyanGlow = ctx.createRadialGradient(width, 0, 50, width, 0, 400);
      cyanGlow.addColorStop(0, 'rgba(0, 242, 255, 0.08)');
      cyanGlow.addColorStop(1, 'rgba(0, 242, 255, 0)');
      ctx.fillStyle = cyanGlow;
      ctx.fillRect(0, 0, width, height);

      // bottom left purple glow
      const purpleGlow = ctx.createRadialGradient(0, height, 50, 0, height, 350);
      purpleGlow.addColorStop(0, 'rgba(188, 19, 254, 0.08)');
      purpleGlow.addColorStop(1, 'rgba(188, 19, 254, 0)');
      ctx.fillStyle = purpleGlow;
      ctx.fillRect(0, 0, width, height);

      // Draw subtle grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;

        // Wrap around screen edges
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      }

      // Draw subtle interconnected lines for a "grid/neural network" tech vibe
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            const alpha = (1 - dist / 120) * 0.12;
            ctx.strokeStyle = `rgba(188, 19, 254, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="bg-canvas"
      className="fixed inset-0 -z-50 w-full h-full pointer-events-none"
    />
  );
}
