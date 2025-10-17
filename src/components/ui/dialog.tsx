"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Button } from "./button";

/**
 * MD3 Dialog Component
 *
 * Implements Material Design 3 dialog specifications:
 * - Elevation level 3 shadow for depth
 * - Border-radius extra-large (28px) for rounded corners
 * - Backdrop with appropriate scrim opacity
 * - Support for header with optional icon
 * - Support for multiple action buttons with different variants
 * - Full-screen mode for mobile viewports
 * - Max-width variants (xs, sm, md, lg, xl)
 * - Open/close animations with MD3 easing
 * - Focus trap and focus restoration (handled by Radix)
 * - Escape key to close (handled by Radix)
 *
 * Features:
 * - Accessible by default (role="dialog", aria-modal, aria-labelledby)
 * - Keyboard navigation support
 * - Focus management
 * - Portal rendering for proper stacking
 */

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

/**
 * DialogOverlay Component
 *
 * Backdrop/scrim for the dialog following MD3 specifications.
 * Uses scrim color with appropriate opacity.
 */
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      // Base styles
      "fixed inset-0 z-50",
      // MD3 scrim color with opacity
      "bg-[hsl(var(--md-sys-color-scrim)/0.32)]",
      // Animations with MD3 easing
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      "data-[state=open]:duration-[var(--md-sys-motion-duration-medium2)]",
      "data-[state=closed]:duration-[var(--md-sys-motion-duration-short4)]",
      "data-[state=open]:ease-[var(--md-sys-motion-easing-emphasized-decelerate)]",
      "data-[state=closed]:ease-[var(--md-sys-motion-easing-emphasized-accelerate)]",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

/**
 * Dialog Content Variants
 */
const dialogContentVariants = cva(
  [
    // Base styles
    "fixed left-[50%] top-[50%] z-50",
    "translate-x-[-50%] translate-y-[-50%]",
    "flex flex-col",
    // MD3 Surface
    "bg-[hsl(var(--md-sys-color-surface-container-high))]",
    "text-[hsl(var(--md-sys-color-on-surface))]",
    // MD3 Elevation Level 3
    "shadow-[var(--md-sys-elevation-level3)]",
    // MD3 Border Radius Extra Large (28px)
    "rounded-[var(--md-sys-shape-corner-extra-large)]",
    // Animations with MD3 easing
    "data-[state=open]:animate-in data-[state=closed]:animate-out",
    "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
    "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
    "data-[state=open]:duration-[var(--md-sys-motion-duration-medium2)]",
    "data-[state=closed]:duration-[var(--md-sys-motion-duration-short4)]",
    "data-[state=open]:ease-[var(--md-sys-motion-easing-emphasized-decelerate)]",
    "data-[state=closed]:ease-[var(--md-sys-motion-easing-emphasized-accelerate)]",
    // Focus styles
    "focus:outline-none",
  ],
  {
    variants: {
      maxWidth: {
        xs: "w-full max-w-xs",
        sm: "w-full max-w-sm",
        md: "w-full max-w-md",
        lg: "w-full max-w-lg",
        xl: "w-full max-w-xl",
      },
      fullScreen: {
        true: "!w-screen !h-screen !max-w-none !rounded-none md:!w-full md:!h-auto md:!max-w-lg md:!rounded-[var(--md-sys-shape-corner-extra-large)]",
        false: "",
      },
    },
    defaultVariants: {
      maxWidth: "md",
      fullScreen: false,
    },
  }
);

export interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof dialogContentVariants> {
  /**
   * Whether to show the close button
   * @default true
   */
  showClose?: boolean;
}

/**
 * DialogContent Component
 *
 * Main dialog container with MD3 styling.
 * Supports max-width variants and full-screen mode for mobile.
 */
const DialogContent = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Content>, DialogContentProps>(
  ({ className, children, maxWidth, fullScreen, showClose = true, ...props }, ref) => (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(dialogContentVariants({ maxWidth, fullScreen }), className)}
        {...props}
      >
        {children}
        {showClose && (
          <DialogPrimitive.Close
            className={cn(
              "absolute right-4 top-4 z-10",
              "rounded-full p-2",
              "text-[hsl(var(--md-sys-color-on-surface-variant))]",
              "transition-colors duration-[var(--md-sys-motion-duration-short2)]",
              "hover:bg-[hsl(var(--md-sys-color-on-surface)/0.08)]",
              "focus:bg-[hsl(var(--md-sys-color-on-surface)/0.12)]",
              "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--md-sys-color-primary))]",
              "disabled:pointer-events-none disabled:opacity-50"
            )}
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
);
DialogContent.displayName = DialogPrimitive.Content.displayName;

export interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Optional icon to display in the header
   */
  icon?: React.ReactNode;
}

/**
 * DialogHeader Component
 *
 * Header section of the dialog with optional icon.
 * Follows MD3 dialog header specifications.
 */
const DialogHeader = React.forwardRef<HTMLDivElement, DialogHeaderProps>(
  ({ className, icon, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col gap-2 px-6 pt-6 pb-4", icon && "items-center text-center", className)}
      {...props}
    >
      {icon && <div className="flex items-center justify-center text-[hsl(var(--md-sys-color-secondary))]">{icon}</div>}
      {children}
    </div>
  )
);
DialogHeader.displayName = "DialogHeader";

/**
 * DialogBody Component
 *
 * Main content area of the dialog.
 */
const DialogBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex-1 overflow-y-auto px-6 py-2",
        // MD3 Body Medium typography
        "text-[length:var(--md-sys-typescale-body-medium-size)]",
        "leading-[var(--md-sys-typescale-body-medium-line-height)]",
        "text-[hsl(var(--md-sys-color-on-surface-variant))]",
        className
      )}
      {...props}
    />
  )
);
DialogBody.displayName = "DialogBody";

/**
 * DialogFooter Component
 *
 * Footer section for action buttons.
 * Follows MD3 dialog actions specifications.
 */
const DialogFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-row items-center justify-end gap-2 px-6 pb-6 pt-4", className)}
      {...props}
    />
  )
);
DialogFooter.displayName = "DialogFooter";

/**
 * DialogTitle Component
 *
 * Title element for the dialog header.
 * Uses MD3 headline-small typography scale.
 */
const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      // MD3 Headline Small typography
      "text-[length:var(--md-sys-typescale-headline-small-size)]",
      "leading-[var(--md-sys-typescale-headline-small-line-height)]",
      "font-[var(--md-sys-typescale-headline-small-weight)]",
      "text-[hsl(var(--md-sys-color-on-surface))]",
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

/**
 * DialogDescription Component
 *
 * Description/subtitle element for the dialog.
 * Uses MD3 body-medium typography scale.
 */
const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn(
      // MD3 Body Medium typography
      "text-[length:var(--md-sys-typescale-body-medium-size)]",
      "leading-[var(--md-sys-typescale-body-medium-line-height)]",
      "text-[hsl(var(--md-sys-color-on-surface-variant))]",
      className
    )}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

/**
 * DialogAction Component
 *
 * Convenience component for dialog action buttons.
 * Wraps the Button component with appropriate defaults.
 */
export interface DialogActionProps extends React.ComponentPropsWithoutRef<typeof Button> {
  /**
   * Button variant
   * @default "text"
   */
  variant?: "filled" | "outlined" | "text" | "elevated" | "tonal";
}

const DialogAction = React.forwardRef<HTMLButtonElement, DialogActionProps>(({ variant = "text", ...props }, ref) => (
  <Button ref={ref} variant={variant} {...props} />
));
DialogAction.displayName = "DialogAction";

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogAction,
};
