import React, { useEffect, useRef } from 'react';

export const CosmicBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle system for glowing cosmic dust
    const particleCount = 75;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2.2 + 0.6,
      color: Math.random() > 0.5 ? '#00f3ff' : '#ff007f', // Neon Cyan & Neon Pink
      alpha: Math.random() * 0.8 + 0.2,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      pulseSpeed: Math.random() * 0.02 + 0.005,
    }));

    let time = 0;

    const render = () => {
      time += 0.01;
      ctx.clearRect(0, 0, width, height);

      // Deep dark cosmic space background gradient
      const bgGradient = ctx.createRadialGradient(
        width * 0.5,
        height * 0.4,
        10,
        width * 0.5,
        height * 0.5,
        Math.max(width, height)
      );
      bgGradient.addColorStop(0, 'rgba(15, 10, 35, 0.95)');
      bgGradient.addColorStop(0.5, 'rgba(8, 6, 20, 0.98)');
      bgGradient.addColorStop(1, 'rgba(3, 2, 10, 1)');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Swirling Neon Cyan and Pink Nebulae clouds
      const cyanGlowX = width * 0.3 + Math.sin(time * 0.5) * 60;
      const cyanGlowY = height * 0.4 + Math.cos(time * 0.3) * 50;
      const cyanGrad = ctx.createRadialGradient(cyanGlowX, cyanGlowY, 20, cyanGlowX, cyanGlowY, 320);
      cyanGrad.addColorStop(0, 'rgba(0, 243, 255, 0.15)');
      cyanGrad.addColorStop(0.5, 'rgba(0, 180, 255, 0.06)');
      cyanGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = cyanGrad;
      ctx.fillRect(0, 0, width, height);

      const pinkGlowX = width * 0.7 + Math.cos(time * 0.4) * 60;
      const pinkGlowY = height * 0.6 + Math.sin(time * 0.5) * 50;
      const pinkGrad = ctx.createRadialGradient(pinkGlowX, pinkGlowY, 20, pinkGlowX, pinkGlowY, 350);
      pinkGrad.addColorStop(0, 'rgba(255, 0, 127, 0.14)');
      pinkGrad.addColorStop(0.5, 'rgba(200, 0, 180, 0.05)');
      pinkGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = pinkGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw particle cosmic dust
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha += Math.sin(time * p.pulseSpeed * 10) * 0.01;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0.1, Math.min(1, p.alpha));
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.radius * 4;
        ctx.fill();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Background canvas for dynamic swirling space particle dust */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      {/* Subtle overlay grid glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-950/20 via-purple-950/30 to-black/90 mix-blend-screen" />
    </div>
  );
};
