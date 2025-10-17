"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { StateLayer, useStateLayer } from "./state-layer";
import { useRipple, RippleContainer } from "@/lib/animations/ripple";

/**
 * MD3 Navigation Bar Component
 *
 * Implements Material Design 3 navigation bar specifications for primary navigation.
 * Typically used for bottom navigation on mobile or top navigation on desktop.
 *
 * Features:
 * - Active indicator with pill shape and primary color
 * - State layers for hover, focus, and pressed states
 * - Badge support for notifications
 * - Keyboard navigation (Tab, Arrow keys)
 * - Responsive positioning (top/bottom)
 * - 80px container height as per MD3 specs
 * - Full accessibility support
 *
 * @example
 * ```tsx
 * <NavigationBar position="bottom">
 *   <NavigationBarItem
 *     icon={<HomeIcon />}
 *     label="Home"
 *     active
 *     onClick={() => navigate('/home')}
 *   />
 *   <NavigationBarItem
 *     icon={<SearchIcon />}
 *     label="Search"
 *     badge={5}
 *     onClick={() => navigate('/search')}
 *   />
 * </NavigationBar>
 * ```
 */

export interface NavigationBarProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Position of the navigation bar
   * @default "bottom"
   */
  position?: "top" | "bottom";

  /**
   * Navigation items
   */
  children: React.ReactNode;
}

export const NavigationBar = React.forwardRef<HTMLElement, NavigationBarProps>(
  ({ position = "bottom", children, className, ...props }, ref) => {
    const navRef = React.useRef<HTMLElement>(null);
    React.useImperativeHandle(ref, () => navRef.current!);

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
      const items = navRef.current?.querySelectorAll('[role="tab"]');
      if (!items || items.length === 0) return;

      const currentIndex = Array.from(items).findIndex((item) => item === document.activeElement);

      let nextIndex = currentIndex;

      switch (e.key) {
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
          break;
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
          break;
        case "Home":
          e.preventDefault();
          nextIndex = 0;
          break;
        case "End":
          e.preventDefault();
          nextIndex = items.length - 1;
          break;
        default:
          return;
      }

      (items[nextIndex] as HTMLElement).focus();
    };

    return (
      <nav
        ref={navRef}
        role="tablist"
        aria-label="Main navigation"
        onKeyDown={handleKeyDown}
        className={cn(
          // Base styles
          "flex items-center justify-around",
          "bg-[hsl(var(--md-sys-color-surface-container))]",
          "border-[hsl(var(--md-sys-color-outline-variant))]",
          // MD3 height specification
          "h-20", // 80px
          // Position-specific styles
          position === "top" && "border-b",
          position === "bottom" && "border-t",
          className
        )}
        {...props}
      >
        {children}
      </nav>
    );
  }
);
NavigationBar.displayName = "NavigationBar";

export interface NavigationBarItemProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /**
   * Icon element
   */
  icon: React.ReactNode;

  /**
   * Label text
   */
  label: string;

  /**
   * Whether this item is active/selected
   */
  active?: boolean;

  /**
   * Badge content (number or text)
   */
  badge?: number | string;

  /**
   * Maximum badge value before showing "+"
   * @default 99
   */
  badgeMax?: number;

  /**
   * Disable ripple effect
   */
  disableRipple?: boolean;
}

export const NavigationBarItem = React.forwardRef<HTMLButtonElement, NavigationBarItemProps>(
  (
    {
      icon,
      label,
      active = false,
      badge,
      badgeMax = 99,
      disableRipple = false,
      onClick,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const { ripples, createRipple } = useRipple();
    const { states, handlers } = useStateLayer();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disableRipple && !disabled) {
        createRipple(e);
      }
      onClick?.(e);
    };

    // Format badge content
    const getBadgeContent = () => {
      if (badge === undefined) return null;
      if (typeof badge === "string") return badge;
      return badge > badgeMax ? `${badgeMax}+` : badge.toString();
    };

    const badgeContent = getBadgeContent();

    return (
      <button
        ref={ref}
        role="tab"
        aria-selected={active}
        aria-label={label}
        tabIndex={active ? 0 : -1}
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          // Base styles
          "relative flex flex-col items-center justify-center gap-1",
          "min-w-[64px] flex-1 max-w-[168px]",
          "px-3 py-3",
          "outline-none",
          // Transitions
          "transition-colors duration-[var(--md-sys-motion-duration-short4)]",
          "ease-[var(--md-sys-motion-easing-standard)]",
          // Focus styles
          "focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-[hsl(var(--md-sys-color-primary))]",
          "focus-visible:ring-inset",
          // Disabled styles
          "disabled:pointer-events-none disabled:opacity-38",
          className
        )}
        {...(!disabled && handlers)}
        {...props}
      >
        {/* State Layer */}
        {!disabled && (
          <StateLayer
            {...states}
            color="hsl(var(--md-sys-color-on-surface))"
            className="rounded-[var(--md-sys-shape-corner-full)]"
          />
        )}

        {/* Ripple Effect */}
        {!disableRipple && !disabled && (
          <RippleContainer ripples={ripples} color="hsl(var(--md-sys-color-on-surface))" />
        )}

        {/* Active Indicator (Pill Shape) */}
        {active && (
          <span
            className={cn(
              "absolute inset-x-0 top-0 mx-auto",
              "w-16 h-8",
              "bg-[hsl(var(--md-sys-color-secondary-container))]",
              "rounded-[var(--md-sys-shape-corner-full)]",
              "transition-all duration-[var(--md-sys-motion-duration-medium2)]",
              "ease-[var(--md-sys-motion-easing-emphasized)]"
            )}
            aria-hidden="true"
          />
        )}

        {/* Icon Container with Badge */}
        <div className="relative z-10 flex items-center justify-center">
          <span
            className={cn(
              "inline-flex items-center justify-center",
              "w-8 h-8",
              "transition-colors duration-[var(--md-sys-motion-duration-short2)]",
              active
                ? "text-[hsl(var(--md-sys-color-on-secondary-container))]"
                : "text-[hsl(var(--md-sys-color-on-surface-variant))]",
              "[&_svg]:w-6 [&_svg]:h-6"
            )}
          >
            {icon}
          </span>

          {/* Badge */}
          {badgeContent && (
            <span
              className={cn(
                "absolute -top-1 -right-1",
                "min-w-[16px] h-4 px-1",
                "flex items-center justify-center",
                "bg-[hsl(var(--md-sys-color-error))]",
                "text-[hsl(var(--md-sys-color-on-error))]",
                "rounded-[var(--md-sys-shape-corner-full)]",
                // Typography - Label Small
                "text-[10px] leading-none font-medium",
                "transition-transform duration-[var(--md-sys-motion-duration-short2)]",
                "ease-[var(--md-sys-motion-easing-standard)]"
              )}
              aria-label={`${badge} notifications`}
            >
              {badgeContent}
            </span>
          )}
        </div>

        {/* Label */}
        <span
          className={cn(
            "z-10",
            // MD3 Typography - Label Medium
            "text-xs font-medium leading-4 tracking-[0.5px]",
            "transition-colors duration-[var(--md-sys-motion-duration-short2)]",
            active ? "text-[hsl(var(--md-sys-color-on-surface))]" : "text-[hsl(var(--md-sys-color-on-surface-variant))]"
          )}
        >
          {label}
        </span>
      </button>
    );
  }
);
NavigationBarItem.displayName = "NavigationBarItem";
