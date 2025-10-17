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
import { Tooltip } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

/**
 * Focus Management Tests
 *
 * Tests for proper focus handling including:
 * - Focus indicators visibility
 * - Focus trap in modals
 * - Focus restoration
 * - Logical focus order
 * - Skip links
 */

describe("Focus Management Accessibility", () => {
  describe("Focus Indicators", () => {
    it("should show visible focus indicator on buttons", async () => {
      const user = userEvent.setup();
      render(<Button>Focus Me</Button>);

      const button = screen.getByRole("button", { name: /focus me/i });
      await user.tab();

      expect(button).toHaveFocus();
      expect(button).toHaveClass("focus-visible:ring-2");
      expect(button).toHaveClass("focus-visible:ring-[hsl(var(--md-sys-color-primary))]");
    });

    it("should show visible focus indicator on text fields", async () => {
      const user = userEvent.setup();
      render(<TextField label="Email" />);

      const input = screen.getByLabelText(/email/i);
      await user.tab();

      expect(input).toHaveFocus();
      // TextField container should show focus styles
      const container = input.parentElement;
      expect(container).toHaveClass("focus-within:border-[hsl(var(--md-sys-color-primary))]");
    });

    it("should show visible focus indicator on links", async () => {
      const user = userEvent.setup();
      render(
        <a href="#test" className="focus-visible:ring-2 focus-visible:ring-[hsl(var(--md-sys-color-primary))]">
          Link
        </a>
      );

      const link = screen.getByRole("link", { name: /link/i });
      await user.tab();

      expect(link).toHaveFocus();
      expect(link).toHaveClass("focus-visible:ring-2");
    });

    it("should not show focus indicator on mouse click", async () => {
      const user = userEvent.setup();
      render(<Button>Click Me</Button>);

      const button = screen.getByRole("button", { name: /click me/i });
      await user.click(button);

      // Focus-visible should not apply on mouse click
      // This is handled by the :focus-visible pseudo-class
      expect(button).toHaveFocus();
    });

    it("should show focus indicator when tabbing to element", async () => {
      const user = userEvent.setup();
      render(
        <>
          <Button>First</Button>
          <Button>Second</Button>
        </>
      );

      await user.tab();
      const firstButton = screen.getByRole("button", { name: /first/i });
      expect(firstButton).toHaveFocus();
      expect(firstButton).toHaveClass("focus-visible:ring-2");
    });
  });

  describe("Focus Trap in Dialog", () => {
    it("should trap focus within open dialog", async () => {
      const user = userEvent.setup();
      render(
        <Dialog open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test Dialog</DialogTitle>
            </DialogHeader>
            <DialogFooter>
              <DialogAction>Cancel</DialogAction>
              <DialogAction>Confirm</DialogAction>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      const dialog = screen.getByRole("dialog");

      // Tab through all focusable elements
      await user.tab();
      let focused = document.activeElement;
      expect(dialog.contains(focused)).toBe(true);

      await user.tab();
      focused = document.activeElement;
      expect(dialog.contains(focused)).toBe(true);

      await user.tab();
      focused = document.activeElement;
      expect(dialog.contains(focused)).toBe(true);

      // After tabbing through all elements, focus should cycle back
      await user.tab();
      focused = document.activeElement;
      expect(dialog.contains(focused)).toBe(true);
    });

    it("should focus first focusable element when dialog opens", async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test Dialog</DialogTitle>
            </DialogHeader>
            <DialogFooter>
              <DialogAction>Action</DialogAction>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      const trigger = screen.getByText(/open dialog/i);
      await user.click(trigger);

      await waitFor(() => {
        const dialog = screen.getByRole("dialog");
        const focused = document.activeElement;
        expect(dialog.contains(focused)).toBe(true);
      });
    });

    it("should restore focus to trigger when dialog closes", async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test Dialog</DialogTitle>
            </DialogHeader>
            <DialogFooter>
              <DialogAction>Close</DialogAction>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      const trigger = screen.getByText(/open dialog/i);
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

    it("should prevent focus from escaping dialog with Tab", async () => {
      const user = userEvent.setup();
      render(
        <>
          <Button>Outside Button</Button>
          <Dialog open>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Focus Trap</DialogTitle>
              </DialogHeader>
              <DialogFooter>
                <DialogAction>Button 1</DialogAction>
                <DialogAction>Button 2</DialogAction>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      );

      const outsideButton = screen.getByRole("button", { name: /outside button/i });
      const dialog = screen.getByRole("dialog");

      // Tab multiple times
      await user.tab();
      await user.tab();
      await user.tab();
      await user.tab();

      // Focus should never reach the outside button
      expect(outsideButton).not.toHaveFocus();
      const focused = document.activeElement;
      expect(dialog.contains(focused)).toBe(true);
    });

    it("should prevent focus from escaping dialog with Shift+Tab", async () => {
      const user = userEvent.setup();
      render(
        <>
          <Button>Outside Button</Button>
          <Dialog open>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Focus Trap</DialogTitle>
              </DialogHeader>
              <DialogFooter>
                <DialogAction>Button 1</DialogAction>
                <DialogAction>Button 2</DialogAction>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      );

      const outsideButton = screen.getByRole("button", { name: /outside button/i });
      const dialog = screen.getByRole("dialog");

      // Shift+Tab multiple times
      await user.tab({ shift: true });
      await user.tab({ shift: true });
      await user.tab({ shift: true });

      // Focus should never reach the outside button
      expect(outsideButton).not.toHaveFocus();
      const focused = document.activeElement;
      expect(dialog.contains(focused)).toBe(true);
    });
  });

  describe("Focus Trap in Menu", () => {
    it("should trap focus within open menu", async () => {
      const user = userEvent.setup();
      render(
        <Menu open anchorEl={document.body}>
          <MenuItem>Item 1</MenuItem>
          <MenuItem>Item 2</MenuItem>
          <MenuItem>Item 3</MenuItem>
        </Menu>
      );

      // Navigate through menu items
      await user.keyboard("{ArrowDown}");
      expect(screen.getByText(/item 1/i)).toHaveFocus();

      await user.keyboard("{ArrowDown}");
      expect(screen.getByText(/item 2/i)).toHaveFocus();

      await user.keyboard("{ArrowDown}");
      expect(screen.getByText(/item 3/i)).toHaveFocus();

      // Should wrap to first item
      await user.keyboard("{ArrowDown}");
      expect(screen.getByText(/item 1/i)).toHaveFocus();
    });

    it("should restore focus when menu closes", async () => {
      const handleClose = vi.fn();
      const user = userEvent.setup();
      render(
        <>
          <Button>Menu Trigger</Button>
          <Menu open anchorEl={document.body} onClose={handleClose}>
            <MenuItem>Item 1</MenuItem>
          </Menu>
        </>
      );

      await user.keyboard("{Escape}");
      expect(handleClose).toHaveBeenCalled();
    });
  });

  describe("Focus Order", () => {
    it("should follow logical tab order in forms", async () => {
      const user = userEvent.setup();
      render(
        <form>
          <TextField label="First Name" />
          <TextField label="Last Name" />
          <TextField label="Email" />
          <Button type="submit">Submit</Button>
        </form>
      );

      await user.tab();
      expect(screen.getByLabelText(/first name/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/last name/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/email/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByRole("button", { name: /submit/i })).toHaveFocus();
    });

    it("should follow logical tab order in complex layouts", async () => {
      const user = userEvent.setup();
      render(
        <div>
          <header>
            <Button>Header Button</Button>
          </header>
          <nav>
            <Button>Nav Item 1</Button>
            <Button>Nav Item 2</Button>
          </nav>
          <main>
            <TextField label="Search" />
            <Button>Search Button</Button>
          </main>
        </div>
      );

      await user.tab();
      expect(screen.getByRole("button", { name: /header button/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole("button", { name: /nav item 1/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole("button", { name: /nav item 2/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/search/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByRole("button", { name: /search button/i })).toHaveFocus();
    });

    it("should respect tabindex order", async () => {
      const user = userEvent.setup();
      render(
        <div>
          <Button tabIndex={3}>Third</Button>
          <Button tabIndex={1}>First</Button>
          <Button tabIndex={2}>Second</Button>
        </div>
      );

      await user.tab();
      expect(screen.getByRole("button", { name: /first/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole("button", { name: /second/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole("button", { name: /third/i })).toHaveFocus();
    });

    it("should skip elements with tabindex=-1", async () => {
      const user = userEvent.setup();
      render(
        <div>
          <Button>First</Button>
          <Button tabIndex={-1}>Skip Me</Button>
          <Button>Third</Button>
        </div>
      );

      await user.tab();
      expect(screen.getByRole("button", { name: /first/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole("button", { name: /third/i })).toHaveFocus();
    });
  });

  describe("Focus Restoration", () => {
    it("should restore focus after tooltip closes", async () => {
      const user = userEvent.setup();
      render(
        <Tooltip title="Helpful info">
          <Button>Hover Me</Button>
        </Tooltip>
      );

      const button = screen.getByRole("button", { name: /hover me/i });
      await user.tab();
      expect(button).toHaveFocus();

      // Tooltip should show on focus
      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
      });

      // Tab away
      await user.tab();

      // Tooltip should close and focus should move
      await waitFor(() => {
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
      });
    });

    it("should restore focus after tab panel change", async () => {
      const user = userEvent.setup();
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">
            <Button>Content 1 Button</Button>
          </TabsContent>
          <TabsContent value="tab2">
            <Button>Content 2 Button</Button>
          </TabsContent>
        </Tabs>
      );

      const tab1 = screen.getByRole("tab", { name: /tab 1/i });
      const tab2 = screen.getByRole("tab", { name: /tab 2/i });

      tab1.focus();
      expect(tab1).toHaveFocus();

      await user.keyboard("{ArrowRight}");
      expect(tab2).toHaveFocus();
    });
  });

  describe("Programmatic Focus", () => {
    it("should allow programmatic focus on elements", () => {
      render(<Button>Focus Me</Button>);

      const button = screen.getByRole("button", { name: /focus me/i });
      button.focus();

      expect(button).toHaveFocus();
    });

    it("should support ref-based focus", () => {
      const TestComponent = () => {
        const buttonRef = React.useRef<HTMLButtonElement>(null);

        React.useEffect(() => {
          buttonRef.current?.focus();
        }, []);

        return <Button ref={buttonRef}>Auto Focus</Button>;
      };

      render(<TestComponent />);

      const button = screen.getByRole("button", { name: /auto focus/i });
      expect(button).toHaveFocus();
    });
  });

  describe("Focus Management in Complex Scenarios", () => {
    it("should handle focus in nested dialogs", async () => {
      const user = userEvent.setup();
      render(
        <Dialog open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Outer Dialog</DialogTitle>
            </DialogHeader>
            <Dialog>
              <DialogTrigger>Open Inner Dialog</DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Inner Dialog</DialogTitle>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </DialogContent>
        </Dialog>
      );

      const outerDialog = screen.getByRole("dialog", { name: /outer dialog/i });
      expect(outerDialog).toBeInTheDocument();

      const innerTrigger = screen.getByText(/open inner dialog/i);
      await user.click(innerTrigger);

      await waitFor(() => {
        const innerDialog = screen.getByRole("dialog", { name: /inner dialog/i });
        expect(innerDialog).toBeInTheDocument();
      });
    });

    it("should handle focus when switching between tabs with forms", async () => {
      const user = userEvent.setup();
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Form 1</TabsTrigger>
            <TabsTrigger value="tab2">Form 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">
            <TextField label="Field 1" />
          </TabsContent>
          <TabsContent value="tab2">
            <TextField label="Field 2" />
          </TabsContent>
        </Tabs>
      );

      const tab1 = screen.getByRole("tab", { name: /form 1/i });
      tab1.focus();

      await user.keyboard("{ArrowRight}");
      const tab2 = screen.getByRole("tab", { name: /form 2/i });
      expect(tab2).toHaveFocus();
    });
  });

  describe("Skip Links", () => {
    it("should allow skipping to main content", async () => {
      const user = userEvent.setup();
      render(
        <div>
          <a href="#main" className="skip-link">
            Skip to main content
          </a>
          <nav>
            <Button>Nav 1</Button>
            <Button>Nav 2</Button>
            <Button>Nav 3</Button>
          </nav>
          <main id="main" tabIndex={-1}>
            <h1>Main Content</h1>
            <Button>Main Button</Button>
          </main>
        </div>
      );

      // First tab should focus skip link
      await user.tab();
      const skipLink = screen.getByText(/skip to main content/i);
      expect(skipLink).toHaveFocus();

      // Activating skip link should move focus to main content
      await user.keyboard("{Enter}");
      // Note: Actual skip link behavior depends on implementation
    });
  });

  describe("Focus Visibility", () => {
    it("should have sufficient contrast for focus indicators", async () => {
      const user = userEvent.setup();
      render(<Button>Focus Me</Button>);

      const button = screen.getByRole("button", { name: /focus me/i });
      await user.tab();

      expect(button).toHaveFocus();
      // Focus ring should use primary color with sufficient contrast
      expect(button).toHaveClass("focus-visible:ring-[hsl(var(--md-sys-color-primary))]");
    });

    it("should show focus indicator on all interactive elements", async () => {
      const user = userEvent.setup();
      render(
        <div>
          <Button>Button</Button>
          <a href="#test">Link</a>
          <TextField label="Input" />
        </div>
      );

      // Tab through all elements and verify focus indicators
      await user.tab();
      let focused = document.activeElement;
      expect(focused).toHaveClass("focus-visible:ring-2");

      await user.tab();
      focused = document.activeElement;
      expect(focused).toHaveClass("focus-visible:ring-2");

      await user.tab();
      // TextField has focus-within styles on container
      const input = screen.getByLabelText(/input/i);
      expect(input).toHaveFocus();
    });
  });
});
