"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * MD3 Circular Progress Component
 *
 * Implements Material Design 3 circular progress indicator specifications.
 * Supports both determinate (with value) and indeterminate (loading) modes.
 *
 * Features:
 * - Determinate and indeterminate modes
 * - Size variants (small, medium, large)
 * - Color variants (primary, secondary, tertiary)
 * - Smooth transitions between progress values
 * - MD3 motion system for animations
 * - Full accessibility support with ARIA attributes
 */

const circularProgressVariants = cva(
  [
    "inline-block",
    "transition-all duration-[var(--md-sys-motion-duration-medium2)]",
    "ease-[var(--md-sys-motion-easing-standard)]",
  ],
  {
    variants: {
      size: {
        small: "w-8 h-8",
        medium: "w-12 h-12",
        large: "w-16 h-16",
      },
      color: {
        primary: "text-[hsl(var(--md-sys-color-primary))]",
        secondary: "text-[hsl(var(--md-sys-color-secondary))]",
        tertiary: "text-[hsl(var(--md-sys-color-tertiary))]",
      },
    },
    defaultVariants: {
      size: "medium",
      color: "primary",
    },
  }
);

export interface CircularProgressProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "color">,
    VariantProps<typeof circularProgressVariants> {
  /**
   * Progress value (0-100). If undefined, shows indeterminate mode.
   */
  value?: number;

  /**
   * Stroke thickness (1-10)
   */
  thickness?: number;
}

const CircularProgress = React.forwardRef<HTMLDivElement, CircularProgressProps>(
  ({ className, size = "medium", color = "primary", value, thickness = 4, ...props }, ref) => {
    const isIndeterminate = value === undefined;
    const normalizedValue = value !== undefined ? Math.min(100, Math.max(0, value)) : 0;

    // SVG dimensions based on size
    const sizeMap = {
      small: 32,
      medium: 48,
      large: 64,
    };
    const svgSize = sizeMap[size || "medium"];
    const center = svgSize / 2;
    const radius = center - thickness / 2;
    const circumference = 2 * Math.PI * radius;

    // Calculate stroke dash offset for determinate mode
    const strokeDashoffset = circumference - (normalizedValue / 100) * circumference;

    return (
      <div
        ref={ref}
        className={cn(circularProgressVariants({ size, color }), className)}
        role="progressbar"
        aria-valuemin={isIndeterminate ? undefined : 0}
        aria-valuemax={isIndeterminate ? undefined : 100}
        aria-valuenow={isIndeterminate ? undefined : normalizedValue}
        aria-label={isIndeterminate ? "Loading" : `${normalizedValue}% complete`}
        {...props}
      >
        <svg className="w-full h-full" viewBox={`0 0 ${svgSize} ${svgSize}`} xmlns="http://www.w3.org/2000/svg">
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={thickness}
            opacity="0.2"
          />

          {/* Progress circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={isIndeterminate ? circumference * 0.25 : strokeDashoffset}
            className={cn(
              "origin-center -rotate-90",
              "transition-[stroke-dashoffset] duration-[var(--md-sys-motion-duration-medium2)]",
              "ease-[var(--md-sys-motion-easing-standard)]",
              isIndeterminate && "animate-circular-progress"
            )}
            style={{
              transformOrigin: "center",
            }}
          />
        </svg>
      </div>
    );
  }
);
CircularProgress.displayName = "CircularProgress";

export { CircularProgress, circularProgressVariants };
