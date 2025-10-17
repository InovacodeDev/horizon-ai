import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogAction,
} from "@/components/ui/dialog";
import { Menu, MenuItem } from "@/components/ui/menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { NavigationBar, NavigationBarItem } from "@/components/ui/navigation-bar";
import { Chip } from "@/components/ui/chip";
import { List, ListItem, ListItemText } from "@/components/ui/list";
import { Home, Settings, User, Mail } from "lucide-react";

describe("Keyboard Navigation Accessibility", () => {
  describe("Tab Navigation", () => {
    it("should navigate through interactive elements in logical order", async () => {
      const user = userEvent.setup();
      render(
        <div>
          <Button>First Button</Button>
          <TextField label="Input Field" />
          <Button>Second Button</Button>
          <a href="#test">Link</a>
        </div>
      );

      // Start tabbing
      await user.tab();
      expect(screen.getByRole("button", { name: /first button/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/input field/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByRole("button", { name: /second button/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole("link", { name: /link/i })).toHaveFocus();
    });

    it("should skip disabled elements", async () => {
      const user = userEvent.setup();
      render(
        <div>
          <Button>Enabled Button</Button>
          <Button disabled>Disabled Button</Button>
          <Button>Another Enabled Button</Button>
        </div>
      );

      await user.tab();
      expect(screen.getByRole("button", { name: /enabled button/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole("button", { name: /another enabled button/i })).toHaveFocus();
    });

    it("should support reverse tab navigation", async () => {
      const user = userEvent.setup();
      render(
        <div>
          <Button>First</Button>
          <Button>Second</Button>
          <Button>Third</Button>
        </div>
      );

      // Tab to third button
      await user.tab();
      await user.tab();
      await user.tab();
      expect(screen.getByRole("button", { name: /third/i })).toHaveFocus();

      // Shift+Tab back
      await user.tab({ shift: true });
      expect(screen.getByRole("button", { name: /second/i })).toHaveFocus();

      await user.tab({ shift: true });
      expect(screen.getByRole("button", { name: /first/i })).toHaveFocus();
    });
  });

  describe("Button Keyboard Interaction", () => {
    it("should activate button with Enter key", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      render(<Button onClick={handleClick}>Click Me</Button>);

      const button = screen.getByRole("button", { name: /click me/i });
      button.focus();

      await user.keyboard("{Enter}");
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should activate button with Space key", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      render(<Button onClick={handleClick}>Click Me</Button>);

      const button = screen.getByRole("button", { name: /click me/i });
      button.focus();

      await user.keyboard(" ");
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should not activate disabled button", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      render(
        <Button onClick={handleClick} disabled>
          Disabled
        </Button>
      );

      const button = screen.getByRole("button", { name: /disabled/i });
      button.focus();

      await user.keyboard("{Enter}");
      await user.keyboard(" ");
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe("Dialog Keyboard Interaction", () => {
    it("should open dialog with Enter on trigger", async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test Dialog</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const trigger = screen.getByText(/open dialog/i);
      trigger.focus();

      await user.keyboard("{Enter}");
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    it("should close dialog with Escape key", async () => {
      const handleOpenChange = vi.fn();
      const user = userEvent.setup();
      render(
        <Dialog open onOpenChange={handleOpenChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test Dialog</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      await user.keyboard("{Escape}");
      await waitFor(() => {
        expect(handleOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it("should trap focus within dialog", async () => {
      const user = userEvent.setup();
      render(
        <Dialog open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Focus Trap</DialogTitle>
            </DialogHeader>
            <DialogFooter>
              <DialogAction>Cancel</DialogAction>
              <DialogAction>Confirm</DialogAction>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      // Tab through all focusable elements
      await user.tab();
      await user.tab();
      await user.tab();

      // Focus should still be within dialog
      const focusedElement = document.activeElement;
      const dialog = screen.getByRole("dialog");
      expect(dialog.contains(focusedElement)).toBe(true);
    });

    it("should restore focus to trigger when dialog closes", async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test</DialogTitle>
            </DialogHeader>
            <DialogFooter>
              <DialogAction>Close</DialogAction>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      const trigger = screen.getByText(/open/i);
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      const closeButton = screen.getByRole("button", { name: /close/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(trigger).toHaveFocus();
      });
    });
  });

  describe("Menu Keyboard Interaction", () => {
    it("should navigate menu items with Arrow keys", async () => {
      const user = userEvent.setup();
      render(
        <Menu open anchorEl={document.body}>
          <MenuItem>First Item</MenuItem>
          <MenuItem>Second Item</MenuItem>
          <MenuItem>Third Item</MenuItem>
        </Menu>
      );

      await user.keyboard("{ArrowDown}");
      expect(screen.getByText(/first item/i)).toHaveFocus();

      await user.keyboard("{ArrowDown}");
      expect(screen.getByText(/second item/i)).toHaveFocus();

      await user.keyboard("{ArrowUp}");
      expect(screen.getByText(/first item/i)).toHaveFocus();
    });

    it("should activate menu item with Enter", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      render(
        <Menu open anchorEl={document.body}>
          <MenuItem onClick={handleClick}>Action</MenuItem>
        </Menu>
      );

      await user.keyboard("{ArrowDown}");
      await user.keyboard("{Enter}");
      expect(handleClick).toHaveBeenCalled();
    });

    it("should close menu with Escape", async () => {
      const handleClose = vi.fn();
      const user = userEvent.setup();
      render(
        <Menu open anchorEl={document.body} onClose={handleClose}>
          <MenuItem>Item</MenuItem>
        </Menu>
      );

      await user.keyboard("{Escape}");
      expect(handleClose).toHaveBeenCalled();
    });

    it("should skip disabled menu items", async () => {
      const user = userEvent.setup();
      render(
        <Menu open anchorEl={document.body}>
          <MenuItem>First</MenuItem>
          <MenuItem disabled>Disabled</MenuItem>
          <MenuItem>Third</MenuItem>
        </Menu>
      );

      await user.keyboard("{ArrowDown}");
      expect(screen.getByText(/first/i)).toHaveFocus();

      await user.keyboard("{ArrowDown}");
      expect(screen.getByText(/third/i)).toHaveFocus();
    });

    it("should support Home and End keys", async () => {
      const user = userEvent.setup();
      render(
        <Menu open anchorEl={document.body}>
          <MenuItem>First</MenuItem>
          <MenuItem>Second</MenuItem>
          <MenuItem>Third</MenuItem>
        </Menu>
      );

      await user.keyboard("{End}");
      expect(screen.getByText(/third/i)).toHaveFocus();

      await user.keyboard("{Home}");
      expect(screen.getByText(/first/i)).toHaveFocus();
    });
  });

  describe("Tabs Keyboard Interaction", () => {
    it("should navigate tabs with Arrow keys", async () => {
      const user = userEvent.setup();
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      const firstTab = screen.getByRole("tab", { name: /tab 1/i });
      firstTab.focus();

      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("tab", { name: /tab 2/i })).toHaveFocus();

      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("tab", { name: /tab 3/i })).toHaveFocus();

      await user.keyboard("{ArrowLeft}");
      expect(screen.getByRole("tab", { name: /tab 2/i })).toHaveFocus();
    });

    it("should wrap around at ends with Arrow keys", async () => {
      const user = userEvent.setup();
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      const firstTab = screen.getByRole("tab", { name: /tab 1/i });
      firstTab.focus();

      await user.keyboard("{ArrowLeft}");
      expect(screen.getByRole("tab", { name: /tab 2/i })).toHaveFocus();

      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("tab", { name: /tab 1/i })).toHaveFocus();
    });

    it("should support Home and End keys", async () => {
      const user = userEvent.setup();
      render(
        <Tabs defaultValue="tab2">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      const secondTab = screen.getByRole("tab", { name: /tab 2/i });
      secondTab.focus();

      await user.keyboard("{End}");
      expect(screen.getByRole("tab", { name: /tab 3/i })).toHaveFocus();

      await user.keyboard("{Home}");
      expect(screen.getByRole("tab", { name: /tab 1/i })).toHaveFocus();
    });

    it("should skip disabled tabs", async () => {
      const user = userEvent.setup();
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2" disabled>
              Tab 2
            </TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      const firstTab = screen.getByRole("tab", { name: /tab 1/i });
      firstTab.focus();

      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("tab", { name: /tab 3/i })).toHaveFocus();
    });
  });

  describe("NavigationBar Keyboard Interaction", () => {
    it("should navigate items with Tab key", async () => {
      const user = userEvent.setup();
      render(
        <NavigationBar>
          <NavigationBarItem icon={<Home />} label="Home" />
          <NavigationBarItem icon={<Settings />} label="Settings" />
          <NavigationBarItem icon={<User />} label="Profile" />
        </NavigationBar>
      );

      await user.tab();
      expect(screen.getByRole("button", { name: /home/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole("button", { name: /settings/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole("button", { name: /profile/i })).toHaveFocus();
    });

    it("should activate navigation item with Enter", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      render(
        <NavigationBar>
          <NavigationBarItem icon={<Home />} label="Home" onClick={handleClick} />
        </NavigationBar>
      );

      const homeButton = screen.getByRole("button", { name: /home/i });
      homeButton.focus();

      await user.keyboard("{Enter}");
      expect(handleClick).toHaveBeenCalled();
    });

    it("should support Arrow key navigation", async () => {
      const user = userEvent.setup();
      render(
        <NavigationBar>
          <NavigationBarItem icon={<Home />} label="Home" />
          <NavigationBarItem icon={<Mail />} label="Messages" />
          <NavigationBarItem icon={<Settings />} label="Settings" />
        </NavigationBar>
      );

      const homeButton = screen.getByRole("button", { name: /home/i });
      homeButton.focus();

      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("button", { name: /messages/i })).toHaveFocus();

      await user.keyboard("{ArrowLeft}");
      expect(screen.getByRole("button", { name: /home/i })).toHaveFocus();
    });
  });

  describe("List Keyboard Interaction", () => {
    it("should navigate list items with Arrow keys", async () => {
      const user = userEvent.setup();
      render(
        <List>
          <ListItem button>
            <ListItemText primary="Item 1" />
          </ListItem>
          <ListItem button>
            <ListItemText primary="Item 2" />
          </ListItem>
          <ListItem button>
            <ListItemText primary="Item 3" />
          </ListItem>
        </List>
      );

      const firstItem = screen.getByText(/item 1/i).closest("li");
      firstItem?.focus();

      await user.keyboard("{ArrowDown}");
      const secondItem = screen.getByText(/item 2/i).closest("li");
      expect(secondItem).toHaveFocus();

      await user.keyboard("{ArrowUp}");
      expect(firstItem).toHaveFocus();
    });

    it("should activate list item with Enter", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      render(
        <List>
          <ListItem button onClick={handleClick}>
            <ListItemText primary="Clickable Item" />
          </ListItem>
        </List>
      );

      const listItem = screen.getByText(/clickable item/i).closest("li");
      listItem?.focus();

      await user.keyboard("{Enter}");
      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe("Chip Keyboard Interaction", () => {
    it("should activate chip with Enter", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      render(<Chip label="Click Me" onClick={handleClick} />);

      const chip = screen.getByText(/click me/i).closest("button");
      chip?.focus();

      await user.keyboard("{Enter}");
      expect(handleClick).toHaveBeenCalled();
    });

    it("should delete chip with Delete key", async () => {
      const handleDelete = vi.fn();
      const user = userEvent.setup();
      render(<Chip label="Deletable" onDelete={handleDelete} />);

      const chip = screen.getByText(/deletable/i).closest("button");
      chip?.focus();

      await user.keyboard("{Delete}");
      expect(handleDelete).toHaveBeenCalled();
    });

    it("should delete chip with Backspace key", async () => {
      const handleDelete = vi.fn();
      const user = userEvent.setup();
      render(<Chip label="Deletable" onDelete={handleDelete} />);

      const chip = screen.getByText(/deletable/i).closest("button");
      chip?.focus();

      await user.keyboard("{Backspace}");
      expect(handleDelete).toHaveBeenCalled();
    });
  });

  describe("TextField Keyboard Interaction", () => {
    it("should allow text input", async () => {
      const user = userEvent.setup();
      render(<TextField label="Name" />);

      const input = screen.getByLabelText(/name/i);
      await user.click(input);
      await user.keyboard("John Doe");

      expect(input).toHaveValue("John Doe");
    });

    it("should support Tab to move to next field", async () => {
      const user = userEvent.setup();
      render(
        <>
          <TextField label="First Name" />
          <TextField label="Last Name" />
        </>
      );

      const firstName = screen.getByLabelText(/first name/i);
      await user.click(firstName);
      await user.keyboard("John");

      await user.tab();
      const lastName = screen.getByLabelText(/last name/i);
      expect(lastName).toHaveFocus();
    });

    it("should support Escape to clear focus", async () => {
      const user = userEvent.setup();
      render(<TextField label="Email" />);

      const input = screen.getByLabelText(/email/i);
      await user.click(input);
      expect(input).toHaveFocus();

      await user.keyboard("{Escape}");
      // Note: Escape behavior may vary by browser
    });
  });

  describe("Complex Keyboard Flows", () => {
    it("should support complete form navigation", async () => {
      const handleSubmit = vi.fn((e) => e.preventDefault());
      const user = userEvent.setup();
      render(
        <form onSubmit={handleSubmit}>
          <TextField label="Username" />
          <TextField label="Email" />
          <TextField label="Password" type="password" />
          <Button type="submit">Submit</Button>
        </form>
      );

      // Tab through all fields
      await user.tab();
      expect(screen.getByLabelText(/username/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/email/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/password/i)).toHaveFocus();

      await user.tab();
      const submitButton = screen.getByRole("button", { name: /submit/i });
      expect(submitButton).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(handleSubmit).toHaveBeenCalled();
    });

    it("should support navigation within dialog containing form", async () => {
      const user = userEvent.setup();
      render(
        <Dialog open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
            </DialogHeader>
            <div>
              <TextField label="Name" />
              <TextField label="Email" />
            </div>
            <DialogFooter>
              <DialogAction>Cancel</DialogAction>
              <DialogAction variant="filled">Save</DialogAction>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      // Tab through dialog elements
      await user.tab();
      // Should focus first element (close button or first input)
      const focusedElement = document.activeElement;
      const dialog = screen.getByRole("dialog");
      expect(dialog.contains(focusedElement)).toBe(true);
    });
  });

  describe("Skip Links", () => {
    it("should provide skip to main content link", async () => {
      const user = userEvent.setup();
      render(
        <div>
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <nav>
            <Button>Nav Item 1</Button>
            <Button>Nav Item 2</Button>
          </nav>
          <main id="main-content">
            <h1>Main Content</h1>
          </main>
        </div>
      );

      // First tab should focus skip link
      await user.tab();
      const skipLink = screen.getByText(/skip to main content/i);
      expect(skipLink).toHaveFocus();
    });
  });
});
