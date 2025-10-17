"use client";

import * as React from "react";
import { toast, Toaster as SonnerToaster } from "sonner";
import { cn } from "@/lib/utils";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { Button } from "./button";

/**
 * MD3 Snackbar Component
 *
 * Implements Material Design 3 snackbar specifications:
 * - Elevation level 3 shadow
 * - Bottom-center positioning by default
 * - Auto-dismiss with configurable duration
 * - Optional action button
 * - Severity variants (info, success, warning, error)
 * - MD3 motion for enter/exit animations
 * - Support for stacking multiple snackbars
 * - Full accessibility with role="status" or "alert" and aria-live
 *
 * Built on top of sonner for robust toast management.
 */

export type SnackbarSeverity = "info" | "success" | "warning" | "error";

export interface SnackbarAction {
  label: string;
  onClick: () => void;
}

export interface SnackbarOptions {
  /**
   * Severity level of the snackbar
   * @default "info"
   */
  severity?: SnackbarSeverity;

  /**
   * Duration in milliseconds before auto-dismiss
   * @default 4000
   */
  duration?: number;

  /**
   * Optional action button
   */
  action?: SnackbarAction;

  /**
   * Position of the snackbar
   * @default "bottom-center"
   */
  position?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";

  /**
   * Custom icon to display
   */
  icon?: React.ReactNode;

  /**
   * Whether the snackbar can be dismissed by clicking the close button
   * @default true
   */
  dismissible?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Get the icon for a severity level
 */
function getSeverityIcon(severity: SnackbarSeverity): React.ReactNode {
  switch (severity) {
    case "success":
      return <CheckCircle2 className="h-5 w-5" />;
    case "error":
      return <AlertCircle className="h-5 w-5" />;
    case "warning":
      return <AlertTriangle className="h-5 w-5" />;
    case "info":
    default:
      return <Info className="h-5 w-5" />;
  }
}

/**
 * Get the color classes for a severity level
 */
function getSeverityColors(severity: SnackbarSeverity): string {
  switch (severity) {
    case "success":
      return "bg-[hsl(var(--md-sys-color-tertiary-container))] text-[hsl(var(--md-sys-color-on-tertiary-container))] [&_svg]:text-[hsl(var(--md-sys-color-tertiary))]";
    case "error":
      return "bg-[hsl(var(--md-sys-color-error-container))] text-[hsl(var(--md-sys-color-on-error-container))] [&_svg]:text-[hsl(var(--md-sys-color-error))]";
    case "warning":
      return "bg-[hsl(var(--md-sys-color-tertiary-container))] text-[hsl(var(--md-sys-color-on-tertiary-container))] [&_svg]:text-[hsl(var(--md-sys-color-tertiary))]";
    case "info":
    default:
      return "bg-[hsl(var(--md-sys-color-inverse-surface))] text-[hsl(var(--md-sys-color-inverse-on-surface))]";
  }
}

/**
 * Show a snackbar notification
 *
 * @example
 * ```tsx
 * showSnackbar("Connection successful", {
 *   severity: "success",
 *   action: {
 *     label: "View",
 *     onClick: () => console.log("View clicked")
 *   }
 * });
 * ```
 */
export function showSnackbar(message: string, options: SnackbarOptions = {}) {
  const { severity = "info", duration = 4000, action, icon, dismissible = true, className } = options;

  const severityIcon = icon || getSeverityIcon(severity);
  const colorClasses = getSeverityColors(severity);

  // Determine ARIA role based on severity
  const ariaRole = severity === "error" || severity === "warning" ? "alert" : "status";
  const ariaLive = severity === "error" || severity === "warning" ? "assertive" : "polite";

  return toast.custom(
    (t) => (
      <div
        role={ariaRole}
        aria-live={ariaLive}
        aria-atomic="true"
        className={cn(
          // Base styles
          "relative flex items-center gap-3 w-full max-w-md",
          "px-4 py-3 rounded-[var(--md-sys-shape-corner-extra-small)]",
          // MD3 Elevation Level 3
          "shadow-[var(--md-sys-elevation-level3)]",
          // MD3 Typography - Body Medium
          "text-[length:var(--md-sys-typescale-body-medium-size,14px)]",
          "leading-[var(--md-sys-typescale-body-medium-line-height,20px)]",
          "font-[number:var(--md-sys-typescale-body-medium-weight,400)]",
          // Colors based on severity
          colorClasses,
          // Animation
          "animate-in slide-in-from-bottom-5 duration-[var(--md-sys-motion-duration-medium2)]",
          "data-[closed]:animate-out data-[closed]:slide-out-to-bottom-5",
          className
        )}
        data-closed={!t}
      >
        {/* Icon */}
        {severityIcon && (
          <div className="flex-shrink-0" aria-hidden="true">
            {severityIcon}
          </div>
        )}

        {/* Message */}
        <div className="flex-1 min-w-0">
          <p className="break-words">{message}</p>
        </div>

        {/* Action Button */}
        {action && (
          <Button
            variant="text"
            size="small"
            onClick={() => {
              action.onClick();
              toast.dismiss(t);
            }}
            className={cn(
              "flex-shrink-0 h-8 px-3 min-w-0",
              severity === "info"
                ? "text-[hsl(var(--md-sys-color-inverse-primary))] hover:bg-[hsl(var(--md-sys-color-inverse-primary)/0.08)]"
                : ""
            )}
          >
            {action.label}
          </Button>
        )}

        {/* Close Button */}
        {dismissible && (
          <button
            onClick={() => toast.dismiss(t)}
            className={cn(
              "flex-shrink-0 p-1 rounded-full",
              "hover:bg-[hsl(var(--md-sys-color-on-surface)/0.08)]",
              "focus-visible:outline-none focus-visible:ring-2",
              "focus-visible:ring-[hsl(var(--md-sys-color-primary))]",
              "transition-colors duration-[var(--md-sys-motion-duration-short2)]"
            )}
            aria-label="Close notification"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    ),
    {
      duration,
      id: `snackbar-${Date.now()}`,
    }
  );
}

/**
 * Convenience methods for different severity levels
 */
export const snackbar = {
  /**
   * Show an info snackbar
   */
  info: (message: string, options?: Omit<SnackbarOptions, "severity">) =>
    showSnackbar(message, { ...options, severity: "info" }),

  /**
   * Show a success snackbar
   */
  success: (message: string, options?: Omit<SnackbarOptions, "severity">) =>
    showSnackbar(message, { ...options, severity: "success" }),

  /**
   * Show a warning snackbar
   */
  warning: (message: string, options?: Omit<SnackbarOptions, "severity">) =>
    showSnackbar(message, { ...options, severity: "warning" }),

  /**
   * Show an error snackbar
   */
  error: (message: string, options?: Omit<SnackbarOptions, "severity">) =>
    showSnackbar(message, { ...options, severity: "error" }),

  /**
   * Dismiss a specific snackbar by ID
   */
  dismiss: (id?: string | number) => toast.dismiss(id),

  /**
   * Dismiss all snackbars
   */
  dismissAll: () => toast.dismiss(),
};

/**
 * Snackbar Provider Component
 *
 * Must be included in your app layout to enable snackbars.
 * Handles positioning, stacking, and animations.
 *
 * @example
 * ```tsx
 * // In your root layout
 * <SnackbarProvider position="bottom-center" />
 * ```
 */
export interface SnackbarProviderProps {
  /**
   * Position of snackbars
   * @default "bottom-center"
   */
  position?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";

  /**
   * Maximum number of snackbars to show at once
   * @default 3
   */
  maxSnackbars?: number;

  /**
   * Gap between stacked snackbars in pixels
   * @default 8
   */
  gap?: number;

  /**
   * Offset from the edge of the screen in pixels
   * @default 16
   */
  offset?: number;
}

export function SnackbarProvider({
  position = "bottom-center",
  maxSnackbars = 3,
  gap = 8,
  offset = 16,
}: SnackbarProviderProps) {
  return (
    <SonnerToaster
      position={position}
      visibleToasts={maxSnackbars}
      gap={gap}
      offset={offset}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "w-full",
        },
      }}
      // MD3 motion easing
      style={
        {
          "--normal-duration": "var(--md-sys-motion-duration-medium2)",
          "--normal-easing": "var(--md-sys-motion-easing-emphasized)",
        } as React.CSSProperties
      }
    />
  );
}

// Export types
export type { SnackbarAction, SnackbarOptions, SnackbarProviderProps };
