/**
 * Material Design 3 Motion Configuration
 * Centralized animation tokens for consistent motion across the app
 */

export const motionConfig = {
  // Duration tokens
  duration: {
    short: 0.15, // 150ms - for subtle feedback like fade-ins
    medium: 0.25, // 250ms - for small element transitions
    long: 0.4, // 400ms - for large-scale transitions like screen changes
  },

  // Easing curves
  easing: {
    emphasized: [0.2, 0, 0, 1] as const, // For elements entering or exiting
    standard: [0.4, 0, 0.2, 1] as const, // For elements transforming within screen
  },

  // Common transition presets
  transitions: {
    fadeIn: {
      duration: 0.15,
      ease: [0.4, 0, 0.2, 1] as const,
    },
    slideIn: {
      duration: 0.4,
      ease: [0.2, 0, 0, 1] as const,
    },
    scale: {
      duration: 0.25,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  },
} as const;

/**
 * CSS custom properties for motion
 * These match the values defined in globals.css
 */
export const motionCSSVars = {
  durationShort: "var(--duration-short)",
  durationMedium: "var(--duration-medium)",
  durationLong: "var(--duration-long)",
  easingEmphasized: "var(--easing-emphasized)",
  easingStandard: "var(--easing-standard)",
} as const;
