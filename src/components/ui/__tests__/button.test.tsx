import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { Button } from "../button";

describe("Button", () => {
  describe("Variants", () => {
    it("renders filled variant correctly", () => {
      render(<Button variant="filled">Filled Button</Button>);
      const button = screen.getByRole("button", { name: /filled button/i });

      expect(button).toBeInTheDocument();
      expect(button).toHaveClass("bg-[hsl(var(--md-sys-color-primary))]");
      expect(button).toHaveClass("text-[hsl(var(--md-sys-color-on-primary))]");
    });

    it("renders outlined variant correctly", () => {
      render(<Button variant="outlined">Outlined Button</Button>);
      const button = screen.getByRole("button", { name: /outlined button/i });

      expect(button).toBeInTheDocument();
      expect(button).toHaveClass("border");
      expect(button).toHaveClass("border-[hsl(var(--md-sys-color-outline))]");
      expect(button).toHaveClass("text-[hsl(var(--md-sys-color-primary))]");
    });

    it("renders text variant correctly", () => {
      render(<Button variant="text">Text Button</Button>);
      const button = screen.getByRole("button", { name: /text button/i });

      expect(button).toBeInTheDocument();
      expect(button).toHaveClass("bg-transparent");
      expect(button).toHaveClass("text-[hsl(var(--md-sys-color-primary))]");
    });

    it("renders elevated variant correctly", () => {
      render(<Button variant="elevated">Elevated Button</Button>);
      const button = screen.getByRole("button", { name: /elevated button/i });

      expect(button).toBeInTheDocument();
      expect(button).toHaveClass("bg-[hsl(var(--md-sys-color-surface-container-low))]");
      expect(button).toHaveClass("shadow-[var(--md-sys-elevation-level1)]");
    });

    it("renders tonal variant correctly", () => {
      render(<Button variant="tonal">Tonal Button</Button>);
      const button = screen.getByRole("button", { name: /tonal button/i });

      expect(button).toBeInTheDocument();
      expect(button).toHaveClass("bg-[hsl(var(--md-sys-color-secondary-container))]");
      expect(button).toHaveClass("text-[hsl(var(--md-sys-color-on-secondary-container))]");
    });
  });

  describe("Sizes", () => {
    it("renders small size correctly", () => {
      render(<Button size="small">Small Button</Button>);
      const button = screen.getByRole("button", { name: /small button/i });

      expect(button).toHaveClass("h-10");
      expect(button).toHaveClass("px-3");
    });

    it("renders medium size correctly (default)", () => {
      render(<Button size="medium">Medium Button</Button>);
      const button = screen.getByRole("button", { name: /medium button/i });

      expect(button).toHaveClass("h-10");
      expect(button).toHaveClass("px-6");
    });

    it("renders large size correctly", () => {
      render(<Button size="large">Large Button</Button>);
      const button = screen.getByRole("button", { name: /large button/i });

      expect(button).toHaveClass("h-12");
      expect(button).toHaveClass("px-8");
    });

    it("renders icon size correctly", () => {
      render(
        <Button size="icon" aria-label="Icon button">
          Icon
        </Button>
      );
      const button = screen.getByRole("button", { name: /icon button/i });

      expect(button).toHaveClass("h-10");
      expect(button).toHaveClass("w-10");
    });
  });

  describe("States", () => {
    it("handles disabled state correctly", () => {
      render(<Button disabled>Disabled Button</Button>);
      const button = screen.getByRole("button", { name: /disabled button/i });

      expect(button).toBeDisabled();
      expect(button).toHaveClass("disabled:pointer-events-none");
    });

    it("applies disabled styles for filled variant", () => {
      render(
        <Button variant="filled" disabled>
          Disabled Filled
        </Button>
      );
      const button = screen.getByRole("button", { name: /disabled filled/i });

      expect(button).toBeDisabled();
      expect(button).toHaveClass("disabled:bg-[hsl(var(--md-sys-color-on-surface)/0.12)]");
      expect(button).toHaveClass("disabled:text-[hsl(var(--md-sys-color-on-surface)/0.38)]");
    });

    it("applies disabled styles for outlined variant", () => {
      render(
        <Button variant="outlined" disabled>
          Disabled Outlined
        </Button>
      );
      const button = screen.getByRole("button", { name: /disabled outlined/i });

      expect(button).toBeDisabled();
      expect(button).toHaveClass("disabled:border-[hsl(var(--md-sys-color-on-surface)/0.12)]");
      expect(button).toHaveClass("disabled:text-[hsl(var(--md-sys-color-on-surface)/0.38)]");
    });
  });

  describe("Icons", () => {
    it("renders leading icon correctly", () => {
      const icon = <svg data-testid="test-icon" />;
      render(
        <Button icon={icon} iconPosition="start">
          Button with Icon
        </Button>
      );

      const button = screen.getByRole("button", { name: /button with icon/i });
      const iconElement = screen.getByTestId("test-icon");

      expect(button).toBeInTheDocument();
      expect(iconElement).toBeInTheDocument();

      // Icon should appear before text
      const buttonChildren = Array.from(button.children);
      const iconParent = iconElement.parentElement;
      const textNode = Array.from(button.childNodes).find(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.includes("Button with Icon")
      );

      expect(iconParent).toBeTruthy();
    });

    it("renders trailing icon correctly", () => {
      const icon = <svg data-testid="test-icon" />;
      render(
        <Button icon={icon} iconPosition="end">
          Button with Icon
        </Button>
      );

      const button = screen.getByRole("button", { name: /button with icon/i });
      const iconElement = screen.getByTestId("test-icon");

      expect(button).toBeInTheDocument();
      expect(iconElement).toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    it("handles click events", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Click Me</Button>);
      const button = screen.getByRole("button", { name: /click me/i });

      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("does not trigger click when disabled", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <Button onClick={handleClick} disabled>
          Click Me
        </Button>
      );
      const button = screen.getByRole("button", { name: /click me/i });

      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it("renders ripple container when not disabled", () => {
      const { container } = render(<Button>Button</Button>);

      // Check for ripple container span
      const rippleContainer = container.querySelector("span.absolute.inset-0.overflow-hidden");
      expect(rippleContainer).toBeInTheDocument();
    });

    it("does not render ripple when disableRipple is true", () => {
      const { container } = render(<Button disableRipple>Button</Button>);

      // Check that ripple container is not present
      const rippleContainer = container.querySelector("span.absolute.inset-0.overflow-hidden");
      expect(rippleContainer).not.toBeInTheDocument();
    });
  });

  describe("Props", () => {
    it("applies fullWidth prop correctly", () => {
      render(<Button fullWidth>Full Width Button</Button>);
      const button = screen.getByRole("button", { name: /full width button/i });

      expect(button).toHaveClass("w-full");
    });

    it("applies disableElevation prop correctly", () => {
      render(
        <Button variant="elevated" disableElevation>
          No Elevation
        </Button>
      );
      const button = screen.getByRole("button", { name: /no elevation/i });

      expect(button).toHaveClass("!shadow-none");
      expect(button).toHaveClass("hover:!shadow-none");
    });

    it("applies custom className", () => {
      render(<Button className="custom-class">Custom Button</Button>);
      const button = screen.getByRole("button", { name: /custom button/i });

      expect(button).toHaveClass("custom-class");
    });

    it("forwards ref correctly", () => {
      const ref = vi.fn();
      render(<Button ref={ref}>Button</Button>);

      expect(ref).toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("has proper button role", () => {
      render(<Button>Accessible Button</Button>);
      const button = screen.getByRole("button", { name: /accessible button/i });

      expect(button).toBeInTheDocument();
    });

    it("supports aria-label", () => {
      render(<Button aria-label="Custom label">Button</Button>);
      const button = screen.getByRole("button", { name: /custom label/i });

      expect(button).toHaveAttribute("aria-label", "Custom label");
    });

    it("has aria-disabled when disabled", () => {
      render(<Button disabled>Disabled Button</Button>);
      const button = screen.getByRole("button", { name: /disabled button/i });

      expect(button).toBeDisabled();
    });

    it("has focus-visible styles", () => {
      render(<Button>Focusable Button</Button>);
      const button = screen.getByRole("button", { name: /focusable button/i });

      expect(button).toHaveClass("focus-visible:outline-none");
      expect(button).toHaveClass("focus-visible:ring-2");
    });

    it("passes axe accessibility tests", async () => {
      const { container } = render(<Button>Accessible Button</Button>);
      const results = await axe(container);

      expect(results.violations).toHaveLength(0);
    });

    it("passes axe accessibility tests when disabled", async () => {
      const { container } = render(<Button disabled>Disabled Button</Button>);
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
        <Button icon={icon} iconPosition="start">
          Button with Icon
        </Button>
      );
      const results = await axe(container);

      expect(results.violations).toHaveLength(0);
    });
  });

  describe("MD3 Typography", () => {
    it("applies label-large typography", () => {
      render(<Button>Typography Button</Button>);
      const button = screen.getByRole("button", { name: /typography button/i });

      expect(button).toHaveClass("font-[family-name:var(--md-sys-typescale-label-large-font)]");
      expect(button).toHaveClass("text-[length:var(--md-sys-typescale-label-large-size)]");
      expect(button).toHaveClass("leading-[var(--md-sys-typescale-label-large-line-height)]");
      expect(button).toHaveClass("font-[number:var(--md-sys-typescale-label-large-weight)]");
    });
  });
});
