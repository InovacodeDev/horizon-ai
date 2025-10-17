import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { Chip } from "../chip";

describe("Chip", () => {
  describe("Variants", () => {
    it("renders assist variant correctly", () => {
      render(<Chip variant="assist" label="Assist Chip" />);
      const chip = screen.getByRole("button", { name: /assist chip/i });

      expect(chip).toBeInTheDocument();
      expect(chip).toHaveClass("bg-[hsl(var(--md-sys-color-surface-container-low))]");
      expect(chip).toHaveClass("text-[hsl(var(--md-sys-color-on-surface))]");
      expect(chip).toHaveClass("shadow-[var(--md-sys-elevation-level1)]");
    });

    it("renders filter variant correctly", () => {
      render(<Chip variant="filter" label="Filter Chip" />);
      const chip = screen.getByRole("checkbox", { name: /filter chip/i });

      expect(chip).toBeInTheDocument();
      expect(chip).toHaveClass("border");
      expect(chip).toHaveClass("border-[hsl(var(--md-sys-color-outline))]");
      expect(chip).toHaveClass("text-[hsl(var(--md-sys-color-on-surface-variant))]");
    });

    it("renders input variant correctly", () => {
      render(<Chip variant="input" label="Input Chip" onDelete={vi.fn()} />);
      const chip = screen.getByText(/input chip/i).parentElement;

      expect(chip).toBeInTheDocument();
      expect(chip).toHaveClass("bg-[hsl(var(--md-sys-color-surface-container-highest))]");
      expect(chip).toHaveClass("text-[hsl(var(--md-sys-color-on-surface-variant))]");
    });

    it("renders suggestion variant correctly", () => {
      render(<Chip variant="suggestion" label="Suggestion Chip" onDelete={vi.fn()} />);
      const chip = screen.getByRole("button", { name: /suggestion chip/i });

      expect(chip).toBeInTheDocument();
      expect(chip).toHaveClass("bg-[hsl(var(--md-sys-color-surface-container-low))]");
      expect(chip).toHaveClass("text-[hsl(var(--md-sys-color-on-surface-variant))]");
      expect(chip).toHaveClass("shadow-[var(--md-sys-elevation-level1)]");
    });
  });

  describe("Selected State", () => {
    it("renders filter chip in unselected state", () => {
      render(<Chip variant="filter" label="Filter Chip" selected={false} />);
      const chip = screen.getByRole("checkbox", { name: /filter chip/i });

      expect(chip).toHaveAttribute("data-selected", "false");
      expect(chip).toHaveAttribute("aria-checked", "false");
      expect(chip).toHaveClass("border-[hsl(var(--md-sys-color-outline))]");
    });

    it("renders filter chip in selected state", () => {
      render(<Chip variant="filter" label="Filter Chip" selected={true} />);
      const chip = screen.getByRole("checkbox", { name: /filter chip/i });

      expect(chip).toHaveAttribute("data-selected", "true");
      expect(chip).toHaveAttribute("aria-checked", "true");
      expect(chip).toHaveClass("data-[selected=true]:bg-[hsl(var(--md-sys-color-secondary-container))]");
      expect(chip).toHaveClass("data-[selected=true]:text-[hsl(var(--md-sys-color-on-secondary-container))]");
    });

    it("toggles selected state on click for filter variant", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Chip variant="filter" label="Filter Chip" onClick={handleClick} />);
      const chip = screen.getByRole("checkbox", { name: /filter chip/i });

      await user.click(chip);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("Delete Functionality", () => {
    it("renders delete button when onDelete is provided", () => {
      const handleDelete = vi.fn();
      render(<Chip variant="input" label="Input Chip" onDelete={handleDelete} />);

      const deleteButton = screen.getByRole("button", { name: /remove/i });
      expect(deleteButton).toBeInTheDocument();
    });

    it("does not render delete button when onDelete is not provided", () => {
      render(<Chip variant="assist" label="Assist Chip" />);

      const deleteButton = screen.queryByRole("button", { name: /remove/i });
      expect(deleteButton).not.toBeInTheDocument();
    });

    it("calls onDelete when delete button is clicked", async () => {
      const handleDelete = vi.fn();
      const user = userEvent.setup();

      render(<Chip variant="input" label="Input Chip" onDelete={handleDelete} />);
      const deleteButton = screen.getByRole("button", { name: /remove/i });

      await user.click(deleteButton);

      expect(handleDelete).toHaveBeenCalledTimes(1);
    });

    it("does not trigger chip onClick when delete button is clicked", async () => {
      const handleClick = vi.fn();
      const handleDelete = vi.fn();
      const user = userEvent.setup();

      render(<Chip variant="input" label="Input Chip" onClick={handleClick} onDelete={handleDelete} />);
      const deleteButton = screen.getByRole("button", { name: /remove/i });

      await user.click(deleteButton);

      expect(handleDelete).toHaveBeenCalledTimes(1);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe("Disabled State", () => {
    it("handles disabled state correctly", () => {
      render(<Chip variant="assist" label="Disabled Chip" disabled />);
      const chip = screen.getByRole("button", { name: /disabled chip/i });

      expect(chip).toBeDisabled();
      expect(chip).toHaveAttribute("aria-disabled", "true");
    });

    it("applies disabled styles for assist variant", () => {
      render(<Chip variant="assist" label="Disabled Assist" disabled />);
      const chip = screen.getByRole("button", { name: /disabled assist/i });

      expect(chip).toBeDisabled();
      expect(chip).toHaveClass("disabled:bg-[hsl(var(--md-sys-color-on-surface)/0.12)]");
      expect(chip).toHaveClass("disabled:text-[hsl(var(--md-sys-color-on-surface)/0.38)]");
    });

    it("applies disabled styles for filter variant", () => {
      render(<Chip variant="filter" label="Disabled Filter" disabled />);
      const chip = screen.getByRole("checkbox", { name: /disabled filter/i });

      expect(chip).toBeDisabled();
      expect(chip).toHaveClass("disabled:border-[hsl(var(--md-sys-color-on-surface)/0.12)]");
      expect(chip).toHaveClass("disabled:text-[hsl(var(--md-sys-color-on-surface)/0.38)]");
    });

    it("does not trigger onClick when disabled", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Chip variant="assist" label="Disabled Chip" onClick={handleClick} disabled />);
      const chip = screen.getByRole("button", { name: /disabled chip/i });

      await user.click(chip);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it("disables delete button when chip is disabled", () => {
      const handleDelete = vi.fn();
      render(<Chip variant="input" label="Disabled Chip" onDelete={handleDelete} disabled />);

      const deleteButton = screen.getByRole("button", { name: /remove/i });
      expect(deleteButton).toBeDisabled();
    });
  });

  describe("Icons and Avatars", () => {
    it("renders leading icon correctly", () => {
      const icon = <svg data-testid="test-icon" />;
      render(<Chip variant="assist" label="Chip with Icon" icon={icon} />);

      const iconElement = screen.getByTestId("test-icon");
      expect(iconElement).toBeInTheDocument();
    });

    it("renders avatar correctly", () => {
      const avatar = <img data-testid="test-avatar" src="/avatar.jpg" alt="Avatar" />;
      render(<Chip variant="input" label="Chip with Avatar" avatar={avatar} />);

      const avatarElement = screen.getByTestId("test-avatar");
      expect(avatarElement).toBeInTheDocument();
    });

    it("prioritizes avatar over icon when both are provided", () => {
      const icon = <svg data-testid="test-icon" />;
      const avatar = <img data-testid="test-avatar" src="/avatar.jpg" alt="Avatar" />;
      render(<Chip variant="input" label="Chip" icon={icon} avatar={avatar} />);

      const avatarElement = screen.getByTestId("test-avatar");
      const iconElement = screen.queryByTestId("test-icon");

      expect(avatarElement).toBeInTheDocument();
      expect(iconElement).not.toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    it("handles click events", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Chip variant="assist" label="Click Me" onClick={handleClick} />);
      const chip = screen.getByRole("button", { name: /click me/i });

      await user.click(chip);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("renders as non-interactive when no onClick is provided", () => {
      render(<Chip variant="input" label="Static Chip" onDelete={vi.fn()} />);

      // Should not have button role when not interactive
      const chip = screen.queryByRole("button", { name: /static chip/i });
      expect(chip).not.toBeInTheDocument();

      // Should have status role instead
      const statusElement = screen.getByRole("status");
      expect(statusElement).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper button role for interactive chips", () => {
      render(<Chip variant="assist" label="Accessible Chip" onClick={vi.fn()} />);
      const chip = screen.getByRole("button", { name: /accessible chip/i });

      expect(chip).toBeInTheDocument();
    });

    it("has proper checkbox role for filter chips", () => {
      render(<Chip variant="filter" label="Filter Chip" />);
      const chip = screen.getByRole("checkbox", { name: /filter chip/i });

      expect(chip).toBeInTheDocument();
    });

    it("has aria-checked attribute for filter chips", () => {
      render(<Chip variant="filter" label="Filter Chip" selected={true} />);
      const chip = screen.getByRole("checkbox", { name: /filter chip/i });

      expect(chip).toHaveAttribute("aria-checked", "true");
    });

    it("has aria-disabled when disabled", () => {
      render(<Chip variant="assist" label="Disabled Chip" disabled />);
      const chip = screen.getByRole("button", { name: /disabled chip/i });

      expect(chip).toHaveAttribute("aria-disabled", "true");
    });

    it("delete button has proper aria-label", () => {
      render(<Chip variant="input" label="Input Chip" onDelete={vi.fn()} />);
      const deleteButton = screen.getByRole("button", { name: /remove/i });

      expect(deleteButton).toHaveAttribute("aria-label", "Remove");
    });

    it("has focus-visible styles", () => {
      render(<Chip variant="assist" label="Focusable Chip" onClick={vi.fn()} />);
      const chip = screen.getByRole("button", { name: /focusable chip/i });

      expect(chip).toHaveClass("focus-visible:outline-none");
      expect(chip).toHaveClass("focus-visible:ring-2");
    });

    it("passes axe accessibility tests for assist variant", async () => {
      const { container } = render(<Chip variant="assist" label="Accessible Chip" onClick={vi.fn()} />);
      const results = await axe(container);

      expect(results.violations).toHaveLength(0);
    });

    it("passes axe accessibility tests for filter variant", async () => {
      const { container } = render(<Chip variant="filter" label="Filter Chip" selected={false} />);
      const results = await axe(container);

      expect(results.violations).toHaveLength(0);
    });

    it("passes axe accessibility tests with delete button", async () => {
      const { container } = render(<Chip variant="input" label="Input Chip" onDelete={vi.fn()} />);
      const results = await axe(container);

      expect(results.violations).toHaveLength(0);
    });

    it("passes axe accessibility tests when disabled", async () => {
      const { container } = render(<Chip variant="assist" label="Disabled Chip" disabled />);
      const results = await axe(container);

      expect(results.violations).toHaveLength(0);
    });
  });

  describe("MD3 Specifications", () => {
    it("applies label-large typography", () => {
      render(<Chip variant="assist" label="Typography Chip" />);
      const chip = screen.getByRole("button", { name: /typography chip/i });

      expect(chip).toHaveClass("font-[family-name:var(--md-sys-typescale-label-large-font)]");
      expect(chip).toHaveClass("text-[length:var(--md-sys-typescale-label-large-size)]");
      expect(chip).toHaveClass("leading-[var(--md-sys-typescale-label-large-line-height)]");
      expect(chip).toHaveClass("font-[number:var(--md-sys-typescale-label-large-weight)]");
    });

    it("applies border-radius small (8px)", () => {
      render(<Chip variant="assist" label="Shape Chip" />);
      const chip = screen.getByRole("button", { name: /shape chip/i });

      expect(chip).toHaveClass("rounded-[var(--md-sys-shape-corner-small)]");
    });

    it("applies correct height (32px / h-8)", () => {
      render(<Chip variant="assist" label="Height Chip" />);
      const chip = screen.getByRole("button", { name: /height chip/i });

      expect(chip).toHaveClass("h-8");
    });

    it("applies correct horizontal padding", () => {
      render(<Chip variant="assist" label="Padding Chip" />);
      const chip = screen.getByRole("button", { name: /padding chip/i });

      expect(chip).toHaveClass("px-4");
    });
  });
});
