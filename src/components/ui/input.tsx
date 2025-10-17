import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full",
          "rounded-[var(--md-sys-shape-corner-small)]",
          "border border-[hsl(var(--md-sys-color-outline))]",
          "bg-[hsl(var(--md-sys-color-surface))]",
          "text-[hsl(var(--md-sys-color-on-surface))]",
          "px-3 py-2 text-base md:text-sm",
          "ring-offset-background",
          "file:border-0 file:bg-transparent",
          "file:text-sm file:font-medium",
          "file:text-[hsl(var(--md-sys-color-on-surface))]",
          "placeholder:text-[hsl(var(--md-sys-color-on-surface-variant))]",
          "focus-visible:outline-none",
          "focus-visible:ring-2",
          "focus-visible:ring-[hsl(var(--md-sys-color-primary))]",
          "focus-visible:ring-offset-2",
          "focus-visible:border-[hsl(var(--md-sys-color-primary))]",
          "disabled:cursor-not-allowed",
          "disabled:opacity-38",
          "transition-colors",
          "duration-[var(--md-sys-motion-duration-short2)]",
          "ease-[var(--md-sys-motion-easing-standard)]",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
