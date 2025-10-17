"use client";

import React from "react";
import { StateLayer, useStateLayer } from "./state-layer";
import { useRipple, RippleContainer } from "@/lib/animations/ripple";
import { cn } from "@/lib/utils";

/**
 * Example component demonstrating StateLayer integration with ripple effects
 * This shows how to combine MD3 state layers with the existing ripple system
 */
export function StateLayerExample() {
  return (
    <div className="p-8 space-y-6">
      <h2 className="text-2xl font-bold">MD3 State Layer Examples</h2>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic State Layer</h3>
        <BasicStateLayerButton />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">State Layer with Ripple</h3>
        <StateLayerWithRippleButton />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Custom Color State Layer</h3>
        <CustomColorStateLayerButton />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Custom Opacity State Layer</h3>
        <CustomOpacityStateLayerButton />
      </div>
    </div>
  );
}

/**
 * Basic button with state layer using the useStateLayer hook
 */
function BasicStateLayerButton() {
  const { states, handlers } = useStateLayer();

  return (
    <button
      className={cn(
        "relative px-6 py-3 rounded-full",
        "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]",
        "font-medium transition-shadow",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      )}
      {...handlers}
    >
      <StateLayer {...states} />
      <span className="relative z-10">Hover, Focus, or Click Me</span>
    </button>
  );
}

/**
 * Button with both state layer and ripple effect
 * Demonstrates integration between the two systems
 */
function StateLayerWithRippleButton() {
  const { states, handlers } = useStateLayer();
  const { ripples, createRipple } = useRipple();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    createRipple(e);
    handlers.onMouseDown();
  };

  return (
    <button
      className={cn(
        "relative px-6 py-3 rounded-full overflow-hidden",
        "bg-[var(--md-sys-color-secondary-container)]",
        "text-[var(--md-sys-color-on-secondary-container)]",
        "font-medium transition-shadow",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      )}
      onMouseEnter={handlers.onMouseEnter}
      onMouseLeave={handlers.onMouseLeave}
      onFocus={handlers.onFocus}
      onBlur={handlers.onBlur}
      onMouseDown={handleClick}
      onMouseUp={handlers.onMouseUp}
    >
      <StateLayer {...states} />
      <RippleContainer ripples={ripples} color="var(--md-sys-color-on-secondary-container)" />
      <span className="relative z-10">Click for Ripple + State Layer</span>
    </button>
  );
}

/**
 * Button with custom color state layer
 */
function CustomColorStateLayerButton() {
  const { states, handlers } = useStateLayer();

  return (
    <button
      className={cn(
        "relative px-6 py-3 rounded-full",
        "bg-[var(--md-sys-color-tertiary)] text-[var(--md-sys-color-on-tertiary)]",
        "font-medium transition-shadow",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      )}
      {...handlers}
    >
      <StateLayer {...states} color="rgb(255, 255, 255)" />
      <span className="relative z-10">Custom White State Layer</span>
    </button>
  );
}

/**
 * Button with custom opacity values
 */
function CustomOpacityStateLayerButton() {
  const { states, handlers } = useStateLayer();

  return (
    <button
      className={cn(
        "relative px-6 py-3 rounded-full",
        "bg-[var(--md-sys-color-error)] text-[var(--md-sys-color-on-error)]",
        "font-medium transition-shadow",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      )}
      {...handlers}
    >
      <StateLayer
        {...states}
        opacity={{
          hover: 0.16,
          focus: 0.24,
          pressed: 0.24,
        }}
      />
      <span className="relative z-10">Custom Opacity (Higher)</span>
    </button>
  );
}
