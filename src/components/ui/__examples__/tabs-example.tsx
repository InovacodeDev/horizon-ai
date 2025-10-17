"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../tabs";
import { Home, User, Settings, Mail } from "lucide-react";

/**
 * Example: Primary Tabs (Filled Indicator)
 *
 * Primary tabs use a filled pill-shaped indicator for the active tab.
 * Best for primary navigation within a section.
 */
export function PrimaryTabsExample() {
  return (
    <div className="w-full max-w-2xl p-6">
      <h3 className="text-lg font-semibold mb-4">Primary Tabs</h3>
      <Tabs defaultValue="home" className="w-full">
        <TabsList variant="primary">
          <TabsTrigger variant="primary" value="home" icon={<Home />}>
            Home
          </TabsTrigger>
          <TabsTrigger variant="primary" value="profile" icon={<User />}>
            Profile
          </TabsTrigger>
          <TabsTrigger variant="primary" value="settings" icon={<Settings />}>
            Settings
          </TabsTrigger>
          <TabsTrigger variant="primary" value="messages" icon={<Mail />} disabled>
            Messages
          </TabsTrigger>
        </TabsList>
        <TabsContent value="home">
          <div className="p-4 bg-[hsl(var(--md-sys-color-surface-container))] rounded-lg">
            <h4 className="font-semibold mb-2">Home Content</h4>
            <p className="text-[hsl(var(--md-sys-color-on-surface-variant))]">
              This is the home tab content. Primary tabs use a filled indicator that provides strong visual feedback.
            </p>
          </div>
        </TabsContent>
        <TabsContent value="profile">
          <div className="p-4 bg-[hsl(var(--md-sys-color-surface-container))] rounded-lg">
            <h4 className="font-semibold mb-2">Profile Content</h4>
            <p className="text-[hsl(var(--md-sys-color-on-surface-variant))]">
              View and edit your profile information here.
            </p>
          </div>
        </TabsContent>
        <TabsContent value="settings">
          <div className="p-4 bg-[hsl(var(--md-sys-color-surface-container))] rounded-lg">
            <h4 className="font-semibold mb-2">Settings Content</h4>
            <p className="text-[hsl(var(--md-sys-color-on-surface-variant))]">
              Manage your application settings and preferences.
            </p>
          </div>
        </TabsContent>
        <TabsContent value="messages">
          <div className="p-4 bg-[hsl(var(--md-sys-color-surface-container))] rounded-lg">
            <h4 className="font-semibold mb-2">Messages Content</h4>
            <p className="text-[hsl(var(--md-sys-color-on-surface-variant))]">
              This tab is disabled and cannot be accessed.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Example: Secondary Tabs (Underline Indicator)
 *
 * Secondary tabs use an underline indicator for the active tab.
 * Best for secondary navigation or content organization.
 */
export function SecondaryTabsExample() {
  return (
    <div className="w-full max-w-2xl p-6">
      <h3 className="text-lg font-semibold mb-4">Secondary Tabs</h3>
      <Tabs defaultValue="overview" className="w-full">
        <TabsList variant="secondary">
          <TabsTrigger variant="secondary" value="overview">
            Overview
          </TabsTrigger>
          <TabsTrigger variant="secondary" value="analytics">
            Analytics
          </TabsTrigger>
          <TabsTrigger variant="secondary" value="reports">
            Reports
          </TabsTrigger>
          <TabsTrigger variant="secondary" value="export" disabled>
            Export
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div className="p-4 bg-[hsl(var(--md-sys-color-surface-container))] rounded-lg">
            <h4 className="font-semibold mb-2">Overview</h4>
            <p className="text-[hsl(var(--md-sys-color-on-surface-variant))]">
              Secondary tabs use an underline indicator for a more subtle appearance.
            </p>
          </div>
        </TabsContent>
        <TabsContent value="analytics">
          <div className="p-4 bg-[hsl(var(--md-sys-color-surface-container))] rounded-lg">
            <h4 className="font-semibold mb-2">Analytics</h4>
            <p className="text-[hsl(var(--md-sys-color-on-surface-variant))]">
              View detailed analytics and metrics here.
            </p>
          </div>
        </TabsContent>
        <TabsContent value="reports">
          <div className="p-4 bg-[hsl(var(--md-sys-color-surface-container))] rounded-lg">
            <h4 className="font-semibold mb-2">Reports</h4>
            <p className="text-[hsl(var(--md-sys-color-on-surface-variant))]">
              Generate and view reports from your data.
            </p>
          </div>
        </TabsContent>
        <TabsContent value="export">
          <div className="p-4 bg-[hsl(var(--md-sys-color-surface-container))] rounded-lg">
            <h4 className="font-semibold mb-2">Export</h4>
            <p className="text-[hsl(var(--md-sys-color-on-surface-variant))]">
              This tab is disabled and cannot be accessed.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Example: Tabs with Icons Only
 *
 * Tabs can display icons without labels for a more compact layout.
 */
export function IconTabsExample() {
  return (
    <div className="w-full max-w-2xl p-6">
      <h3 className="text-lg font-semibold mb-4">Icon-Only Tabs</h3>
      <Tabs defaultValue="home" className="w-full">
        <TabsList variant="primary">
          <TabsTrigger variant="primary" value="home" icon={<Home />} aria-label="Home" />
          <TabsTrigger variant="primary" value="profile" icon={<User />} aria-label="Profile" />
          <TabsTrigger variant="primary" value="settings" icon={<Settings />} aria-label="Settings" />
          <TabsTrigger variant="primary" value="messages" icon={<Mail />} aria-label="Messages" disabled />
        </TabsList>
        <TabsContent value="home">
          <div className="p-4 bg-[hsl(var(--md-sys-color-surface-container))] rounded-lg">
            <h4 className="font-semibold mb-2">Home</h4>
            <p className="text-[hsl(var(--md-sys-color-on-surface-variant))]">
              Icon-only tabs are useful when space is limited.
            </p>
          </div>
        </TabsContent>
        <TabsContent value="profile">
          <div className="p-4 bg-[hsl(var(--md-sys-color-surface-container))] rounded-lg">
            <h4 className="font-semibold mb-2">Profile</h4>
            <p className="text-[hsl(var(--md-sys-color-on-surface-variant))]">Profile content.</p>
          </div>
        </TabsContent>
        <TabsContent value="settings">
          <div className="p-4 bg-[hsl(var(--md-sys-color-surface-container))] rounded-lg">
            <h4 className="font-semibold mb-2">Settings</h4>
            <p className="text-[hsl(var(--md-sys-color-on-surface-variant))]">Settings content.</p>
          </div>
        </TabsContent>
        <TabsContent value="messages">
          <div className="p-4 bg-[hsl(var(--md-sys-color-surface-container))] rounded-lg">
            <h4 className="font-semibold mb-2">Messages</h4>
            <p className="text-[hsl(var(--md-sys-color-on-surface-variant))]">Messages content.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Example: Controlled Tabs
 *
 * Tabs can be controlled externally for programmatic navigation.
 */
export function ControlledTabsExample() {
  const [activeTab, setActiveTab] = React.useState("tab1");

  return (
    <div className="w-full max-w-2xl p-6">
      <h3 className="text-lg font-semibold mb-4">Controlled Tabs</h3>
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setActiveTab("tab1")}
          className="px-4 py-2 bg-[hsl(var(--md-sys-color-primary))] text-[hsl(var(--md-sys-color-on-primary))] rounded"
        >
          Go to Tab 1
        </button>
        <button
          onClick={() => setActiveTab("tab2")}
          className="px-4 py-2 bg-[hsl(var(--md-sys-color-primary))] text-[hsl(var(--md-sys-color-on-primary))] rounded"
        >
          Go to Tab 2
        </button>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList variant="secondary">
          <TabsTrigger variant="secondary" value="tab1">
            Tab 1
          </TabsTrigger>
          <TabsTrigger variant="secondary" value="tab2">
            Tab 2
          </TabsTrigger>
          <TabsTrigger variant="secondary" value="tab3">
            Tab 3
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">
          <div className="p-4 bg-[hsl(var(--md-sys-color-surface-container))] rounded-lg">
            <h4 className="font-semibold mb-2">Tab 1 Content</h4>
            <p className="text-[hsl(var(--md-sys-color-on-surface-variant))]">
              This tab is controlled externally. Current tab: {activeTab}
            </p>
          </div>
        </TabsContent>
        <TabsContent value="tab2">
          <div className="p-4 bg-[hsl(var(--md-sys-color-surface-container))] rounded-lg">
            <h4 className="font-semibold mb-2">Tab 2 Content</h4>
            <p className="text-[hsl(var(--md-sys-color-on-surface-variant))]">
              This tab is controlled externally. Current tab: {activeTab}
            </p>
          </div>
        </TabsContent>
        <TabsContent value="tab3">
          <div className="p-4 bg-[hsl(var(--md-sys-color-surface-container))] rounded-lg">
            <h4 className="font-semibold mb-2">Tab 3 Content</h4>
            <p className="text-[hsl(var(--md-sys-color-on-surface-variant))]">
              This tab is controlled externally. Current tab: {activeTab}
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
