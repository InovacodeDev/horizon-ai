"use client";

import { useState, useCallback, MouseEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface RippleEffect {
  x: number;
  y: number;
  id: number;
}

/**
 * Hook to manage ripple effects on button clicks
 */
export function useRipple() {
  const [ripples, setRipples] = useState<RippleEffect[]>([]);

  const createRipple = useCallback((event: MouseEvent<HTMLElement>) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const newRipple: RippleEffect = {
      x,
      y,
      id: Date.now(),
    };

    setRipples((prev) => [...prev, newRipple]);

    // Remove ripple after animation completes
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);
  }, []);

  return { ripples, createRipple };
}

interface RippleContainerProps {
  ripples: RippleEffect[];
  color?: string;
}

/**
 * Ripple Container Component
 * Renders ripple effects at specified positions
 */
export function RippleContainer({
  ripples,
  color = "currentColor",
}: RippleContainerProps) {
  return (
    <span className="absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none">
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            className="absolute rounded-full"
            style={{
              left: ripple.x,
              top: ripple.y,
              backgroundColor: color,
              opacity: 0.12,
            }}
            initial={{
              width: 0,
              height: 0,
              x: 0,
              y: 0,
            }}
            animate={{
              width: 300,
              height: 300,
              x: -150,
              y: -150,
            }}
            exit={{
              opacity: 0,
            }}
            transition={{
              duration: 0.6,
              ease: [0.4, 0, 0.2, 1],
            }}
          />
        ))}
      </AnimatePresence>
    </span>
  );
}
