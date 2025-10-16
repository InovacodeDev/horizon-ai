"use client";

import { motion, HTMLMotionProps, Variants } from "framer-motion";
import { ReactNode } from "react";

interface StaggerContainerProps
  extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  staggerDelay?: number;
  delayChildren?: number;
}

/**
 * Stagger Container
 * Automatically staggers the animation of child elements
 * Used for lists and grids where items should animate in sequence
 */
export function StaggerContainer({
  children,
  staggerDelay = 0.1,
  delayChildren = 0,
  ...props
}: StaggerContainerProps) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stagger Item
 * Child component to be used within StaggerContainer
 * Provides the animation variants for individual items
 * Optimized for hardware acceleration using CSS transforms
 */
interface StaggerItemProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
}

export function StaggerItem({ children, ...props }: StaggerItemProps) {
  const itemVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1], // Standard easing
      },
    },
  };

  return (
    <motion.div
      variants={itemVariants}
      style={{
        // Use will-change during animation for better performance
        willChange: "transform, opacity",
      }}
      onAnimationComplete={(definition) => {
        // Remove will-change after animation to free GPU resources
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
