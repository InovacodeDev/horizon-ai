import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogAction,
} from "../dialog";

describe("Dialog", () => {
  describe("Open/Close Behavior", () => {
    it("renders dialog when open", () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test Dialog</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Test Dialog")).toBeInTheDocument();
    });

    it("does not render dialog when closed", () => {
      render(
        <Dialog open={false}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test Dialog</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("opens dialog when trigger is clicked", async () => {
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

      const trigger = screen.getByText("Open Dialog");
      await user.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    it("calls onOpenChange when dialog state changes", async () => {
      const handleOpenChange = vi.fn();
      const user = userEvent.setup();

      render(
        <Dialog onOpenChange={handleOpenChange}>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test Dialog</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const trigger = screen.getByText("Open Dialog");
      await user.click(trigger);

      await waitFor(() => {
        expect(handleOpenChange).toHaveBeenCalledWith(true);
      });
    });
  });

  describe("Backdrop Click to Close", () => {
    it("closes dialog when backdrop is clicked", async () => {
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

      // Click on the overlay/backdrop - find it by class since it has aria-hidden
      const overlay = document.querySelector(".fixed.inset-0.z-50");
      if (overlay) {
        await user.click(overlay);
      }

      await waitFor(() => {
        expect(handleOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe("Escape Key to Close", () => {
    it("closes dialog when Escape key is pressed", async () => {
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

  describe("Close Button", () => {
    it("renders close button by default", () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test Dialog</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const closeButton = screen.getByRole("button", { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });

    it("does not render close button when showClose is false", () => {
      render(
        <Dialog open>
          <DialogContent showClose={false}>
            <DialogHeader>
              <DialogTitle>Test Dialog</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const closeButton = screen.queryByRole("button", { name: /close/i });
      expect(closeButton).not.toBeInTheDocument();
    });

    it("closes dialog when close button is clicked", async () => {
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

      const closeButton = screen.getByRole("button", { name: /close/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(handleOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe("Max Width Variants", () => {
    it("applies xs max-width", () => {
      render(
        <Dialog open>
          <DialogContent maxWidth="xs">
            <DialogHeader>
              <DialogTitle>XS Dialog</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveClass("max-w-xs");
    });

    it("applies sm max-width", () => {
      render(
        <Dialog open>
          <DialogContent maxWidth="sm">
            <DialogHeader>
              <DialogTitle>SM Dialog</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveClass("max-w-sm");
    });

    it("applies md max-width (default)", () => {
      render(
        <Dialog open>
          <DialogContent maxWidth="md">
            <DialogHeader>
              <DialogTitle>MD Dialog</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveClass("max-w-md");
    });

    it("applies lg max-width", () => {
      render(
        <Dialog open>
          <DialogContent maxWidth="lg">
            <DialogHeader>
              <DialogTitle>LG Dialog</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveClass("max-w-lg");
    });

    it("applies xl max-width", () => {
      render(
        <Dialog open>
          <DialogContent maxWidth="xl">
            <DialogHeader>
              <DialogTitle>XL Dialog</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveClass("max-w-xl");
    });
  });

  describe("Full-Screen Mode", () => {
    it("applies full-screen styles when fullScreen is true", () => {
      render(
        <Dialog open>
          <DialogContent fullScreen>
            <DialogHeader>
              <DialogTitle>Full Screen Dialog</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveClass("!w-screen");
      expect(dialog).toHaveClass("!h-screen");
      expect(dialog).toHaveClass("!max-w-none");
      expect(dialog).toHaveClass("!rounded-none");
    });

    it("applies responsive full-screen styles", () => {
      render(
        <Dialog open>
          <DialogContent fullScreen>
            <DialogHeader>
              <DialogTitle>Full Screen Dialog</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const dialog = screen.getByRole("dialog");
      // Should be full-screen on mobile but normal on desktop
      expect(dialog).toHaveClass("md:!w-full");
      expect(dialog).toHaveClass("md:!h-auto");
      expect(dialog).toHaveClass("md:!max-w-lg");
    });
  });

  describe("Dialog Structure", () => {
    it("renders complete dialog structure", () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog Title</DialogTitle>
              <DialogDescription>Dialog Description</DialogDescription>
            </DialogHeader>
            <DialogBody>Dialog Body Content</DialogBody>
            <DialogFooter>
              <DialogAction>Cancel</DialogAction>
              <DialogAction variant="filled">Confirm</DialogAction>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText("Dialog Title")).toBeInTheDocument();
      expect(screen.getByText("Dialog Description")).toBeInTheDocument();
      expect(screen.getByText("Dialog Body Content")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /confirm/i })).toBeInTheDocument();
    });

    it("renders dialog with icon in header", () => {
      const icon = <svg data-testid="dialog-icon" />;
      render(
        <Dialog open>
          <DialogContent>
            <DialogHeader icon={icon}>
              <DialogTitle>Dialog with Icon</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByTestId("dialog-icon")).toBeInTheDocument();
      expect(screen.getByText("Dialog with Icon")).toBeInTheDocument();
    });

    it("renders multiple action buttons", () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Multiple Actions</DialogTitle>
            </DialogHeader>
            <DialogFooter>
              <DialogAction variant="text">Cancel</DialogAction>
              <DialogAction variant="outlined">Save Draft</DialogAction>
              <DialogAction variant="filled">Publish</DialogAction>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /save draft/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /publish/i })).toBeInTheDocument();
    });
  });

  describe("MD3 Styling", () => {
    it("applies MD3 elevation level 3", () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveClass("shadow-[var(--md-sys-elevation-level3)]");
    });

    it("applies MD3 border-radius extra-large", () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveClass("rounded-[var(--md-sys-shape-corner-extra-large)]");
    });

    it("applies MD3 surface color", () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveClass("bg-[hsl(var(--md-sys-color-surface-container-high))]");
      expect(dialog).toHaveClass("text-[hsl(var(--md-sys-color-on-surface))]");
    });

    it("applies MD3 scrim color to overlay", () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      // Overlay is rendered in a portal, so we need to query from document
      const overlay = document.querySelector(".fixed.inset-0.z-50");
      expect(overlay).toHaveClass("bg-[hsl(var(--md-sys-color-scrim)/0.32)]");
    });

    it("applies MD3 headline-small typography to title", () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog Title</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const title = screen.getByText("Dialog Title");
      expect(title).toHaveClass("text-[length:var(--md-sys-typescale-headline-small-size)]");
      expect(title).toHaveClass("leading-[var(--md-sys-typescale-headline-small-line-height)]");
      expect(title).toHaveClass("font-[var(--md-sys-typescale-headline-small-weight)]");
    });

    it("applies MD3 body-medium typography to description", () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Title</DialogTitle>
              <DialogDescription>Description text</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const description = screen.getByText("Description text");
      expect(description).toHaveClass("text-[length:var(--md-sys-typescale-body-medium-size)]");
      expect(description).toHaveClass("leading-[var(--md-sys-typescale-body-medium-line-height)]");
    });

    it("applies MD3 motion easing to animations", () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveClass("data-[state=open]:ease-[var(--md-sys-motion-easing-emphasized-decelerate)]");
      expect(dialog).toHaveClass("data-[state=closed]:ease-[var(--md-sys-motion-easing-emphasized-accelerate)]");
    });
  });

  describe("Accessibility", () => {
    it("has role='dialog'", () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test Dialog</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("has proper dialog role (aria-modal is implicit)", () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test Dialog</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const dialog = screen.getByRole("dialog");
      // Radix Dialog automatically handles modal behavior
      expect(dialog).toBeInTheDocument();
    });

    it("has aria-labelledby pointing to title", () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test Dialog</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const dialog = screen.getByRole("dialog");
      const title = screen.getByText("Test Dialog");

      const labelledBy = dialog.getAttribute("aria-labelledby");
      const titleId = title.getAttribute("id");

      expect(labelledBy).toBeTruthy();
      expect(titleId).toBeTruthy();
      expect(labelledBy).toBe(titleId);
    });

    it("has aria-describedby when description is present", () => {
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
      const description = screen.getByText("Dialog description");

      const describedBy = dialog.getAttribute("aria-describedby");
      const descriptionId = description.getAttribute("id");

      expect(describedBy).toBeTruthy();
      expect(descriptionId).toBeTruthy();
      expect(describedBy).toBe(descriptionId);
    });

    it("close button has accessible label", () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test Dialog</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const closeButton = screen.getByRole("button", { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });

    it("passes axe accessibility tests", async () => {
      const { container } = render(
        <Dialog open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Accessible Dialog</DialogTitle>
              <DialogDescription>This is an accessible dialog</DialogDescription>
            </DialogHeader>
            <DialogBody>Dialog content goes here</DialogBody>
            <DialogFooter>
              <DialogAction>Cancel</DialogAction>
              <DialogAction variant="filled">Confirm</DialogAction>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      const results = await axe(container);
      expect(results.violations).toHaveLength(0);
    });

    it("passes axe accessibility tests with icon", async () => {
      const icon = (
        <svg aria-hidden="true">
          <path d="M0 0h24v24H0z" />
        </svg>
      );
      const { container } = render(
        <Dialog open>
          <DialogContent>
            <DialogHeader icon={icon}>
              <DialogTitle>Dialog with Icon</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const results = await axe(container);
      expect(results.violations).toHaveLength(0);
    });

    it("passes axe accessibility tests in full-screen mode", async () => {
      const { container } = render(
        <Dialog open>
          <DialogContent fullScreen>
            <DialogHeader>
              <DialogTitle>Full Screen Dialog</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const results = await axe(container);
      expect(results.violations).toHaveLength(0);
    });
  });

  describe("Focus Management", () => {
    it("focuses first focusable element when opened", async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test Dialog</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const trigger = screen.getByText("Open");
      await user.click(trigger);

      await waitFor(() => {
        // Radix focuses the first focusable element (close button)
        const closeButton = screen.getByRole("button", { name: /close/i });
        expect(closeButton).toHaveFocus();
      });
    });

    it("traps focus within dialog", async () => {
      const user = userEvent.setup();
      render(
        <Dialog open>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Test Dialog</DialogTitle>
            </DialogHeader>
            <DialogFooter>
              <DialogAction>First Button</DialogAction>
              <DialogAction>Second Button</DialogAction>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      const firstButton = screen.getByRole("button", { name: /first button/i });
      const secondButton = screen.getByRole("button", { name: /second button/i });
      const closeButton = screen.getByRole("button", { name: /close/i });

      // Tab through focusable elements
      await user.tab();
      // First tab should focus one of the buttons
      const focusedElement = document.activeElement;
      expect([closeButton, firstButton, secondButton]).toContain(focusedElement);

      // Continue tabbing
      await user.tab();
      await user.tab();

      // Focus should stay within dialog (not escape to body)
      const finalFocusedElement = document.activeElement;
      expect([closeButton, firstButton, secondButton]).toContain(finalFocusedElement);
    });
  });

  describe("DialogAction Component", () => {
    it("renders with text variant by default", () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogFooter>
              <DialogAction>Action</DialogAction>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      const button = screen.getByRole("button", { name: /action/i });
      expect(button).toHaveClass("bg-transparent");
      expect(button).toHaveClass("text-[hsl(var(--md-sys-color-primary))]");
    });

    it("renders with filled variant", () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogFooter>
              <DialogAction variant="filled">Action</DialogAction>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      const button = screen.getByRole("button", { name: /action/i });
      expect(button).toHaveClass("bg-[hsl(var(--md-sys-color-primary))]");
    });

    it("handles click events", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <Dialog open>
          <DialogContent>
            <DialogFooter>
              <DialogAction onClick={handleClick}>Action</DialogAction>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      const button = screen.getByRole("button", { name: /action/i });
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});
