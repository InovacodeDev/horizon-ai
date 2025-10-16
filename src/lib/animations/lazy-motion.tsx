"use client";

import dynamic from "next/dynamic";
import { ComponentProps } from "react";

/**
 * Lazy-loaded motion components for code splitting
 * Use these instead of direct framer-motion imports for better performance
 */

// Lazy load motion.div with no SSR to reduce initial bundle
export const LazyMotionDiv = dynamic(
  () => import("framer-motion").then((mod) => mod.motion.div),
  { ssr: false }
);

// Lazy load motion.section
export const LazyMotionSection = dynamic(
  () => import("framer-motion").then((mod) => mod.motion.section),
  { ssr: false }
);

// Lazy load motion.article
export const LazyMotionArticle = dynamic(
  () => import("framer-motion").then((mod) => mod.motion.article),
  { ssr: false }
);

// Type exports for convenience
export type LazyMotionDivProps = ComponentProps<typeof LazyMotionDiv>;
export type LazyMotionSectionProps = ComponentProps<typeof LazyMotionSection>;
export type LazyMotionArticleProps = ComponentProps<typeof LazyMotionArticle>;
