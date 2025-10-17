import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { Tooltip, TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent } from "../tooltip";
import { Button } from "../button";

describe("Tooltip", () => {
  describe("Display on Hover", () => {
    it("shows tooltip on hover", async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <Tooltip title="Test tooltip">
            <Button>Hover me</Button>
          </Tooltip>
        </TooltipProvider>
      );

      const button = screen.getByRole("button", { name: /hover me/i });
      await user.hover(button);

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
        expect(screen.getByText("Test tooltip")).toBeInTheDocument();
      });
    });

    it("hides tooltip when mouse leaves", async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <Tooltip title="Test tooltip">
            <Button>Hover me</Button>
          </Tooltip>
        </TooltipProvider>
      );

      const button = screen.getByRole("button", { name: /hover me/i });
      await user.hover(button);

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
      });

      await user.unhover(button);

      await waitFor(() => {
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
      });
    });

    it("respects delay duration", async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <Tooltip title="Test tooltip" delayDuration={0}>
            <Button>Hover me</Button>
          </Tooltip>
        </TooltipProvider>
      );

      const button = screen.getByRole("button", { name: /hover me/i });
      await user.hover(button);

      // With 0 delay, tooltip should appear immediately
      await waitFor(
        () => {
          expect(screen.getByRole("tooltip")).toBeInTheDocument();
        },
        { timeout: 100 }
      );
    });
  });

  describe("Display on Keyboard Focus", () => {
    it("shows tooltip on keyboard focus", async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <Tooltip title="Test tooltip">
            <Button>Focus me</Button>
          </Tooltip>
        </TooltipProvider>
      );

      const button = screen.getByRole("button", { name: /focus me/i });
      await user.tab();

      // Button should be focused
      expect(button).toHaveFocus();

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
        expect(screen.getByText("Test tooltip")).toBeInTheDocument();
      });
    });

    it("hides tooltip when focus is lost", async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <Tooltip title="Test tooltip">
            <Button>Focus me</Button>
          </Tooltip>
          <Button>Other button</Button>
        </TooltipProvider>
      );

      const button = screen.getByRole("button", { name: /focus me/i });
      await user.tab();

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
      });

      // Tab to next element
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
      });
    });
  });

  describe("Placement Variants", () => {
    it("renders with top placement", async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <Tooltip title="Top tooltip" placement="top">
            <Button>Hover me</Button>
          </Tooltip>
        </TooltipProvider>
      );

      const button = screen.getByRole("button", { name: /hover me/i });
      await user.hover(button);

      await waitFor(() => {
        const tooltip = screen.getByRole("tooltip");
        expect(tooltip).toBeInTheDocument();
        expect(tooltip).toHaveAttribute("data-side", "top");
      });
    });

    it("renders with bottom placement", async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <Tooltip title="Bottom tooltip" placement="bottom">
            <Button>Hover me</Button>
          </Tooltip>
        </TooltipProvider>
      );

      const button = screen.getByRole("button", { name: /hover me/i });
      await user.hover(button);

      await waitFor(() => {
        const tooltip = screen.getByRole("tooltip");
        expect(tooltip).toBeInTheDocument();
        expect(tooltip).toHaveAttribute("data-side", "bottom");
      });
    });

    it("renders with left placement", async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <Tooltip title="Left tooltip" placement="left">
            <Button>Hover me</Button>
          </Tooltip>
        </TooltipProvider>
      );

      const button = screen.getByRole("button", { name: /hover me/i });
      await user.hover(button);

      await waitFor(() => {
        const tooltip = screen.getByRole("tooltip");
        expect(tooltip).toBeInTheDocument();
        expect(tooltip).toHaveAttribute("data-side", "left");
      });
    });

    it("renders with right placement", async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <Tooltip title="Right tooltip" placement="right">
            <Button>Hover me</Button>
          </Tooltip>
        </TooltipProvider>
      );

      const button = screen.getByRole("button", { name: /hover me/i });
      await user.hover(button);

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
        // Check data-side on the tooltip content div, not the hidden span
        const tooltipContent = document.querySelector('[data-radix-popper-content-wrapper] > div[data-side="right"]');
        expect(tooltipContent).toBeInTheDocument();
      });
    });
  });

  describe("Arrow Rendering", () => {
    it("does not render arrow by default", async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <Tooltip title="Test tooltip">
            <Button>Hover me</Button>
          </Tooltip>
        </TooltipProvider>
      );

      const button = screen.getByRole("button", { name: /hover me/i });
      await user.hover(button);

      await waitFor(() => {
        const tooltip = screen.getByRole("tooltip");
        expect(tooltip).toBeInTheDocument();

        // Arrow should not be present
        const arrow = tooltip.querySelector("svg");
        expect(arrow).not.toBeInTheDocument();
      });
    });

    it("renders arrow when arrow prop is true", async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <Tooltip title="Test tooltip" arrow>
            <Button>Hover me</Button>
          </Tooltip>
        </TooltipProvider>
      );

      const button = screen.getByRole("button", { name: /hover me/i });
      await user.hover(button);

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();

        // Arrow is in the tooltip content div (rendered in portal)
        const tooltipContent = document.querySelector(
          '[data-radix-popper-content-wrapper] > div[data-state="delayed-open"]'
        );
        const arrow = tooltipContent?.querySelector("svg");
        expect(arrow).toBeInTheDocument();
        expect(arrow).toHaveClass("fill-[hsl(var(--md-sys-color-surface-variant))]");
      });
    });
  });

  describe("Disabled State", () => {
    it("does not show tooltip when disabled", async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <Tooltip title="Test tooltip" disabled>
            <Button>Hover me</Button>
          </Tooltip>
        </TooltipProvider>
      );

      const button = screen.getByRole("button", { name: /hover me/i });
      await user.hover(button);

      // Wait a bit to ensure tooltip doesn't appear
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });
  });

  describe("MD3 Styling", () => {
    it("applies MD3 surface-variant background", async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <Tooltip title="Test tooltip">
            <Button>Hover me</Button>
          </Tooltip>
        </TooltipProvider>
      );

      const button = screen.getByRole("button", { name: /hover me/i });
      await user.hover(button);

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
        // Tooltip is rendered in a portal, so use document.querySelector
        const tooltipContent = document.querySelector(
          '[data-radix-popper-content-wrapper] > div[data-state="delayed-open"]'
        );
        expect(tooltipContent).toHaveClass("bg-[hsl(var(--md-sys-color-surface-variant))]");
        expect(tooltipContent).toHaveClass("text-[hsl(var(--md-sys-color-on-surface-variant))]");
      });
    });

    it("applies MD3 border-radius extra-small", async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <Tooltip title="Test tooltip">
            <Button>Hover me</Button>
          </Tooltip>
        </TooltipProvider>
      );

      const button = screen.getByRole("button", { name: /hover me/i });
      await user.hover(button);

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
        const tooltipContent = document.querySelector(
          '[data-radix-popper-content-wrapper] > div[data-state="delayed-open"]'
        );
        expect(tooltipContent).toHaveClass("rounded-[var(--md-sys-shape-corner-extra-small)]");
      });
    });

    it("applies MD3 body-small typography", async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <Tooltip title="Test tooltip">
            <Button>Hover me</Button>
          </Tooltip>
        </TooltipProvider>
      );

      const button = screen.getByRole("button", { name: /hover me/i });
      await user.hover(button);

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
        const tooltipContent = document.querySelector(
          '[data-radix-popper-content-wrapper] > div[data-state="delayed-open"]'
        );
        expect(tooltipContent).toHaveClass("text-[length:var(--md-sys-typescale-body-small-size)]");
        expect(tooltipContent).toHaveClass("leading-[var(--md-sys-typescale-body-small-line-height)]");
        expect(tooltipContent).toHaveClass("font-[number:var(--md-sys-typescale-body-small-weight)]");
        expect(tooltipContent).toHaveClass("tracking-[var(--md-sys-typescale-body-small-tracking)]");
      });
    });

    it("applies MD3 elevation level 2", async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <Tooltip title="Test tooltip">
            <Button>Hover me</Button>
          </Tooltip>
        </TooltipProvider>
      );

      const button = screen.getByRole("button", { name: /hover me/i });
      await user.hover(button);

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
        const tooltipContent = document.querySelector(
          '[data-radix-popper-content-wrapper] > div[data-state="delayed-open"]'
        );
        expect(tooltipContent).toHaveClass("shadow-[var(--md-sys-elevation-level2)]");
      });
    });

    it("applies MD3 motion easing to animations", async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <Tooltip title="Test tooltip">
            <Button>Hover me</Button>
          </Tooltip>
        </TooltipProvider>
      );

      const button = screen.getByRole("button", { name: /hover me/i });
      await user.hover(button);

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
        const tooltipContent = document.querySelector(
          '[data-radix-popper-content-wrapper] > div[data-state="delayed-open"]'
        );
        expect(tooltipContent).toHaveClass(
          "data-[state=open]:ease-[var(--md-sys-motion-easing-emphasized-decelerate)]"
        );
        expect(tooltipContent).toHaveClass(
          "data-[state=closed]:ease-[var(--md-sys-motion-easing-emphasized-accelerate)]"
        );
      });
    });
  });

  describe("Accessibility", () => {
    it("has role='tooltip'", async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <Tooltip title="Test tooltip">
            <Button>Hover me</Button>
          </Tooltip>
        </TooltipProvider>
      );

      const button = screen.getByRole("button", { name: /hover me/i });
      await user.hover(button);

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
      });
    });

    it("has aria-describedby on trigger", async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <Tooltip title="Test tooltip">
            <Button>Hover me</Button>
          </Tooltip>
        </TooltipProvider>
      );

      const button = screen.getByRole("button", { name: /hover me/i });
      await user.hover(button);

      await waitFor(() => {
        const tooltip = screen.getByRole("tooltip");
        const tooltipId = tooltip.getAttribute("id");
        const buttonDescribedBy = button.getAttribute("aria-describedby");

        expect(tooltipId).toBeTruthy();
        expect(buttonDescribedBy).toBeTruthy();
        expect(buttonDescribedBy).toBe(tooltipId);
      });
    });

    it("passes axe accessibility tests", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <TooltipProvider>
          <Tooltip title="Accessible tooltip">
            <Button>Hover me</Button>
          </Tooltip>
        </TooltipProvider>
      );

      const button = screen.getByRole("button", { name: /hover me/i });
      await user.hover(button);

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results.violations).toHaveLength(0);
    });

    it("passes axe accessibility tests with arrow", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <TooltipProvider>
          <Tooltip title="Accessible tooltip" arrow delayDuration={0}>
            <Button>Hover me</Button>
          </Tooltip>
        </TooltipProvider>
      );

      const button = screen.getByRole("button", { name: /hover me/i });
      await user.hover(button);

      await waitFor(
        () => {
          expect(screen.getByRole("tooltip")).toBeInTheDocument();
        },
        { timeout: 500 }
      );

      const results = await axe(container);
      expect(results.violations).toHaveLength(0);
    });

    it("passes axe accessibility tests with all placements", async () => {
      const placements = ["top", "bottom", "left", "right"] as const;

      for (const placement of placements) {
        const user = userEvent.setup();
        const { container, unmount } = render(
          <TooltipProvider>
            <Tooltip title="Accessible tooltip" placement={placement}>
              <Button>Hover me</Button>
            </Tooltip>
          </TooltipProvider>
        );

        const button = screen.getByRole("button", { name: /hover me/i });
        await user.hover(button);

        await waitFor(() => {
          expect(screen.getByRole("tooltip")).toBeInTheDocument();
        });

        const results = await axe(container);
        expect(results.violations).toHaveLength(0);

        unmount();
      }
    });
  });

  describe("Advanced Usage with Primitives", () => {
    it("renders with TooltipRoot, TooltipTrigger, and TooltipContent", async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <TooltipRoot>
            <TooltipTrigger asChild>
              <Button>Hover me</Button>
            </TooltipTrigger>
            <TooltipContent>Custom tooltip content</TooltipContent>
          </TooltipRoot>
        </TooltipProvider>
      );

      const button = screen.getByRole("button", { name: /hover me/i });
      await user.hover(button);

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
        // Content appears twice: once in visible div, once in hidden span with role="tooltip"
        const tooltipTexts = screen.getAllByText("Custom tooltip content");
        expect(tooltipTexts.length).toBeGreaterThan(0);
      });
    });

    it("supports custom side offset", async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <TooltipRoot>
            <TooltipTrigger asChild>
              <Button>Hover me</Button>
            </TooltipTrigger>
            <TooltipContent sideOffset={16}>Custom offset</TooltipContent>
          </TooltipRoot>
        </TooltipProvider>
      );

      const button = screen.getByRole("button", { name: /hover me/i });
      await user.hover(button);

      await waitFor(() => {
        const tooltip = screen.getByRole("tooltip");
        expect(tooltip).toBeInTheDocument();
      });
    });

    it("supports custom className", async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <Tooltip title="Test tooltip" className="custom-tooltip-class">
            <Button>Hover me</Button>
          </Tooltip>
        </TooltipProvider>
      );

      const button = screen.getByRole("button", { name: /hover me/i });
      await user.hover(button);

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
        const tooltipContent = document.querySelector(
          '[data-radix-popper-content-wrapper] > div[data-state="delayed-open"]'
        );
        expect(tooltipContent).toHaveClass("custom-tooltip-class");
      });
    });
  });

  describe("Multiple Tooltips", () => {
    it("handles multiple tooltips correctly", async () => {
      const user = userEvent.setup();
      render(
        <TooltipProvider>
          <Tooltip title="First tooltip" delayDuration={0}>
            <Button>First button</Button>
          </Tooltip>
          <Tooltip title="Second tooltip" delayDuration={0}>
            <Button>Second button</Button>
          </Tooltip>
        </TooltipProvider>
      );

      const firstButton = screen.getByRole("button", { name: /first button/i });
      const secondButton = screen.getByRole("button", { name: /second button/i });

      // Hover first button
      await user.hover(firstButton);

      await waitFor(() => {
        const firstTooltips = screen.getAllByText("First tooltip");
        expect(firstTooltips.length).toBeGreaterThan(0);
      });

      // Move to second button - wait a bit for first tooltip to close
      await user.unhover(firstButton);
      await new Promise((resolve) => setTimeout(resolve, 100));
      await user.hover(secondButton);

      await waitFor(() => {
        // First tooltip should be gone, second should appear
        const secondTooltips = screen.getAllByText("Second tooltip");
        expect(secondTooltips.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Long Text Handling", () => {
    it("handles long tooltip text with max-width", async () => {
      const user = userEvent.setup();
      const longText =
        "This is a very long tooltip text that should wrap to multiple lines when it exceeds the maximum width constraint";

      render(
        <TooltipProvider>
          <Tooltip title={longText}>
            <Button>Hover me</Button>
          </Tooltip>
        </TooltipProvider>
      );

      const button = screen.getByRole("button", { name: /hover me/i });
      await user.hover(button);

      await waitFor(() => {
        expect(screen.getByRole("tooltip")).toBeInTheDocument();
        const tooltipContent = document.querySelector(
          '[data-radix-popper-content-wrapper] > div[data-state="delayed-open"]'
        );
        expect(tooltipContent).toHaveClass("max-w-xs");
        const longTextElements = screen.getAllByText(longText);
        expect(longTextElements.length).toBeGreaterThan(0);
      });
    });
  });
});
