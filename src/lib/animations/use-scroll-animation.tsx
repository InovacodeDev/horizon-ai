"use client";

import { useInView } from "framer-motion";
import { useRef } from "react";

interface UseScrollAnimationOptions {
  /**
   * Only trigger the animation once when element enters viewport
   * @default true
   */
  once?: boolean;
  /**
   * Margin around the viewport for triggering the animation
   * Positive values trigger before element enters viewport
   * Negative values trigger after element enters viewport
   * @default "-100px"
   */
  margin?:
    | `${number}px`
    | `${number}px ${number}px`
    | `${number}px ${number}px ${number}px ${number}px`;
  /**
   * Amount of the element that needs to be visible (0-1)
   * @default 0 (any part visible)
   */
  amount?: number | "some" | "all";
}

/**
 * Hook for scroll-triggered animations
 * Uses Intersection Observer via Framer Motion's useInView
 *
 * @example
 * ```tsx
 * const { ref, isInView } = useScrollAnimation({ once: true });
 *
 * return (
 *   <motion.div
 *     ref={ref}
 *     initial={{ opacity: 0, y: 20 }}
 *     animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
 *   >
 *     Content
 *   </motion.div>
 * );
 * ```
 */
export function useScrollAnimation<T extends HTMLElement = HTMLDivElement>(
  options: UseScrollAnimationOptions = {}
) {
  const { once = true, margin = "-100px", amount = 0 } = options;

  const ref = useRef<T>(null);
  const isInView = useInView(ref, {
    once,
    margin,
    amount,
  });

  return { ref, isInView };
}

/**
 * Predefined animation variants for common scroll animations
 * All variants use CSS transforms for hardware acceleration
 * Note: Use these with will-change: transform, opacity during animation
 */
export const scrollAnimationVariants = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
    },
  },
  fadeInUp: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
    },
  },
  fadeInDown: {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
    },
  },
  fadeInLeft: {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
    },
  },
  fadeInRight: {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
    },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
    },
  },
} as const;
