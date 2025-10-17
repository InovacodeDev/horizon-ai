"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { StateLayer, useStateLayer } from "./state-layer";

/**
 * MD3 Chip Component
 *
 * Implements Material Design 3 chip specifications with four variants:
 * - assist: Elevated chip with icon for suggested actions
 * - filter: Outlined chip that can be selected/deselected
 * - input: Filled chip with delete functionality for user input
 * - suggestion: Elevated chip that can be dismissed
 *
 * Features:
 * - State layers for hover, focus, and pressed states
 * - Support for leading icons and avatars
 * - Delete/dismiss functionality with trailing icon
 * - MD3 label-large typography
 * - Border-radius small (8px)
 * - Proper disabled and selected states
 * - Full accessibility support
 */

const chipVariants = cva(
  [
    // Base styles
    "relative inline-flex items-center justify-center gap-2",
    "whitespace-nowrap overflow-hidden",
    "h-8 px-4",
    // MD3 Typography - Label Large
    "font-[family-name:var(--md-sys-typescale-label-large-font)]",
    "text-[length:var(--md-sys-typescale-label-large-size)]",
    "leading-[var(--md-sys-typescale-label-large-line-height)]",
    "font-[number:var(--md-sys-typescale-label-large-weight)]",
    "tracking-[var(--md-sys-typescale-label-large-tracking)]",
    // MD3 Shape - Small (8px)
    "rounded-[var(--md-sys-shape-corner-small)]",
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
        // Assist - Elevated with icon, for suggested actions
        assist: [
          "bg-[hsl(var(--md-sys-color-surface-container-low))]",
          "text-[hsl(var(--md-sys-color-on-surface))]",
          "shadow-[var(--md-sys-elevation-level1)]",
          "hover:shadow-[var(--md-sys-elevation-level2)]",
          "disabled:bg-[hsl(var(--md-sys-color-on-surface)/0.12)]",
          "disabled:text-[hsl(var(--md-sys-color-on-surface)/0.38)]",
          "disabled:shadow-none",
        ],
        // Filter - Outlined, selectable
        filter: [
          "border border-[hsl(var(--md-sys-color-outline))]",
          "bg-transparent",
          "text-[hsl(var(--md-sys-color-on-surface-variant))]",
          "data-[selected=true]:bg-[hsl(var(--md-sys-color-secondary-container))]",
          "data-[selected=true]:text-[hsl(var(--md-sys-color-on-secondary-container))]",
          "data-[selected=true]:border-transparent",
          "disabled:border-[hsl(var(--md-sys-color-on-surface)/0.12)]",
          "disabled:text-[hsl(var(--md-sys-color-on-surface)/0.38)]",
        ],
        // Input - Filled with delete icon, for user input
        input: [
          "bg-[hsl(var(--md-sys-color-surface-container-highest))]",
          "text-[hsl(var(--md-sys-color-on-surface-variant))]",
          "disabled:bg-[hsl(var(--md-sys-color-on-surface)/0.12)]",
          "disabled:text-[hsl(var(--md-sys-color-on-surface)/0.38)]",
        ],
        // Suggestion - Elevated, dismissible
        suggestion: [
          "bg-[hsl(var(--md-sys-color-surface-container-low))]",
          "text-[hsl(var(--md-sys-color-on-surface-variant))]",
          "shadow-[var(--md-sys-elevation-level1)]",
          "hover:shadow-[var(--md-sys-elevation-level2)]",
          "disabled:bg-[hsl(var(--md-sys-color-on-surface)/0.12)]",
          "disabled:text-[hsl(var(--md-sys-color-on-surface)/0.38)]",
          "disabled:shadow-none",
        ],
      },
    },
    defaultVariants: {
      variant: "assist",
    },
  }
);

export interface ChipProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">,
    VariantProps<typeof chipVariants> {
  /**
   * Chip label text
   */
  label: string;

  /**
   * Whether the chip is selected (for filter variant)
   */
  selected?: boolean;

  /**
   * Leading icon (displayed before label)
   */
  icon?: React.ReactNode;

  /**
   * Avatar element (displayed before label, alternative to icon)
   */
  avatar?: React.ReactNode;

  /**
   * Delete/dismiss handler
   * When provided, shows a trailing X icon
   */
  onDelete?: () => void;

  /**
   * Click handler for the chip itself
   */
  onClick?: () => void;
}

const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  (
    { className, variant = "assist", label, selected = false, icon, avatar, onDelete, onClick, disabled, ...props },
    ref
  ) => {
    const { states, handlers } = useStateLayer();
    const [deleteHover, setDeleteHover] = React.useState(false);

    // Determine if chip is interactive (clickable)
    // Assist and suggestion chips are always interactive (even without onClick)
    // Filter chips are always interactive
    // Input chips are only interactive if onClick is provided
    const isInteractive = variant === "assist" || variant === "suggestion" || variant === "filter" || !!onClick;

    // Determine state layer color based on variant and state
    const getStateLayerColor = () => {
      if (variant === "filter" && selected) {
        return "hsl(var(--md-sys-color-on-secondary-container))";
      }
      return "hsl(var(--md-sys-color-on-surface-variant))";
    };

    // Handle delete button click
    const handleDeleteClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete?.();
    };

    // Handle chip click
    const handleClick = () => {
      if (!disabled && isInteractive) {
        onClick?.();
      }
    };

    // Determine the element type
    // If chip has onDelete, use div to avoid button nesting
    const Component = isInteractive && !onDelete ? "button" : "div";
    const buttonProps =
      isInteractive && !onDelete
        ? {
            type: "button" as const,
            onClick: handleClick,
            disabled,
            role: variant === "filter" ? "checkbox" : "button",
            "aria-checked": variant === "filter" ? selected : undefined,
            "aria-disabled": disabled,
            ...(!disabled && handlers),
          }
        : isInteractive && onDelete
          ? {
              onClick: handleClick,
              role: variant === "filter" ? "checkbox" : "button",
              "aria-checked": variant === "filter" ? selected : undefined,
              "aria-disabled": disabled ? "true" : undefined,
              ...(!disabled && handlers),
            }
          : {
              role: "status",
            };

    return (
      <Component
        className={cn(chipVariants({ variant }), className)}
        ref={isInteractive ? (ref as React.Ref<HTMLButtonElement>) : undefined}
        data-selected={selected}
        {...buttonProps}
        {...props}
      >
        {/* State Layer */}
        {!disabled && isInteractive && <StateLayer {...states} color={getStateLayerColor()} />}

        {/* Leading Avatar or Icon */}
        {avatar && <span className="inline-flex shrink-0 -ml-2">{avatar}</span>}
        {!avatar && icon && <span className="inline-flex shrink-0">{icon}</span>}

        {/* Label */}
        <span className="truncate">{label}</span>

        {/* Trailing Delete/Dismiss Icon */}
        {onDelete && (
          <button
            type="button"
            onClick={handleDeleteClick}
            onMouseEnter={() => setDeleteHover(true)}
            onMouseLeave={() => setDeleteHover(false)}
            disabled={disabled}
            className={cn(
              "inline-flex shrink-0 -mr-2 ml-1 p-1 rounded-full",
              "transition-colors duration-200",
              "hover:bg-[hsl(var(--md-sys-color-on-surface-variant)/0.12)]",
              "focus-visible:outline-none focus-visible:ring-2",
              "focus-visible:ring-[hsl(var(--md-sys-color-primary))]",
              "disabled:opacity-38"
            )}
            aria-label="Remove"
          >
            <X className="size-4" />
          </button>
        )}
      </Component>
    );
  }
);
Chip.displayName = "Chip";

export { Chip, chipVariants };
