import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
}

export const Canvas3DBackground: React.FC = () => {
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
      initParticles();
    };

    window.addEventListener('resize', handleResize);

    const colors = [
      'rgba(99, 102, 241,',  // Indigo (#6366f1)
      'rgba(168, 85, 247,',  // Purple (#a855f7)
      'rgba(56, 189, 248,',  // Cyan (#38bdf8)
      'rgba(14, 165, 233,',  // Sky blue (#0ea5e9)
    ];

    let particles: Particle[] = [];
    const particleCount = Math.min(Math.floor((width * height) / 14000), 85);

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          z: Math.random() * 2 + 0.5,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45,
          radius: Math.random() * 2.2 + 1.2,
          color,
          alpha: Math.random() * 0.6 + 0.25,
        });
      }
    };

    initParticles();

    // Mouse coordinates for gentle interactive parallax
    const mouse = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2 };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      // Smooth lerp for mouse
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // Draw subtle ambient glow gradients
      const grad1 = ctx.createRadialGradient(
        width * 0.2,
        height * 0.15,
        50,
        width * 0.2,
        height * 0.15,
        450
      );
      grad1.addColorStop(0, 'rgba(99, 102, 241, 0.12)');
      grad1.addColorStop(1, 'rgba(99, 102, 241, 0)');
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      const grad2 = ctx.createRadialGradient(
        width * 0.82,
        height * 0.65,
        50,
        width * 0.82,
        height * 0.65,
        500
      );
      grad2.addColorStop(0, 'rgba(56, 189, 248, 0.10)');
      grad2.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Move
        p.x += p.vx * p.z;
        p.y += p.vy * p.z;

        // Wrap around screen bounds
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Interactive mouse push
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 130) {
          const force = (130 - dist) / 130;
          p.x -= (dx / dist) * force * 1.5;
          p.y -= (dy / dist) * force * 1.5;
        }

        // Draw particle with glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * p.z, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color} ${p.alpha})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `${p.color} 0.8)`;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Connect nearby particles (constellation effect)
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const distNodes = Math.hypot(p.x - p2.x, p.y - p2.y);
          const maxDist = 120;

          if (distNodes < maxDist) {
            const lineAlpha = (1 - distNodes / maxDist) * 0.22;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(147, 197, 253, ${lineAlpha})`;
            ctx.lineWidth = 0.85;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
};
