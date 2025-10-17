"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * MD3 Linear Progress Component
 *
 * Implements Material Design 3 linear progress indicator specifications.
 * Supports both determinate (with value) and indeterminate (loading) modes.
 *
 * Features:
 * - Determinate and indeterminate modes
 * - Buffer support for showing loading ahead
 * - Color variants (primary, secondary, tertiary)
 * - Smooth transitions between progress values
 * - MD3 motion system for animations
 * - Full accessibility support with ARIA attributes
 */

const linearProgressVariants = cva(
  ["relative w-full h-1 overflow-hidden", "bg-[hsl(var(--md-sys-color-surface-variant))]", "rounded-full"],
  {
    variants: {
      color: {
        primary: "[&_.progress-bar]:bg-[hsl(var(--md-sys-color-primary))]",
        secondary: "[&_.progress-bar]:bg-[hsl(var(--md-sys-color-secondary))]",
        tertiary: "[&_.progress-bar]:bg-[hsl(var(--md-sys-color-tertiary))]",
      },
    },
    defaultVariants: {
      color: "primary",
    },
  }
);

export interface LinearProgressProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "color">,
    VariantProps<typeof linearProgressVariants> {
  /**
   * Progress value (0-100). If undefined, shows indeterminate mode.
   */
  value?: number;

  /**
   * Buffer value (0-100). Shows a lighter bar ahead of the progress.
   */
  buffer?: number;
}

const LinearProgress = React.forwardRef<HTMLDivElement, LinearProgressProps>(
  ({ className, color = "primary", value, buffer, ...props }, ref) => {
    const isIndeterminate = value === undefined;
    const normalizedValue = value !== undefined ? Math.min(100, Math.max(0, value)) : 0;
    const normalizedBuffer = buffer !== undefined ? Math.min(100, Math.max(0, buffer)) : 0;

    return (
      <div
        ref={ref}
        className={cn(linearProgressVariants({ color }), className)}
        role="progressbar"
        aria-valuemin={isIndeterminate ? undefined : 0}
        aria-valuemax={isIndeterminate ? undefined : 100}
        aria-valuenow={isIndeterminate ? undefined : normalizedValue}
        aria-label={isIndeterminate ? "Loading" : `${normalizedValue}% complete`}
        {...props}
      >
        {/* Buffer bar (if provided) */}
        {buffer !== undefined && !isIndeterminate && (
          <div
            className="progress-bar absolute inset-y-0 left-0 opacity-30 rounded-full transition-[width] duration-[var(--md-sys-motion-duration-medium2)] ease-[var(--md-sys-motion-easing-standard)]"
            style={{ width: `${normalizedBuffer}%` }}
          />
        )}

        {/* Progress bar */}
        {isIndeterminate ? (
          <>
            {/* Primary indeterminate bar */}
            <div
              className="progress-bar absolute inset-y-0 rounded-full animate-linear-progress-primary"
              style={{
                left: "-35%",
                right: "100%",
              }}
            />
            {/* Secondary indeterminate bar */}
            <div
              className="progress-bar absolute inset-y-0 rounded-full animate-linear-progress-secondary"
              style={{
                left: "-200%",
                right: "100%",
              }}
            />
          </>
        ) : (
          <div
            className="progress-bar absolute inset-y-0 left-0 rounded-full transition-[width] duration-[var(--md-sys-motion-duration-medium2)] ease-[var(--md-sys-motion-easing-standard)]"
            style={{ width: `${normalizedValue}%` }}
          />
        )}
      </div>
    );
  }
);
LinearProgress.displayName = "LinearProgress";

export { LinearProgress, linearProgressVariants };
