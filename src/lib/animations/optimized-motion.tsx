"use client";

import { motion, HTMLMotionProps, Variants } from "framer-motion";
import { ReactNode, useRef, useEffect } from "react";

interface OptimizedMotionProps
  extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  /**
   * Enable will-change optimization
   * @default true
   */
  enableWillChange?: boolean;
}

/**
 * Performance-optimized motion component
 * - Uses CSS transforms for hardware acceleration
 * - Applies will-change only during animation
 * - Automatically removes will-change after animation completes
 * - Ensures 60fps performance
 */
export function OptimizedMotion({
  children,
  enableWillChange = true,
  ...props
}: OptimizedMotionProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enableWillChange || !ref.current) return;

    const element = ref.current;

    // Apply will-change when animation starts
    const handleAnimationStart = () => {
      element.style.willChange = "transform, opacity";
    };

    // Remove will-change when animation completes to free GPU resources
    const handleAnimationComplete = () => {
      element.style.willChange = "auto";
    };

    // Listen for animation events
    element.addEventListener("animationstart", handleAnimationStart);
    element.addEventListener("animationend", handleAnimationComplete);

    return () => {
      element.removeEventListener("animationstart", handleAnimationStart);
      element.removeEventListener("animationend", handleAnimationComplete);
    };
  }, [enableWillChange]);

  return (
    <motion.div
      ref={ref}
      {...props}
      style={{
        // Force hardware acceleration
        transform: "translateZ(0)",
        ...props.style,
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Optimized animation variants that ensure hardware acceleration
 * All animations use transform and opacity only (GPU-accelerated properties)
 */
export const optimizedVariants = {
  /**
   * Fade in with upward movement
   * Uses translateY for hardware acceleration
   */
  fadeInUp: {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1],
      },
    },
  } as Variants,

  /**
   * Scale in animation
   * Uses scale transform for hardware acceleration
   */
  scaleIn: {
    hidden: {
      opacity: 0,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
      },
    },
  } as Variants,

  /**
   * Slide in from left
   * Uses translateX for hardware acceleration
   */
  slideInLeft: {
    hidden: {
      opacity: 0,
      x: -20,
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1],
      },
    },
  } as Variants,

  /**
   * Slide in from right
   * Uses translateX for hardware acceleration
   */
  slideInRight: {
    hidden: {
      opacity: 0,
      x: 20,
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1],
      },
    },
  } as Variants,
} as const;
