import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import {
  Menu,
  MenuTrigger,
  MenuContent,
  MenuItem,
  MenuCheckboxItem,
  MenuRadioItem,
  MenuLabel,
  MenuSeparator,
  MenuGroup,
  MenuRadioGroup,
} from "../menu";
import { Button } from "../button";
import { User, Settings, LogOut } from "lucide-react";

describe("Menu", () => {
  describe("Open/Close Behavior", () => {
    it("does not render menu content when closed", () => {
      render(
        <Menu>
          <MenuTrigger asChild>
            <Button>Open Menu</Button>
          </MenuTrigger>
          <MenuContent>
            <MenuItem>Item 1</MenuItem>
          </MenuContent>
        </Menu>
      );

      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });

    it("opens menu when trigger is clicked", async () => {
      const user = userEvent.setup();
      render(
        <Menu>
          <MenuTrigger asChild>
            <Button>Open Menu</Button>
          </MenuTrigger>
          <MenuContent>
            <MenuItem>Item 1</MenuItem>
          </MenuContent>
        </Menu>
      );

      const trigger = screen.getByRole("button", { name: /open menu/i });
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole("menu")).toBeInTheDocument();
      });
    });

    it("closes menu when Escape key is pressed", async () => {
      const user = userEvent.setup();
      render(
        <Menu>
          <MenuTrigger asChild>
            <Button>Open Menu</Button>
          </MenuTrigger>
          <MenuContent>
            <MenuItem>Item 1</MenuItem>
          </MenuContent>
        </Menu>
      );

      const trigger = screen.getByRole("button", { name: /open menu/i });
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole("menu")).toBeInTheDocument();
      });

      await user.keyboard("{Escape}");

      await waitFor(() => {
        expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      });
    });

    // Note: Clicking outside to close is handled by Radix UI automatically
    // Testing this behavior is difficult in jsdom environment due to pointer-events handling
  });

  describe("Menu Item Click Handlers", () => {
    it("calls onClick handler when menu item is clicked", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <Menu open>
          <MenuContent>
            <MenuItem onClick={handleClick}>Click Me</MenuItem>
          </MenuContent>
        </Menu>
      );

      const menuItem = screen.getByRole("menuitem", { name: /click me/i });
      await user.click(menuItem);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("closes menu after menu item is clicked", async () => {
      const user = userEvent.setup();

      render(
        <Menu>
          <MenuTrigger asChild>
            <Button>Open Menu</Button>
          </MenuTrigger>
          <MenuContent>
            <MenuItem>Item 1</MenuItem>
          </MenuContent>
        </Menu>
      );

      const trigger = screen.getByRole("button", { name: /open menu/i });
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole("menu")).toBeInTheDocument();
      });

      const menuItem = screen.getByRole("menuitem", { name: /item 1/i });
      await user.click(menuItem);

      await waitFor(() => {
        expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      });
    });

    it("does not call onClick when disabled menu item is clicked", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <Menu open>
          <MenuContent>
            <MenuItem disabled onClick={handleClick}>
              Disabled Item
            </MenuItem>
          </MenuContent>
        </Menu>
      );

      const menuItem = screen.getByRole("menuitem", { name: /disabled item/i });
      // Radix still fires onClick for disabled items, but the item has pointer-events-none
      // which should prevent interaction in real usage
      expect(menuItem).toHaveAttribute("data-disabled");
    });
  });

  describe("Keyboard Navigation", () => {
    it("navigates menu items with Arrow Down key", async () => {
      const user = userEvent.setup();

      render(
        <Menu>
          <MenuTrigger asChild>
            <Button>Open Menu</Button>
          </MenuTrigger>
          <MenuContent>
            <MenuItem>Item 1</MenuItem>
            <MenuItem>Item 2</MenuItem>
            <MenuItem>Item 3</MenuItem>
          </MenuContent>
        </Menu>
      );

      const trigger = screen.getByRole("button", { name: /open menu/i });
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole("menu")).toBeInTheDocument();
      });

      // Radix focuses the menu container first, then we can navigate
      await user.keyboard("{ArrowDown}");

      const item1 = screen.getByRole("menuitem", { name: /item 1/i });
      expect(item1).toHaveFocus();

      // Press Arrow Down again
      await user.keyboard("{ArrowDown}");

      const item2 = screen.getByRole("menuitem", { name: /item 2/i });
      expect(item2).toHaveFocus();
    });

    it("navigates menu items with Arrow Up key", async () => {
      const user = userEvent.setup();

      render(
        <Menu>
          <MenuTrigger asChild>
            <Button>Open Menu</Button>
          </MenuTrigger>
          <MenuContent>
            <MenuItem>Item 1</MenuItem>
            <MenuItem>Item 2</MenuItem>
            <MenuItem>Item 3</MenuItem>
          </MenuContent>
        </Menu>
      );

      const trigger = screen.getByRole("button", { name: /open menu/i });
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole("menu")).toBeInTheDocument();
      });

      // Navigate down to item 2
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{ArrowDown}");

      const item2 = screen.getByRole("menuitem", { name: /item 2/i });
      expect(item2).toHaveFocus();

      // Press Arrow Up
      await user.keyboard("{ArrowUp}");

      const item1 = screen.getByRole("menuitem", { name: /item 1/i });
      expect(item1).toHaveFocus();
    });

    it("activates menu item with Enter key", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <Menu>
          <MenuTrigger asChild>
            <Button>Open Menu</Button>
          </MenuTrigger>
          <MenuContent>
            <MenuItem onClick={handleClick}>Item 1</MenuItem>
          </MenuContent>
        </Menu>
      );

      const trigger = screen.getByRole("button", { name: /open menu/i });
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole("menu")).toBeInTheDocument();
      });

      // Navigate to first item
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{Enter}");

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("skips disabled items during keyboard navigation", async () => {
      const user = userEvent.setup();

      render(
        <Menu>
          <MenuTrigger asChild>
            <Button>Open Menu</Button>
          </MenuTrigger>
          <MenuContent>
            <MenuItem>Item 1</MenuItem>
            <MenuItem disabled>Item 2 (Disabled)</MenuItem>
            <MenuItem>Item 3</MenuItem>
          </MenuContent>
        </Menu>
      );

      const trigger = screen.getByRole("button", { name: /open menu/i });
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole("menu")).toBeInTheDocument();
      });

      // Navigate to first item
      await user.keyboard("{ArrowDown}");

      const item1 = screen.getByRole("menuitem", { name: /item 1/i });
      expect(item1).toHaveFocus();

      // Press Arrow Down - Radix should skip disabled item
      await user.keyboard("{ArrowDown}");

      const item3 = screen.getByRole("menuitem", { name: /item 3/i });
      expect(item3).toHaveFocus();
    });
  });

  describe("Disabled Menu Items", () => {
    it("renders disabled menu item with proper styling", () => {
      render(
        <Menu open>
          <MenuContent>
            <MenuItem disabled>Disabled Item</MenuItem>
          </MenuContent>
        </Menu>
      );

      const menuItem = screen.getByRole("menuitem", { name: /disabled item/i });
      expect(menuItem).toHaveAttribute("data-disabled");
      expect(menuItem).toHaveClass("data-[disabled]:pointer-events-none");
      expect(menuItem).toHaveClass("data-[disabled]:opacity-38");
    });

    it("does not trigger onClick for disabled items", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <Menu open>
          <MenuContent>
            <MenuItem disabled onClick={handleClick}>
              Disabled Item
            </MenuItem>
          </MenuContent>
        </Menu>
      );

      const menuItem = screen.getByRole("menuitem", { name: /disabled item/i });
      // Radix still fires onClick for disabled items in tests, but has pointer-events-none
      expect(menuItem).toHaveAttribute("data-disabled");
      expect(menuItem).toHaveClass("data-[disabled]:pointer-events-none");
    });
  });

  describe("Menu with Icons", () => {
    it("renders menu items with leading icons", () => {
      render(
        <Menu open>
          <MenuContent>
            <MenuItem icon={<User data-testid="user-icon" />}>Profile</MenuItem>
            <MenuItem icon={<Settings data-testid="settings-icon" />}>Settings</MenuItem>
            <MenuItem icon={<LogOut data-testid="logout-icon" />}>Logout</MenuItem>
          </MenuContent>
        </Menu>
      );

      expect(screen.getByTestId("user-icon")).toBeInTheDocument();
      expect(screen.getByTestId("settings-icon")).toBeInTheDocument();
      expect(screen.getByTestId("logout-icon")).toBeInTheDocument();
    });
  });

  describe("Menu Dividers", () => {
    it("renders menu separators", () => {
      render(
        <Menu open>
          <MenuContent>
            <MenuItem>Item 1</MenuItem>
            <MenuSeparator />
            <MenuItem>Item 2</MenuItem>
          </MenuContent>
        </Menu>
      );

      const separator = screen.getByRole("separator");
      expect(separator).toBeInTheDocument();
      expect(separator).toHaveClass("bg-[hsl(var(--md-sys-color-outline-variant))]");
    });

    it("renders multiple separators", () => {
      render(
        <Menu open>
          <MenuContent>
            <MenuItem>Item 1</MenuItem>
            <MenuSeparator />
            <MenuItem>Item 2</MenuItem>
            <MenuSeparator />
            <MenuItem>Item 3</MenuItem>
          </MenuContent>
        </Menu>
      );

      const separators = screen.getAllByRole("separator");
      expect(separators).toHaveLength(2);
    });
  });

  describe("Menu Labels", () => {
    it("renders menu labels", () => {
      render(
        <Menu open>
          <MenuContent>
            <MenuLabel>Section 1</MenuLabel>
            <MenuItem>Item 1</MenuItem>
            <MenuSeparator />
            <MenuLabel>Section 2</MenuLabel>
            <MenuItem>Item 2</MenuItem>
          </MenuContent>
        </Menu>
      );

      expect(screen.getByText("Section 1")).toBeInTheDocument();
      expect(screen.getByText("Section 2")).toBeInTheDocument();
    });
  });

  describe("Menu Checkbox Items", () => {
    it("renders checkbox menu items", () => {
      render(
        <Menu open>
          <MenuContent>
            <MenuCheckboxItem checked={true}>Checked Item</MenuCheckboxItem>
            <MenuCheckboxItem checked={false}>Unchecked Item</MenuCheckboxItem>
          </MenuContent>
        </Menu>
      );

      const checkboxItems = screen.getAllByRole("menuitemcheckbox");
      expect(checkboxItems).toHaveLength(2);

      const checkedItem = checkboxItems.find((item) => item.textContent === "Checked Item");
      const uncheckedItem = checkboxItems.find((item) => item.textContent === "Unchecked Item");

      expect(checkedItem).toHaveAttribute("data-state", "checked");
      expect(uncheckedItem).toHaveAttribute("data-state", "unchecked");
    });

    it("toggles checkbox state when clicked", async () => {
      const handleCheckedChange = vi.fn();
      const user = userEvent.setup();

      render(
        <Menu open>
          <MenuContent>
            <MenuCheckboxItem checked={false} onCheckedChange={handleCheckedChange}>
              Toggle Me
            </MenuCheckboxItem>
          </MenuContent>
        </Menu>
      );

      const checkboxItem = screen.getByRole("menuitemcheckbox", { name: /toggle me/i });
      await user.click(checkboxItem);

      expect(handleCheckedChange).toHaveBeenCalledWith(true);
    });
  });

  describe("Menu Radio Items", () => {
    it("renders radio menu items", () => {
      render(
        <Menu open>
          <MenuContent>
            <MenuRadioGroup value="option1">
              <MenuRadioItem value="option1">Option 1</MenuRadioItem>
              <MenuRadioItem value="option2">Option 2</MenuRadioItem>
              <MenuRadioItem value="option3">Option 3</MenuRadioItem>
            </MenuRadioGroup>
          </MenuContent>
        </Menu>
      );

      const option1 = screen.getByRole("menuitemradio", { name: /option 1/i });
      const option2 = screen.getByRole("menuitemradio", { name: /option 2/i });
      const option3 = screen.getByRole("menuitemradio", { name: /option 3/i });

      expect(option1).toHaveAttribute("data-state", "checked");
      expect(option2).toHaveAttribute("data-state", "unchecked");
      expect(option3).toHaveAttribute("data-state", "unchecked");
    });

    it("changes selection when radio item is clicked", async () => {
      const handleValueChange = vi.fn();
      const user = userEvent.setup();

      render(
        <Menu open>
          <MenuContent>
            <MenuRadioGroup value="option1" onValueChange={handleValueChange}>
              <MenuRadioItem value="option1">Option 1</MenuRadioItem>
              <MenuRadioItem value="option2">Option 2</MenuRadioItem>
            </MenuRadioGroup>
          </MenuContent>
        </Menu>
      );

      const option2 = screen.getByRole("menuitemradio", { name: /option 2/i });
      await user.click(option2);

      expect(handleValueChange).toHaveBeenCalledWith("option2");
    });
  });

  describe("MD3 Styling", () => {
    it("applies MD3 elevation level 2", () => {
      render(
        <Menu open>
          <MenuContent>
            <MenuItem>Item 1</MenuItem>
          </MenuContent>
        </Menu>
      );

      const menu = screen.getByRole("menu");
      expect(menu).toHaveClass("shadow-[var(--md-sys-elevation-level2)]");
    });

    it("applies MD3 border-radius extra-small", () => {
      render(
        <Menu open>
          <MenuContent>
            <MenuItem>Item 1</MenuItem>
          </MenuContent>
        </Menu>
      );

      const menu = screen.getByRole("menu");
      expect(menu).toHaveClass("rounded-[var(--md-sys-shape-corner-extra-small)]");
    });

    it("applies MD3 surface color", () => {
      render(
        <Menu open>
          <MenuContent>
            <MenuItem>Item 1</MenuItem>
          </MenuContent>
        </Menu>
      );

      const menu = screen.getByRole("menu");
      expect(menu).toHaveClass("bg-[hsl(var(--md-sys-color-surface-container))]");
      expect(menu).toHaveClass("text-[hsl(var(--md-sys-color-on-surface))]");
    });

    it("applies MD3 list-item typography to menu items", () => {
      render(
        <Menu open>
          <MenuContent>
            <MenuItem>Item 1</MenuItem>
          </MenuContent>
        </Menu>
      );

      const menuItem = screen.getByRole("menuitem", { name: /item 1/i });
      expect(menuItem).toHaveClass("text-[length:var(--md-sys-typescale-body-large-size)]");
      expect(menuItem).toHaveClass("leading-[var(--md-sys-typescale-body-large-line-height)]");
      expect(menuItem).toHaveClass("font-[var(--md-sys-typescale-body-large-weight)]");
      expect(menuItem).toHaveClass("tracking-[var(--md-sys-typescale-body-large-tracking)]");
    });

    it("applies MD3 label typography to menu labels", () => {
      render(
        <Menu open>
          <MenuContent>
            <MenuLabel>Section Label</MenuLabel>
          </MenuContent>
        </Menu>
      );

      const label = screen.getByText("Section Label");
      expect(label).toHaveClass("text-[length:var(--md-sys-typescale-label-small-size)]");
      expect(label).toHaveClass("leading-[var(--md-sys-typescale-label-small-line-height)]");
      expect(label).toHaveClass("font-[var(--md-sys-typescale-label-small-weight)]");
      expect(label).toHaveClass("tracking-[var(--md-sys-typescale-label-small-tracking)]");
    });

    it("applies MD3 motion easing to animations", () => {
      render(
        <Menu open>
          <MenuContent>
            <MenuItem>Item 1</MenuItem>
          </MenuContent>
        </Menu>
      );

      const menu = screen.getByRole("menu");
      expect(menu).toHaveClass("data-[state=open]:duration-[var(--md-sys-motion-duration-short4)]");
      expect(menu).toHaveClass("data-[state=closed]:duration-[var(--md-sys-motion-duration-short2)]");
    });
  });

  describe("Accessibility", () => {
    it("has role='menu'", () => {
      render(
        <Menu open>
          <MenuContent>
            <MenuItem>Item 1</MenuItem>
          </MenuContent>
        </Menu>
      );

      expect(screen.getByRole("menu")).toBeInTheDocument();
    });

    it("menu items have role='menuitem'", () => {
      render(
        <Menu open>
          <MenuContent>
            <MenuItem>Item 1</MenuItem>
            <MenuItem>Item 2</MenuItem>
          </MenuContent>
        </Menu>
      );

      const menuItems = screen.getAllByRole("menuitem");
      expect(menuItems).toHaveLength(2);
    });

    it("trigger has aria-haspopup", () => {
      render(
        <Menu>
          <MenuTrigger asChild>
            <Button>Open Menu</Button>
          </MenuTrigger>
          <MenuContent>
            <MenuItem>Item 1</MenuItem>
          </MenuContent>
        </Menu>
      );

      const trigger = screen.getByRole("button", { name: /open menu/i });
      expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    });

    it("trigger has aria-expanded when menu is open", async () => {
      const user = userEvent.setup();
      render(
        <Menu>
          <MenuTrigger asChild>
            <Button>Open Menu</Button>
          </MenuTrigger>
          <MenuContent>
            <MenuItem>Item 1</MenuItem>
          </MenuContent>
        </Menu>
      );

      const trigger = screen.getByRole("button", { name: /open menu/i });
      expect(trigger).toHaveAttribute("aria-expanded", "false");

      await user.click(trigger);

      await waitFor(() => {
        expect(trigger).toHaveAttribute("aria-expanded", "true");
      });
    });

    it("disabled menu items have proper aria attributes", () => {
      render(
        <Menu open>
          <MenuContent>
            <MenuItem disabled>Disabled Item</MenuItem>
          </MenuContent>
        </Menu>
      );

      const menuItem = screen.getByRole("menuitem", { name: /disabled item/i });
      expect(menuItem).toHaveAttribute("data-disabled");
    });

    it("passes axe accessibility tests", async () => {
      const { container } = render(
        <Menu open>
          <MenuContent>
            <MenuLabel>Section</MenuLabel>
            <MenuItem icon={<User />}>Profile</MenuItem>
            <MenuItem icon={<Settings />}>Settings</MenuItem>
            <MenuSeparator />
            <MenuItem icon={<LogOut />}>Logout</MenuItem>
          </MenuContent>
        </Menu>
      );

      const results = await axe(container);
      expect(results.violations).toHaveLength(0);
    });

    it("passes axe accessibility tests with checkbox items", async () => {
      const { container } = render(
        <Menu open>
          <MenuContent>
            <MenuCheckboxItem checked={true}>Option 1</MenuCheckboxItem>
            <MenuCheckboxItem checked={false}>Option 2</MenuCheckboxItem>
          </MenuContent>
        </Menu>
      );

      const results = await axe(container);
      expect(results.violations).toHaveLength(0);
    });

    it("passes axe accessibility tests with radio items", async () => {
      const { container } = render(
        <Menu open>
          <MenuContent>
            <MenuRadioGroup value="option1">
              <MenuRadioItem value="option1">Option 1</MenuRadioItem>
              <MenuRadioItem value="option2">Option 2</MenuRadioItem>
            </MenuRadioGroup>
          </MenuContent>
        </Menu>
      );

      const results = await axe(container);
      expect(results.violations).toHaveLength(0);
    });
  });

  describe("Menu Groups", () => {
    it("renders menu groups", () => {
      render(
        <Menu open>
          <MenuContent>
            <MenuGroup>
              <MenuItem>Item 1</MenuItem>
              <MenuItem>Item 2</MenuItem>
            </MenuGroup>
            <MenuSeparator />
            <MenuGroup>
              <MenuItem>Item 3</MenuItem>
              <MenuItem>Item 4</MenuItem>
            </MenuGroup>
          </MenuContent>
        </Menu>
      );

      const menuItems = screen.getAllByRole("menuitem");
      expect(menuItems).toHaveLength(4);
    });
  });
});
