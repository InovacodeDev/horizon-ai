"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";
import { StateLayer, useStateLayer } from "./state-layer";

/**
 * MD3 Tabs Component
 *
 * Implements Material Design 3 tabs specifications:
 * - Primary variant with filled active indicator
 * - Secondary variant with underline active indicator
 * - State layers for tab interaction
 * - Support for leading icons
 * - Active indicator animation with MD3 easing
 * - Title-small typography for tab labels
 * - Keyboard navigation (Arrow keys, Home, End) - handled by Radix
 * - Accessible by default (role="tablist", role="tab", aria-selected)
 * - Support for disabled tabs
 *
 * Features:
 * - Smooth indicator transitions
 * - Interactive state feedback
 * - Full keyboard navigation
 * - ARIA attributes for accessibility
 */

const Tabs = TabsPrimitive.Root;

/**
 * TabsList Component
 *
 * Container for tab triggers with MD3 styling.
 */
const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
    variant?: "primary" | "secondary";
  }
>(({ className, variant = "primary", ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      // Base styles
      "inline-flex items-center justify-start",
      "relative",
      // Primary variant - filled container
      variant === "primary" && [
        "bg-[hsl(var(--md-sys-color-surface-container))]",
        "rounded-[var(--md-sys-shape-corner-full)]",
        "p-1",
        "gap-1",
      ],
      // Secondary variant - underline
      variant === "secondary" && ["border-b border-[hsl(var(--md-sys-color-surface-variant))]", "gap-0"],
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

/**
 * TabsTrigger Component
 *
 * Individual tab button with MD3 styling and state layers.
 */
const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
    variant?: "primary" | "secondary";
    icon?: React.ReactNode;
  }
>(({ className, variant = "primary", icon, children, ...props }, ref) => {
  const { states, handlers } = useStateLayer();
  const [isSelected, setIsSelected] = React.useState(false);
  const internalRef = React.useRef<HTMLButtonElement>(null);

  // Merge refs
  React.useImperativeHandle(ref, () => internalRef.current as HTMLButtonElement);

  // Track selection state for styling
  React.useEffect(() => {
    if (internalRef.current) {
      const observer = new MutationObserver(() => {
        setIsSelected(internalRef.current?.getAttribute("data-state") === "active");
      });
      observer.observe(internalRef.current, {
        attributes: true,
        attributeFilter: ["data-state"],
      });
      // Initial check
      setIsSelected(internalRef.current.getAttribute("data-state") === "active");
      return () => observer.disconnect();
    }
  }, []);

  return (
    <TabsPrimitive.Trigger
      ref={internalRef}
      className={cn(
        // Base styles
        "relative inline-flex items-center justify-center gap-2",
        "whitespace-nowrap",
        "transition-all duration-[var(--md-sys-motion-duration-short4)]",
        "ease-[var(--md-sys-motion-easing-standard)]",
        // MD3 Typography - Title Small
        "font-[family-name:var(--md-sys-typescale-title-small-font)]",
        "text-[length:var(--md-sys-typescale-title-small-size)]",
        "leading-[var(--md-sys-typescale-title-small-line-height)]",
        "font-[number:var(--md-sys-typescale-title-small-weight)]",
        "tracking-[var(--md-sys-typescale-title-small-tracking)]",
        // Focus styles
        "focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-[hsl(var(--md-sys-color-primary))]",
        "focus-visible:ring-offset-2",
        // Disabled styles
        "disabled:pointer-events-none disabled:opacity-38",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-38",
        // Icon sizing
        "[&_svg]:pointer-events-none [&_svg]:size-[18px] [&_svg]:shrink-0",

        // Primary variant styles
        variant === "primary" && [
          "px-4 h-10 min-w-[90px]",
          "rounded-[var(--md-sys-shape-corner-full)]",
          "text-[hsl(var(--md-sys-color-on-surface-variant))]",
          // Active state - filled indicator
          "data-[state=active]:bg-[hsl(var(--md-sys-color-secondary-container))]",
          "data-[state=active]:text-[hsl(var(--md-sys-color-on-secondary-container))]",
          "data-[state=active]:shadow-[var(--md-sys-elevation-level0)]",
        ],

        // Secondary variant styles
        variant === "secondary" && [
          "px-4 h-12 min-w-[90px]",
          "text-[hsl(var(--md-sys-color-on-surface-variant))]",
          "border-b-2 border-transparent",
          "-mb-[2px]",
          // Active state - underline indicator
          "data-[state=active]:text-[hsl(var(--md-sys-color-primary))]",
          "data-[state=active]:border-[hsl(var(--md-sys-color-primary))]",
        ],

        className
      )}
      {...handlers}
      {...props}
    >
      {/* State Layer - only show when not selected for primary variant */}
      {!props.disabled && variant === "primary" && !isSelected && (
        <StateLayer {...states} color="hsl(var(--md-sys-color-on-surface))" />
      )}
      {!props.disabled && variant === "secondary" && (
        <StateLayer {...states} color="hsl(var(--md-sys-color-primary))" />
      )}

      {/* Content */}
      {icon && <span className="inline-flex shrink-0 z-10">{icon}</span>}
      <span className="z-10">{children}</span>
    </TabsPrimitive.Trigger>
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

/**
 * TabsContent Component
 *
 * Content container for each tab panel.
 */
const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      // Base styles
      "mt-4",
      // Focus styles
      "focus-visible:outline-none focus-visible:ring-2",
      "focus-visible:ring-[hsl(var(--md-sys-color-primary))]",
      "focus-visible:ring-offset-2",
      // Animations
      "data-[state=active]:animate-in data-[state=inactive]:animate-out",
      "data-[state=inactive]:fade-out-0 data-[state=active]:fade-in-0",
      "data-[state=inactive]:zoom-out-95 data-[state=active]:zoom-in-95",
      "data-[state=active]:duration-[var(--md-sys-motion-duration-short4)]",
      "data-[state=inactive]:duration-[var(--md-sys-motion-duration-short2)]",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
