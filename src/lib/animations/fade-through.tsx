"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";

interface FadeThroughProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  delay?: number;
}

/**
 * Fade Through Animation
 * Used for list items entering the screen with a staggered effect
 * Duration: 150ms (Short), with slight upward movement
 * Optimized for hardware acceleration using CSS transforms
 */
export function FadeThrough({
  children,
  delay = 0,
  ...props
}: FadeThroughProps) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 16,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.15, // Short duration (150ms)
        delay,
        ease: [0.4, 0, 0.2, 1], // Standard easing
      }}
      style={{
        // Use will-change only during animation
        willChange: "transform, opacity",
      }}
      onAnimationComplete={(definition) => {
        // Remove will-change after animation completes to free resources
        // The definition parameter is the target element
        const element = definition as unknown as HTMLElement;
        if (element && element.style) {
          element.style.willChange = "auto";
        }
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface FadeThroughListProps {
  children: ReactNode[];
  staggerDelay?: number;
  className?: string;
}

/**
 * Fade Through List
 * Wrapper component that automatically staggers children with Fade Through animation
 */
export function FadeThroughList({
  children,
  staggerDelay = 0.05,
  className,
}: FadeThroughListProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <FadeThrough key={index} delay={index * staggerDelay}>
          {child}
        </FadeThrough>
      ))}
    </div>
  );
}
