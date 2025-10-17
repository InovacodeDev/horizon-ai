"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { StateLayer, useStateLayer } from "./state-layer";

/**
 * MD3 Menu Component
 *
 * Implements Material Design 3 menu specifications:
 * - Elevation level 2 shadow for depth
 * - Border-radius extra-small (4px) for rounded corners
 * - Menu items with state layers for interactive feedback
 * - Support for leading icons
 * - Dividers between menu sections
 * - Disabled state for menu items
 * - List-item typography
 * - Keyboard navigation (Arrow keys, Enter, Escape) - handled by Radix
 * - Focus management and focus trap - handled by Radix
 * - Positioning relative to anchor element - handled by Radix
 *
 * Features:
 * - Accessible by default (role="menu", role="menuitem", aria-haspopup)
 * - Keyboard navigation support
 * - Focus management
 * - Portal rendering for proper stacking
 */

const Menu = DropdownMenuPrimitive.Root;

const MenuTrigger = DropdownMenuPrimitive.Trigger;

const MenuGroup = DropdownMenuPrimitive.Group;

const MenuPortal = DropdownMenuPrimitive.Portal;

const MenuSub = DropdownMenuPrimitive.Sub;

const MenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

/**
 * MenuSubTrigger Component
 *
 * Trigger for submenu items.
 */
const MenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => {
  const { states, handlers } = useStateLayer();

  return (
    <DropdownMenuPrimitive.SubTrigger
      ref={ref}
      className={cn(
        // Base styles
        "relative flex cursor-pointer select-none items-center gap-3",
        "rounded-[var(--md-sys-shape-corner-extra-small)]",
        "px-3 py-2 min-h-[48px]",
        // MD3 List Item typography
        "text-[length:var(--md-sys-typescale-body-large-size)]",
        "leading-[var(--md-sys-typescale-body-large-line-height)]",
        "font-[var(--md-sys-typescale-body-large-weight)]",
        "tracking-[var(--md-sys-typescale-body-large-tracking)]",
        "text-[hsl(var(--md-sys-color-on-surface))]",
        // Focus styles
        "outline-none",
        "focus:bg-[hsl(var(--md-sys-color-on-surface)/0.12)]",
        // Disabled styles
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-38",
        inset && "pl-10",
        className
      )}
      {...handlers}
      {...props}
    >
      {/* State Layer */}
      <StateLayer {...states} color="hsl(var(--md-sys-color-on-surface))" />

      {children}
      <svg
        className="ml-auto h-4 w-4 z-10"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </DropdownMenuPrimitive.SubTrigger>
  );
});
MenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

/**
 * MenuSubContent Component
 *
 * Content container for submenu items.
 */
const MenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      // Base styles
      "z-50 min-w-[8rem] overflow-hidden",
      // MD3 Surface
      "bg-[hsl(var(--md-sys-color-surface-container))]",
      // MD3 Elevation Level 2
      "shadow-[var(--md-sys-elevation-level2)]",
      // MD3 Border Radius Extra Small (4px)
      "rounded-[var(--md-sys-shape-corner-extra-small)]",
      // Padding
      "p-1",
      // Animations with MD3 easing
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
      "data-[side=bottom]:slide-in-from-top-2",
      "data-[side=left]:slide-in-from-right-2",
      "data-[side=right]:slide-in-from-left-2",
      "data-[side=top]:slide-in-from-bottom-2",
      "data-[state=open]:duration-[var(--md-sys-motion-duration-short4)]",
      "data-[state=closed]:duration-[var(--md-sys-motion-duration-short2)]",
      className
    )}
    {...props}
  />
));
MenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

/**
 * MenuContent Component
 *
 * Main menu container with MD3 styling.
 */
const MenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        // Base styles
        "z-50 min-w-[8rem] overflow-hidden",
        // MD3 Surface
        "bg-[hsl(var(--md-sys-color-surface-container))]",
        "text-[hsl(var(--md-sys-color-on-surface))]",
        // MD3 Elevation Level 2
        "shadow-[var(--md-sys-elevation-level2)]",
        // MD3 Border Radius Extra Small (4px)
        "rounded-[var(--md-sys-shape-corner-extra-small)]",
        // Padding
        "p-1",
        // Animations with MD3 easing
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[side=bottom]:slide-in-from-top-2",
        "data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2",
        "data-[side=top]:slide-in-from-bottom-2",
        "data-[state=open]:duration-[var(--md-sys-motion-duration-short4)]",
        "data-[state=closed]:duration-[var(--md-sys-motion-duration-short2)]",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
MenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

/**
 * MenuItem Component
 *
 * Individual menu item with MD3 styling and state layers.
 */
const MenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
    icon?: React.ReactNode;
  }
>(({ className, inset, icon, children, ...props }, ref) => {
  const { states, handlers } = useStateLayer();

  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(
        // Base styles
        "relative flex cursor-pointer select-none items-center gap-3",
        "rounded-[var(--md-sys-shape-corner-extra-small)]",
        "px-3 py-2 min-h-[48px]",
        // MD3 List Item typography
        "text-[length:var(--md-sys-typescale-body-large-size)]",
        "leading-[var(--md-sys-typescale-body-large-line-height)]",
        "font-[var(--md-sys-typescale-body-large-weight)]",
        "tracking-[var(--md-sys-typescale-body-large-tracking)]",
        "text-[hsl(var(--md-sys-color-on-surface))]",
        // Transitions
        "transition-colors duration-[var(--md-sys-motion-duration-short2)]",
        // Focus styles
        "outline-none",
        "focus:bg-[hsl(var(--md-sys-color-on-surface)/0.12)]",
        // Disabled styles
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-38",
        inset && "pl-10",
        className
      )}
      {...handlers}
      {...props}
    >
      {/* State Layer */}
      <StateLayer {...states} color="hsl(var(--md-sys-color-on-surface))" />

      {/* Leading Icon */}
      {icon && <span className="flex items-center justify-center w-6 h-6 z-10 [&_svg]:w-5 [&_svg]:h-5">{icon}</span>}

      {/* Content */}
      <span className="flex-1 z-10">{children}</span>
    </DropdownMenuPrimitive.Item>
  );
});
MenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

/**
 * MenuCheckboxItem Component
 *
 * Checkbox menu item with check indicator.
 */
const MenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => {
  const { states, handlers } = useStateLayer();

  return (
    <DropdownMenuPrimitive.CheckboxItem
      ref={ref}
      className={cn(
        // Base styles
        "relative flex cursor-pointer select-none items-center gap-3",
        "rounded-[var(--md-sys-shape-corner-extra-small)]",
        "px-3 py-2 min-h-[48px] pl-10",
        // MD3 List Item typography
        "text-[length:var(--md-sys-typescale-body-large-size)]",
        "leading-[var(--md-sys-typescale-body-large-line-height)]",
        "font-[var(--md-sys-typescale-body-large-weight)]",
        "tracking-[var(--md-sys-typescale-body-large-tracking)]",
        "text-[hsl(var(--md-sys-color-on-surface))]",
        // Transitions
        "transition-colors duration-[var(--md-sys-motion-duration-short2)]",
        // Focus styles
        "outline-none",
        "focus:bg-[hsl(var(--md-sys-color-on-surface)/0.12)]",
        // Disabled styles
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-38",
        className
      )}
      checked={checked}
      {...handlers}
      {...props}
    >
      {/* State Layer */}
      <StateLayer {...states} color="hsl(var(--md-sys-color-on-surface))" />

      {/* Check Indicator */}
      <span className="absolute left-3 flex h-6 w-6 items-center justify-center z-10">
        <DropdownMenuPrimitive.ItemIndicator>
          <Check className="h-5 w-5 text-[hsl(var(--md-sys-color-primary))]" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>

      {/* Content */}
      <span className="flex-1 z-10">{children}</span>
    </DropdownMenuPrimitive.CheckboxItem>
  );
});
MenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;

/**
 * MenuRadioItem Component
 *
 * Radio menu item with selection indicator.
 */
const MenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => {
  const { states, handlers } = useStateLayer();

  return (
    <DropdownMenuPrimitive.RadioItem
      ref={ref}
      className={cn(
        // Base styles
        "relative flex cursor-pointer select-none items-center gap-3",
        "rounded-[var(--md-sys-shape-corner-extra-small)]",
        "px-3 py-2 min-h-[48px] pl-10",
        // MD3 List Item typography
        "text-[length:var(--md-sys-typescale-body-large-size)]",
        "leading-[var(--md-sys-typescale-body-large-line-height)]",
        "font-[var(--md-sys-typescale-body-large-weight)]",
        "tracking-[var(--md-sys-typescale-body-large-tracking)]",
        "text-[hsl(var(--md-sys-color-on-surface))]",
        // Transitions
        "transition-colors duration-[var(--md-sys-motion-duration-short2)]",
        // Focus styles
        "outline-none",
        "focus:bg-[hsl(var(--md-sys-color-on-surface)/0.12)]",
        // Disabled styles
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-38",
        className
      )}
      {...handlers}
      {...props}
    >
      {/* State Layer */}
      <StateLayer {...states} color="hsl(var(--md-sys-color-on-surface))" />

      {/* Radio Indicator */}
      <span className="absolute left-3 flex h-6 w-6 items-center justify-center z-10">
        <DropdownMenuPrimitive.ItemIndicator>
          <div className="h-2 w-2 rounded-full bg-[hsl(var(--md-sys-color-primary))]" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>

      {/* Content */}
      <span className="flex-1 z-10">{children}</span>
    </DropdownMenuPrimitive.RadioItem>
  );
});
MenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

/**
 * MenuLabel Component
 *
 * Label for menu sections.
 */
const MenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-3 py-2 min-h-[48px] flex items-center",
      // MD3 Label Small typography
      "text-[length:var(--md-sys-typescale-label-small-size)]",
      "leading-[var(--md-sys-typescale-label-small-line-height)]",
      "font-[var(--md-sys-typescale-label-small-weight)]",
      "tracking-[var(--md-sys-typescale-label-small-tracking)]",
      "text-[hsl(var(--md-sys-color-on-surface-variant))]",
      inset && "pl-10",
      className
    )}
    {...props}
  />
));
MenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

/**
 * MenuSeparator Component
 *
 * Divider between menu sections following MD3 specifications.
 */
const MenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-[1px]", "bg-[hsl(var(--md-sys-color-outline-variant))]", className)}
    {...props}
  />
));
MenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

/**
 * MenuShortcut Component
 *
 * Keyboard shortcut display for menu items.
 */
const MenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest",
        "text-[hsl(var(--md-sys-color-on-surface-variant))]",
        "opacity-60",
        className
      )}
      {...props}
    />
  );
};
MenuShortcut.displayName = "MenuShortcut";

export {
  Menu,
  MenuTrigger,
  MenuContent,
  MenuItem,
  MenuCheckboxItem,
  MenuRadioItem,
  MenuLabel,
  MenuSeparator,
  MenuShortcut,
  MenuGroup,
  MenuPortal,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuRadioGroup,
};
