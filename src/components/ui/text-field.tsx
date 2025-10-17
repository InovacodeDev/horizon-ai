"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { StateLayer, useStateLayer } from "./state-layer";

/**
 * MD3 TextField Component
 *
 * Implements Material Design 3 text field specifications with two variants:
 * - filled: High emphasis with filled background
 * - outlined: Medium emphasis with border
 *
 * Features:
 * - Floating label with animation
 * - Helper text and error message display
 * - Leading and trailing icons support
 * - MD3 body-large typography for input text
 * - States: default, focused, error, disabled
 * - Focus indicator with primary color
 * - State layers for hover interaction
 * - Full accessibility support
 */

const textFieldVariants = cva(
  [
    // Base container styles
    "relative flex w-full",
    "transition-all duration-[var(--md-sys-motion-duration-short4)]",
    "ease-[var(--md-sys-motion-easing-standard)]",
  ],
  {
    variants: {
      variant: {
        filled: [
          "rounded-t-[var(--md-sys-shape-corner-extra-small)]",
          "bg-[hsl(var(--md-sys-color-surface-container-highest))]",
          "border-b-2",
          "border-b-[hsl(var(--md-sys-color-on-surface-variant))]",
          "hover:bg-[hsl(var(--md-sys-color-on-surface)/0.08)]",
        ],
        outlined: [
          "rounded-[var(--md-sys-shape-corner-extra-small)]",
          "border",
          "border-[hsl(var(--md-sys-color-outline))]",
          "bg-transparent",
        ],
      },
      state: {
        default: "",
        focused: "",
        error: "",
        disabled: "",
      },
    },
    compoundVariants: [
      // Filled focused state
      {
        variant: "filled",
        state: "focused",
        className: [
          "border-b-[hsl(var(--md-sys-color-primary))]",
          "bg-[hsl(var(--md-sys-color-surface-container-highest))]",
        ],
      },
      // Filled error state
      {
        variant: "filled",
        state: "error",
        className: "border-b-[hsl(var(--md-sys-color-error))]",
      },
      // Filled disabled state
      {
        variant: "filled",
        state: "disabled",
        className: [
          "bg-[hsl(var(--md-sys-color-on-surface)/0.04)]",
          "border-b-[hsl(var(--md-sys-color-on-surface)/0.38)]",
        ],
      },
      // Outlined focused state
      {
        variant: "outlined",
        state: "focused",
        className: "border-2 border-[hsl(var(--md-sys-color-primary))]",
      },
      // Outlined error state
      {
        variant: "outlined",
        state: "error",
        className: "border-2 border-[hsl(var(--md-sys-color-error))]",
      },
      // Outlined disabled state
      {
        variant: "outlined",
        state: "disabled",
        className: "border-[hsl(var(--md-sys-color-on-surface)/0.12)]",
      },
    ],
    defaultVariants: {
      variant: "filled",
      state: "default",
    },
  }
);

const inputVariants = cva(
  [
    // Base input styles
    "w-full bg-transparent outline-none",
    "text-[hsl(var(--md-sys-color-on-surface))]",
    "placeholder:text-transparent",
    // MD3 Typography - Body Large
    "font-[family-name:var(--md-sys-typescale-body-large-font)]",
    "text-[length:var(--md-sys-typescale-body-large-size)]",
    "leading-[var(--md-sys-typescale-body-large-line-height)]",
    "font-[number:var(--md-sys-typescale-body-large-weight)]",
    "tracking-[var(--md-sys-typescale-body-large-tracking)]",
  ],
  {
    variants: {
      variant: {
        filled: "px-4 pt-6 pb-2",
        outlined: "px-4 py-4",
      },
      hasLeadingIcon: {
        true: "pl-12",
        false: "",
      },
      hasTrailingIcon: {
        true: "pr-12",
        false: "",
      },
      disabled: {
        true: "text-[hsl(var(--md-sys-color-on-surface)/0.38)] cursor-not-allowed",
        false: "",
      },
    },
    defaultVariants: {
      variant: "filled",
      hasLeadingIcon: false,
      hasTrailingIcon: false,
      disabled: false,
    },
  }
);

const labelVariants = cva(
  [
    // Base label styles
    "absolute left-0 pointer-events-none",
    "text-[hsl(var(--md-sys-color-on-surface-variant))]",
    "transition-all duration-[var(--md-sys-motion-duration-short4)]",
    "ease-[var(--md-sys-motion-easing-emphasized-decelerate)]",
    "origin-left",
    // MD3 Typography - Body Large (default)
    "font-[family-name:var(--md-sys-typescale-body-large-font)]",
    "text-[length:var(--md-sys-typescale-body-large-size)]",
    "leading-[var(--md-sys-typescale-body-large-line-height)]",
    "font-[number:var(--md-sys-typescale-body-large-weight)]",
  ],
  {
    variants: {
      variant: {
        filled: "top-4 left-4",
        outlined: "top-4 left-4 bg-[hsl(var(--md-sys-color-surface))] px-1",
      },
      floating: {
        true: "",
        false: "",
      },
      hasLeadingIcon: {
        true: "left-12",
        false: "",
      },
      focused: {
        true: "text-[hsl(var(--md-sys-color-primary))]",
        false: "",
      },
      error: {
        true: "text-[hsl(var(--md-sys-color-error))]",
        false: "",
      },
      disabled: {
        true: "text-[hsl(var(--md-sys-color-on-surface)/0.38)]",
        false: "",
      },
    },
    compoundVariants: [
      // Filled floating label
      {
        variant: "filled",
        floating: true,
        className: [
          "top-2 left-4",
          "text-[length:var(--md-sys-typescale-body-small-size)]",
          "leading-[var(--md-sys-typescale-body-small-line-height)]",
          "scale-100",
        ],
      },
      // Outlined floating label
      {
        variant: "outlined",
        floating: true,
        className: [
          "-top-2 left-3",
          "text-[length:var(--md-sys-typescale-body-small-size)]",
          "leading-[var(--md-sys-typescale-body-small-line-height)]",
          "scale-100",
        ],
      },
    ],
    defaultVariants: {
      variant: "filled",
      floating: false,
      hasLeadingIcon: false,
      focused: false,
      error: false,
      disabled: false,
    },
  }
);

const supportingTextVariants = cva(
  [
    // Base supporting text styles
    "mt-1 px-4",
    // MD3 Typography - Body Small
    "font-[family-name:var(--md-sys-typescale-body-small-font)]",
    "text-[length:var(--md-sys-typescale-body-small-size)]",
    "leading-[var(--md-sys-typescale-body-small-line-height)]",
    "font-[number:var(--md-sys-typescale-body-small-weight)]",
    "tracking-[var(--md-sys-typescale-body-small-tracking)]",
  ],
  {
    variants: {
      error: {
        true: "text-[hsl(var(--md-sys-color-error))]",
        false: "text-[hsl(var(--md-sys-color-on-surface-variant))]",
      },
      disabled: {
        true: "text-[hsl(var(--md-sys-color-on-surface)/0.38)]",
        false: "",
      },
    },
    defaultVariants: {
      error: false,
      disabled: false,
    },
  }
);

export interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  /**
   * TextField variant
   */
  variant?: "filled" | "outlined";

  /**
   * Label text
   */
  label?: string;

  /**
   * Helper text displayed below the input
   */
  helperText?: string;

  /**
   * Error state
   */
  error?: boolean;

  /**
   * Error message (overrides helperText when error is true)
   */
  errorMessage?: string;

  /**
   * Leading icon (displayed before input)
   */
  leadingIcon?: React.ReactNode;

  /**
   * Trailing icon (displayed after input)
   */
  trailingIcon?: React.ReactNode;

  /**
   * Make input full width
   */
  fullWidth?: boolean;
}

const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      className,
      variant = "filled",
      label,
      helperText,
      error = false,
      errorMessage,
      leadingIcon,
      trailingIcon,
      fullWidth = false,
      disabled = false,
      value,
      defaultValue,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(Boolean(value || defaultValue));
    const { states, handlers } = useStateLayer();
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    // Determine current state
    const currentState = disabled ? "disabled" : error ? "error" : isFocused ? "focused" : "default";

    // Check if label should float
    const shouldFloat = isFocused || hasValue;

    // Update hasValue when value prop changes
    React.useEffect(() => {
      setHasValue(Boolean(value || defaultValue));
    }, [value, defaultValue]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setHasValue(Boolean(e.target.value));
      onBlur?.(e);
    };

    const handleLabelClick = () => {
      inputRef.current?.focus();
    };

    // Combine refs
    const setRefs = React.useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref]
    );

    // Generate IDs for accessibility
    const inputId = React.useId();
    const helperTextId = `${inputId}-helper`;
    const errorMessageId = `${inputId}-error`;

    const supportingText = error && errorMessage ? errorMessage : helperText;
    const describedBy = supportingText ? (error ? errorMessageId : helperTextId) : undefined;

    return (
      <div className={cn("flex flex-col", fullWidth && "w-full", className)}>
        <div
          className={cn(textFieldVariants({ variant, state: currentState }), "overflow-hidden")}
          {...(!disabled && handlers)}
        >
          {/* State Layer for hover */}
          {!disabled && variant === "filled" && (
            <StateLayer hover={states.hover && !isFocused} color="hsl(var(--md-sys-color-on-surface))" />
          )}

          {/* Leading Icon */}
          {leadingIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-[hsl(var(--md-sys-color-on-surface-variant))]">
              <span className="inline-flex [&_svg]:size-6">{leadingIcon}</span>
            </div>
          )}

          {/* Input */}
          <input
            ref={setRefs}
            className={inputVariants({
              variant,
              hasLeadingIcon: Boolean(leadingIcon),
              hasTrailingIcon: Boolean(trailingIcon),
              disabled,
            })}
            disabled={disabled}
            value={value}
            defaultValue={defaultValue}
            onFocus={handleFocus}
            onBlur={handleBlur}
            aria-invalid={error}
            aria-describedby={describedBy}
            id={inputId}
            {...props}
          />

          {/* Label */}
          {label && (
            <label
              htmlFor={inputId}
              className={labelVariants({
                variant,
                floating: shouldFloat,
                hasLeadingIcon: Boolean(leadingIcon),
                focused: isFocused,
                error,
                disabled,
              })}
              onClick={handleLabelClick}
            >
              {label}
            </label>
          )}

          {/* Trailing Icon */}
          {trailingIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-[hsl(var(--md-sys-color-on-surface-variant))]">
              <span className="inline-flex [&_svg]:size-6">{trailingIcon}</span>
            </div>
          )}
        </div>

        {/* Supporting Text (Helper Text or Error Message) */}
        {supportingText && (
          <div
            id={error ? errorMessageId : helperTextId}
            className={supportingTextVariants({ error, disabled })}
            role={error ? "alert" : undefined}
          >
            {supportingText}
          </div>
        )}
      </div>
    );
  }
);

TextField.displayName = "TextField";

export { TextField, textFieldVariants };
