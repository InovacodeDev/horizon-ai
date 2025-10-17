"use client";

import * as React from "react";
import {
  NavigationDrawer,
  NavigationDrawerHeader,
  NavigationDrawerContent,
  NavigationDrawerFooter,
  NavigationDrawerItem,
  NavigationDrawerSection,
} from "@/components/ui/navigation-drawer";
import { Button } from "@/components/ui/button";
import { Home, Search, Settings, User, Bell, HelpCircle, Shield, Palette, Globe, Menu } from "lucide-react";

/**
 * Example: Modal Navigation Drawer
 *
 * Demonstrates a modal drawer with backdrop that overlays the content.
 * Width: 256px, Elevation: Level 1
 */
export function ModalNavigationDrawerExample() {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="p-8">
      <Button onClick={() => setOpen(true)} icon={<Menu />}>
        Open Modal Drawer
      </Button>

      <NavigationDrawer open={open} onOpenChange={setOpen} variant="modal">
        <NavigationDrawerHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[hsl(var(--md-sys-color-primary))] flex items-center justify-center text-[hsl(var(--md-sys-color-on-primary))]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium">John Doe</p>
              <p className="text-xs text-[hsl(var(--md-sys-color-on-surface-variant))]">john@example.com</p>
            </div>
          </div>
        </NavigationDrawerHeader>

        <NavigationDrawerContent>
          <NavigationDrawerItem icon={<Home />} label="Home" active onClick={() => console.log("Home")} />
          <NavigationDrawerItem icon={<Search />} label="Search" onClick={() => console.log("Search")} />
          <NavigationDrawerItem
            icon={<Bell />}
            label="Notifications"
            badge={5}
            onClick={() => console.log("Notifications")}
          />

          <NavigationDrawerSection label="Settings" icon={<Settings />}>
            <NavigationDrawerItem icon={<User />} label="Profile" onClick={() => console.log("Profile")} />
            <NavigationDrawerItem icon={<Shield />} label="Security" onClick={() => console.log("Security")} />
            <NavigationDrawerItem icon={<Palette />} label="Appearance" onClick={() => console.log("Appearance")} />
            <NavigationDrawerItem
              icon={<Globe />}
              label="Language"
              badge="New"
              onClick={() => console.log("Language")}
            />
          </NavigationDrawerSection>

          <NavigationDrawerItem icon={<HelpCircle />} label="Help & Support" onClick={() => console.log("Help")} />
        </NavigationDrawerContent>

        <NavigationDrawerFooter>
          <p className="text-xs text-[hsl(var(--md-sys-color-on-surface-variant))]">Version 1.0.0</p>
        </NavigationDrawerFooter>
      </NavigationDrawer>
    </div>
  );
}

/**
 * Example: Standard Navigation Drawer
 *
 * Demonstrates a persistent drawer without backdrop.
 * Width: 360px, No elevation
 */
export function StandardNavigationDrawerExample() {
  const [open, setOpen] = React.useState(true);

  return (
    <div className="flex h-screen">
      <NavigationDrawer open={open} onOpenChange={setOpen} variant="standard">
        <NavigationDrawerHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[hsl(var(--md-sys-color-primary))] flex items-center justify-center text-[hsl(var(--md-sys-color-on-primary))]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium">John Doe</p>
              <p className="text-xs text-[hsl(var(--md-sys-color-on-surface-variant))]">john@example.com</p>
            </div>
          </div>
        </NavigationDrawerHeader>

        <NavigationDrawerContent>
          <NavigationDrawerItem icon={<Home />} label="Home" active onClick={() => console.log("Home")} />
          <NavigationDrawerItem icon={<Search />} label="Search" onClick={() => console.log("Search")} />
          <NavigationDrawerItem
            icon={<Bell />}
            label="Notifications"
            badge={12}
            onClick={() => console.log("Notifications")}
          />

          <NavigationDrawerSection label="Settings" icon={<Settings />} defaultExpanded={false}>
            <NavigationDrawerItem icon={<User />} label="Profile" onClick={() => console.log("Profile")} />
            <NavigationDrawerItem icon={<Shield />} label="Security" onClick={() => console.log("Security")} />
            <NavigationDrawerItem icon={<Palette />} label="Appearance" onClick={() => console.log("Appearance")} />
          </NavigationDrawerSection>

          <NavigationDrawerItem icon={<HelpCircle />} label="Help & Support" onClick={() => console.log("Help")} />
        </NavigationDrawerContent>

        <NavigationDrawerFooter>
          <div className="flex items-center justify-between w-full">
            <p className="text-xs text-[hsl(var(--md-sys-color-on-surface-variant))]">Version 1.0.0</p>
            <Button variant="text" size="small" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </NavigationDrawerFooter>
      </NavigationDrawer>

      <div className="flex-1 p-8">
        <Button onClick={() => setOpen(!open)} icon={<Menu />}>
          Toggle Drawer
        </Button>
        <div className="mt-8">
          <h1 className="text-2xl font-bold mb-4">Main Content</h1>
          <p className="text-[hsl(var(--md-sys-color-on-surface-variant))]">
            This is the main content area. The standard drawer is persistent and doesn't overlay this content.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Example: Right-Side Navigation Drawer
 *
 * Demonstrates a drawer that appears from the right side.
 */
export function RightSideNavigationDrawerExample() {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="p-8">
      <Button onClick={() => setOpen(true)} icon={<Menu />}>
        Open Right Drawer
      </Button>

      <NavigationDrawer open={open} onOpenChange={setOpen} variant="modal" side="right">
        <NavigationDrawerHeader>
          <h2 className="text-lg font-semibold">Quick Actions</h2>
        </NavigationDrawerHeader>

        <NavigationDrawerContent>
          <NavigationDrawerItem
            icon={<Bell />}
            label="Notifications"
            badge={3}
            onClick={() => console.log("Notifications")}
          />
          <NavigationDrawerItem icon={<Settings />} label="Settings" onClick={() => console.log("Settings")} />
          <NavigationDrawerItem icon={<HelpCircle />} label="Help" onClick={() => console.log("Help")} />
        </NavigationDrawerContent>
      </NavigationDrawer>
    </div>
  );
}

/**
 * Example: Navigation Drawer with Disabled Items
 *
 * Demonstrates disabled navigation items.
 */
export function DisabledItemsNavigationDrawerExample() {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="p-8">
      <Button onClick={() => setOpen(true)} icon={<Menu />}>
        Open Drawer with Disabled Items
      </Button>

      <NavigationDrawer open={open} onOpenChange={setOpen} variant="modal">
        <NavigationDrawerHeader>
          <h2 className="text-lg font-semibold">Navigation</h2>
        </NavigationDrawerHeader>

        <NavigationDrawerContent>
          <NavigationDrawerItem icon={<Home />} label="Home" active onClick={() => console.log("Home")} />
          <NavigationDrawerItem icon={<Search />} label="Search" onClick={() => console.log("Search")} />
          <NavigationDrawerItem
            icon={<Bell />}
            label="Notifications (Coming Soon)"
            disabled
            onClick={() => console.log("Notifications")}
          />
          <NavigationDrawerItem
            icon={<Settings />}
            label="Settings (Premium)"
            disabled
            onClick={() => console.log("Settings")}
          />
        </NavigationDrawerContent>
      </NavigationDrawer>
    </div>
  );
}
