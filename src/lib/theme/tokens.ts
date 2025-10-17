/**
 * Utility functions for accessing MD3 design tokens
 */

/**
 * Get a CSS variable value from the document root
 */
function getCSSVariable(variable: string): string {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
}

/**
 * Color token utilities
 */
export const colors = {
  primary: () => getCSSVariable("--md-sys-color-primary"),
  onPrimary: () => getCSSVariable("--md-sys-color-on-primary"),
  primaryContainer: () => getCSSVariable("--md-sys-color-primary-container"),
  onPrimaryContainer: () => getCSSVariable("--md-sys-color-on-primary-container"),

  secondary: () => getCSSVariable("--md-sys-color-secondary"),
  onSecondary: () => getCSSVariable("--md-sys-color-on-secondary"),
  secondaryContainer: () => getCSSVariable("--md-sys-color-secondary-container"),
  onSecondaryContainer: () => getCSSVariable("--md-sys-color-on-secondary-container"),

  tertiary: () => getCSSVariable("--md-sys-color-tertiary"),
  onTertiary: () => getCSSVariable("--md-sys-color-on-tertiary"),
  tertiaryContainer: () => getCSSVariable("--md-sys-color-tertiary-container"),
  onTertiaryContainer: () => getCSSVariable("--md-sys-color-on-tertiary-container"),

  error: () => getCSSVariable("--md-sys-color-error"),
  onError: () => getCSSVariable("--md-sys-color-on-error"),
  errorContainer: () => getCSSVariable("--md-sys-color-error-container"),
  onErrorContainer: () => getCSSVariable("--md-sys-color-on-error-container"),

  surface: () => getCSSVariable("--md-sys-color-surface"),
  onSurface: () => getCSSVariable("--md-sys-color-on-surface"),
  surfaceVariant: () => getCSSVariable("--md-sys-color-surface-variant"),
  onSurfaceVariant: () => getCSSVariable("--md-sys-color-on-surface-variant"),
  surfaceContainerLowest: () => getCSSVariable("--md-sys-color-surface-container-lowest"),
  surfaceContainerLow: () => getCSSVariable("--md-sys-color-surface-container-low"),
  surfaceContainer: () => getCSSVariable("--md-sys-color-surface-container"),
  surfaceContainerHigh: () => getCSSVariable("--md-sys-color-surface-container-high"),
  surfaceContainerHighest: () => getCSSVariable("--md-sys-color-surface-container-highest"),

  outline: () => getCSSVariable("--md-sys-color-outline"),
  outlineVariant: () => getCSSVariable("--md-sys-color-outline-variant"),

  background: () => getCSSVariable("--md-sys-color-background"),
  onBackground: () => getCSSVariable("--md-sys-color-on-background"),

  inverseSurface: () => getCSSVariable("--md-sys-color-inverse-surface"),
  inverseOnSurface: () => getCSSVariable("--md-sys-color-inverse-on-surface"),
  inversePrimary: () => getCSSVariable("--md-sys-color-inverse-primary"),

  scrim: () => getCSSVariable("--md-sys-color-scrim"),
  shadow: () => getCSSVariable("--md-sys-color-shadow"),
} as const;

/**
 * Typography token utilities
 */
export const typography = {
  displayLarge: {
    font: () => getCSSVariable("--md-sys-typescale-display-large-font"),
    size: () => getCSSVariable("--md-sys-typescale-display-large-size"),
    lineHeight: () => getCSSVariable("--md-sys-typescale-display-large-line-height"),
    weight: () => getCSSVariable("--md-sys-typescale-display-large-weight"),
    tracking: () => getCSSVariable("--md-sys-typescale-display-large-tracking"),
  },
  displayMedium: {
    font: () => getCSSVariable("--md-sys-typescale-display-medium-font"),
    size: () => getCSSVariable("--md-sys-typescale-display-medium-size"),
    lineHeight: () => getCSSVariable("--md-sys-typescale-display-medium-line-height"),
    weight: () => getCSSVariable("--md-sys-typescale-display-medium-weight"),
    tracking: () => getCSSVariable("--md-sys-typescale-display-medium-tracking"),
  },
  displaySmall: {
    font: () => getCSSVariable("--md-sys-typescale-display-small-font"),
    size: () => getCSSVariable("--md-sys-typescale-display-small-size"),
    lineHeight: () => getCSSVariable("--md-sys-typescale-display-small-line-height"),
    weight: () => getCSSVariable("--md-sys-typescale-display-small-weight"),
    tracking: () => getCSSVariable("--md-sys-typescale-display-small-tracking"),
  },
  headlineLarge: {
    font: () => getCSSVariable("--md-sys-typescale-headline-large-font"),
    size: () => getCSSVariable("--md-sys-typescale-headline-large-size"),
    lineHeight: () => getCSSVariable("--md-sys-typescale-headline-large-line-height"),
    weight: () => getCSSVariable("--md-sys-typescale-headline-large-weight"),
    tracking: () => getCSSVariable("--md-sys-typescale-headline-large-tracking"),
  },
  headlineMedium: {
    font: () => getCSSVariable("--md-sys-typescale-headline-medium-font"),
    size: () => getCSSVariable("--md-sys-typescale-headline-medium-size"),
    lineHeight: () => getCSSVariable("--md-sys-typescale-headline-medium-line-height"),
    weight: () => getCSSVariable("--md-sys-typescale-headline-medium-weight"),
    tracking: () => getCSSVariable("--md-sys-typescale-headline-medium-tracking"),
  },
  headlineSmall: {
    font: () => getCSSVariable("--md-sys-typescale-headline-small-font"),
    size: () => getCSSVariable("--md-sys-typescale-headline-small-size"),
    lineHeight: () => getCSSVariable("--md-sys-typescale-headline-small-line-height"),
    weight: () => getCSSVariable("--md-sys-typescale-headline-small-weight"),
    tracking: () => getCSSVariable("--md-sys-typescale-headline-small-tracking"),
  },
  titleLarge: {
    font: () => getCSSVariable("--md-sys-typescale-title-large-font"),
    size: () => getCSSVariable("--md-sys-typescale-title-large-size"),
    lineHeight: () => getCSSVariable("--md-sys-typescale-title-large-line-height"),
    weight: () => getCSSVariable("--md-sys-typescale-title-large-weight"),
    tracking: () => getCSSVariable("--md-sys-typescale-title-large-tracking"),
  },
  titleMedium: {
    font: () => getCSSVariable("--md-sys-typescale-title-medium-font"),
    size: () => getCSSVariable("--md-sys-typescale-title-medium-size"),
    lineHeight: () => getCSSVariable("--md-sys-typescale-title-medium-line-height"),
    weight: () => getCSSVariable("--md-sys-typescale-title-medium-weight"),
    tracking: () => getCSSVariable("--md-sys-typescale-title-medium-tracking"),
  },
  titleSmall: {
    font: () => getCSSVariable("--md-sys-typescale-title-small-font"),
    size: () => getCSSVariable("--md-sys-typescale-title-small-size"),
    lineHeight: () => getCSSVariable("--md-sys-typescale-title-small-line-height"),
    weight: () => getCSSVariable("--md-sys-typescale-title-small-weight"),
    tracking: () => getCSSVariable("--md-sys-typescale-title-small-tracking"),
  },
  bodyLarge: {
    font: () => getCSSVariable("--md-sys-typescale-body-large-font"),
    size: () => getCSSVariable("--md-sys-typescale-body-large-size"),
    lineHeight: () => getCSSVariable("--md-sys-typescale-body-large-line-height"),
    weight: () => getCSSVariable("--md-sys-typescale-body-large-weight"),
    tracking: () => getCSSVariable("--md-sys-typescale-body-large-tracking"),
  },
  bodyMedium: {
    font: () => getCSSVariable("--md-sys-typescale-body-medium-font"),
    size: () => getCSSVariable("--md-sys-typescale-body-medium-size"),
    lineHeight: () => getCSSVariable("--md-sys-typescale-body-medium-line-height"),
    weight: () => getCSSVariable("--md-sys-typescale-body-medium-weight"),
    tracking: () => getCSSVariable("--md-sys-typescale-body-medium-tracking"),
  },
  bodySmall: {
    font: () => getCSSVariable("--md-sys-typescale-body-small-font"),
    size: () => getCSSVariable("--md-sys-typescale-body-small-size"),
    lineHeight: () => getCSSVariable("--md-sys-typescale-body-small-line-height"),
    weight: () => getCSSVariable("--md-sys-typescale-body-small-weight"),
    tracking: () => getCSSVariable("--md-sys-typescale-body-small-tracking"),
  },
  labelLarge: {
    font: () => getCSSVariable("--md-sys-typescale-label-large-font"),
    size: () => getCSSVariable("--md-sys-typescale-label-large-size"),
    lineHeight: () => getCSSVariable("--md-sys-typescale-label-large-line-height"),
    weight: () => getCSSVariable("--md-sys-typescale-label-large-weight"),
    tracking: () => getCSSVariable("--md-sys-typescale-label-large-tracking"),
  },
  labelMedium: {
    font: () => getCSSVariable("--md-sys-typescale-label-medium-font"),
    size: () => getCSSVariable("--md-sys-typescale-label-medium-size"),
    lineHeight: () => getCSSVariable("--md-sys-typescale-label-medium-line-height"),
    weight: () => getCSSVariable("--md-sys-typescale-label-medium-weight"),
    tracking: () => getCSSVariable("--md-sys-typescale-label-medium-tracking"),
  },
  labelSmall: {
    font: () => getCSSVariable("--md-sys-typescale-label-small-font"),
    size: () => getCSSVariable("--md-sys-typescale-label-small-size"),
    lineHeight: () => getCSSVariable("--md-sys-typescale-label-small-line-height"),
    weight: () => getCSSVariable("--md-sys-typescale-label-small-weight"),
    tracking: () => getCSSVariable("--md-sys-typescale-label-small-tracking"),
  },
} as const;

/**
 * Elevation token utilities
 */
export const elevation = {
  level0: () => getCSSVariable("--md-sys-elevation-level0"),
  level1: () => getCSSVariable("--md-sys-elevation-level1"),
  level2: () => getCSSVariable("--md-sys-elevation-level2"),
  level3: () => getCSSVariable("--md-sys-elevation-level3"),
  level4: () => getCSSVariable("--md-sys-elevation-level4"),
  level5: () => getCSSVariable("--md-sys-elevation-level5"),
} as const;

/**
 * Shape token utilities
 */
export const shape = {
  none: () => getCSSVariable("--md-sys-shape-corner-none"),
  extraSmall: () => getCSSVariable("--md-sys-shape-corner-extra-small"),
  small: () => getCSSVariable("--md-sys-shape-corner-small"),
  medium: () => getCSSVariable("--md-sys-shape-corner-medium"),
  large: () => getCSSVariable("--md-sys-shape-corner-large"),
  extraLarge: () => getCSSVariable("--md-sys-shape-corner-extra-large"),
  full: () => getCSSVariable("--md-sys-shape-corner-full"),
} as const;

/**
 * Motion token utilities
 */
export const motion = {
  duration: {
    short1: () => getCSSVariable("--md-sys-motion-duration-short1"),
    short2: () => getCSSVariable("--md-sys-motion-duration-short2"),
    short3: () => getCSSVariable("--md-sys-motion-duration-short3"),
    short4: () => getCSSVariable("--md-sys-motion-duration-short4"),
    medium1: () => getCSSVariable("--md-sys-motion-duration-medium1"),
    medium2: () => getCSSVariable("--md-sys-motion-duration-medium2"),
    medium3: () => getCSSVariable("--md-sys-motion-duration-medium3"),
    medium4: () => getCSSVariable("--md-sys-motion-duration-medium4"),
    long1: () => getCSSVariable("--md-sys-motion-duration-long1"),
    long2: () => getCSSVariable("--md-sys-motion-duration-long2"),
    long3: () => getCSSVariable("--md-sys-motion-duration-long3"),
    long4: () => getCSSVariable("--md-sys-motion-duration-long4"),
    extraLong1: () => getCSSVariable("--md-sys-motion-duration-extra-long1"),
    extraLong2: () => getCSSVariable("--md-sys-motion-duration-extra-long2"),
    extraLong3: () => getCSSVariable("--md-sys-motion-duration-extra-long3"),
    extraLong4: () => getCSSVariable("--md-sys-motion-duration-extra-long4"),
  },
  easing: {
    standard: () => getCSSVariable("--md-sys-motion-easing-standard"),
    standardAccelerate: () => getCSSVariable("--md-sys-motion-easing-standard-accelerate"),
    standardDecelerate: () => getCSSVariable("--md-sys-motion-easing-standard-decelerate"),
    emphasized: () => getCSSVariable("--md-sys-motion-easing-emphasized"),
    emphasizedAccelerate: () => getCSSVariable("--md-sys-motion-easing-emphasized-accelerate"),
    emphasizedDecelerate: () => getCSSVariable("--md-sys-motion-easing-emphasized-decelerate"),
    legacy: () => getCSSVariable("--md-sys-motion-easing-legacy"),
    legacyAccelerate: () => getCSSVariable("--md-sys-motion-easing-legacy-accelerate"),
    legacyDecelerate: () => getCSSVariable("--md-sys-motion-easing-legacy-decelerate"),
    linear: () => getCSSVariable("--md-sys-motion-easing-linear"),
  },
} as const;

/**
 * State layer opacity utilities
 */
export const state = {
  hoverOpacity: () => getCSSVariable("--md-sys-state-hover-opacity"),
  focusOpacity: () => getCSSVariable("--md-sys-state-focus-opacity"),
  pressedOpacity: () => getCSSVariable("--md-sys-state-pressed-opacity"),
  draggedOpacity: () => getCSSVariable("--md-sys-state-dragged-opacity"),
  disabledContentOpacity: () => getCSSVariable("--md-sys-state-disabled-content-opacity"),
  disabledContainerOpacity: () => getCSSVariable("--md-sys-state-disabled-container-opacity"),
} as const;

/**
 * Helper to create a state layer color with opacity
 */
export function createStateLayer(color: string, opacity: number | string): string {
  return `hsl(${color} / ${opacity})`;
}

/**
 * Export all token utilities
 */
export const tokens = {
  colors,
  typography,
  elevation,
  shape,
  motion,
  state,
  createStateLayer,
} as const;
