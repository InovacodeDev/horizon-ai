"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { StateLayer, useStateLayer } from "./state-layer";

/**
 * MD3 List Item Component
 *
 * Implements Material Design 3 list item specifications with support for:
 * - Leading elements (icon, avatar, checkbox)
 * - Trailing elements (icon, text, switch)
 * - Three-line structure (overline, headline, supporting text)
 * - Appropriate heights based on content (56px one-line, 72px two-line, 88px three-line)
 * - State layers for interactive items
 * - Selected state with active indicator
 * - Disabled state support
 */

export interface ListItemProps extends React.HTMLAttributes<HTMLLIElement> {
  /**
   * Leading element (icon, avatar, checkbox, etc.)
   */
  leading?: React.ReactNode;

  /**
   * Trailing element (icon, text, switch, etc.)
   */
  trailing?: React.ReactNode;

  /**
   * Overline text (appears above headline)
   */
  overline?: string;

  /**
   * Headline text (primary text, required)
   */
  headline: string;

  /**
   * Supporting text (appears below headline)
   */
  supportingText?: string;

  /**
   * Whether the list item is interactive (clickable)
   * @default false
   */
  interactive?: boolean;

  /**
   * Whether the list item is selected
   * @default false
   */
  selected?: boolean;

  /**
   * Whether the list item is disabled
   * @default false
   */
  disabled?: boolean;
}

/**
 * ListItem Component
 *
 * @example One-line list item
 * ```tsx
 * <ListItem headline="Item title" />
 * ```
 *
 * @example Two-line list item with icon
 * ```tsx
 * <ListItem
 *   leading={<Icon />}
 *   headline="Item title"
 *   supportingText="Supporting text"
 * />
 * ```
 *
 * @example Three-line list item
 * ```tsx
 * <ListItem
 *   overline="Overline"
 *   headline="Item title"
 *   supportingText="Supporting text"
 * />
 * ```
 *
 * @example Interactive list item
 * ```tsx
 * <ListItem
 *   headline="Clickable item"
 *   interactive
 *   onClick={handleClick}
 * />
 * ```
 *
 * @example Selected list item
 * ```tsx
 * <ListItem
 *   headline="Selected item"
 *   interactive
 *   selected
 * />
 * ```
 */
const ListItem = React.forwardRef<HTMLLIElement, ListItemProps>(
  (
    {
      className,
      leading,
      trailing,
      overline,
      headline,
      supportingText,
      interactive = false,
      selected = false,
      disabled = false,
      onClick,
      ...props
    },
    ref
  ) => {
    const { states, handlers } = useStateLayer();

    // Determine if item should be interactive
    const isInteractive = (interactive || !!onClick) && !disabled;

    // Determine line count for height
    const lineCount = overline && supportingText ? 3 : supportingText || overline ? 2 : 1;

    // Get height based on line count
    const getHeightClass = () => {
      switch (lineCount) {
        case 1:
          return "min-h-[56px]";
        case 2:
          return "min-h-[72px]";
        case 3:
          return "min-h-[88px]";
        default:
          return "min-h-[56px]";
      }
    };

    return (
      <li
        ref={ref}
        aria-disabled={disabled ? true : undefined}
        className={cn(
          // Base styles
          "relative flex items-center gap-4 px-4 py-2",
          getHeightClass(),
          // Interactive styles
          isInteractive && "cursor-pointer",
          // Selected styles
          selected && "bg-[hsl(var(--md-sys-color-secondary-container)/0.12)]",
          // Disabled styles
          disabled && "opacity-38 cursor-not-allowed",
          className
        )}
        onClick={disabled ? undefined : onClick}
        {...(isInteractive ? handlers : {})}
        {...props}
      >
        {/* State Layer */}
        {isInteractive && <StateLayer {...states} color="hsl(var(--md-sys-color-on-surface))" />}

        {/* Selected Indicator */}
        {selected && (
          <div
            className="absolute left-0 top-0 bottom-0 w-1 bg-[hsl(var(--md-sys-color-primary))]"
            aria-hidden="true"
          />
        )}

        {/* Leading Element */}
        {leading && <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 z-10">{leading}</div>}

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center min-w-0 z-10">
          {/* Overline */}
          {overline && (
            <div
              className={cn(
                "text-[length:var(--md-sys-typescale-label-small-size)]",
                "leading-[var(--md-sys-typescale-label-small-line-height)]",
                "font-[var(--md-sys-typescale-label-small-weight)]",
                "tracking-[var(--md-sys-typescale-label-small-tracking)]",
                "text-[hsl(var(--md-sys-color-on-surface-variant))]",
                "truncate"
              )}
            >
              {overline}
            </div>
          )}

          {/* Headline */}
          <div
            className={cn(
              "text-[length:var(--md-sys-typescale-body-large-size)]",
              "leading-[var(--md-sys-typescale-body-large-line-height)]",
              "font-[var(--md-sys-typescale-body-large-weight)]",
              "tracking-[var(--md-sys-typescale-body-large-tracking)]",
              "text-[hsl(var(--md-sys-color-on-surface))]",
              lineCount === 1 ? "truncate" : "line-clamp-1"
            )}
          >
            {headline}
          </div>

          {/* Supporting Text */}
          {supportingText && (
            <div
              className={cn(
                "text-[length:var(--md-sys-typescale-body-medium-size)]",
                "leading-[var(--md-sys-typescale-body-medium-line-height)]",
                "font-[var(--md-sys-typescale-body-medium-weight)]",
                "tracking-[var(--md-sys-typescale-body-medium-tracking)]",
                "text-[hsl(var(--md-sys-color-on-surface-variant))]",
                lineCount === 3 ? "line-clamp-2" : "truncate"
              )}
            >
              {supportingText}
            </div>
          )}
        </div>

        {/* Trailing Element */}
        {trailing && <div className="flex-shrink-0 flex items-center justify-center z-10">{trailing}</div>}
      </li>
    );
  }
);
ListItem.displayName = "ListItem";

/**
 * MD3 Divider Component
 *
 * Implements Material Design 3 divider specifications.
 * Used to separate content in lists and layouts.
 */

export interface DividerProps extends React.HTMLAttributes<HTMLHRElement> {
  /**
   * Whether the divider has inset (indentation from the left)
   * @default false
   */
  inset?: boolean;

  /**
   * Custom inset value in pixels
   * Only applies when inset is true
   * @default 16
   */
  insetValue?: number;

  /**
   * Orientation of the divider
   * @default "horizontal"
   */
  orientation?: "horizontal" | "vertical";
}

/**
 * Divider Component
 *
 * @example Horizontal divider
 * ```tsx
 * <Divider />
 * ```
 *
 * @example Divider with inset
 * ```tsx
 * <Divider inset />
 * ```
 *
 * @example Vertical divider
 * ```tsx
 * <Divider orientation="vertical" />
 * ```
 */
const Divider = React.forwardRef<HTMLHRElement, DividerProps>(
  ({ className, inset = false, insetValue = 16, orientation = "horizontal", ...props }, ref) => {
    return (
      <hr
        ref={ref}
        role="separator"
        aria-orientation={orientation}
        className={cn(
          "border-none bg-[hsl(var(--md-sys-color-outline-variant))]",
          orientation === "horizontal" ? cn("h-[1px] w-full", inset && `ml-[${insetValue}px]`) : "w-[1px] h-full",
          className
        )}
        style={orientation === "horizontal" && inset ? { marginLeft: `${insetValue}px` } : undefined}
        {...props}
      />
    );
  }
);
Divider.displayName = "Divider";

/**
 * List Container Component
 *
 * Container for list items following MD3 specifications.
 */

export interface ListProps extends React.HTMLAttributes<HTMLUListElement> {
  /**
   * Whether to show dividers between list items
   * @default false
   */
  dividers?: boolean;

  /**
   * Whether dividers should have inset
   * @default false
   */
  dividerInset?: boolean;
}

/**
 * List Component
 *
 * @example Basic list
 * ```tsx
 * <List>
 *   <ListItem headline="Item 1" />
 *   <ListItem headline="Item 2" />
 * </List>
 * ```
 *
 * @example List with dividers
 * ```tsx
 * <List dividers>
 *   <ListItem headline="Item 1" />
 *   <ListItem headline="Item 2" />
 * </List>
 * ```
 */
const List = React.forwardRef<HTMLUListElement, ListProps>(
  ({ className, dividers = false, dividerInset = false, children, ...props }, ref) => {
    const childArray = React.Children.toArray(children);

    return (
      <ul ref={ref} className={cn("w-full list-none", className)} {...props}>
        {dividers
          ? childArray.map((child, index) => (
              <React.Fragment key={index}>
                {child}
                {index < childArray.length - 1 && (
                  <li role="presentation" aria-hidden="true" className="px-0">
                    <Divider inset={dividerInset} />
                  </li>
                )}
              </React.Fragment>
            ))
          : children}
      </ul>
    );
  }
);
List.displayName = "List";

export { List, ListItem, Divider };
