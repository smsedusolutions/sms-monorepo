import { useRef, useState, useCallback, useEffect } from 'react';

interface TiltOptions {
  maxRotation?: number; // max tilt degrees, default 12
  perspective?: number; // perspective in px, default 1000
  scale?: number; // scale on hover, default 1.03
  speed?: number; // transition speed ms, default 400
  glare?: boolean; // enable shine glare
}

export function use3DTilt<T extends HTMLElement = HTMLDivElement>(options: TiltOptions = {}) {
  const {
    maxRotation = 10,
    perspective = 1000,
    scale = 1.02,
    speed = 350,
    glare = true,
  } = options;

  const elementRef = useRef<T | null>(null);
  const [style, setStyle] = useState<React.CSSProperties>({
    transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
    transition: `transform ${speed}ms cubic-bezier(0.16, 1, 0.3, 1)`,
    transformStyle: 'preserve-3d',
    willChange: 'transform',
  });

  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });
  const rafId = useRef<number | null>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!elementRef.current) return;

    if (rafId.current) cancelAnimationFrame(rafId.current);

    rafId.current = requestAnimationFrame(() => {
      if (!elementRef.current) return;
      const rect = elementRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -maxRotation;
      const rotateY = ((x - centerX) / centerX) * maxRotation;

      setStyle({
        transform: `perspective(${perspective}px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`,
        transition: 'transform 80ms ease-out',
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      });

      if (glare) {
        setGlarePos({
          x: (x / rect.width) * 100,
          y: (y / rect.height) * 100,
          opacity: 0.35,
        });
      }
    });
  }, [glare, maxRotation, perspective, scale]);

  const handleMouseLeave = useCallback(() => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    setStyle({
      transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
      transition: `transform ${speed}ms cubic-bezier(0.16, 1, 0.3, 1)`,
      transformStyle: 'preserve-3d',
    });
    setGlarePos((p) => ({ ...p, opacity: 0 }));
  }, [perspective, speed]);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [handleMouseMove, handleMouseLeave]);

  return {
    ref: elementRef,
    style,
    glareStyle: glare
      ? {
          position: 'absolute' as const,
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none' as const,
          borderRadius: 'inherit',
          background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,${glarePos.opacity}), transparent 60%)`,
          transition: 'opacity 300ms ease',
          zIndex: 10,
        }
      : undefined,
  };
}
