"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { useRipple, RippleContainer } from "@/lib/animations/ripple";
import { StateLayer, useStateLayer } from "./state-layer";

/**
 * MD3 Button Component
 *
 * Implements Material Design 3 button specifications with five variants:
 * - filled: High emphasis with primary color and elevation on hover
 * - outlined: Medium emphasis with border and state layers
 * - text: Low emphasis with transparent background
 * - elevated: Medium emphasis with shadow elevation
 * - tonal: Medium emphasis with secondary container colors
 *
 * Features:
 * - State layers for hover, focus, and pressed states
 * - Ripple effects on click
 * - Support for leading and trailing icons
 * - MD3 label-large typography
 * - Proper disabled states with appropriate opacity
 * - Full accessibility support
 */

const buttonVariants = cva(
  [
    // Base styles
    "relative inline-flex items-center justify-center gap-2",
    "whitespace-nowrap overflow-hidden rounded-[0.5rem]",
    // MD3 Typography - Label Large
    "font-[family-name:var(--md-sys-typescale-label-large-font)]",
    "text-[length:var(--md-sys-typescale-label-large-size)]",
    "leading-[var(--md-sys-typescale-label-large-line-height)]",
    "font-[number:var(--md-sys-typescale-label-large-weight)]",
    "tracking-[var(--md-sys-typescale-label-large-tracking)]",
    // Transitions
    "transition-all duration-[var(--md-sys-motion-duration-short2)]",
    "ease-[var(--md-sys-motion-easing-standard)]",
    // Focus styles
    "focus-visible:outline-none focus-visible:ring-2",
    "focus-visible:ring-[hsl(var(--md-sys-color-primary))]",
    "focus-visible:ring-offset-2",
    // Disabled styles
    "disabled:pointer-events-none",
    // Icon sizing
    "[&_svg]:pointer-events-none [&_svg]:size-[18px] [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        // Filled - High emphasis, primary color
        filled: [
          "bg-[hsl(var(--md-sys-color-primary))]",
          "text-[hsl(var(--md-sys-color-on-primary))]",
          "shadow-[var(--md-sys-elevation-level0)]",
          "hover:shadow-[var(--md-sys-elevation-level1)]",
          "disabled:bg-[hsl(var(--md-sys-color-on-surface)/0.12)]",
          "disabled:text-[hsl(var(--md-sys-color-on-surface)/0.38)]",
          "disabled:shadow-none",
        ],
        // Outlined - Medium emphasis, border
        outlined: [
          "border border-[hsl(var(--md-sys-color-outline))]",
          "bg-transparent",
          "text-[hsl(var(--md-sys-color-primary))]",
          "disabled:border-[hsl(var(--md-sys-color-on-surface)/0.12)]",
          "disabled:text-[hsl(var(--md-sys-color-on-surface)/0.38)]",
        ],
        // Text - Low emphasis, transparent
        text: [
          "bg-transparent",
          "text-[hsl(var(--md-sys-color-primary))]",
          "disabled:text-[hsl(var(--md-sys-color-on-surface)/0.38)]",
        ],
        // Elevated - Medium emphasis, shadow
        elevated: [
          "bg-[hsl(var(--md-sys-color-surface-container-low))]",
          "text-[hsl(var(--md-sys-color-primary))]",
          "shadow-[var(--md-sys-elevation-level1)]",
          "hover:shadow-[var(--md-sys-elevation-level2)]",
          "disabled:bg-[hsl(var(--md-sys-color-on-surface)/0.12)]",
          "disabled:text-[hsl(var(--md-sys-color-on-surface)/0.38)]",
          "disabled:shadow-none",
        ],
        // Tonal - Medium emphasis, secondary container
        tonal: [
          "bg-[hsl(var(--md-sys-color-secondary-container))]",
          "text-[hsl(var(--md-sys-color-on-secondary-container))]",
          "shadow-[var(--md-sys-elevation-level0)]",
          "hover:shadow-[var(--md-sys-elevation-level1)]",
          "disabled:bg-[hsl(var(--md-sys-color-on-surface)/0.12)]",
          "disabled:text-[hsl(var(--md-sys-color-on-surface)/0.38)]",
          "disabled:shadow-none",
        ],
      },
      size: {
        small: "h-10 px-3 min-w-[64px]",
        medium: "h-10 px-6 min-w-[64px]",
        large: "h-12 px-8 min-w-[64px]",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "filled",
      size: "medium",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Render as a child component (using Radix Slot)
   */
  asChild?: boolean;

  /**
   * Disable ripple effect
   */
  disableRipple?: boolean;

  /**
   * Disable elevation changes (for filled, elevated, tonal variants)
   */
  disableElevation?: boolean;

  /**
   * Leading icon (displayed before text)
   */
  icon?: React.ReactNode;

  /**
   * Icon position
   */
  iconPosition?: "start" | "end";

  /**
   * Make button full width
   */
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "filled",
      size = "medium",
      asChild = false,
      disableRipple = false,
      disableElevation = false,
      icon,
      iconPosition = "start",
      fullWidth = false,
      onClick,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const { ripples, createRipple } = useRipple();
    const { states, handlers } = useStateLayer();
    const Comp = asChild ? Slot : "button";

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disableRipple && !disabled) {
        createRipple(e);
      }
      onClick?.(e);
    };

    // Determine state layer color based on variant
    const getStateLayerColor = () => {
      switch (variant) {
        case "filled":
          return "hsl(var(--md-sys-color-on-primary))";
        case "outlined":
        case "text":
        case "elevated":
          return "hsl(var(--md-sys-color-primary))";
        case "tonal":
          return "hsl(var(--md-sys-color-on-secondary-container))";
        default:
          return "currentColor";
      }
    };

    // Determine ripple color based on variant
    const getRippleColor = () => {
      switch (variant) {
        case "filled":
          return "hsl(var(--md-sys-color-on-primary))";
        case "outlined":
        case "text":
        case "elevated":
          return "hsl(var(--md-sys-color-primary))";
        case "tonal":
          return "hsl(var(--md-sys-color-on-secondary-container))";
        default:
          return "currentColor";
      }
    };

    const content = (
      <>
        {/* State Layer */}
        {!disabled && <StateLayer {...states} color={getStateLayerColor()} />}

        {/* Ripple Effect */}
        {!disableRipple && !disabled && <RippleContainer ripples={ripples} color={getRippleColor()} />}

        {/* Content */}
        {icon && iconPosition === "start" && <span className="inline-flex shrink-0">{icon}</span>}
        {children}
        {icon && iconPosition === "end" && <span className="inline-flex shrink-0">{icon}</span>}
      </>
    );

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size }),
          fullWidth && "w-full",
          disableElevation && "!shadow-none hover:!shadow-none",
          className
        )}
        ref={ref}
        onClick={handleClick}
        disabled={disabled}
        {...(!disabled && handlers)}
        {...props}
      >
        {content}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
