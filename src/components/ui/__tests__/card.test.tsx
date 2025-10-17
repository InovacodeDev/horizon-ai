import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../card";

describe("Card", () => {
  describe("Variants", () => {
    it("renders elevated variant correctly", () => {
      const { container } = render(
        <Card variant="elevated" data-testid="card">
          <CardContent>Elevated Card</CardContent>
        </Card>
      );
      const card = container.querySelector('[data-testid="card"]');

      expect(card).toBeInTheDocument();
      expect(card).toHaveClass("bg-[hsl(var(--md-sys-color-surface-container-low))]");
      expect(card).toHaveClass("shadow-[var(--md-sys-elevation-level1)]");
    });

    it("renders filled variant correctly", () => {
      const { container } = render(
        <Card variant="filled" data-testid="card">
          <CardContent>Filled Card</CardContent>
        </Card>
      );
      const card = container.querySelector('[data-testid="card"]');

      expect(card).toBeInTheDocument();
      expect(card).toHaveClass("bg-[hsl(var(--md-sys-color-surface-container-highest))]");
    });

    it("renders outlined variant correctly", () => {
      const { container } = render(
        <Card variant="outlined" data-testid="card">
          <CardContent>Outlined Card</CardContent>
        </Card>
      );
      const card = container.querySelector('[data-testid="card"]');

      expect(card).toBeInTheDocument();
      expect(card).toHaveClass("border");
      expect(card).toHaveClass("border-[hsl(var(--md-sys-color-outline-variant))]");
      expect(card).toHaveClass("bg-[hsl(var(--md-sys-color-surface))]");
    });

    it("defaults to elevated variant", () => {
      const { container } = render(
        <Card data-testid="card">
          <CardContent>Default Card</CardContent>
        </Card>
      );
      const card = container.querySelector('[data-testid="card"]');

      expect(card).toHaveClass("shadow-[var(--md-sys-elevation-level1)]");
    });
  });

  describe("Elevation Levels", () => {
    it("applies elevation level 0", () => {
      const { container } = render(
        <Card variant="elevated" elevation={0} data-testid="card">
          <CardContent>Level 0</CardContent>
        </Card>
      );
      const card = container.querySelector('[data-testid="card"]');

      expect(card).toHaveClass("shadow-[var(--md-sys-elevation-level0)]");
    });

    it("applies elevation level 1 (default)", () => {
      const { container } = render(
        <Card variant="elevated" elevation={1} data-testid="card">
          <CardContent>Level 1</CardContent>
        </Card>
      );
      const card = container.querySelector('[data-testid="card"]');

      expect(card).toHaveClass("shadow-[var(--md-sys-elevation-level1)]");
    });

    it("applies elevation level 2", () => {
      const { container } = render(
        <Card variant="elevated" elevation={2} data-testid="card">
          <CardContent>Level 2</CardContent>
        </Card>
      );
      const card = container.querySelector('[data-testid="card"]');

      expect(card).toHaveClass("shadow-[var(--md-sys-elevation-level2)]");
    });

    it("applies elevation level 3", () => {
      const { container } = render(
        <Card variant="elevated" elevation={3} data-testid="card">
          <CardContent>Level 3</CardContent>
        </Card>
      );
      const card = container.querySelector('[data-testid="card"]');

      expect(card).toHaveClass("shadow-[var(--md-sys-elevation-level3)]");
    });

    it("applies elevation level 4", () => {
      const { container } = render(
        <Card variant="elevated" elevation={4} data-testid="card">
          <CardContent>Level 4</CardContent>
        </Card>
      );
      const card = container.querySelector('[data-testid="card"]');

      expect(card).toHaveClass("shadow-[var(--md-sys-elevation-level4)]");
    });

    it("applies elevation level 5", () => {
      const { container } = render(
        <Card variant="elevated" elevation={5} data-testid="card">
          <CardContent>Level 5</CardContent>
        </Card>
      );
      const card = container.querySelector('[data-testid="card"]');

      expect(card).toHaveClass("shadow-[var(--md-sys-elevation-level5)]");
    });

    it("does not apply elevation to filled variant", () => {
      const { container } = render(
        <Card variant="filled" elevation={3} data-testid="card">
          <CardContent>Filled Card</CardContent>
        </Card>
      );
      const card = container.querySelector('[data-testid="card"]');

      expect(card).not.toHaveClass("shadow-[var(--md-sys-elevation-level3)]");
    });

    it("does not apply elevation to outlined variant", () => {
      const { container } = render(
        <Card variant="outlined" elevation={3} data-testid="card">
          <CardContent>Outlined Card</CardContent>
        </Card>
      );
      const card = container.querySelector('[data-testid="card"]');

      expect(card).not.toHaveClass("shadow-[var(--md-sys-elevation-level3)]");
    });
  });

  describe("Card Composition", () => {
    it("renders card with header, content, and footer", () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
          </CardHeader>
          <CardContent>Card Content</CardContent>
          <CardFooter>Card Footer</CardFooter>
        </Card>
      );

      expect(screen.getByText("Card Title")).toBeInTheDocument();
      expect(screen.getByText("Card Description")).toBeInTheDocument();
      expect(screen.getByText("Card Content")).toBeInTheDocument();
      expect(screen.getByText("Card Footer")).toBeInTheDocument();
    });

    it("renders card with only content", () => {
      render(
        <Card>
          <CardContent>Simple Card</CardContent>
        </Card>
      );

      expect(screen.getByText("Simple Card")).toBeInTheDocument();
    });

    it("renders CardHeader with avatar slot", () => {
      const avatar = <div data-testid="avatar">A</div>;
      render(
        <CardHeader avatar={avatar}>
          <CardTitle>Title</CardTitle>
        </CardHeader>
      );

      expect(screen.getByTestId("avatar")).toBeInTheDocument();
      expect(screen.getByText("Title")).toBeInTheDocument();
    });

    it("renders CardHeader with action slot", () => {
      const action = <button data-testid="action">Action</button>;
      render(
        <CardHeader action={action}>
          <CardTitle>Title</CardTitle>
        </CardHeader>
      );

      expect(screen.getByTestId("action")).toBeInTheDocument();
      expect(screen.getByText("Title")).toBeInTheDocument();
    });

    it("renders CardHeader with both avatar and action", () => {
      const avatar = <div data-testid="avatar">A</div>;
      const action = <button data-testid="action">Action</button>;
      render(
        <CardHeader avatar={avatar} action={action}>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
      );

      expect(screen.getByTestId("avatar")).toBeInTheDocument();
      expect(screen.getByTestId("action")).toBeInTheDocument();
      expect(screen.getByText("Title")).toBeInTheDocument();
      expect(screen.getByText("Description")).toBeInTheDocument();
    });
  });

  describe("Interactive Cards", () => {
    it("applies interactive styles when interactive prop is true", () => {
      const { container } = render(
        <Card interactive data-testid="card">
          <CardContent>Interactive Card</CardContent>
        </Card>
      );
      const card = container.querySelector('[data-testid="card"]');

      expect(card).toHaveClass("cursor-pointer");
    });

    it("applies interactive styles when onClick is provided", () => {
      const handleClick = vi.fn();
      const { container } = render(
        <Card onClick={handleClick} data-testid="card">
          <CardContent>Clickable Card</CardContent>
        </Card>
      );
      const card = container.querySelector('[data-testid="card"]');

      expect(card).toHaveClass("cursor-pointer");
    });

    it("handles click events on interactive cards", async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      const { container } = render(
        <Card onClick={handleClick} data-testid="card">
          <CardContent>Clickable Card</CardContent>
        </Card>
      );
      const card = container.querySelector('[data-testid="card"]');

      if (card) {
        await user.click(card);
      }

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("renders state layer for interactive elevated cards on hover", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <Card variant="elevated" interactive data-testid="card">
          <CardContent>Interactive Card</CardContent>
        </Card>
      );
      const card = container.querySelector('[data-testid="card"]');

      // State layer should not be present initially
      let stateLayer = container.querySelector('span[aria-hidden="true"]');
      expect(stateLayer).not.toBeInTheDocument();

      // Hover over the card
      if (card) {
        await user.hover(card);
      }

      // State layer should now be present
      stateLayer = container.querySelector('span[aria-hidden="true"]');
      expect(stateLayer).toBeInTheDocument();
    });

    it("renders state layer for interactive filled cards on hover", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <Card variant="filled" interactive data-testid="card">
          <CardContent>Interactive Card</CardContent>
        </Card>
      );
      const card = container.querySelector('[data-testid="card"]');

      // Hover over the card
      if (card) {
        await user.hover(card);
      }

      const stateLayer = container.querySelector('span[aria-hidden="true"]');
      expect(stateLayer).toBeInTheDocument();
    });

    it("renders state layer for interactive outlined cards on hover", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <Card variant="outlined" interactive data-testid="card">
          <CardContent>Interactive Card</CardContent>
        </Card>
      );
      const card = container.querySelector('[data-testid="card"]');

      // Hover over the card
      if (card) {
        await user.hover(card);
      }

      const stateLayer = container.querySelector('span[aria-hidden="true"]');
      expect(stateLayer).toBeInTheDocument();
    });

    it("applies hover elevation for interactive elevated cards", () => {
      const { container } = render(
        <Card variant="elevated" interactive data-testid="card">
          <CardContent>Interactive Card</CardContent>
        </Card>
      );
      const card = container.querySelector('[data-testid="card"]');

      expect(card).toHaveClass("hover:shadow-[var(--md-sys-elevation-level2)]");
      expect(card).toHaveClass("transition-shadow");
    });

    it("applies hover elevation for interactive filled cards", () => {
      const { container } = render(
        <Card variant="filled" interactive data-testid="card">
          <CardContent>Interactive Card</CardContent>
        </Card>
      );
      const card = container.querySelector('[data-testid="card"]');

      expect(card).toHaveClass("hover:shadow-[var(--md-sys-elevation-level1)]");
      expect(card).toHaveClass("transition-shadow");
    });

    it("applies hover elevation for interactive outlined cards", () => {
      const { container } = render(
        <Card variant="outlined" interactive data-testid="card">
          <CardContent>Interactive Card</CardContent>
        </Card>
      );
      const card = container.querySelector('[data-testid="card"]');

      expect(card).toHaveClass("hover:shadow-[var(--md-sys-elevation-level1)]");
      expect(card).toHaveClass("transition-shadow");
    });
  });

  describe("MD3 Styling", () => {
    it("applies MD3 border-radius medium", () => {
      const { container } = render(
        <Card data-testid="card">
          <CardContent>Card</CardContent>
        </Card>
      );
      const card = container.querySelector('[data-testid="card"]');

      expect(card).toHaveClass("rounded-[var(--md-sys-shape-corner-medium)]");
    });

    it("applies MD3 color tokens", () => {
      const { container } = render(
        <Card data-testid="card">
          <CardContent>Card</CardContent>
        </Card>
      );
      const card = container.querySelector('[data-testid="card"]');

      expect(card).toHaveClass("text-[hsl(var(--md-sys-color-on-surface))]");
    });

    it("applies MD3 typography to CardTitle", () => {
      render(<CardTitle data-testid="title">Title</CardTitle>);
      const title = screen.getByTestId("title");

      expect(title).toHaveClass("text-[length:var(--md-sys-typescale-title-large-size)]");
      expect(title).toHaveClass("leading-[var(--md-sys-typescale-title-large-line-height)]");
      expect(title).toHaveClass("font-[var(--md-sys-typescale-title-large-weight)]");
    });

    it("applies MD3 typography to CardDescription", () => {
      render(<CardDescription data-testid="description">Description</CardDescription>);
      const description = screen.getByTestId("description");

      expect(description).toHaveClass("text-[length:var(--md-sys-typescale-body-medium-size)]");
      expect(description).toHaveClass("leading-[var(--md-sys-typescale-body-medium-line-height)]");
      expect(description).toHaveClass("text-[hsl(var(--md-sys-color-on-surface-variant))]");
    });
  });

  describe("Props", () => {
    it("applies custom className", () => {
      const { container } = render(
        <Card className="custom-class" data-testid="card">
          <CardContent>Custom Card</CardContent>
        </Card>
      );
      const card = container.querySelector('[data-testid="card"]');

      expect(card).toHaveClass("custom-class");
    });

    it("forwards ref correctly", () => {
      const ref = vi.fn();
      render(
        <Card ref={ref}>
          <CardContent>Card</CardContent>
        </Card>
      );

      expect(ref).toHaveBeenCalled();
    });

    it("passes through additional HTML attributes", () => {
      const { container } = render(
        <Card data-testid="card" aria-label="Test card">
          <CardContent>Card</CardContent>
        </Card>
      );
      const card = container.querySelector('[data-testid="card"]');

      expect(card).toHaveAttribute("aria-label", "Test card");
    });
  });

  describe("Accessibility", () => {
    it("passes axe accessibility tests for elevated variant", async () => {
      const { container } = render(
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Title</CardTitle>
            <CardDescription>Description</CardDescription>
          </CardHeader>
          <CardContent>Content</CardContent>
        </Card>
      );
      const results = await axe(container);

      expect(results.violations).toHaveLength(0);
    });

    it("passes axe accessibility tests for filled variant", async () => {
      const { container } = render(
        <Card variant="filled">
          <CardContent>Content</CardContent>
        </Card>
      );
      const results = await axe(container);

      expect(results.violations).toHaveLength(0);
    });

    it("passes axe accessibility tests for outlined variant", async () => {
      const { container } = render(
        <Card variant="outlined">
          <CardContent>Content</CardContent>
        </Card>
      );
      const results = await axe(container);

      expect(results.violations).toHaveLength(0);
    });

    it("passes axe accessibility tests for interactive card", async () => {
      const { container } = render(
        <Card interactive onClick={() => {}}>
          <CardContent>Interactive Content</CardContent>
        </Card>
      );
      const results = await axe(container);

      expect(results.violations).toHaveLength(0);
    });
  });
});
