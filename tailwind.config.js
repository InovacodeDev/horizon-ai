/**
 * Tailwind CSS Configuration
 * Horizon AI Design System
 *
 * This configuration defines the design tokens for the application including:
 * - Color palette (light and dark theme support via CSS variables)
 * - Spacing scale (4px base grid system)
 * - Typography system (Inter font family with optimized sizes)
 * - Soft shadow system (subtle, diffused shadows)
 * - Border radius values (consistent rounding)
 * - Smooth transitions (cubic-bezier easing)
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  // Content paths for Tailwind to scan for class usage
  // Optimized for production builds with automatic purging
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    // Explicitly exclude files that might contain non-CSS content
    '!./public/**/*.ofx',
    '!./public/assets/**/*.ofx',
  ],

  // Enable dark mode via class strategy (controlled by ThemeProvider)
  darkMode: 'class',

  theme: {
    extend: {
      // Color System
      // All colors use CSS custom properties for dynamic theme switching
      // Legacy tokens maintained for backward compatibility
      colors: {
        // ============================================
        // Legacy Tokens (Backward Compatibility)
        // ============================================
        // These tokens are maintained for existing components
        // New components should use the design system tokens below
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: 'var(--primary)',
        'on-primary': 'var(--on-primary)',
        'primary-container': 'var(--primary-container)',
        'on-primary-container': 'var(--on-primary-container)',
        secondary: 'var(--secondary)',
        'on-secondary': 'var(--on-secondary)',
        'secondary-container': 'var(--secondary-container)',
        'on-secondary-container': 'var(--on-secondary-container)',
        surface: 'var(--surface)',
        'on-surface': 'var(--on-surface)',
        'surface-variant': 'var(--surface-variant)',
        'on-surface-variant': 'var(--on-surface-variant)',
        'surface-container': 'var(--surface-container)',
        outline: 'var(--outline)',
        'outline-variant': 'var(--outline-variant)',
        warning: 'var(--warning)',
        'on-warning': 'var(--on-warning)',
        'warning-container': 'var(--warning-container)',
        'on-warning-container': 'var(--on-warning-container)',
        error: 'var(--error)',
        'on-error': 'var(--on-error)',
        'error-container': 'var(--error-container)',
        'on-error-container': 'var(--on-error-container)',

        // ============================================
        // Design System Tokens (Preferred)
        // ============================================
        // Background colors - Page and section backgrounds
        bg: {
          primary: 'var(--bg-primary)', // Main page background
          secondary: 'var(--bg-secondary)', // Secondary sections
          tertiary: 'var(--bg-tertiary)', // Tertiary backgrounds
        },

        // Surface colors - Cards, containers, elevated elements
        'surface-new': {
          primary: 'var(--surface-primary)', // Cards, containers
          secondary: 'var(--surface-secondary)', // Elevated surfaces
          tertiary: 'var(--surface-tertiary)', // Subtle surfaces
        },

        // Text colors - All text content
        text: {
          primary: 'var(--text-primary)', // Primary text (WCAG AA compliant)
          secondary: 'var(--text-secondary)', // Secondary text
          tertiary: 'var(--text-tertiary)', // Muted text
          disabled: 'var(--text-disabled)', // Disabled state
        },

        // Border colors - Dividers, outlines, focus states
        border: {
          primary: 'var(--border-primary)', // Subtle borders
          secondary: 'var(--border-secondary)', // Medium borders
          focus: 'var(--border-focus)', // Focus state (blue)
        },

        // Brand colors - Primary blue palette
        blue: {
          primary: 'var(--blue-primary)', // Primary brand color
          hover: 'var(--blue-hover)', // Hover state
          light: 'var(--blue-light)', // Light backgrounds
          dark: 'var(--blue-dark)', // Dark variant
        },

        // Semantic colors - Success (green)
        green: {
          bg: 'var(--green-bg)', // Success background
          text: 'var(--green-text)', // Success text
          border: 'var(--green-border)', // Success border
        },

        // Semantic colors - Error (red)
        red: {
          bg: 'var(--red-bg)', // Error background
          text: 'var(--red-text)', // Error text
          border: 'var(--red-border)', // Error border
        },

        // Semantic colors - Warning (orange)
        orange: {
          bg: 'var(--orange-bg)', // Warning background
          text: 'var(--orange-text)', // Warning text
          border: 'var(--orange-border)', // Warning border
        },

        // Semantic colors - Info (blue)
        'blue-info': {
          bg: 'var(--blue-info-bg)', // Info background
          text: 'var(--blue-info-text)', // Info text
          border: 'var(--blue-info-border)', // Info border
        },
      },

      // ============================================
      // Spacing Scale (4px base grid system)
      // ============================================
      // Provides consistent spacing throughout the application
      // Use these values for padding, margin, gap, etc.
      spacing: {
        0: '0px', // No spacing
        1: '4px', // Extra small
        2: '8px', // Small
        3: '12px', // Medium-small
        4: '16px', // Medium (default for most elements)
        5: '20px', // Medium-large
        6: '24px', // Large (default for cards)
        7: '28px', // Extra large
        8: '32px', // 2x large (page padding desktop)
        10: '40px', // 2.5x large
        12: '48px', // 3x large
        16: '64px', // 4x large
        20: '80px', // 5x large
        24: '96px', // 6x large
      },

      // ============================================
      // Typography System
      // ============================================
      // Inter font family with optimized sizes and line heights
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },

      // Font sizes with optimized line heights and letter spacing
      fontSize: {
        xs: ['12px', { lineHeight: '16px', letterSpacing: '0.01em' }], // Small labels, captions
        sm: ['14px', { lineHeight: '20px', letterSpacing: '0.01em' }], // Body text, buttons
        base: ['16px', { lineHeight: '24px', letterSpacing: '0' }], // Default body text
        lg: ['18px', { lineHeight: '28px', letterSpacing: '-0.01em' }], // Large body text
        xl: ['20px', { lineHeight: '28px', letterSpacing: '-0.01em' }], // Small headings
        '2xl': ['24px', { lineHeight: '32px', letterSpacing: '-0.02em' }], // Medium headings
        '3xl': ['30px', { lineHeight: '36px', letterSpacing: '-0.02em' }], // Large headings
        '4xl': ['36px', { lineHeight: '40px', letterSpacing: '-0.02em' }], // Extra large headings
      },

      // Font weights for different text emphasis levels
      fontWeight: {
        normal: '400', // Body text
        medium: '500', // Emphasis, buttons
        semibold: '600', // Headings
        bold: '700', // Strong emphasis
      },

      // ============================================
      // Soft Shadow System
      // ============================================
      // Subtle, diffused shadows for depth without harshness
      // Multiple layers create realistic depth perception
      boxShadow: {
        'soft-xs': '0 1px 2px 0 rgba(0, 0, 0, 0.03)', // Minimal shadow for subtle depth
        'soft-sm': '0 2px 4px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)', // Small shadow for buttons
        'soft-md': '0 4px 8px 0 rgba(0, 0, 0, 0.05), 0 2px 4px 0 rgba(0, 0, 0, 0.03)', // Medium shadow for cards
        'soft-lg': '0 8px 16px 0 rgba(0, 0, 0, 0.06), 0 4px 8px 0 rgba(0, 0, 0, 0.04)', // Large shadow for elevated cards
        'soft-xl': '0 12px 24px 0 rgba(0, 0, 0, 0.07), 0 6px 12px 0 rgba(0, 0, 0, 0.05)', // Extra large shadow for modals
      },

      // ============================================
      // Border Radius
      // ============================================
      // Consistent rounding values for all elements
      borderRadius: {
        none: '0', // No rounding
        sm: '4px', // Small elements (badges, tags)
        DEFAULT: '8px', // Default (buttons, inputs)
        md: '8px', // Same as default
        lg: '12px', // Cards, containers
        xl: '16px', // Large containers
        '2xl': '20px', // Extra large containers
        full: '9999px', // Circular (avatars, pills)
      },

      // ============================================
      // Smooth Transitions
      // ============================================
      // Optimized timing for smooth, natural animations
      transitionDuration: {
        150: '150ms', // Fast transitions (hover, focus)
        200: '200ms', // Medium transitions (shadows, transforms)
      },

      // Cubic-bezier easing for smooth, natural motion
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)', // Ease-in-out with slight acceleration
      },

      // ============================================
      // Custom Animations
      // ============================================
      // Animations for import system and other UI elements
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'check-mark': {
          '0%': { strokeDasharray: '0 100', strokeDashoffset: '0' },
          '100%': { strokeDasharray: '100 100', strokeDashoffset: '0' },
        },
        'progress-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
        'scale-in': 'scale-in 0.5s ease-out',
        'check-mark': 'check-mark 0.6s ease-out forwards',
        'progress-pulse': 'progress-pulse 1.5s ease-in-out infinite',
      },
    },
  },

  // Airbag extra (opcional): bloqueia explicitamente o token que te quebrou
  blocklist: ['[-3:BRT]'],

  // No additional plugins required
  // All functionality achieved with core Tailwind + custom config
  plugins: [],
};
