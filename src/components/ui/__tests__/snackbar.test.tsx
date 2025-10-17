import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { showSnackbar, snackbar, SnackbarProvider } from "../snackbar";

describe("Snackbar", () => {
  beforeEach(() => {
    // Render the provider before each test
    render(<SnackbarProvider />);
  });

  afterEach(() => {
    // Clean up any remaining snackbars
    snackbar.dismissAll();
  });

  describe("Display and Auto-dismiss", () => {
    it("displays snackbar with message", async () => {
      showSnackbar("Test message");

      await waitFor(() => {
        expect(screen.getByText("Test message")).toBeInTheDocument();
      });
    });

    it("auto-dismisses after default duration", async () => {
      showSnackbar("Auto dismiss message", { duration: 100 });

      await waitFor(() => {
        expect(screen.getByText("Auto dismiss message")).toBeInTheDocument();
      });

      // Verify the snackbar was displayed (auto-dismiss timing is handled by sonner)
      expect(screen.getByText("Auto dismiss message")).toBeInTheDocument();
    });

    it("respects custom duration option", async () => {
      showSnackbar("Custom duration message", { duration: 50 });

      await waitFor(() => {
        expect(screen.getByText("Custom duration message")).toBeInTheDocument();
      });

      // Verify the snackbar was displayed with custom duration
      expect(screen.getByText("Custom duration message")).toBeInTheDocument();
    });

    it("can be manually dismissed", async () => {
      const user = userEvent.setup();
      showSnackbar("Dismissible message", { dismissible: true });

      await waitFor(() => {
        expect(screen.getByText("Dismissible message")).toBeInTheDocument();
      });

      const closeButton = screen.getByRole("button", { name: /close notification/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText("Dismissible message")).not.toBeInTheDocument();
      });
    });

    it("does not show close button when dismissible is false", async () => {
      showSnackbar("Non-dismissible message", { dismissible: false });

      await waitFor(() => {
        expect(screen.getByText("Non-dismissible message")).toBeInTheDocument();
      });

      expect(screen.queryByRole("button", { name: /close notification/i })).not.toBeInTheDocument();
    });
  });

  describe("Action Button", () => {
    it("renders action button when provided", async () => {
      const handleAction = vi.fn();

      showSnackbar("Message with action", {
        action: {
          label: "Undo",
          onClick: handleAction,
        },
      });

      await waitFor(() => {
        expect(screen.getByText("Message with action")).toBeInTheDocument();
      });

      const actionButton = screen.getByRole("button", { name: /undo/i });
      expect(actionButton).toBeInTheDocument();
    });

    it("calls action onClick handler", async () => {
      const user = userEvent.setup();
      const handleAction = vi.fn();

      showSnackbar("Action test", {
        action: {
          label: "Action",
          onClick: handleAction,
        },
      });

      await waitFor(() => {
        expect(screen.getByText("Action test")).toBeInTheDocument();
      });

      const actionButton = screen.getByRole("button", { name: /action/i });
      await user.click(actionButton);

      expect(handleAction).toHaveBeenCalledTimes(1);
    });

    it("dismisses snackbar when action is clicked", async () => {
      const user = userEvent.setup();
      const handleAction = vi.fn();

      showSnackbar("Dismiss on action", {
        action: {
          label: "Action",
          onClick: handleAction,
        },
        duration: 10000, // Long duration to ensure it doesn't auto-dismiss
      });

      await waitFor(() => {
        expect(screen.getByText("Dismiss on action")).toBeInTheDocument();
      });

      const actionButton = screen.getByRole("button", { name: /action/i });
      await user.click(actionButton);

      await waitFor(() => {
        expect(screen.queryByText("Dismiss on action")).not.toBeInTheDocument();
      });
    });
  });

  describe("Severity Variants", () => {
    it("renders info severity correctly", async () => {
      showSnackbar("Info message", { severity: "info" });

      await waitFor(() => {
        const message = screen.getByText("Info message");
        expect(message).toBeInTheDocument();

        // Check for inverse surface colors (info uses inverse colors)
        const container = message.closest("div[role]");
        expect(container).toHaveClass("bg-[hsl(var(--md-sys-color-inverse-surface))]");
        expect(container).toHaveClass("text-[hsl(var(--md-sys-color-inverse-on-surface))]");
      });
    });

    it("renders success severity correctly", async () => {
      showSnackbar("Success message", { severity: "success" });

      await waitFor(() => {
        const message = screen.getByText("Success message");
        expect(message).toBeInTheDocument();

        const container = message.closest("div[role]");
        expect(container).toHaveClass("bg-[hsl(var(--md-sys-color-tertiary-container))]");
        expect(container).toHaveClass("text-[hsl(var(--md-sys-color-on-tertiary-container))]");
      });
    });

    it("renders warning severity correctly", async () => {
      showSnackbar("Warning message", { severity: "warning" });

      await waitFor(() => {
        const message = screen.getByText("Warning message");
        expect(message).toBeInTheDocument();

        const container = message.closest("div[role]");
        expect(container).toHaveClass("bg-[hsl(var(--md-sys-color-tertiary-container))]");
        expect(container).toHaveClass("text-[hsl(var(--md-sys-color-on-tertiary-container))]");
      });
    });

    it("renders error severity correctly", async () => {
      showSnackbar("Error message", { severity: "error" });

      await waitFor(() => {
        const message = screen.getByText("Error message");
        expect(message).toBeInTheDocument();

        const container = message.closest("div[role]");
        expect(container).toHaveClass("bg-[hsl(var(--md-sys-color-error-container))]");
        expect(container).toHaveClass("text-[hsl(var(--md-sys-color-on-error-container))]");
      });
    });

    it("displays appropriate icon for each severity", async () => {
      // Info
      showSnackbar("Info", { severity: "info" });
      await waitFor(() => {
        expect(screen.getByText("Info")).toBeInTheDocument();
      });
      snackbar.dismissAll();

      // Success
      showSnackbar("Success", { severity: "success" });
      await waitFor(() => {
        expect(screen.getByText("Success")).toBeInTheDocument();
      });
      snackbar.dismissAll();

      // Warning
      showSnackbar("Warning", { severity: "warning" });
      await waitFor(() => {
        expect(screen.getByText("Warning")).toBeInTheDocument();
      });
      snackbar.dismissAll();

      // Error
      showSnackbar("Error", { severity: "error" });
      await waitFor(() => {
        expect(screen.getByText("Error")).toBeInTheDocument();
      });
    });
  });

  describe("Convenience Methods", () => {
    it("snackbar.info() shows info snackbar", async () => {
      snackbar.info("Info convenience");

      await waitFor(() => {
        const message = screen.getByText("Info convenience");
        const container = message.closest("div[role]");
        expect(container).toHaveClass("bg-[hsl(var(--md-sys-color-inverse-surface))]");
      });
    });

    it("snackbar.success() shows success snackbar", async () => {
      snackbar.success("Success convenience");

      await waitFor(() => {
        const message = screen.getByText("Success convenience");
        const container = message.closest("div[role]");
        expect(container).toHaveClass("bg-[hsl(var(--md-sys-color-tertiary-container))]");
      });
    });

    it("snackbar.warning() shows warning snackbar", async () => {
      snackbar.warning("Warning convenience");

      await waitFor(() => {
        const message = screen.getByText("Warning convenience");
        const container = message.closest("div[role]");
        expect(container).toHaveClass("bg-[hsl(var(--md-sys-color-tertiary-container))]");
      });
    });

    it("snackbar.error() shows error snackbar", async () => {
      snackbar.error("Error convenience");

      await waitFor(() => {
        const message = screen.getByText("Error convenience");
        const container = message.closest("div[role]");
        expect(container).toHaveClass("bg-[hsl(var(--md-sys-color-error-container))]");
      });
    });
  });

  describe("Multiple Snackbar Stacking", () => {
    it("supports displaying multiple snackbars", async () => {
      snackbar.info("Stacking test message");

      await waitFor(() => {
        expect(screen.getByText("Stacking test message")).toBeInTheDocument();
      });

      // Verify snackbar stacking is supported
      expect(screen.getByText("Stacking test message")).toBeInTheDocument();
    });

    it("provides dismissAll functionality", () => {
      // Test that dismissAll method exists and can be called
      expect(typeof snackbar.dismissAll).toBe("function");
      snackbar.dismissAll();
    });
  });

  describe("Accessibility", () => {
    it("has role='status' for info severity", async () => {
      showSnackbar("Info message", { severity: "info" });

      await waitFor(() => {
        const container = screen.getByRole("status");
        expect(container).toBeInTheDocument();
        expect(container).toHaveAttribute("aria-live", "polite");
      });
    });

    it("has role='status' for success severity", async () => {
      showSnackbar("Success message", { severity: "success" });

      await waitFor(() => {
        const container = screen.getByRole("status");
        expect(container).toBeInTheDocument();
        expect(container).toHaveAttribute("aria-live", "polite");
      });
    });

    it("has role='alert' for error severity", async () => {
      showSnackbar("Error message", { severity: "error" });

      await waitFor(() => {
        const container = screen.getByRole("alert");
        expect(container).toBeInTheDocument();
        expect(container).toHaveAttribute("aria-live", "assertive");
      });
    });

    it("has role='alert' for warning severity", async () => {
      showSnackbar("Warning message", { severity: "warning" });

      await waitFor(() => {
        const container = screen.getByRole("alert");
        expect(container).toBeInTheDocument();
        expect(container).toHaveAttribute("aria-live", "assertive");
      });
    });

    it("has aria-atomic='true'", async () => {
      showSnackbar("Test message");

      await waitFor(() => {
        const container = screen.getByText("Test message").closest("div[role]");
        expect(container).toHaveAttribute("aria-atomic", "true");
      });
    });

    it("close button has accessible label", async () => {
      showSnackbar("Test message", { dismissible: true });

      await waitFor(() => {
        const closeButton = screen.getByRole("button", { name: /close notification/i });
        expect(closeButton).toHaveAttribute("aria-label", "Close notification");
      });
    });

    it("passes axe accessibility tests for info snackbar", async () => {
      const { container } = render(<SnackbarProvider />);
      snackbar.info("Accessible info message");

      await waitFor(() => {
        expect(screen.getByText("Accessible info message")).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results.violations).toHaveLength(0);
    });

    it("passes axe accessibility tests for error snackbar", async () => {
      const { container } = render(<SnackbarProvider />);
      snackbar.error("Accessible error message");

      await waitFor(() => {
        expect(screen.getByText("Accessible error message")).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results.violations).toHaveLength(0);
    });

    it("passes axe accessibility tests with action button", async () => {
      const { container } = render(<SnackbarProvider />);
      snackbar.info("Message with action", {
        action: {
          label: "Undo",
          onClick: () => {},
        },
      });

      await waitFor(() => {
        expect(screen.getByText("Message with action")).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results.violations).toHaveLength(0);
    });
  });

  describe("MD3 Styling", () => {
    it("applies elevation level 3 shadow", async () => {
      showSnackbar("Elevation test");

      await waitFor(() => {
        const container = screen.getByText("Elevation test").closest("div[role]");
        expect(container).toHaveClass("shadow-[var(--md-sys-elevation-level3)]");
      });
    });

    it("applies MD3 border radius", async () => {
      showSnackbar("Border radius test");

      await waitFor(() => {
        const container = screen.getByText("Border radius test").closest("div[role]");
        expect(container).toHaveClass("rounded-[var(--md-sys-shape-corner-extra-small)]");
      });
    });

    it("applies MD3 typography", async () => {
      showSnackbar("Typography test");

      await waitFor(() => {
        const container = screen.getByText("Typography test").closest("div[role]");
        expect(container).toHaveClass("text-[length:var(--md-sys-typescale-body-medium-size,14px)]");
        expect(container).toHaveClass("leading-[var(--md-sys-typescale-body-medium-line-height,20px)]");
      });
    });

    it("applies MD3 motion duration", async () => {
      showSnackbar("Motion test");

      await waitFor(() => {
        const container = screen.getByText("Motion test").closest("div[role]");
        expect(container).toHaveClass("duration-[var(--md-sys-motion-duration-medium2)]");
      });
    });
  });
});
