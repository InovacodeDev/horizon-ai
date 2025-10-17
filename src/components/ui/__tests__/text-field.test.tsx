import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { TextField } from "../text-field";

describe("TextField", () => {
  describe("Variants", () => {
    it("renders filled variant correctly", () => {
      render(<TextField variant="filled" label="Filled Input" />);
      const input = screen.getByLabelText(/filled input/i);
      const container = input.parentElement;

      expect(input).toBeInTheDocument();
      expect(container).toHaveClass("bg-[hsl(var(--md-sys-color-surface-container-highest))]");
      expect(container).toHaveClass("border-b-2");
    });

    it("renders outlined variant correctly", () => {
      render(<TextField variant="outlined" label="Outlined Input" />);
      const input = screen.getByLabelText(/outlined input/i);
      const container = input.parentElement;

      expect(input).toBeInTheDocument();
      expect(container).toHaveClass("border");
      expect(container).toHaveClass("border-[hsl(var(--md-sys-color-outline))]");
    });
  });

  describe("Label Floating Behavior", () => {
    it("floats label when input is focused", async () => {
      const user = userEvent.setup();
      render(<TextField variant="filled" label="Test Label" />);

      const input = screen.getByLabelText(/test label/i);
      const label = screen.getByText(/test label/i);

      // Label should not be floating initially
      expect(label).not.toHaveClass("top-2");

      // Focus input
      await user.click(input);

      // Label should float
      expect(label).toHaveClass("top-2");
    });

    it("floats label when input has value", () => {
      render(<TextField variant="filled" label="Test Label" value="Some value" onChange={() => {}} />);

      const label = screen.getByText(/test label/i);

      // Label should be floating because input has value
      expect(label).toHaveClass("top-2");
    });

    it("floats label when input has defaultValue", () => {
      render(<TextField variant="filled" label="Test Label" defaultValue="Default value" />);

      const label = screen.getByText(/test label/i);

      // Label should be floating because input has defaultValue
      expect(label).toHaveClass("top-2");
    });

    it("does not float label when input only has placeholder", () => {
      render(<TextField variant="filled" label="Test Label" placeholder="Placeholder" />);

      const label = screen.getByText(/test label/i);

      // Label should not be floating because placeholder doesn't count as value
      expect(label).not.toHaveClass("top-2");
      expect(label).toHaveClass("top-4");
    });

    it("returns label to default position when input loses focus and is empty", async () => {
      const user = userEvent.setup();
      render(<TextField variant="filled" label="Test Label" />);

      const input = screen.getByLabelText(/test label/i);
      const label = screen.getByText(/test label/i);

      // Focus input
      await user.click(input);
      expect(label).toHaveClass("top-2");

      // Blur input without entering value
      await user.tab();
      expect(label).not.toHaveClass("top-2");
    });

    it("keeps label floating when input loses focus but has value", async () => {
      const user = userEvent.setup();
      render(<TextField variant="filled" label="Test Label" />);

      const input = screen.getByLabelText(/test label/i);
      const label = screen.getByText(/test label/i);

      // Type value
      await user.type(input, "Test value");
      expect(label).toHaveClass("top-2");

      // Blur input
      await user.tab();
      expect(label).toHaveClass("top-2");
    });

    it("floats outlined variant label correctly", async () => {
      const user = userEvent.setup();
      render(<TextField variant="outlined" label="Outlined Label" />);

      const input = screen.getByLabelText(/outlined label/i);
      const label = screen.getByText(/outlined label/i);

      // Focus input
      await user.click(input);

      // Outlined label should float to top with negative offset
      expect(label).toHaveClass("-top-2");
    });
  });

  describe("Error State", () => {
    it("displays error message when error is true", () => {
      render(<TextField label="Test Input" error errorMessage="This field is required" />);

      const errorMessage = screen.getByText(/this field is required/i);
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveClass("text-[hsl(var(--md-sys-color-error))]");
    });

    it("applies error styles to container", () => {
      render(<TextField variant="filled" label="Test Input" error />);

      const input = screen.getByLabelText(/test input/i);
      const container = input.parentElement;

      expect(container).toHaveClass("border-b-[hsl(var(--md-sys-color-error))]");
    });

    it("applies error styles to outlined variant", () => {
      render(<TextField variant="outlined" label="Test Input" error />);

      const input = screen.getByLabelText(/test input/i);
      const container = input.parentElement;

      expect(container).toHaveClass("border-2");
      expect(container).toHaveClass("border-[hsl(var(--md-sys-color-error))]");
    });

    it("applies error color to label", () => {
      render(<TextField label="Test Input" error />);

      const label = screen.getByText(/test input/i);
      expect(label).toHaveClass("text-[hsl(var(--md-sys-color-error))]");
    });

    it("prioritizes error message over helper text", () => {
      render(<TextField label="Test Input" helperText="Helper text" error errorMessage="Error message" />);

      expect(screen.getByText(/error message/i)).toBeInTheDocument();
      expect(screen.queryByText(/helper text/i)).not.toBeInTheDocument();
    });
  });

  describe("Helper Text", () => {
    it("displays helper text when provided", () => {
      render(<TextField label="Test Input" helperText="This is helper text" />);

      const helperText = screen.getByText(/this is helper text/i);
      expect(helperText).toBeInTheDocument();
      expect(helperText).toHaveClass("text-[hsl(var(--md-sys-color-on-surface-variant))]");
    });

    it("does not display helper text when not provided", () => {
      const { container } = render(<TextField label="Test Input" />);

      const supportingText = container.querySelector('[id$="-helper"]');
      expect(supportingText).not.toBeInTheDocument();
    });
  });

  describe("Leading and Trailing Icons", () => {
    it("renders leading icon correctly", () => {
      const icon = <svg data-testid="leading-icon" />;
      render(<TextField label="Test Input" leadingIcon={icon} />);

      const iconElement = screen.getByTestId("leading-icon");
      expect(iconElement).toBeInTheDocument();

      // Check that icon is positioned on the left
      const iconContainer = iconElement.parentElement?.parentElement;
      expect(iconContainer).toHaveClass("left-3");
    });

    it("renders trailing icon correctly", () => {
      const icon = <svg data-testid="trailing-icon" />;
      render(<TextField label="Test Input" trailingIcon={icon} />);

      const iconElement = screen.getByTestId("trailing-icon");
      expect(iconElement).toBeInTheDocument();

      // Check that icon is positioned on the right
      const iconContainer = iconElement.parentElement?.parentElement;
      expect(iconContainer).toHaveClass("right-3");
    });

    it("adjusts input padding when leading icon is present", () => {
      const icon = <svg data-testid="leading-icon" />;
      render(<TextField label="Test Input" leadingIcon={icon} />);

      const input = screen.getByLabelText(/test input/i);
      expect(input).toHaveClass("pl-12");
    });

    it("adjusts input padding when trailing icon is present", () => {
      const icon = <svg data-testid="trailing-icon" />;
      render(<TextField label="Test Input" trailingIcon={icon} />);

      const input = screen.getByLabelText(/test input/i);
      expect(input).toHaveClass("pr-12");
    });

    it("adjusts label position when leading icon is present", () => {
      const icon = <svg data-testid="leading-icon" />;
      render(<TextField label="Test Input" leadingIcon={icon} />);

      const label = screen.getByText(/test input/i);
      expect(label).toHaveClass("left-12");
    });
  });

  describe("Disabled State", () => {
    it("disables input when disabled prop is true", () => {
      render(<TextField label="Test Input" disabled />);

      const input = screen.getByLabelText(/test input/i);
      expect(input).toBeDisabled();
    });

    it("applies disabled styles to input", () => {
      render(<TextField label="Test Input" disabled />);

      const input = screen.getByLabelText(/test input/i);
      expect(input).toHaveClass("text-[hsl(var(--md-sys-color-on-surface)/0.38)]");
      expect(input).toHaveClass("cursor-not-allowed");
    });

    it("applies disabled styles to label", () => {
      render(<TextField label="Test Input" disabled />);

      const label = screen.getByText(/test input/i);
      expect(label).toHaveClass("text-[hsl(var(--md-sys-color-on-surface)/0.38)]");
    });

    it("applies disabled styles to helper text", () => {
      render(<TextField label="Test Input" helperText="Helper text" disabled />);

      const helperText = screen.getByText(/helper text/i);
      expect(helperText).toHaveClass("text-[hsl(var(--md-sys-color-on-surface)/0.38)]");
    });

    it("applies disabled styles to filled variant container", () => {
      render(<TextField variant="filled" label="Test Input" disabled />);

      const input = screen.getByLabelText(/test input/i);
      const container = input.parentElement;

      expect(container).toHaveClass("bg-[hsl(var(--md-sys-color-on-surface)/0.04)]");
      expect(container).toHaveClass("border-b-[hsl(var(--md-sys-color-on-surface)/0.38)]");
    });

    it("applies disabled styles to outlined variant container", () => {
      render(<TextField variant="outlined" label="Test Input" disabled />);

      const input = screen.getByLabelText(/test input/i);
      const container = input.parentElement;

      expect(container).toHaveClass("border-[hsl(var(--md-sys-color-on-surface)/0.12)]");
    });
  });

  describe("Accessibility", () => {
    it("associates label with input using htmlFor and id", () => {
      render(<TextField label="Test Input" />);

      const input = screen.getByLabelText(/test input/i);
      const label = screen.getByText(/test input/i);

      expect(label).toHaveAttribute("for", input.id);
    });

    it("sets aria-invalid when error is true", () => {
      render(<TextField label="Test Input" error />);

      const input = screen.getByLabelText(/test input/i);
      expect(input).toHaveAttribute("aria-invalid", "true");
    });

    it("sets aria-invalid to false when error is false", () => {
      render(<TextField label="Test Input" error={false} />);

      const input = screen.getByLabelText(/test input/i);
      expect(input).toHaveAttribute("aria-invalid", "false");
    });

    it("associates helper text with input using aria-describedby", () => {
      render(<TextField label="Test Input" helperText="Helper text" />);

      const input = screen.getByLabelText(/test input/i);
      const helperText = screen.getByText(/helper text/i);

      expect(input).toHaveAttribute("aria-describedby", helperText.id);
    });

    it("associates error message with input using aria-describedby", () => {
      render(<TextField label="Test Input" error errorMessage="Error message" />);

      const input = screen.getByLabelText(/test input/i);
      const errorMessage = screen.getByText(/error message/i);

      expect(input).toHaveAttribute("aria-describedby", errorMessage.id);
    });

    it("sets role=alert on error message", () => {
      render(<TextField label="Test Input" error errorMessage="Error message" />);

      const errorMessage = screen.getByText(/error message/i);
      expect(errorMessage).toHaveAttribute("role", "alert");
    });

    it("does not set role=alert on helper text", () => {
      render(<TextField label="Test Input" helperText="Helper text" />);

      const helperText = screen.getByText(/helper text/i);
      expect(helperText).not.toHaveAttribute("role");
    });

    it("passes axe accessibility tests", async () => {
      const { container } = render(<TextField label="Accessible Input" />);
      const results = await axe(container);

      expect(results.violations).toHaveLength(0);
    });

    it("passes axe accessibility tests with error", async () => {
      const { container } = render(<TextField label="Accessible Input" error errorMessage="Error message" />);
      const results = await axe(container);

      expect(results.violations).toHaveLength(0);
    });

    it("passes axe accessibility tests with helper text", async () => {
      const { container } = render(<TextField label="Accessible Input" helperText="Helper text" />);
      const results = await axe(container);

      expect(results.violations).toHaveLength(0);
    });

    it("passes axe accessibility tests when disabled", async () => {
      const { container } = render(<TextField label="Accessible Input" disabled />);
      const results = await axe(container);

      expect(results.violations).toHaveLength(0);
    });

    it("passes axe accessibility tests with icons", async () => {
      const leadingIcon = (
        <svg aria-hidden="true">
          <path d="M0 0h24v24H0z" />
        </svg>
      );
      const trailingIcon = (
        <svg aria-hidden="true">
          <path d="M0 0h24v24H0z" />
        </svg>
      );
      const { container } = render(
        <TextField label="Accessible Input" leadingIcon={leadingIcon} trailingIcon={trailingIcon} />
      );
      const results = await axe(container);

      expect(results.violations).toHaveLength(0);
    });
  });

  describe("Focus Behavior", () => {
    it("applies focus styles when input is focused", async () => {
      const user = userEvent.setup();
      render(<TextField variant="filled" label="Test Input" />);

      const input = screen.getByLabelText(/test input/i);
      const container = input.parentElement;

      // Focus input
      await user.click(input);

      // Check focus styles
      expect(container).toHaveClass("border-b-[hsl(var(--md-sys-color-primary))]");
    });

    it("applies focus color to label", async () => {
      const user = userEvent.setup();
      render(<TextField label="Test Input" />);

      const input = screen.getByLabelText(/test input/i);
      const label = screen.getByText(/test input/i);

      // Focus input
      await user.click(input);

      // Label should have primary color
      expect(label).toHaveClass("text-[hsl(var(--md-sys-color-primary))]");
    });

    it("applies focus styles to outlined variant", async () => {
      const user = userEvent.setup();
      render(<TextField variant="outlined" label="Test Input" />);

      const input = screen.getByLabelText(/test input/i);
      const container = input.parentElement;

      // Focus input
      await user.click(input);

      // Check focus styles
      expect(container).toHaveClass("border-2");
      expect(container).toHaveClass("border-[hsl(var(--md-sys-color-primary))]");
    });

    it("calls onFocus callback when input is focused", async () => {
      const handleFocus = vi.fn();
      const user = userEvent.setup();

      render(<TextField label="Test Input" onFocus={handleFocus} />);
      const input = screen.getByLabelText(/test input/i);

      await user.click(input);

      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it("calls onBlur callback when input loses focus", async () => {
      const handleBlur = vi.fn();
      const user = userEvent.setup();

      render(<TextField label="Test Input" onBlur={handleBlur} />);
      const input = screen.getByLabelText(/test input/i);

      await user.click(input);
      await user.tab();

      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe("Props", () => {
    it("applies fullWidth prop correctly", () => {
      const { container } = render(<TextField label="Test Input" fullWidth />);

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("w-full");
    });

    it("applies custom className", () => {
      const { container } = render(<TextField label="Test Input" className="custom-class" />);

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("custom-class");
    });

    it("forwards ref correctly", () => {
      const ref = vi.fn();
      render(<TextField label="Test Input" ref={ref} />);

      expect(ref).toHaveBeenCalled();
    });

    it("supports controlled input", async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();

      const { rerender } = render(<TextField label="Test Input" value="" onChange={handleChange} />);

      const input = screen.getByLabelText(/test input/i) as HTMLInputElement;

      await user.type(input, "a");

      expect(handleChange).toHaveBeenCalled();
    });

    it("supports uncontrolled input with defaultValue", () => {
      render(<TextField label="Test Input" defaultValue="Default value" />);

      const input = screen.getByLabelText(/test input/i) as HTMLInputElement;
      expect(input.value).toBe("Default value");
    });
  });

  describe("MD3 Typography", () => {
    it("applies body-large typography to input", () => {
      render(<TextField label="Test Input" />);
      const input = screen.getByLabelText(/test input/i);

      expect(input).toHaveClass("font-[family-name:var(--md-sys-typescale-body-large-font)]");
      expect(input).toHaveClass("text-[length:var(--md-sys-typescale-body-large-size)]");
      expect(input).toHaveClass("leading-[var(--md-sys-typescale-body-large-line-height)]");
      expect(input).toHaveClass("font-[number:var(--md-sys-typescale-body-large-weight)]");
    });

    it("applies body-small typography to helper text", () => {
      render(<TextField label="Test Input" helperText="Helper text" />);
      const helperText = screen.getByText(/helper text/i);

      expect(helperText).toHaveClass("font-[family-name:var(--md-sys-typescale-body-small-font)]");
      expect(helperText).toHaveClass("text-[length:var(--md-sys-typescale-body-small-size)]");
      expect(helperText).toHaveClass("leading-[var(--md-sys-typescale-body-small-line-height)]");
    });
  });
});
