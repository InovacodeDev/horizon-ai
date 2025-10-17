"use client";

import * as React from "react";
import { NavigationBar, NavigationBarItem } from "../navigation-bar";
import { LayoutDashboard, Search, Bell, User, Settings } from "lucide-react";

/**
 * Example usage of the MD3 Navigation Bar component
 * This demonstrates all features including:
 * - Active state
 * - Badge notifications
 * - Keyboard navigation
 * - Top/bottom positioning
 */
export function NavigationBarExample() {
  const [activeItem, setActiveItem] = React.useState("home");

  return (
    <div className="space-y-8 p-8">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Navigation Bar - Bottom Position</h2>
        <p className="text-muted-foreground">Typical mobile navigation pattern with bottom positioning</p>
        <div className="relative border rounded-lg overflow-hidden">
          <div className="h-[400px] bg-[hsl(var(--md-sys-color-surface))] flex items-center justify-center">
            <p className="text-[hsl(var(--md-sys-color-on-surface-variant))]">Content Area</p>
          </div>
          <NavigationBar position="bottom">
            <NavigationBarItem
              icon={<LayoutDashboard />}
              label="Home"
              active={activeItem === "home"}
              onClick={() => setActiveItem("home")}
            />
            <NavigationBarItem
              icon={<Search />}
              label="Search"
              active={activeItem === "search"}
              onClick={() => setActiveItem("search")}
            />
            <NavigationBarItem
              icon={<Bell />}
              label="Notifications"
              badge={5}
              active={activeItem === "notifications"}
              onClick={() => setActiveItem("notifications")}
            />
            <NavigationBarItem
              icon={<User />}
              label="Profile"
              active={activeItem === "profile"}
              onClick={() => setActiveItem("profile")}
            />
          </NavigationBar>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Navigation Bar - Top Position</h2>
        <p className="text-muted-foreground">Alternative desktop pattern with top positioning</p>
        <div className="relative border rounded-lg overflow-hidden">
          <NavigationBar position="top">
            <NavigationBarItem
              icon={<LayoutDashboard />}
              label="Dashboard"
              active={activeItem === "home"}
              onClick={() => setActiveItem("home")}
            />
            <NavigationBarItem
              icon={<Search />}
              label="Search"
              active={activeItem === "search"}
              onClick={() => setActiveItem("search")}
            />
            <NavigationBarItem
              icon={<Bell />}
              label="Alerts"
              badge={99}
              active={activeItem === "notifications"}
              onClick={() => setActiveItem("notifications")}
            />
            <NavigationBarItem
              icon={<Settings />}
              label="Settings"
              active={activeItem === "settings"}
              onClick={() => setActiveItem("settings")}
            />
          </NavigationBar>
          <div className="h-[400px] bg-[hsl(var(--md-sys-color-surface))] flex items-center justify-center">
            <p className="text-[hsl(var(--md-sys-color-on-surface-variant))]">Content Area</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">With Large Badge Numbers</h2>
        <p className="text-muted-foreground">Badge numbers over 99 show as &quot;99+&quot;</p>
        <div className="relative border rounded-lg overflow-hidden">
          <NavigationBar position="bottom">
            <NavigationBarItem
              icon={<LayoutDashboard />}
              label="Home"
              active={activeItem === "home"}
              onClick={() => setActiveItem("home")}
            />
            <NavigationBarItem
              icon={<Bell />}
              label="Notifications"
              badge={150}
              badgeMax={99}
              active={activeItem === "notifications"}
              onClick={() => setActiveItem("notifications")}
            />
            <NavigationBarItem
              icon={<User />}
              label="Messages"
              badge={1000}
              badgeMax={999}
              active={activeItem === "messages"}
              onClick={() => setActiveItem("messages")}
            />
          </NavigationBar>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Keyboard Navigation</h2>
        <p className="text-muted-foreground">Try using Tab, Arrow keys, Home, and End to navigate</p>
        <div className="p-4 bg-[hsl(var(--md-sys-color-surface-container))] rounded-lg">
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>
              <kbd className="px-2 py-1 bg-[hsl(var(--md-sys-color-surface))] rounded">Tab</kbd> - Focus next item
            </li>
            <li>
              <kbd className="px-2 py-1 bg-[hsl(var(--md-sys-color-surface))] rounded">Arrow Left/Up</kbd> - Previous
              item
            </li>
            <li>
              <kbd className="px-2 py-1 bg-[hsl(var(--md-sys-color-surface))] rounded">Arrow Right/Down</kbd> - Next
              item
            </li>
            <li>
              <kbd className="px-2 py-1 bg-[hsl(var(--md-sys-color-surface))] rounded">Home</kbd> - First item
            </li>
            <li>
              <kbd className="px-2 py-1 bg-[hsl(var(--md-sys-color-surface))] rounded">End</kbd> - Last item
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
