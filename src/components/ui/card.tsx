"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { StateLayer, useStateLayer } from "./state-layer";

/**
 * MD3 Card Variants
 */
type CardVariant = "elevated" | "filled" | "outlined";

/**
 * MD3 Elevation Levels (0-5)
 */
type ElevationLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Card variant following MD3 specifications
   * - elevated: Surface with elevation level 1 shadow
   * - filled: Surface with container-highest background
   * - outlined: Surface with outline border
   * @default "elevated"
   */
  variant?: CardVariant;

  /**
   * Whether the card is interactive (clickable)
   * Adds state layers and hover effects
   * @default false
   */
  interactive?: boolean;

  /**
   * Custom elevation level (0-5)
   * Only applies to elevated variant
   * @default 1
   */
  elevation?: ElevationLevel;
}

/**
 * Card Component
 *
 * Implements Material Design 3 Card specifications with three variants:
 * - elevated: Default card with shadow elevation
 * - filled: Card with filled background color
 * - outlined: Card with border outline
 *
 * @example
 * ```tsx
 * <Card variant="elevated">
 *   <CardHeader>
 *     <CardTitle>Card Title</CardTitle>
 *   </CardHeader>
 *   <CardContent>Card content goes here</CardContent>
 * </Card>
 * ```
 *
 * @example Interactive card
 * ```tsx
 * <Card variant="outlined" interactive onClick={handleClick}>
 *   <CardContent>Clickable card</CardContent>
 * </Card>
 * ```
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "elevated", interactive = false, elevation = 1, onClick, ...props }, ref) => {
    const { states, handlers } = useStateLayer();

    // Determine if card should be interactive
    const isInteractive = interactive || !!onClick;

    // Get elevation class based on level
    const getElevationClass = () => {
      if (variant !== "elevated") return "";
      return `shadow-[var(--md-sys-elevation-level${elevation})]`;
    };

    // Get variant-specific classes
    const variantClasses = {
      elevated: cn(
        "bg-[hsl(var(--md-sys-color-surface-container-low))]",
        getElevationClass(),
        isInteractive && "hover:shadow-[var(--md-sys-elevation-level2)] transition-shadow duration-200"
      ),
      filled: cn(
        "bg-[hsl(var(--md-sys-color-surface-container-highest))]",
        isInteractive && "hover:shadow-[var(--md-sys-elevation-level1)] transition-shadow duration-200"
      ),
      outlined: cn(
        "border border-[hsl(var(--md-sys-color-outline-variant))] bg-[hsl(var(--md-sys-color-surface))]",
        isInteractive && "hover:shadow-[var(--md-sys-elevation-level1)] transition-shadow duration-200"
      ),
    };

    return (
      <div
        ref={ref}
        className={cn(
          // Base styles
          "relative rounded-[var(--md-sys-shape-corner-medium)] text-[hsl(var(--md-sys-color-on-surface))]",
          // Variant styles
          variantClasses[variant],
          // Interactive styles
          isInteractive && "cursor-pointer",
          className
        )}
        onClick={onClick}
        {...(isInteractive ? handlers : {})}
        {...props}
      >
        {isInteractive && <StateLayer {...states} color="hsl(var(--md-sys-color-on-surface))" />}
        {props.children}
      </div>
    );
  }
);
Card.displayName = "Card";

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Optional avatar element (icon, image, etc.)
   */
  avatar?: React.ReactNode;

  /**
   * Optional action element (button, icon button, etc.)
   */
  action?: React.ReactNode;
}

/**
 * CardHeader Component
 *
 * Header section of a card with optional avatar and action slots.
 * Follows MD3 card header specifications.
 *
 * @example
 * ```tsx
 * <CardHeader
 *   avatar={<Avatar>A</Avatar>}
 *   action={<IconButton icon={<MoreVertIcon />} />}
 * >
 *   <CardTitle>Title</CardTitle>
 *   <CardDescription>Description</CardDescription>
 * </CardHeader>
 * ```
 */
const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, avatar, action, children, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-start gap-4 p-6", className)} {...props}>
      {avatar && <div className="flex-shrink-0">{avatar}</div>}
      <div className="flex-1 flex flex-col gap-1">{children}</div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
);
CardHeader.displayName = "CardHeader";

/**
 * CardTitle Component
 *
 * Title element for card header.
 * Uses MD3 title-large typography scale.
 */
const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "text-[length:var(--md-sys-typescale-title-large-size)] leading-[var(--md-sys-typescale-title-large-line-height)] font-[var(--md-sys-typescale-title-large-weight)] text-[hsl(var(--md-sys-color-on-surface))]",
        className
      )}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

/**
 * CardDescription Component
 *
 * Description/subtitle element for card header.
 * Uses MD3 body-medium typography scale.
 */
const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "text-[length:var(--md-sys-typescale-body-medium-size)] leading-[var(--md-sys-typescale-body-medium-line-height)] text-[hsl(var(--md-sys-color-on-surface-variant))]",
        className
      )}
      {...props}
    />
  )
);
CardDescription.displayName = "CardDescription";

/**
 * CardContent Component
 *
 * Main content area of the card.
 */
const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("px-6 py-4", className)} {...props} />
);
CardContent.displayName = "CardContent";

/**
 * CardFooter Component
 *
 * Footer section of the card, typically for actions.
 */
const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center gap-2 px-4 py-3", className)} {...props} />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
