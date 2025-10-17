"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { StateLayer, useStateLayer } from "./state-layer";

/**
 * MD3 Tabs Component
 *
 * Implements Material Design 3 tabs specifications with two variants:
 * - primary: Filled active indicator with prominent appearance
 * - secondary: Underline active indicator with subtle appearance
 *
 * Features:
 * - State layers for hover and focus states
 * - Support for leading icons
 * - Active indicator animation with MD3 easing
 * - MD3 title-small typography for tab labels
 * - Full keyboard navigation support (Arrow keys, Home, End)
 * - Comprehensive accessibility support (ARIA attributes)
 * - Support for disabled tabs
 * - Horizontal scrolling for overflow
 */

const tabsListVariants = cva(
  [
    // Base styles
    "relative flex items-center gap-0",
    "border-b border-b-[hsl(var(--md-sys-color-outline))]",
    "bg-[hsl(var(--md-sys-color-surface))]",
    // Transitions
    "transition-all duration-[var(--md-sys-motion-duration-short2)]",
    "ease-[var(--md-sys-motion-easing-standard)]",
    // Overflow handling
    "overflow-x-auto",
    "[scrollbar-width:none]",
    "[&::-webkit-scrollbar]:hidden",
  ],
  {
    variants: {
      variant: {
        primary: ["bg-[hsl(var(--md-sys-color-surface))]"],
        secondary: ["bg-[hsl(var(--md-sys-color-surface))]"],
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  }
);

const tabTriggerVariants = cva(
  [
    // Base styles
    "relative inline-flex items-center justify-center gap-2",
    "px-4 py-3",
    "min-w-max",
    "whitespace-nowrap",
    "cursor-pointer",
    "user-select-none",
    // MD3 Typography - Title Small
    "font-[family-name:var(--md-sys-typescale-title-small-font)]",
    "text-[length:var(--md-sys-typescale-title-small-size)]",
    "leading-[var(--md-sys-typescale-title-small-line-height)]",
    "font-[number:var(--md-sys-typescale-title-small-weight)]",
    "tracking-[var(--md-sys-typescale-title-small-tracking)]",
    // Transitions
    "transition-all duration-[var(--md-sys-motion-duration-short2)]",
    "ease-[var(--md-sys-motion-easing-standard)]",
    // Focus styles
    "focus-visible:outline-none",
    "focus-visible:ring-2 focus-visible:ring-offset-0",
    "focus-visible:ring-[hsl(var(--md-sys-color-primary))]",
    // Disabled styles
    "disabled:opacity-[0.38]",
    "disabled:cursor-not-allowed",
    "disabled:pointer-events-none",
    // Icon sizing
    "[&_svg]:pointer-events-none [&_svg]:size-[18px] [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary: [
          "text-[hsl(var(--md-sys-color-on-surface-variant))]",
          "data-[active]:text-[hsl(var(--md-sys-color-primary))]",
          "hover:bg-[hsl(var(--md-sys-color-primary)/0.08)]",
          "focus-visible:bg-[hsl(var(--md-sys-color-primary)/0.12)]",
          "active:bg-[hsl(var(--md-sys-color-primary)/0.12)]",
        ],
        secondary: [
          "text-[hsl(var(--md-sys-color-on-surface-variant))]",
          "data-[active]:text-[hsl(var(--md-sys-color-primary))]",
          "hover:bg-[hsl(var(--md-sys-color-primary)/0.08)]",
          "focus-visible:bg-[hsl(var(--md-sys-color-primary)/0.12)]",
          "active:bg-[hsl(var(--md-sys-color-primary)/0.12)]",
        ],
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  }
);

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The variant of tabs to display
   * - primary: Filled active indicator
   * - secondary: Underline active indicator
   */
  variant?: "primary" | "secondary";

  /**
   * The currently active tab value
   */
  value?: string;

  /**
   * Callback when tab selection changes
   */
  onValueChange?: (value: string) => void;

  /**
   * Whether tabs should be disabled
   */
  disabled?: boolean;

  /**
   * Orientation of the tabs
   */
  orientation?: "horizontal" | "vertical";
}

export interface TabTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * The value of this tab trigger
   */
  value: string;

  /**
   * Icon to display before the tab label
   */
  icon?: React.ReactNode;

  /**
   * Icon position relative to label
   */
  iconPosition?: "start" | "end";

  /**
   * The variant inherited from parent Tabs
   */
  variant?: "primary" | "secondary";

  /**
   * Whether this tab is active
   */
  active?: boolean;

  /**
   * Callback when tab is selected
   */
  onSelect?: () => void;
}

export interface TabContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The value that must be active for this content to display
   */
  value: string;

  /**
   * Whether to force mount the content (useful for animations)
   */
  forceMount?: boolean;
}

/**
 * Tabs Context for managing state
 */
interface TabsContextType {
  activeValue: string;
  onValueChange: (value: string) => void;
  variant: "primary" | "secondary";
}

const TabsContext = React.createContext<TabsContextType | undefined>(undefined);

/**
 * Hook to use Tabs context
 */
function useTabsContext() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within a Tabs provider");
  }
  return context;
}

/**
 * Tabs Root Component
 */
const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  (
    { className, variant = "primary", value, onValueChange, disabled, orientation = "horizontal", children, ...props },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState<string>("");
    const activeValue = value ?? internalValue;

    const handleValueChange = (newValue: string) => {
      if (disabled) return;
      setInternalValue(newValue);
      onValueChange?.(newValue);
    };

    return (
      <TabsContext.Provider
        value={{
          activeValue,
          onValueChange: handleValueChange,
          variant,
        }}
      >
        <div ref={ref} className={cn("w-full", className)} role="tablist" {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);
Tabs.displayName = "Tabs";

/**
 * Tabs List Component - Container for tab triggers
 */
const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: "primary" | "secondary" }
>(({ className, variant = "primary", ...props }, ref) => (
  <div ref={ref} className={cn(tabsListVariants({ variant }), className)} role="tablist" {...props} />
));
TabsList.displayName = "TabsList";

/**
 * Tabs Trigger Component - Individual tab button
 */
const TabsTrigger = React.forwardRef<HTMLButtonElement, TabTriggerProps>(
  (
    { className, value, icon, iconPosition = "start", variant, disabled, children, onClick, onKeyDown, ...props },
    ref
  ) => {
    const context = useTabsContext();
    const { states, handlers } = useStateLayer();
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const isActive = context.activeValue === value;
    const triggerVariant = variant ?? context.variant;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled) {
        context.onValueChange(value);
      }
      onClick?.(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      // Get all trigger elements
      const triggers = Array.from(
        buttonRef.current?.parentElement?.querySelectorAll(`[role="tab"]`) as NodeListOf<HTMLButtonElement>
      );
      const currentIndex = triggers.findIndex((t) => t === buttonRef.current);

      switch (e.key) {
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : triggers.length - 1;
          triggers[prevIndex]?.focus();
          break;
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          const nextIndex = currentIndex < triggers.length - 1 ? currentIndex + 1 : 0;
          triggers[nextIndex]?.focus();
          break;
        case "Home":
          e.preventDefault();
          triggers[0]?.focus();
          break;
        case "End":
          e.preventDefault();
          triggers[triggers.length - 1]?.focus();
          break;
      }

      onKeyDown?.(e);
    };

    return (
      <button
        ref={ref || buttonRef}
        type="button"
        role="tab"
        aria-selected={isActive}
        aria-controls={`tab-content-${value}`}
        data-active={isActive ? "" : undefined}
        disabled={disabled}
        className={cn(tabTriggerVariants({ variant: triggerVariant }), className)}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        {...(!disabled && handlers)}
        {...props}
      >
        {/* State Layer */}
        {!disabled && <StateLayer {...states} color="hsl(var(--md-sys-color-primary))" className="rounded-none" />}

        {/* Content */}
        {icon && iconPosition === "start" && <span className="inline-flex shrink-0">{icon}</span>}
        <span className="relative z-10">{children}</span>
        {icon && iconPosition === "end" && <span className="inline-flex shrink-0">{icon}</span>}

        {/* Active Indicator */}
        {isActive && (
          <div
            className={cn(
              "absolute bottom-0 left-0 right-0 h-1",
              "bg-[hsl(var(--md-sys-color-primary))]",
              "transition-all duration-[var(--md-sys-motion-duration-medium1)]",
              "ease-[var(--md-sys-motion-easing-emphasized-decelerate)]"
            )}
            aria-hidden="true"
          />
        )}
      </button>
    );
  }
);
TabsTrigger.displayName = "TabsTrigger";

/**
 * Tabs Content Component - Content panel for a tab
 */
const TabsContent = React.forwardRef<HTMLDivElement, TabContentProps>(
  ({ className, value, forceMount, ...props }, ref) => {
    const context = useTabsContext();
    const isActive = context.activeValue === value;

    if (!isActive && !forceMount) {
      return null;
    }

    return (
      <div
        ref={ref}
        id={`tab-content-${value}`}
        role="tabpanel"
        aria-labelledby={`tab-trigger-${value}`}
        data-state={isActive ? "active" : "inactive"}
        className={cn(
          "mt-0 py-4 px-0",
          "ring-offset-[hsl(var(--md-sys-color-surface))]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--md-sys-color-primary))]",
          isActive ? "block" : "hidden",
          className
        )}
        {...props}
      />
    );
  }
);
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
