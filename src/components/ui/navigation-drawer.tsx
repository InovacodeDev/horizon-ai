"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { StateLayer, useStateLayer } from "./state-layer";
import { useRipple, RippleContainer } from "@/lib/animations/ripple";

/**
 * MD3 Navigation Drawer Component
 *
 * Implements Material Design 3 navigation drawer specifications for side navigation.
 * Supports two variants:
 * - standard: 360px width, persistent (stays visible)
 * - modal: 256px width, with backdrop overlay
 *
 * Features:
 * - Active indicator with rounded rectangle shape
 * - State layers for interactive items
 * - Support for nested navigation items (expandable sections)
 * - Header and footer slots
 * - Elevation level 1 for modal variant
 * - Open/close animations with MD3 easing
 * - Keyboard navigation and focus management
 * - Full accessibility support
 *
 * @example
 * ```tsx
 * <NavigationDrawer open={isOpen} onOpenChange={setIsOpen} variant="modal">
 *   <NavigationDrawerHeader>
 *     <h2>Navigation</h2>
 *   </NavigationDrawerHeader>
 *   <NavigationDrawerContent>
 *     <NavigationDrawerItem
 *       icon={<HomeIcon />}
 *       label="Home"
 *       active
 *       onClick={() => navigate('/home')}
 *     />
 *     <NavigationDrawerSection label="Settings">
 *       <NavigationDrawerItem
 *         icon={<SettingsIcon />}
 *         label="General"
 *         onClick={() => navigate('/settings/general')}
 *       />
 *     </NavigationDrawerSection>
 *   </NavigationDrawerContent>
 *   <NavigationDrawerFooter>
 *     <p>Version 1.0.0</p>
 *   </NavigationDrawerFooter>
 * </NavigationDrawer>
 * ```
 */

export interface NavigationDrawerProps {
  /**
   * Whether the drawer is open
   */
  open: boolean;

  /**
   * Callback when open state changes
   */
  onOpenChange: (open: boolean) => void;

  /**
   * Drawer variant
   * - standard: 360px width, persistent
   * - modal: 256px width, with backdrop
   * @default "modal"
   */
  variant?: "standard" | "modal";

  /**
   * Side of the screen where drawer appears
   * @default "left"
   */
  side?: "left" | "right";

  /**
   * Drawer content
   */
  children: React.ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;
}

export const NavigationDrawer = React.forwardRef<HTMLDivElement, NavigationDrawerProps>(
  ({ open, onOpenChange, variant = "modal", side = "left", children, className }, ref) => {
    const isModal = variant === "modal";

    if (isModal) {
      return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
          <DialogPrimitive.Portal>
            {/* Backdrop for modal variant */}
            <DialogPrimitive.Overlay
              className={cn(
                "fixed inset-0 z-40",
                "bg-[hsl(var(--md-sys-color-scrim)/0.32)]",
                "data-[state=open]:animate-in data-[state=closed]:animate-out",
                "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                "duration-[var(--md-sys-motion-duration-medium2)]",
                "ease-[var(--md-sys-motion-easing-emphasized)]"
              )}
            />

            <DialogPrimitive.Content
              ref={ref}
              className={cn(
                // Base styles
                "fixed z-50 flex flex-col",
                "bg-[hsl(var(--md-sys-color-surface-container-low))]",
                "text-[hsl(var(--md-sys-color-on-surface))]",
                // MD3 width specification for modal
                "w-[256px]",
                // Elevation level 1
                "shadow-[var(--md-sys-elevation-level1)]",
                // Border radius
                side === "left" && "rounded-r-[var(--md-sys-shape-corner-large)]",
                side === "right" && "rounded-l-[var(--md-sys-shape-corner-large)]",
                // Position
                side === "left" && "left-0 top-0 bottom-0",
                side === "right" && "right-0 top-0 bottom-0",
                // Animations
                "data-[state=open]:animate-in data-[state=closed]:animate-out",
                "duration-[var(--md-sys-motion-duration-medium4)]",
                "ease-[var(--md-sys-motion-easing-emphasized-decelerate)]",
                side === "left" && "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
                side === "right" && "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
                // Focus styles
                "focus:outline-none",
                className
              )}
            >
              {children}
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      );
    }

    // Standard variant (non-modal, persistent)
    return (
      <div
        ref={ref}
        className={cn(
          // Base styles
          "flex flex-col",
          "bg-[hsl(var(--md-sys-color-surface-container-low))]",
          "text-[hsl(var(--md-sys-color-on-surface))]",
          // MD3 width specification for standard
          "w-[360px]",
          // Border
          side === "left" && "border-r border-[hsl(var(--md-sys-color-outline-variant))]",
          side === "right" && "border-l border-[hsl(var(--md-sys-color-outline-variant))]",
          // Transitions
          "transition-transform duration-[var(--md-sys-motion-duration-medium4)]",
          "ease-[var(--md-sys-motion-easing-emphasized)]",
          // Hide/show based on open state
          !open && side === "left" && "-translate-x-full",
          !open && side === "right" && "translate-x-full",
          className
        )}
      >
        {children}
      </div>
    );
  }
);
NavigationDrawer.displayName = "NavigationDrawer";

export interface NavigationDrawerHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export const NavigationDrawerHeader = React.forwardRef<HTMLDivElement, NavigationDrawerHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-3",
          "px-4 py-6",
          "border-b border-[hsl(var(--md-sys-color-outline-variant))]",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
NavigationDrawerHeader.displayName = "NavigationDrawerHeader";

export interface NavigationDrawerContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const NavigationDrawerContent = React.forwardRef<HTMLDivElement, NavigationDrawerContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <nav
        ref={ref}
        role="navigation"
        aria-label="Drawer navigation"
        className={cn("flex-1 overflow-y-auto py-2", className)}
        {...props}
      >
        {children}
      </nav>
    );
  }
);
NavigationDrawerContent.displayName = "NavigationDrawerContent";

export interface NavigationDrawerFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const NavigationDrawerFooter = React.forwardRef<HTMLDivElement, NavigationDrawerFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-3",
          "px-4 py-4",
          "border-t border-[hsl(var(--md-sys-color-outline-variant))]",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
NavigationDrawerFooter.displayName = "NavigationDrawerFooter";

export interface NavigationDrawerItemProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /**
   * Icon element
   */
  icon?: React.ReactNode;

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

  /**
   * Indentation level for nested items
   * @default 0
   */
  indent?: number;
}

export const NavigationDrawerItem = React.forwardRef<HTMLButtonElement, NavigationDrawerItemProps>(
  (
    {
      icon,
      label,
      active = false,
      badge,
      badgeMax = 99,
      disableRipple = false,
      indent = 0,
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
        role="menuitem"
        aria-current={active ? "page" : undefined}
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          // Base styles
          "relative flex items-center gap-3",
          "w-full h-14",
          "px-4",
          "text-left",
          "outline-none",
          // Indentation for nested items
          indent > 0 && `pl-${4 + indent * 4}`,
          // Transitions
          "transition-colors duration-[var(--md-sys-motion-duration-short2)]",
          "ease-[var(--md-sys-motion-easing-standard)]",
          // Focus styles
          "focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-[hsl(var(--md-sys-color-primary))]",
          "focus-visible:ring-inset",
          // Disabled styles
          "disabled:pointer-events-none disabled:opacity-38",
          className
        )}
        style={{
          paddingLeft: indent > 0 ? `${16 + indent * 16}px` : undefined,
        }}
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

        {/* Active Indicator (Rounded Rectangle) */}
        {active && (
          <span
            className={cn(
              "absolute inset-y-2 left-3 right-3",
              "bg-[hsl(var(--md-sys-color-secondary-container))]",
              "rounded-[var(--md-sys-shape-corner-full)]",
              "transition-all duration-[var(--md-sys-motion-duration-medium2)]",
              "ease-[var(--md-sys-motion-easing-emphasized)]"
            )}
            aria-hidden="true"
          />
        )}

        {/* Icon */}
        {icon && (
          <span
            className={cn(
              "relative z-10 inline-flex items-center justify-center shrink-0",
              "w-6 h-6",
              "transition-colors duration-[var(--md-sys-motion-duration-short2)]",
              active
                ? "text-[hsl(var(--md-sys-color-on-secondary-container))]"
                : "text-[hsl(var(--md-sys-color-on-surface-variant))]",
              "[&_svg]:w-6 [&_svg]:h-6"
            )}
          >
            {icon}
          </span>
        )}

        {/* Label */}
        <span
          className={cn(
            "relative z-10 flex-1",
            // MD3 Typography - Label Large
            "text-sm font-medium leading-5 tracking-[0.1px]",
            "transition-colors duration-[var(--md-sys-motion-duration-short2)]",
            active
              ? "text-[hsl(var(--md-sys-color-on-secondary-container))]"
              : "text-[hsl(var(--md-sys-color-on-surface))]"
          )}
        >
          {label}
        </span>

        {/* Badge */}
        {badgeContent && (
          <span
            className={cn(
              "relative z-10",
              "min-w-[20px] h-5 px-1.5",
              "flex items-center justify-center",
              "bg-[hsl(var(--md-sys-color-error))]",
              "text-[hsl(var(--md-sys-color-on-error))]",
              "rounded-[var(--md-sys-shape-corner-full)]",
              // Typography - Label Small
              "text-[11px] leading-none font-medium",
              "transition-transform duration-[var(--md-sys-motion-duration-short2)]",
              "ease-[var(--md-sys-motion-easing-standard)]"
            )}
            aria-label={`${badge} notifications`}
          >
            {badgeContent}
          </span>
        )}
      </button>
    );
  }
);
NavigationDrawerItem.displayName = "NavigationDrawerItem";

export interface NavigationDrawerSectionProps {
  /**
   * Section label
   */
  label: string;

  /**
   * Icon for the section header
   */
  icon?: React.ReactNode;

  /**
   * Whether the section is initially expanded
   * @default true
   */
  defaultExpanded?: boolean;

  /**
   * Nested navigation items
   */
  children: React.ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;
}

export const NavigationDrawerSection = React.forwardRef<HTMLDivElement, NavigationDrawerSectionProps>(
  ({ label, icon, defaultExpanded = true, children, className }, ref) => {
    const [expanded, setExpanded] = React.useState(defaultExpanded);
    const { states, handlers } = useStateLayer();

    const toggleExpanded = () => {
      setExpanded((prev) => !prev);
    };

    return (
      <div ref={ref} className={cn("flex flex-col", className)}>
        {/* Section Header */}
        <button
          onClick={toggleExpanded}
          aria-expanded={expanded}
          className={cn(
            // Base styles
            "relative flex items-center gap-3",
            "w-full h-14",
            "px-4",
            "text-left",
            "outline-none",
            // Transitions
            "transition-colors duration-[var(--md-sys-motion-duration-short2)]",
            "ease-[var(--md-sys-motion-easing-standard)]",
            // Focus styles
            "focus-visible:outline-none focus-visible:ring-2",
            "focus-visible:ring-[hsl(var(--md-sys-color-primary))]",
            "focus-visible:ring-inset"
          )}
          {...handlers}
        >
          {/* State Layer */}
          <StateLayer
            {...states}
            color="hsl(var(--md-sys-color-on-surface))"
            className="rounded-[var(--md-sys-shape-corner-full)]"
          />

          {/* Icon */}
          {icon && (
            <span
              className={cn(
                "relative z-10 inline-flex items-center justify-center shrink-0",
                "w-6 h-6",
                "text-[hsl(var(--md-sys-color-on-surface-variant))]",
                "[&_svg]:w-6 [&_svg]:h-6"
              )}
            >
              {icon}
            </span>
          )}

          {/* Label */}
          <span
            className={cn(
              "relative z-10 flex-1",
              // MD3 Typography - Title Small
              "text-sm font-medium leading-5",
              "text-[hsl(var(--md-sys-color-on-surface-variant))]"
            )}
          >
            {label}
          </span>

          {/* Expand/Collapse Icon */}
          <span
            className={cn(
              "relative z-10 inline-flex items-center justify-center shrink-0",
              "w-6 h-6",
              "text-[hsl(var(--md-sys-color-on-surface-variant))]",
              "transition-transform duration-[var(--md-sys-motion-duration-short2)]",
              "ease-[var(--md-sys-motion-easing-standard)]",
              expanded && "rotate-0",
              !expanded && "-rotate-90"
            )}
          >
            <ChevronDown className="w-5 h-5" />
          </span>
        </button>

        {/* Section Content */}
        {expanded && (
          <div
            className={cn(
              "flex flex-col",
              "animate-in slide-in-from-top-2",
              "duration-[var(--md-sys-motion-duration-medium2)]",
              "ease-[var(--md-sys-motion-easing-emphasized-decelerate)]"
            )}
          >
            {React.Children.map(children, (child) => {
              if (React.isValidElement(child) && child.type === NavigationDrawerItem) {
                return React.cloneElement(child as React.ReactElement<NavigationDrawerItemProps>, {
                  indent: 1,
                });
              }
              return child;
            })}
          </div>
        )}
      </div>
    );
  }
);
NavigationDrawerSection.displayName = "NavigationDrawerSection";
