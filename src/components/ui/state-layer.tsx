"use client";

import React from "react";
import { cn } from "@/lib/utils";

/**
 * MD3 State Layer Opacity Values
 * These follow Material Design 3 specifications for interactive states
 */
export const MD3_STATE_OPACITY = {
  hover: 0.08,
  focus: 0.12,
  pressed: 0.12,
  dragged: 0.16,
} as const;

export interface StateLayerProps {
  /**
   * Whether the hover state is active
   */
  hover?: boolean;

  /**
   * Whether the focus state is active
   */
  focus?: boolean;

  /**
   * Whether the pressed state is active
   */
  pressed?: boolean;

  /**
   * Whether the dragged state is active
   */
  dragged?: boolean;

  /**
   * Custom color for the state layer
   * Defaults to currentColor (inherits from parent)
   */
  color?: string;

  /**
   * Custom opacity overrides for each state
   */
  opacity?: {
    hover?: number;
    focus?: number;
    pressed?: number;
    dragged?: number;
  };

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * StateLayer Component
 *
 * Implements Material Design 3 state layer system for interactive components.
 * State layers provide visual feedback for user interactions (hover, focus, pressed, dragged).
 *
 * @example
 * ```tsx
 * <button className="relative">
 *   <StateLayer hover={isHovered} focus={isFocused} />
 *   Button Text
 * </button>
 * ```
 *
 * @example With custom color
 * ```tsx
 * <StateLayer hover color="rgb(103, 80, 164)" />
 * ```
 *
 * @example With custom opacity
 * ```tsx
 * <StateLayer hover opacity={{ hover: 0.16 }} />
 * ```
 */
export function StateLayer({
  hover = false,
  focus = false,
  pressed = false,
  dragged = false,
  color = "currentColor",
  opacity,
  className,
}: StateLayerProps) {
  // Determine which state is active (priority: dragged > pressed > focus > hover)
  const activeState = dragged ? "dragged" : pressed ? "pressed" : focus ? "focus" : hover ? "hover" : null;

  // Get the opacity for the active state
  const getOpacity = () => {
    if (!activeState) return 0;

    // Use custom opacity if provided, otherwise use MD3 default
    if (opacity?.[activeState] !== undefined) {
      return opacity[activeState];
    }

    return MD3_STATE_OPACITY[activeState];
  };

  const stateOpacity = getOpacity();

  // Don't render if no state is active
  if (!activeState || stateOpacity === 0) {
    return null;
  }

  return (
    <span
      className={cn(
        "absolute inset-0 rounded-[inherit] pointer-events-none transition-opacity duration-200",
        className
      )}
      style={{
        backgroundColor: color,
        opacity: stateOpacity,
      }}
      aria-hidden="true"
    />
  );
}

/**
 * Hook to manage state layer states
 * Provides a convenient way to track hover, focus, and pressed states
 *
 * @example
 * ```tsx
 * function MyButton() {
 *   const { states, handlers } = useStateLayer();
 *
 *   return (
 *     <button className="relative" {...handlers}>
 *       <StateLayer {...states} />
 *       Button Text
 *     </button>
 *   );
 * }
 * ```
 */
export function useStateLayer() {
  const [hover, setHover] = React.useState(false);
  const [focus, setFocus] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);

  const handlers = {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPressed(false);
    },
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    onMouseDown: () => setPressed(true),
    onMouseUp: () => setPressed(false),
  };

  return {
    states: { hover, focus, pressed },
    handlers,
  };
}
