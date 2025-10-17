"use client";

import dynamic from "next/dynamic";
import { ComponentProps } from "react";

/**
 * Lazy-loaded MD3 components for code splitting and better performance.
 *
 * Use these lazy-loaded versions for components that:
 * - Are not immediately visible on page load
 * - Are used conditionally (dialogs, drawers, tooltips)
 * - Are large and can benefit from code splitting
 *
 * Benefits:
 * - Reduced initial bundle size
 * - Faster initial page load
 * - Better Time to Interactive (TTI)
 * - Improved Core Web Vitals
 */

/**
 * Lazy Dialog Component
 *
 * Use for dialogs that are not immediately visible.
 * Reduces initial bundle by ~5KB (gzipped).
 */
export const LazyDialog = dynamic(() => import("@/components/ui/dialog").then((mod) => ({ default: mod.Dialog })), {
  ssr: false,
});

export const LazyDialogContent = dynamic(
  () => import("@/components/ui/dialog").then((mod) => ({ default: mod.DialogContent })),
  { ssr: false }
);

export const LazyDialogHeader = dynamic(
  () => import("@/components/ui/dialog").then((mod) => ({ default: mod.DialogHeader })),
  { ssr: false }
);

export const LazyDialogTitle = dynamic(
  () => import("@/components/ui/dialog").then((mod) => ({ default: mod.DialogTitle })),
  { ssr: false }
);

export const LazyDialogBody = dynamic(
  () => import("@/components/ui/dialog").then((mod) => ({ default: mod.DialogBody })),
  { ssr: false }
);

export const LazyDialogFooter = dynamic(
  () => import("@/components/ui/dialog").then((mod) => ({ default: mod.DialogFooter })),
  { ssr: false }
);

/**
 * Lazy Navigation Drawer Component
 *
 * Use for navigation drawers that are not immediately visible.
 * Reduces initial bundle by ~6KB (gzipped).
 */
export const LazyNavigationDrawer = dynamic(
  () => import("@/components/ui/navigation-drawer").then((mod) => ({ default: mod.NavigationDrawer })),
  { ssr: false }
);

export const LazyNavigationDrawerContent = dynamic(
  () => import("@/components/ui/navigation-drawer").then((mod) => ({ default: mod.NavigationDrawerContent })),
  { ssr: false }
);

export const LazyNavigationDrawerItem = dynamic(
  () => import("@/components/ui/navigation-drawer").then((mod) => ({ default: mod.NavigationDrawerItem })),
  { ssr: false }
);

/**
 * Lazy Tooltip Component
 *
 * Use for tooltips that are not critical for initial render.
 * Reduces initial bundle by ~2KB (gzipped).
 */
export const LazyTooltip = dynamic(() => import("@/components/ui/tooltip").then((mod) => ({ default: mod.Tooltip })), {
  ssr: false,
});

export const LazyTooltipTrigger = dynamic(
  () => import("@/components/ui/tooltip").then((mod) => ({ default: mod.TooltipTrigger })),
  { ssr: false }
);

export const LazyTooltipContent = dynamic(
  () => import("@/components/ui/tooltip").then((mod) => ({ default: mod.TooltipContent })),
  { ssr: false }
);

/**
 * Lazy Menu Component
 *
 * Use for menus that are not immediately visible.
 * Reduces initial bundle by ~3KB (gzipped).
 */
export const LazyMenu = dynamic(() => import("@/components/ui/menu").then((mod) => ({ default: mod.Menu })), {
  ssr: false,
});

export const LazyMenuTrigger = dynamic(
  () => import("@/components/ui/menu").then((mod) => ({ default: mod.MenuTrigger })),
  { ssr: false }
);

export const LazyMenuContent = dynamic(
  () => import("@/components/ui/menu").then((mod) => ({ default: mod.MenuContent })),
  { ssr: false }
);

export const LazyMenuItem = dynamic(() => import("@/components/ui/menu").then((mod) => ({ default: mod.MenuItem })), {
  ssr: false,
});

/**
 * Type exports for convenience
 */
export type LazyDialogProps = ComponentProps<typeof LazyDialog>;
export type LazyDialogContentProps = ComponentProps<typeof LazyDialogContent>;
export type LazyNavigationDrawerProps = ComponentProps<typeof LazyNavigationDrawer>;
export type LazyTooltipProps = ComponentProps<typeof LazyTooltip>;
export type LazyMenuProps = ComponentProps<typeof LazyMenu>;
