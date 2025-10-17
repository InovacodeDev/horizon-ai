"use client";

import * as React from "react";
import {
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
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuRadioGroup,
} from "@/components/ui/menu";
import { Button } from "@/components/ui/button";
import {
  User,
  Settings,
  LogOut,
  Mail,
  MessageSquare,
  PlusCircle,
  UserPlus,
  Github,
  LifeBuoy,
  Cloud,
  CreditCard,
  Keyboard,
} from "lucide-react";

/**
 * Basic Menu Example
 *
 * Demonstrates a simple menu with items and icons.
 */
export function BasicMenuExample() {
  return (
    <Menu>
      <MenuTrigger asChild>
        <Button variant="outlined">Open Menu</Button>
      </MenuTrigger>
      <MenuContent>
        <MenuItem icon={<User />}>
          Profile
          <MenuShortcut>⇧⌘P</MenuShortcut>
        </MenuItem>
        <MenuItem icon={<Settings />}>
          Settings
          <MenuShortcut>⌘S</MenuShortcut>
        </MenuItem>
        <MenuSeparator />
        <MenuItem icon={<LogOut />}>Log out</MenuItem>
      </MenuContent>
    </Menu>
  );
}

/**
 * Menu with Sections Example
 *
 * Demonstrates a menu with labeled sections and dividers.
 */
export function MenuWithSectionsExample() {
  return (
    <Menu>
      <MenuTrigger asChild>
        <Button variant="outlined">Actions</Button>
      </MenuTrigger>
      <MenuContent className="w-56">
        <MenuLabel>My Account</MenuLabel>
        <MenuSeparator />
        <MenuGroup>
          <MenuItem icon={<User />}>Profile</MenuItem>
          <MenuItem icon={<CreditCard />}>Billing</MenuItem>
          <MenuItem icon={<Settings />}>Settings</MenuItem>
          <MenuItem icon={<Keyboard />}>Keyboard shortcuts</MenuItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuLabel>Support</MenuLabel>
        <MenuSeparator />
        <MenuGroup>
          <MenuItem icon={<LifeBuoy />}>Support</MenuItem>
          <MenuItem icon={<Cloud />}>API</MenuItem>
          <MenuItem icon={<Github />}>GitHub</MenuItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuItem icon={<LogOut />}>Log out</MenuItem>
      </MenuContent>
    </Menu>
  );
}

/**
 * Menu with Checkboxes Example
 *
 * Demonstrates checkbox menu items for toggling options.
 */
export function MenuWithCheckboxesExample() {
  const [showStatusBar, setShowStatusBar] = React.useState(true);
  const [showActivityBar, setShowActivityBar] = React.useState(false);
  const [showPanel, setShowPanel] = React.useState(false);

  return (
    <Menu>
      <MenuTrigger asChild>
        <Button variant="outlined">View Options</Button>
      </MenuTrigger>
      <MenuContent className="w-56">
        <MenuLabel>Appearance</MenuLabel>
        <MenuSeparator />
        <MenuCheckboxItem checked={showStatusBar} onCheckedChange={setShowStatusBar}>
          Status Bar
        </MenuCheckboxItem>
        <MenuCheckboxItem checked={showActivityBar} onCheckedChange={setShowActivityBar}>
          Activity Bar
        </MenuCheckboxItem>
        <MenuCheckboxItem checked={showPanel} onCheckedChange={setShowPanel}>
          Panel
        </MenuCheckboxItem>
      </MenuContent>
    </Menu>
  );
}

/**
 * Menu with Radio Group Example
 *
 * Demonstrates radio menu items for selecting one option from a group.
 */
export function MenuWithRadioGroupExample() {
  const [position, setPosition] = React.useState("bottom");

  return (
    <Menu>
      <MenuTrigger asChild>
        <Button variant="outlined">Panel Position</Button>
      </MenuTrigger>
      <MenuContent className="w-56">
        <MenuLabel>Panel Position</MenuLabel>
        <MenuSeparator />
        <MenuRadioGroup value={position} onValueChange={setPosition}>
          <MenuRadioItem value="top">Top</MenuRadioItem>
          <MenuRadioItem value="bottom">Bottom</MenuRadioItem>
          <MenuRadioItem value="right">Right</MenuRadioItem>
        </MenuRadioGroup>
      </MenuContent>
    </Menu>
  );
}

/**
 * Menu with Submenu Example
 *
 * Demonstrates nested submenus.
 */
export function MenuWithSubmenuExample() {
  return (
    <Menu>
      <MenuTrigger asChild>
        <Button variant="outlined">More Options</Button>
      </MenuTrigger>
      <MenuContent className="w-56">
        <MenuItem icon={<Mail />}>Email</MenuItem>
        <MenuItem icon={<MessageSquare />}>Message</MenuItem>
        <MenuSeparator />
        <MenuSub>
          <MenuSubTrigger>
            <UserPlus className="mr-2 h-4 w-4" />
            <span>Invite users</span>
          </MenuSubTrigger>
          <MenuSubContent>
            <MenuItem icon={<Mail />}>Email</MenuItem>
            <MenuItem icon={<MessageSquare />}>Message</MenuItem>
            <MenuSeparator />
            <MenuItem icon={<PlusCircle />}>More...</MenuItem>
          </MenuSubContent>
        </MenuSub>
        <MenuSeparator />
        <MenuItem icon={<Github />}>GitHub</MenuItem>
        <MenuItem icon={<LifeBuoy />}>Support</MenuItem>
        <MenuItem disabled icon={<Cloud />}>
          API (Coming Soon)
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

/**
 * Menu with Disabled Items Example
 *
 * Demonstrates disabled menu items.
 */
export function MenuWithDisabledItemsExample() {
  return (
    <Menu>
      <MenuTrigger asChild>
        <Button variant="outlined">File</Button>
      </MenuTrigger>
      <MenuContent className="w-56">
        <MenuItem icon={<PlusCircle />}>
          New File
          <MenuShortcut>⌘N</MenuShortcut>
        </MenuItem>
        <MenuItem icon={<User />}>
          New Window
          <MenuShortcut>⇧⌘N</MenuShortcut>
        </MenuItem>
        <MenuItem disabled icon={<Settings />}>
          New Private Window
          <MenuShortcut>⇧⌘P</MenuShortcut>
        </MenuItem>
        <MenuSeparator />
        <MenuItem icon={<Cloud />}>
          Save
          <MenuShortcut>⌘S</MenuShortcut>
        </MenuItem>
        <MenuItem disabled icon={<CreditCard />}>
          Save As...
          <MenuShortcut>⇧⌘S</MenuShortcut>
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

/**
 * Complete Menu Example
 *
 * Demonstrates all menu features together.
 */
export function CompleteMenuExample() {
  const [showBookmarks, setShowBookmarks] = React.useState(true);
  const [showFullUrls, setShowFullUrls] = React.useState(false);
  const [person, setPerson] = React.useState("pedro");

  return (
    <div className="flex flex-col gap-4 p-8">
      <h2 className="text-2xl font-bold">MD3 Menu Component Examples</h2>

      <div className="flex flex-wrap gap-4">
        <div>
          <h3 className="text-sm font-medium mb-2">Basic Menu</h3>
          <BasicMenuExample />
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Menu with Sections</h3>
          <MenuWithSectionsExample />
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Menu with Checkboxes</h3>
          <MenuWithCheckboxesExample />
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Menu with Radio Group</h3>
          <MenuWithRadioGroupExample />
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Menu with Submenu</h3>
          <MenuWithSubmenuExample />
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Menu with Disabled Items</h3>
          <MenuWithDisabledItemsExample />
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Complex Menu Example</h3>
        <Menu>
          <MenuTrigger asChild>
            <Button variant="filled">Open Complex Menu</Button>
          </MenuTrigger>
          <MenuContent className="w-64">
            <MenuLabel>Application</MenuLabel>
            <MenuSeparator />
            <MenuGroup>
              <MenuItem icon={<Settings />}>
                Settings
                <MenuShortcut>⌘,</MenuShortcut>
              </MenuItem>
              <MenuSub>
                <MenuSubTrigger>
                  <User className="mr-2 h-4 w-4" />
                  <span>Switch Account</span>
                </MenuSubTrigger>
                <MenuSubContent>
                  <MenuRadioGroup value={person} onValueChange={setPerson}>
                    <MenuRadioItem value="pedro">Pedro Duarte</MenuRadioItem>
                    <MenuRadioItem value="colm">Colm Tuite</MenuRadioItem>
                  </MenuRadioGroup>
                </MenuSubContent>
              </MenuSub>
            </MenuGroup>
            <MenuSeparator />
            <MenuLabel>View</MenuLabel>
            <MenuSeparator />
            <MenuCheckboxItem checked={showBookmarks} onCheckedChange={setShowBookmarks}>
              Show Bookmarks
              <MenuShortcut>⌘B</MenuShortcut>
            </MenuCheckboxItem>
            <MenuCheckboxItem checked={showFullUrls} onCheckedChange={setShowFullUrls}>
              Show Full URLs
            </MenuCheckboxItem>
            <MenuSeparator />
            <MenuItem icon={<LogOut />}>
              Log out
              <MenuShortcut>⇧⌘Q</MenuShortcut>
            </MenuItem>
          </MenuContent>
        </Menu>
      </div>
    </div>
  );
}
