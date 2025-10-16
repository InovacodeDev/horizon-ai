"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";

interface SharedAxisProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  direction?: "forward" | "backward";
}

/**
 * Shared Axis Transition
 * Used for screen-to-screen transitions to create a sense of forward/backward progression
 * Duration: 300-400ms (Long), Easing: Emphasized
 */
export function SharedAxis({
  children,
  direction = "forward",
  ...props
}: SharedAxisProps) {
  const variants = {
    initial: {
      x: direction === "forward" ? 30 : -30,
      opacity: 0,
    },
    animate: {
      x: 0,
      opacity: 1,
    },
    exit: {
      x: direction === "forward" ? -30 : 30,
      opacity: 0,
    },
  };

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{
        duration: 0.4, // Long duration (400ms)
        ease: [0.2, 0, 0, 1], // Emphasized easing
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
