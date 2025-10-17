"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * MD3 Badge Component
 *
 * Implements Material Design 3 badge specifications with two variants:
 * - standard: Badge with content (number or text)
 * - dot: Simple notification indicator without content
 *
 * Features:
 * - Color variants (primary, secondary, error)
 * - Max value with "+" suffix (e.g., "99+")
 * - Positioned relative to child element
 * - Support for invisible prop to hide badge
 * - MD3 label-small typography for standard variant
 * - Proper sizing and positioning
 * - Full accessibility support with aria-label
 */

const badgeVariants = cva(
  [
    // Base styles
    "absolute inline-flex items-center justify-center",
    "whitespace-nowrap",
    "rounded-full",
    // Transitions
    "transition-all duration-[var(--md-sys-motion-duration-short2)]",
    "ease-[var(--md-sys-motion-easing-standard)]",
    // Z-index to appear above child
    "z-10",
  ],
  {
    variants: {
      variant: {
        // Standard - with content (number or text)
        standard: [
          "min-w-5 h-5 px-1.5",
          // MD3 Typography - Label Small
          "font-[family-name:var(--md-sys-typescale-label-small-font)]",
          "text-[length:var(--md-sys-typescale-label-small-size)]",
          "leading-[var(--md-sys-typescale-label-small-line-height)]",
          "font-[number:var(--md-sys-typescale-label-small-weight)]",
          "tracking-[var(--md-sys-typescale-label-small-tracking)]",
        ],
        // Dot - simple indicator
        dot: ["w-2 h-2"],
      },
      color: {
        primary: ["bg-[hsl(var(--md-sys-color-primary))]", "text-[hsl(var(--md-sys-color-on-primary))]"],
        secondary: ["bg-[hsl(var(--md-sys-color-secondary))]", "text-[hsl(var(--md-sys-color-on-secondary))]"],
        error: ["bg-[hsl(var(--md-sys-color-error))]", "text-[hsl(var(--md-sys-color-on-error))]"],
      },
      invisible: {
        true: "opacity-0 scale-0",
        false: "opacity-100 scale-100",
      },
    },
    defaultVariants: {
      variant: "standard",
      color: "error",
      invisible: false,
    },
  }
);

export interface BadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "color">,
    VariantProps<typeof badgeVariants> {
  /**
   * Badge content (number or text)
   * Only used for standard variant
   */
  content?: number | string;

  /**
   * Maximum value to display before showing "+"
   * e.g., max=99 will show "99+" for values >= 100
   * @default 99
   */
  max?: number;

  /**
   * Child element to position badge relative to
   */
  children: React.ReactNode;

  /**
   * Accessible label for screen readers
   * If not provided, will use content value
   */
  "aria-label"?: string;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant = "standard",
      color = "error",
      invisible = false,
      content,
      max = 99,
      children,
      "aria-label": ariaLabel,
      ...props
    },
    ref
  ) => {
    // Calculate display content with max value
    const getDisplayContent = () => {
      if (variant === "dot") return null;

      if (content === undefined || content === null) return null;

      if (typeof content === "number") {
        if (content > max) {
          return `${max}+`;
        }
        return content.toString();
      }

      return content;
    };

    const displayContent = getDisplayContent();

    // Generate accessible label
    const getAriaLabel = () => {
      if (ariaLabel) return ariaLabel;

      if (variant === "dot") {
        return "notification indicator";
      }

      if (typeof content === "number") {
        if (content > max) {
          return `${content} notifications`;
        }
        return content === 1 ? "1 notification" : `${content} notifications`;
      }

      return content ? String(content) : undefined;
    };

    return (
      <span className="relative inline-flex">
        {children}
        <span
          ref={ref}
          className={cn(
            badgeVariants({ variant, color, invisible }),
            // Position badge at top-right corner
            "top-0 right-0 -translate-y-1/2 translate-x-1/2",
            className
          )}
          role="status"
          aria-label={getAriaLabel()}
          {...props}
        >
          {displayContent}
        </span>
      </span>
    );
  }
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
