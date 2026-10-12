import { useRef } from 'react';

interface TiltOptions {
  maxRotation?: number;
  perspective?: number;
  scale?: number;
  speed?: number;
  glare?: boolean;
}

/**
 * Clean static hook replacing cursor-following 3D tilt and shiny glare animations.
 * Provides standard, accessible transition styles without mouse tracking.
 */
export function use3DTilt<T extends HTMLElement = HTMLDivElement>(_options: TiltOptions = {}) {
  const elementRef = useRef<T | null>(null);

  return {
    ref: elementRef,
    style: {
      transition: 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
    },
    glareStyle: undefined,
  };
}

