import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "vitest-axe";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { TextField } from "@/components/ui/text-field";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DialogAction,
} from "@/components/ui/dialog";
import { CircularProgress } from "@/components/ui/circular-progress";
import { LinearProgress } from "@/components/ui/linear-progress";
import { Snackbar } from "@/components/ui/snackbar";
import { List, ListItem, ListItemText } from "@/components/ui/list";
import { Chip } from "@/components/ui/chip";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { Menu, MenuItem } from "@/components/ui/menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { NavigationBar, NavigationBarItem } from "@/components/ui/navigation-bar";
import { Home, Settings, User } from "lucide-react";

expect.extend(toHaveNoViolations);

describe("MD3 Components Accessibility", () => {
  describe("Button Accessibility", () => {
    it("should not have accessibility violations", async () => {
      const { container } = render(<Button>Accessible Button</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should be keyboard accessible", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      render(<Button onClick={handleClick}>Click Me</Button>);

      const button = screen.getByRole("button", { name: /click me/i });
      button.focus();
      expect(button).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(handleClick).toHaveBeenCalled();
    });

    it("should have visible focus indicator", async () => {
      const user = userEvent.setup();
      render(<Button>Focus Me</Button>);

      const button = screen.getByRole("button", { name: /focus me/i });
      await user.tab();

      expect(button).toHaveFocus();
      expect(button).toHaveClass("focus-visible:ring-2");
    });

    it("should have proper ARIA attributes when disabled", () => {
      render(<Button disabled>Disabled Button</Button>);
      const button = screen.getByRole("button", { name: /disabled button/i });

      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("disabled");
    });

    it("should support aria-label for icon-only buttons", async () => {
      const { container } = render(
        <Button size="icon" aria-label="Settings">
          <Settings />
        </Button>
      );

      const button = screen.getByRole("button", { name: /settings/i });
      expect(button).toBeInTheDocument();

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("Card Accessibility", () => {
    it("should not have accessibility violations", async () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <h2>Card Title</h2>
          </CardHeader>
          <CardContent>
            <p>Card content goes here</p>
          </CardContent>
        </Card>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should be keyboard accessible when interactive", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <Card interactive onClick={handleClick} tabIndex={0}>
          <CardContent>Interactive Card</CardContent>
        </Card>
      );

      const card = screen.getByText(/interactive card/i).parentElement;
      card?.focus();
      expect(card).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe("TextField Accessibility", () => {
    it("should not have accessibility violations", async () => {
      const { container } = render(<TextField label="Email Address" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should associate label with input", () => {
      render(<TextField label="Username" />);
      const input = screen.getByLabelText(/username/i);
      expect(input).toBeInTheDocument();
    });

    it("should have proper ARIA attributes for error state", () => {
      render(<TextField label="Email" error errorMessage="Invalid email" />);

      const input = screen.getByLabelText(/email/i);
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(input).toHaveAttribute("aria-describedby");

      const errorMessage = screen.getByText(/invalid email/i);
      expect(errorMessage).toHaveAttribute("role", "alert");
    });

    it("should be keyboard navigable", async () => {
      const user = userEvent.setup();
      render(
        <>
          <TextField label="First Name" />
          <TextField label="Last Name" />
        </>
      );

      await user.tab();
      expect(screen.getByLabelText(/first name/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/last name/i)).toHaveFocus();
    });

    it("should announce helper text to screen readers", () => {
      render(<TextField label="Password" helperText="Must be at least 8 characters" />);

      const input = screen.getByLabelText(/password/i);
      const helperText = screen.getByText(/must be at least 8 characters/i);

      expect(input).toHaveAttribute("aria-describedby", helperText.id);
    });
  });

  describe("Dialog Accessibility", () => {
    it("should not have accessibility violations", async () => {
      const { container } = render(
        <Dialog open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Accessible Dialog</DialogTitle>
              <DialogDescription>This dialog is accessible</DialogDescription>
            </DialogHeader>
            <DialogBody>Content goes here</DialogBody>
            <DialogFooter>
              <DialogAction>Cancel</DialogAction>
              <DialogAction variant="filled">Confirm</DialogAction>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have proper dialog role and ARIA attributes", () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test Dialog</DialogTitle>
              <DialogDescription>Dialog description</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-labelledby");
      expect(dialog).toHaveAttribute("aria-describedby");
    });

    it("should trap focus within dialog", async () => {
      const user = userEvent.setup();
      render(
        <Dialog open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Focus Trap Test</DialogTitle>
            </DialogHeader>
            <DialogFooter>
              <DialogAction>Button 1</DialogAction>
              <DialogAction>Button 2</DialogAction>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      await user.tab();
      const focusedElement = document.activeElement;
      expect(focusedElement?.closest('[role="dialog"]')).toBeInTheDocument();
    });

    it("should close on Escape key", async () => {
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
  });

  describe("Progress Indicators Accessibility", () => {
    it("CircularProgress should not have accessibility violations", async () => {
      const { container } = render(<CircularProgress value={50} aria-label="Loading progress" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("LinearProgress should not have accessibility violations", async () => {
      const { container } = render(<LinearProgress value={75} aria-label="Upload progress" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have proper ARIA attributes for determinate progress", () => {
      render(<CircularProgress value={60} aria-label="Loading" />);

      const progressbar = screen.getByRole("progressbar");
      expect(progressbar).toHaveAttribute("aria-valuenow", "60");
      expect(progressbar).toHaveAttribute("aria-valuemin", "0");
      expect(progressbar).toHaveAttribute("aria-valuemax", "100");
    });

    it("should have proper ARIA attributes for indeterminate progress", () => {
      render(<CircularProgress aria-label="Loading" />);

      const progressbar = screen.getByRole("progressbar");
      expect(progressbar).not.toHaveAttribute("aria-valuenow");
    });
  });

  describe("Snackbar Accessibility", () => {
    it("should not have accessibility violations", async () => {
      const { container } = render(<Snackbar open message="Operation successful" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have proper ARIA live region", () => {
      render(<Snackbar open message="Success message" />);

      const snackbar = screen.getByText(/success message/i).closest('[role="status"]');
      expect(snackbar).toBeInTheDocument();
    });

    it("should use alert role for error messages", () => {
      render(<Snackbar open message="Error occurred" severity="error" />);

      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
    });

    it("action button should be keyboard accessible", async () => {
      const handleAction = vi.fn();
      const user = userEvent.setup();

      render(<Snackbar open message="Undo available" action={{ label: "Undo", onClick: handleAction }} />);

      const button = screen.getByRole("button", { name: /undo/i });
      button.focus();
      expect(button).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(handleAction).toHaveBeenCalled();
    });
  });

  describe("List Accessibility", () => {
    it("should not have accessibility violations", async () => {
      const { container } = render(
        <List>
          <ListItem>
            <ListItemText primary="Item 1" />
          </ListItem>
          <ListItem>
            <ListItemText primary="Item 2" />
          </ListItem>
        </List>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have proper list semantics", () => {
      render(
        <List>
          <ListItem>
            <ListItemText primary="Item 1" />
          </ListItem>
        </List>
      );

      const list = screen.getByRole("list");
      expect(list).toBeInTheDocument();

      const listItems = screen.getAllByRole("listitem");
      expect(listItems).toHaveLength(1);
    });

    it("interactive list items should be keyboard accessible", async () => {
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
      expect(listItem).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(handleClick).toHaveBeenCalled();
    });

    it("should indicate selected state with ARIA", () => {
      render(
        <List>
          <ListItem selected>
            <ListItemText primary="Selected Item" />
          </ListItem>
        </List>
      );

      const listItem = screen.getByText(/selected item/i).closest("li");
      expect(listItem).toHaveAttribute("aria-selected", "true");
    });
  });

  describe("Chip Accessibility", () => {
    it("should not have accessibility violations", async () => {
      const { container } = render(<Chip label="Accessible Chip" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should be keyboard accessible", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Chip label="Click Me" onClick={handleClick} />);

      const chip = screen.getByText(/click me/i).closest("button");
      chip?.focus();
      expect(chip).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(handleClick).toHaveBeenCalled();
    });

    it("delete button should be keyboard accessible", async () => {
      const handleDelete = vi.fn();
      const user = userEvent.setup();

      render(<Chip label="Deletable" onDelete={handleDelete} />);

      const deleteButton = screen.getByRole("button", { name: /delete/i });
      deleteButton.focus();
      expect(deleteButton).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(handleDelete).toHaveBeenCalled();
    });

    it("should indicate selected state for filter chips", () => {
      render(<Chip label="Filter" variant="filter" selected />);

      const chip = screen.getByText(/filter/i).closest('[role="option"]');
      expect(chip).toHaveAttribute("aria-selected", "true");
    });
  });

  describe("Badge Accessibility", () => {
    it("should not have accessibility violations", async () => {
      const { container } = render(
        <Badge content={5}>
          <Button>Notifications</Button>
        </Badge>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have accessible label for screen readers", () => {
      render(
        <Badge content={3} aria-label="3 unread messages">
          <Button>Messages</Button>
        </Badge>
      );

      const badge = screen.getByLabelText(/3 unread messages/i);
      expect(badge).toBeInTheDocument();
    });

    it("should not be announced when invisible", () => {
      const { container } = render(
        <Badge content={0} invisible>
          <Button>Notifications</Button>
        </Badge>
      );

      const badge = container.querySelector("[aria-label]");
      expect(badge).not.toBeInTheDocument();
    });
  });

  describe("Tooltip Accessibility", () => {
    it("should not have accessibility violations", async () => {
      const { container } = render(
        <Tooltip title="Helpful information">
          <Button>Hover Me</Button>
        </Tooltip>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should show on keyboard focus", async () => {
      const user = userEvent.setup();
      render(
        <Tooltip title="Tooltip text">
          <Button>Focus Me</Button>
        </Tooltip>
      );

      const button = screen.getByRole("button", { name: /focus me/i });
      await user.tab();

      expect(button).toHaveFocus();
      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
      });
    });

    it("should have proper ARIA relationship", async () => {
      const user = userEvent.setup();
      render(
        <Tooltip title="Tooltip content">
          <Button>Button</Button>
        </Tooltip>
      );

      const button = screen.getByRole("button", { name: /button/i });
      await user.hover(button);

      await waitFor(() => {
        const tooltip = screen.getByRole("tooltip");
        expect(button).toHaveAttribute("aria-describedby", tooltip.id);
      });
    });
  });

  describe("Menu Accessibility", () => {
    it("should not have accessibility violations", async () => {
      const { container } = render(
        <Menu open anchorEl={document.body}>
          <MenuItem>Option 1</MenuItem>
          <MenuItem>Option 2</MenuItem>
        </Menu>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have proper menu role", () => {
      render(
        <Menu open anchorEl={document.body}>
          <MenuItem>Option 1</MenuItem>
        </Menu>
      );

      const menu = screen.getByRole("menu");
      expect(menu).toBeInTheDocument();

      const menuItems = screen.getAllByRole("menuitem");
      expect(menuItems).toHaveLength(1);
    });

    it("should support keyboard navigation", async () => {
      const user = userEvent.setup();
      render(
        <Menu open anchorEl={document.body}>
          <MenuItem>First</MenuItem>
          <MenuItem>Second</MenuItem>
          <MenuItem>Third</MenuItem>
        </Menu>
      );

      await user.keyboard("{ArrowDown}");
      const firstItem = screen.getByText(/first/i);
      expect(firstItem).toHaveFocus();

      await user.keyboard("{ArrowDown}");
      const secondItem = screen.getByText(/second/i);
      expect(secondItem).toHaveFocus();
    });

    it("should close on Escape key", async () => {
      const handleClose = vi.fn();
      const user = userEvent.setup();

      render(
        <Menu open anchorEl={document.body} onClose={handleClose}>
          <MenuItem>Option</MenuItem>
        </Menu>
      );

      await user.keyboard("{Escape}");
      expect(handleClose).toHaveBeenCalled();
    });

    it("should indicate disabled menu items", () => {
      render(
        <Menu open anchorEl={document.body}>
          <MenuItem disabled>Disabled Option</MenuItem>
        </Menu>
      );

      const menuItem = screen.getByText(/disabled option/i);
      expect(menuItem).toHaveAttribute("aria-disabled", "true");
    });
  });

  describe("Tabs Accessibility", () => {
    it("should not have accessibility violations", async () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have proper tablist role", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      const tablist = screen.getByRole("tablist");
      expect(tablist).toBeInTheDocument();

      const tabs = screen.getAllByRole("tab");
      expect(tabs).toHaveLength(1);
    });

    it("should support keyboard navigation", async () => {
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
      const secondTab = screen.getByRole("tab", { name: /tab 2/i });
      expect(secondTab).toHaveFocus();

      await user.keyboard("{ArrowLeft}");
      expect(firstTab).toHaveFocus();
    });

    it("should indicate selected tab", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      const selectedTab = screen.getByRole("tab", { name: /tab 1/i });
      expect(selectedTab).toHaveAttribute("aria-selected", "true");

      const unselectedTab = screen.getByRole("tab", { name: /tab 2/i });
      expect(unselectedTab).toHaveAttribute("aria-selected", "false");
    });

    it("should associate tab with tabpanel", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
        </Tabs>
      );

      const tab = screen.getByRole("tab", { name: /tab 1/i });
      const tabpanel = screen.getByRole("tabpanel");

      expect(tab).toHaveAttribute("aria-controls", tabpanel.id);
      expect(tabpanel).toHaveAttribute("aria-labelledby", tab.id);
    });
  });

  describe("NavigationBar Accessibility", () => {
    it("should not have accessibility violations", async () => {
      const { container } = render(
        <NavigationBar>
          <NavigationBarItem icon={<Home />} label="Home" />
          <NavigationBarItem icon={<Settings />} label="Settings" />
          <NavigationBarItem icon={<User />} label="Profile" />
        </NavigationBar>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should have proper navigation role", () => {
      render(
        <NavigationBar>
          <NavigationBarItem icon={<Home />} label="Home" />
        </NavigationBar>
      );

      const nav = screen.getByRole("navigation");
      expect(nav).toBeInTheDocument();
    });

    it("should be keyboard navigable", async () => {
      const user = userEvent.setup();
      render(
        <NavigationBar>
          <NavigationBarItem icon={<Home />} label="Home" />
          <NavigationBarItem icon={<Settings />} label="Settings" />
        </NavigationBar>
      );

      await user.tab();
      const homeButton = screen.getByRole("button", { name: /home/i });
      expect(homeButton).toHaveFocus();

      await user.tab();
      const settingsButton = screen.getByRole("button", { name: /settings/i });
      expect(settingsButton).toHaveFocus();
    });

    it("should indicate active item", () => {
      render(
        <NavigationBar>
          <NavigationBarItem icon={<Home />} label="Home" active />
          <NavigationBarItem icon={<Settings />} label="Settings" />
        </NavigationBar>
      );

      const homeButton = screen.getByRole("button", { name: /home/i });
      expect(homeButton).toHaveAttribute("aria-current", "page");
    });
  });

  describe("Color Contrast", () => {
    it("primary button should have sufficient contrast", async () => {
      const { container } = render(<Button variant="filled">Primary Button</Button>);
      const results = await axe(container, {
        rules: {
          "color-contrast": { enabled: true },
        },
      });
      expect(results).toHaveNoViolations();
    });

    it("text on surface should have sufficient contrast", async () => {
      const { container } = render(
        <Card>
          <CardContent>
            <p>This is regular text on a surface</p>
          </CardContent>
        </Card>
      );
      const results = await axe(container, {
        rules: {
          "color-contrast": { enabled: true },
        },
      });
      expect(results).toHaveNoViolations();
    });

    it("error text should have sufficient contrast", async () => {
      const { container } = render(<TextField label="Email" error errorMessage="Invalid email" />);
      const results = await axe(container, {
        rules: {
          "color-contrast": { enabled: true },
        },
      });
      expect(results).toHaveNoViolations();
    });
  });

  describe("Focus Management", () => {
    it("should have visible focus indicators on all interactive elements", async () => {
      const user = userEvent.setup();
      render(
        <>
          <Button>Button 1</Button>
          <Button>Button 2</Button>
          <TextField label="Input" />
        </>
      );

      await user.tab();
      let focused = document.activeElement;
      expect(focused).toHaveClass("focus-visible:ring-2");

      await user.tab();
      focused = document.activeElement;
      expect(focused).toHaveClass("focus-visible:ring-2");
    });

    it("should maintain logical tab order", async () => {
      const user = userEvent.setup();
      render(
        <>
          <Button>First</Button>
          <TextField label="Second" />
          <Button>Third</Button>
        </>
      );

      await user.tab();
      expect(screen.getByRole("button", { name: /first/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/second/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByRole("button", { name: /third/i })).toHaveFocus();
    });
  });

  describe("Screen Reader Support", () => {
    it("should provide meaningful labels for all interactive elements", () => {
      render(
        <>
          <Button aria-label="Close dialog">×</Button>
          <Button size="icon" aria-label="Settings">
            <Settings />
          </Button>
        </>
      );

      expect(screen.getByRole("button", { name: /close dialog/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /settings/i })).toBeInTheDocument();
    });

    it("should announce dynamic content changes", () => {
      render(<Snackbar open message="File uploaded successfully" severity="success" />);

      const status = screen.getByRole("status");
      expect(status).toBeInTheDocument();
      expect(status).toHaveTextContent(/file uploaded successfully/i);
    });

    it("should provide context for form errors", () => {
      render(<TextField label="Email" error errorMessage="Please enter a valid email address" />);

      const input = screen.getByLabelText(/email/i);
      const errorMessage = screen.getByText(/please enter a valid email address/i);

      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(input).toHaveAttribute("aria-describedby", errorMessage.id);
      expect(errorMessage).toHaveAttribute("role", "alert");
    });
  });
});
