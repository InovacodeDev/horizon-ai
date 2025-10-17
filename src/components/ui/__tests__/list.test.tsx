import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { List, ListItem, Divider } from "../list";

describe("ListItem", () => {
  describe("Rendering", () => {
    it("renders one-line list item correctly", () => {
      render(<ListItem headline="Item title" />);
      const listItem = screen.getByRole("listitem");

      expect(listItem).toBeInTheDocument();
      expect(screen.getByText("Item title")).toBeInTheDocument();
      expect(listItem).toHaveClass("min-h-[56px]");
    });

    it("renders two-line list item with supporting text", () => {
      render(<ListItem headline="Item title" supportingText="Supporting text" />);
      const listItem = screen.getByRole("listitem");

      expect(listItem).toBeInTheDocument();
      expect(screen.getByText("Item title")).toBeInTheDocument();
      expect(screen.getByText("Supporting text")).toBeInTheDocument();
      expect(listItem).toHaveClass("min-h-[72px]");
    });

    it("renders two-line list item with overline", () => {
      render(<ListItem headline="Item title" overline="Overline" />);
      const listItem = screen.getByRole("listitem");

      expect(listItem).toBeInTheDocument();
      expect(screen.getByText("Overline")).toBeInTheDocument();
      expect(screen.getByText("Item title")).toBeInTheDocument();
      expect(listItem).toHaveClass("min-h-[72px]");
    });

    it("renders three-line list item with overline and supporting text", () => {
      render(<ListItem headline="Item title" overline="Overline" supportingText="Supporting text" />);
      const listItem = screen.getByRole("listitem");

      expect(listItem).toBeInTheDocument();
      expect(screen.getByText("Overline")).toBeInTheDocument();
      expect(screen.getByText("Item title")).toBeInTheDocument();
      expect(screen.getByText("Supporting text")).toBeInTheDocument();
      expect(listItem).toHaveClass("min-h-[88px]");
    });

    it("renders leading element correctly", () => {
      const icon = <svg data-testid="leading-icon" />;
      render(<ListItem headline="Item title" leading={icon} />);

      expect(screen.getByTestId("leading-icon")).toBeInTheDocument();
    });

    it("renders trailing element correctly", () => {
      const icon = <svg data-testid="trailing-icon" />;
      render(<ListItem headline="Item title" trailing={icon} />);

      expect(screen.getByTestId("trailing-icon")).toBeInTheDocument();
    });

    it("renders both leading and trailing elements", () => {
      const leadingIcon = <svg data-testid="leading-icon" />;
      const trailingIcon = <svg data-testid="trailing-icon" />;
      render(<ListItem headline="Item title" leading={leadingIcon} trailing={trailingIcon} />);

      expect(screen.getByTestId("leading-icon")).toBeInTheDocument();
      expect(screen.getByTestId("trailing-icon")).toBeInTheDocument();
    });
  });

  describe("Interactive States", () => {
    it("applies interactive styles when interactive prop is true", () => {
      render(<ListItem headline="Interactive item" interactive />);
      const listItem = screen.getByRole("listitem");

      expect(listItem).toHaveClass("cursor-pointer");
    });

    it("applies interactive styles when onClick is provided", () => {
      const handleClick = vi.fn();
      render(<ListItem headline="Clickable item" onClick={handleClick} />);
      const listItem = screen.getByRole("listitem");

      expect(listItem).toHaveClass("cursor-pointer");
    });

    it("handles click events", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<ListItem headline="Clickable item" interactive onClick={handleClick} />);
      const listItem = screen.getByRole("listitem");

      await user.click(listItem);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("does not apply interactive styles when disabled", () => {
      render(<ListItem headline="Disabled item" interactive disabled />);
      const listItem = screen.getByRole("listitem");

      expect(listItem).not.toHaveClass("cursor-pointer");
      expect(listItem).toHaveClass("cursor-not-allowed");
    });

    it("does not trigger click when disabled", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<ListItem headline="Disabled item" interactive disabled onClick={handleClick} />);
      const listItem = screen.getByRole("listitem");

      await user.click(listItem);

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe("Selected State", () => {
    it("applies selected styles", () => {
      render(<ListItem headline="Selected item" selected />);
      const listItem = screen.getByRole("listitem");

      expect(listItem).toHaveClass("bg-[hsl(var(--md-sys-color-secondary-container)/0.12)]");
    });

    it("renders selected indicator", () => {
      const { container } = render(<ListItem headline="Selected item" selected />);
      const indicator = container.querySelector(".absolute.left-0.top-0.bottom-0.w-1");

      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveClass("bg-[hsl(var(--md-sys-color-primary))]");
    });

    it("renders selected indicator when selected", () => {
      const { container } = render(<ListItem headline="Selected item" interactive selected />);
      const indicator = container.querySelector(".absolute.left-0.top-0.bottom-0.w-1");

      expect(indicator).toBeInTheDocument();
    });

    it("applies selected background when selected", () => {
      render(<ListItem headline="Selected item" selected />);
      const listItem = screen.getByRole("listitem");

      expect(listItem).toHaveClass("bg-[hsl(var(--md-sys-color-secondary-container)/0.12)]");
    });
  });

  describe("Disabled State", () => {
    it("applies disabled styles", () => {
      render(<ListItem headline="Disabled item" disabled />);
      const listItem = screen.getByRole("listitem");

      expect(listItem).toHaveClass("opacity-38");
      expect(listItem).toHaveClass("cursor-not-allowed");
    });

    it("has aria-disabled attribute", () => {
      render(<ListItem headline="Disabled item" disabled />);
      const listItem = screen.getByRole("listitem");

      expect(listItem).toHaveAttribute("aria-disabled", "true");
    });
  });

  describe("Typography", () => {
    it("applies correct typography to overline", () => {
      render(<ListItem headline="Title" overline="Overline" />);
      const overline = screen.getByText("Overline");

      expect(overline).toHaveClass("text-[length:var(--md-sys-typescale-label-small-size)]");
      expect(overline).toHaveClass("leading-[var(--md-sys-typescale-label-small-line-height)]");
    });

    it("applies correct typography to headline", () => {
      render(<ListItem headline="Headline" />);
      const headline = screen.getByText("Headline");

      expect(headline).toHaveClass("text-[length:var(--md-sys-typescale-body-large-size)]");
      expect(headline).toHaveClass("leading-[var(--md-sys-typescale-body-large-line-height)]");
    });

    it("applies correct typography to supporting text", () => {
      render(<ListItem headline="Title" supportingText="Supporting" />);
      const supportingText = screen.getByText("Supporting");

      expect(supportingText).toHaveClass("text-[length:var(--md-sys-typescale-body-medium-size)]");
      expect(supportingText).toHaveClass("leading-[var(--md-sys-typescale-body-medium-line-height)]");
    });
  });

  describe("Accessibility", () => {
    it("has proper listitem role", () => {
      render(<ListItem headline="Item" />);
      const listItem = screen.getByRole("listitem");

      expect(listItem).toBeInTheDocument();
    });

    it("passes axe accessibility tests", async () => {
      const { container } = render(
        <List>
          <ListItem headline="Accessible item" />
        </List>
      );
      const results = await axe(container);

      expect(results.violations).toHaveLength(0);
    });

    it("passes axe accessibility tests when interactive", async () => {
      const { container } = render(
        <List>
          <ListItem headline="Interactive item" interactive />
        </List>
      );
      const results = await axe(container);

      expect(results.violations).toHaveLength(0);
    });

    it("passes axe accessibility tests when selected", async () => {
      const { container } = render(
        <List>
          <ListItem headline="Selected item" interactive selected />
        </List>
      );
      const results = await axe(container);

      expect(results.violations).toHaveLength(0);
    });

    it("passes axe accessibility tests when disabled", async () => {
      const { container } = render(
        <List>
          <ListItem headline="Disabled item" disabled />
        </List>
      );
      const results = await axe(container);

      expect(results.violations).toHaveLength(0);
    });
  });
});

describe("Divider", () => {
  describe("Rendering", () => {
    it("renders horizontal divider correctly", () => {
      render(<Divider />);
      const divider = screen.getByRole("separator");

      expect(divider).toBeInTheDocument();
      expect(divider).toHaveClass("h-[1px]");
      expect(divider).toHaveClass("w-full");
    });

    it("renders vertical divider correctly", () => {
      render(<Divider orientation="vertical" />);
      const divider = screen.getByRole("separator");

      expect(divider).toBeInTheDocument();
      expect(divider).toHaveClass("w-[1px]");
      expect(divider).toHaveClass("h-full");
      expect(divider).toHaveAttribute("aria-orientation", "vertical");
    });

    it("applies MD3 color", () => {
      render(<Divider />);
      const divider = screen.getByRole("separator");

      expect(divider).toHaveClass("bg-[hsl(var(--md-sys-color-outline-variant))]");
    });

    it("applies inset correctly", () => {
      render(<Divider inset />);
      const divider = screen.getByRole("separator");

      expect(divider).toHaveStyle({ marginLeft: "16px" });
    });

    it("applies custom inset value", () => {
      render(<Divider inset insetValue={24} />);
      const divider = screen.getByRole("separator");

      expect(divider).toHaveStyle({ marginLeft: "24px" });
    });
  });

  describe("Accessibility", () => {
    it("has proper separator role", () => {
      render(<Divider />);
      const divider = screen.getByRole("separator");

      expect(divider).toBeInTheDocument();
    });

    it("has correct aria-orientation for horizontal", () => {
      render(<Divider orientation="horizontal" />);
      const divider = screen.getByRole("separator");

      expect(divider).toHaveAttribute("aria-orientation", "horizontal");
    });

    it("has correct aria-orientation for vertical", () => {
      render(<Divider orientation="vertical" />);
      const divider = screen.getByRole("separator");

      expect(divider).toHaveAttribute("aria-orientation", "vertical");
    });

    it("passes axe accessibility tests", async () => {
      const { container } = render(<Divider />);
      const results = await axe(container);

      expect(results.violations).toHaveLength(0);
    });
  });
});

describe("List", () => {
  describe("Rendering", () => {
    it("renders list container correctly", () => {
      render(
        <List>
          <ListItem headline="Item 1" />
          <ListItem headline="Item 2" />
        </List>
      );
      const list = screen.getByRole("list");

      expect(list).toBeInTheDocument();
      expect(screen.getByText("Item 1")).toBeInTheDocument();
      expect(screen.getByText("Item 2")).toBeInTheDocument();
    });

    it("renders without dividers by default", () => {
      render(
        <List>
          <ListItem headline="Item 1" />
          <ListItem headline="Item 2" />
        </List>
      );

      const dividers = screen.queryAllByRole("separator");
      expect(dividers).toHaveLength(0);
    });

    it("renders with dividers when dividers prop is true", () => {
      const { container } = render(
        <List dividers>
          <ListItem headline="Item 1" />
          <ListItem headline="Item 2" />
          <ListItem headline="Item 3" />
        </List>
      );

      const dividers = container.querySelectorAll("hr[role='separator']");
      expect(dividers).toHaveLength(2); // n-1 dividers for n items
    });

    it("applies divider inset when dividerInset is true", () => {
      const { container } = render(
        <List dividers dividerInset>
          <ListItem headline="Item 1" />
          <ListItem headline="Item 2" />
        </List>
      );

      const divider = container.querySelector("hr");
      expect(divider).toHaveStyle({ marginLeft: "16px" });
    });
  });

  describe("Accessibility", () => {
    it("has proper list role", () => {
      render(
        <List>
          <ListItem headline="Item 1" />
        </List>
      );
      const list = screen.getByRole("list");

      expect(list).toBeInTheDocument();
    });

    it("passes axe accessibility tests", async () => {
      const { container } = render(
        <List>
          <ListItem headline="Item 1" />
          <ListItem headline="Item 2" />
        </List>
      );
      const results = await axe(container);

      expect(results.violations).toHaveLength(0);
    });

    it("passes axe accessibility tests with dividers", async () => {
      const { container } = render(
        <List dividers>
          <ListItem headline="Item 1" />
          <ListItem headline="Item 2" />
        </List>
      );
      const results = await axe(container);

      expect(results.violations).toHaveLength(0);
    });
  });
});
