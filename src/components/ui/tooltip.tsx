"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * MD3 Tooltip Component
 *
 * Implements Material Design 3 tooltip specifications:
 * - Surface-variant background with appropriate contrast
 * - Placement variants (top, bottom, left, right)
 * - Optional arrow indicator
 * - Body-small typography
 * - Show/hide animations with MD3 easing
 * - Delay before showing tooltip
 * - Keyboard focus support (handled by Radix)
 * - Full accessibility (role="tooltip", aria-describedby)
 *
 * Features:
 * - Accessible by default with proper ARIA attributes
 * - Keyboard navigation support (focus to show)
 * - Configurable delay and positioning
 * - Optional arrow for better visual connection
 */

const TooltipProvider = TooltipPrimitive.Provider;

const TooltipRoot = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

/**
 * Tooltip Content Variants
 */
const tooltipContentVariants = cva(
  [
    // Base styles
    "z-50 overflow-hidden",
    "px-3 py-2",
    "max-w-xs",
    // MD3 Surface Variant background
    "bg-[hsl(var(--md-sys-color-surface-variant))]",
    "text-[hsl(var(--md-sys-color-on-surface-variant))]",
    // MD3 Border Radius Extra Small (4px)
    "rounded-[var(--md-sys-shape-corner-extra-small)]",
    // MD3 Typography - Body Small
    "text-[length:var(--md-sys-typescale-body-small-size)]",
    "leading-[var(--md-sys-typescale-body-small-line-height)]",
    "font-[number:var(--md-sys-typescale-body-small-weight)]",
    "tracking-[var(--md-sys-typescale-body-small-tracking)]",
    // MD3 Elevation Level 2
    "shadow-[var(--md-sys-elevation-level2)]",
    // Animations with MD3 easing
    "animate-in fade-in-0 zoom-in-95",
    "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
    "data-[state=open]:duration-[var(--md-sys-motion-duration-short4)]",
    "data-[state=closed]:duration-[var(--md-sys-motion-duration-short2)]",
    "data-[state=open]:ease-[var(--md-sys-motion-easing-emphasized-decelerate)]",
    "data-[state=closed]:ease-[var(--md-sys-motion-easing-emphasized-accelerate)]",
  ],
  {
    variants: {
      side: {
        top: "data-[side=top]:slide-in-from-bottom-2",
        bottom: "data-[side=bottom]:slide-in-from-top-2",
        left: "data-[side=left]:slide-in-from-right-2",
        right: "data-[side=right]:slide-in-from-left-2",
      },
    },
    defaultVariants: {
      side: "top",
    },
  }
);

export interface TooltipContentProps
  extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>,
    VariantProps<typeof tooltipContentVariants> {
  /**
   * Whether to show an arrow pointing to the trigger
   * @default false
   */
  arrow?: boolean;

  /**
   * Size offset from the trigger element
   * @default 4
   */
  sideOffset?: number;
}

/**
 * TooltipContent Component
 *
 * The content of the tooltip with MD3 styling.
 * Supports placement variants and optional arrow.
 */
const TooltipContent = React.forwardRef<React.ElementRef<typeof TooltipPrimitive.Content>, TooltipContentProps>(
  ({ className, sideOffset = 4, arrow = false, side, children, ...props }, ref) => (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        side={side}
        sideOffset={sideOffset}
        className={cn(tooltipContentVariants({ side }), className)}
        {...props}
      >
        {children}
        {arrow && (
          <TooltipPrimitive.Arrow
            className={cn(
              "fill-[hsl(var(--md-sys-color-surface-variant))]",
              // Add subtle shadow to arrow
              "drop-shadow-sm"
            )}
            width={8}
            height={4}
          />
        )}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
);
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

/**
 * Tooltip Component
 *
 * Convenience wrapper that combines TooltipRoot, TooltipTrigger, and TooltipContent.
 * Provides a simpler API for common use cases.
 *
 * @example
 * ```tsx
 * <Tooltip title="This is a tooltip">
 *   <button>Hover me</button>
 * </Tooltip>
 * ```
 *
 * @example
 * ```tsx
 * <Tooltip
 *   title="Tooltip with arrow"
 *   placement="right"
 *   arrow
 *   delayDuration={500}
 * >
 *   <button>Hover me</button>
 * </Tooltip>
 * ```
 */
export interface TooltipProps {
  /**
   * The content to display in the tooltip
   */
  title: string;

  /**
   * The element that triggers the tooltip
   */
  children: React.ReactElement;

  /**
   * Placement of the tooltip relative to the trigger
   * @default "top"
   */
  placement?: "top" | "bottom" | "left" | "right";

  /**
   * Whether to show an arrow pointing to the trigger
   * @default false
   */
  arrow?: boolean;

  /**
   * Delay in milliseconds before showing the tooltip
   * @default 700
   */
  delayDuration?: number;

  /**
   * Whether to skip the delay when moving between tooltips
   * @default true
   */
  skipDelayDuration?: number;

  /**
   * Whether the tooltip is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Additional CSS classes for the tooltip content
   */
  className?: string;

  /**
   * Size offset from the trigger element
   * @default 4
   */
  sideOffset?: number;
}

const Tooltip = React.forwardRef<HTMLButtonElement, TooltipProps>(
  (
    {
      title,
      children,
      placement = "top",
      arrow = false,
      delayDuration = 700,
      skipDelayDuration = 300,
      disabled = false,
      className,
      sideOffset = 4,
    },
    ref
  ) => {
    if (disabled) {
      return children;
    }

    return (
      <TooltipRoot delayDuration={delayDuration} skipDelayDuration={skipDelayDuration}>
        <TooltipTrigger asChild ref={ref}>
          {children}
        </TooltipTrigger>
        <TooltipContent side={placement} arrow={arrow} className={className} sideOffset={sideOffset}>
          {title}
        </TooltipContent>
      </TooltipRoot>
    );
  }
);
Tooltip.displayName = "Tooltip";

export { Tooltip, TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent };
