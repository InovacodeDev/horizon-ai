import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { Badge } from "../badge";

describe("Badge", () => {
  describe("Variants", () => {
    it("renders standard variant correctly", () => {
      render(
        <Badge variant="standard" content={5}>
          <button>Notifications</button>
        </Badge>
      );

      const badge = screen.getByRole("status");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent("5");
      expect(badge).toHaveClass("min-w-5");
      expect(badge).toHaveClass("h-5");
    });

    it("renders dot variant correctly", () => {
      render(
        <Badge variant="dot">
          <button>Notifications</button>
        </Badge>
      );

      const badge = screen.getByRole("status");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass("w-2");
      expect(badge).toHaveClass("h-2");
      expect(badge).not.toHaveTextContent(/./);
    });
  });

  describe("Color Variants", () => {
    it("renders primary color correctly", () => {
      render(
        <Badge color="primary" content={3}>
          <button>Messages</button>
        </Badge>
      );

      const badge = screen.getByRole("status");
      expect(badge).toHaveClass("bg-[hsl(var(--md-sys-color-primary))]");
      expect(badge).toHaveClass("text-[hsl(var(--md-sys-color-on-primary))]");
    });

    it("renders secondary color correctly", () => {
      render(
        <Badge color="secondary" content={7}>
          <button>Updates</button>
        </Badge>
      );

      const badge = screen.getByRole("status");
      expect(badge).toHaveClass("bg-[hsl(var(--md-sys-color-secondary))]");
      expect(badge).toHaveClass("text-[hsl(var(--md-sys-color-on-secondary))]");
    });

    it("renders error color correctly (default)", () => {
      render(
        <Badge content={10}>
          <button>Errors</button>
        </Badge>
      );

      const badge = screen.getByRole("status");
      expect(badge).toHaveClass("bg-[hsl(var(--md-sys-color-error))]");
      expect(badge).toHaveClass("text-[hsl(var(--md-sys-color-on-error))]");
    });
  });

  describe("Max Value Truncation", () => {
    it("displays number as-is when below max", () => {
      render(
        <Badge content={50} max={99}>
          <button>Notifications</button>
        </Badge>
      );

      const badge = screen.getByRole("status");
      expect(badge).toHaveTextContent("50");
    });

    it("displays number as-is when equal to max", () => {
      render(
        <Badge content={99} max={99}>
          <button>Notifications</button>
        </Badge>
      );

      const badge = screen.getByRole("status");
      expect(badge).toHaveTextContent("99");
    });

    it("displays max+ when content exceeds max", () => {
      render(
        <Badge content={100} max={99}>
          <button>Notifications</button>
        </Badge>
      );

      const badge = screen.getByRole("status");
      expect(badge).toHaveTextContent("99+");
    });

    it("displays max+ when content greatly exceeds max", () => {
      render(
        <Badge content={1000} max={99}>
          <button>Notifications</button>
        </Badge>
      );

      const badge = screen.getByRole("status");
      expect(badge).toHaveTextContent("99+");
    });

    it("uses custom max value", () => {
      render(
        <Badge content={50} max={9}>
          <button>Notifications</button>
        </Badge>
      );

      const badge = screen.getByRole("status");
      expect(badge).toHaveTextContent("9+");
    });

    it("handles string content without truncation", () => {
      render(
        <Badge content="NEW" max={99}>
          <button>Updates</button>
        </Badge>
      );

      const badge = screen.getByRole("status");
      expect(badge).toHaveTextContent("NEW");
    });
  });

  describe("Invisible Prop", () => {
    it("shows badge by default", () => {
      render(
        <Badge content={5}>
          <button>Notifications</button>
        </Badge>
      );

      const badge = screen.getByRole("status");
      expect(badge).toHaveClass("opacity-100");
      expect(badge).toHaveClass("scale-100");
    });

    it("hides badge when invisible is true", () => {
      render(
        <Badge content={5} invisible={true}>
          <button>Notifications</button>
        </Badge>
      );

      const badge = screen.getByRole("status");
      expect(badge).toHaveClass("opacity-0");
      expect(badge).toHaveClass("scale-0");
    });

    it("shows badge when invisible is false", () => {
      render(
        <Badge content={5} invisible={false}>
          <button>Notifications</button>
        </Badge>
      );

      const badge = screen.getByRole("status");
      expect(badge).toHaveClass("opacity-100");
      expect(badge).toHaveClass("scale-100");
    });
  });

  describe("Positioning Relative to Child", () => {
    it("positions badge at top-right corner", () => {
      render(
        <Badge content={3}>
          <button>Notifications</button>
        </Badge>
      );

      const badge = screen.getByRole("status");
      expect(badge).toHaveClass("top-0");
      expect(badge).toHaveClass("right-0");
      expect(badge).toHaveClass("-translate-y-1/2");
      expect(badge).toHaveClass("translate-x-1/2");
    });

    it("wraps child in relative container", () => {
      const { container } = render(
        <Badge content={5}>
          <button>Notifications</button>
        </Badge>
      );

      const wrapper = container.querySelector(".relative");
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveClass("inline-flex");
    });

    it("renders child element correctly", () => {
      render(
        <Badge content={5}>
          <button>Click Me</button>
        </Badge>
      );

      const button = screen.getByRole("button", { name: /click me/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe("Accessibility Attributes", () => {
    it("has role status", () => {
      render(
        <Badge content={5}>
          <button>Notifications</button>
        </Badge>
      );

      const badge = screen.getByRole("status");
      expect(badge).toBeInTheDocument();
    });

    it("has default aria-label for numeric content", () => {
      render(
        <Badge content={5}>
          <button>Notifications</button>
        </Badge>
      );

      const badge = screen.getByRole("status");
      expect(badge).toHaveAttribute("aria-label", "5 notifications");
    });

    it("has singular aria-label for content of 1", () => {
      render(
        <Badge content={1}>
          <button>Notifications</button>
        </Badge>
      );

      const badge = screen.getByRole("status");
      expect(badge).toHaveAttribute("aria-label", "1 notification");
    });

    it("has aria-label with actual count when exceeding max", () => {
      render(
        <Badge content={150} max={99}>
          <button>Notifications</button>
        </Badge>
      );

      const badge = screen.getByRole("status");
      expect(badge).toHaveAttribute("aria-label", "150 notifications");
    });

    it("has aria-label for string content", () => {
      render(
        <Badge content="NEW">
          <button>Updates</button>
        </Badge>
      );

      const badge = screen.getByRole("status");
      expect(badge).toHaveAttribute("aria-label", "NEW");
    });

    it("has default aria-label for dot variant", () => {
      render(
        <Badge variant="dot">
          <button>Notifications</button>
        </Badge>
      );

      const badge = screen.getByRole("status");
      expect(badge).toHaveAttribute("aria-label", "notification indicator");
    });

    it("uses custom aria-label when provided", () => {
      render(
        <Badge content={5} aria-label="5 unread messages">
          <button>Messages</button>
        </Badge>
      );

      const badge = screen.getByRole("status");
      expect(badge).toHaveAttribute("aria-label", "5 unread messages");
    });

    it("passes axe accessibility tests for standard variant", async () => {
      const { container } = render(
        <Badge content={5}>
          <button>Notifications</button>
        </Badge>
      );
      const results = await axe(container);

      expect(results.violations).toHaveLength(0);
    });

    it("passes axe accessibility tests for dot variant", async () => {
      const { container } = render(
        <Badge variant="dot">
          <button>Notifications</button>
        </Badge>
      );
      const results = await axe(container);

      expect(results.violations).toHaveLength(0);
    });

    it("passes axe accessibility tests with different colors", async () => {
      const { container } = render(
        <Badge color="primary" content={3}>
          <button>Messages</button>
        </Badge>
      );
      const results = await axe(container);

      expect(results.violations).toHaveLength(0);
    });

    it("passes axe accessibility tests when invisible", async () => {
      const { container } = render(
        <Badge content={5} invisible={true}>
          <button>Notifications</button>
        </Badge>
      );
      const results = await axe(container);

      expect(results.violations).toHaveLength(0);
    });
  });

  describe("MD3 Specifications", () => {
    it("applies label-small typography for standard variant", () => {
      render(
        <Badge variant="standard" content={5}>
          <button>Notifications</button>
        </Badge>
      );

      const badge = screen.getByRole("status");
      expect(badge).toHaveClass("font-[family-name:var(--md-sys-typescale-label-small-font)]");
      expect(badge).toHaveClass("text-[length:var(--md-sys-typescale-label-small-size)]");
      expect(badge).toHaveClass("leading-[var(--md-sys-typescale-label-small-line-height)]");
      expect(badge).toHaveClass("font-[number:var(--md-sys-typescale-label-small-weight)]");
    });

    it("applies rounded-full shape", () => {
      render(
        <Badge content={5}>
          <button>Notifications</button>
        </Badge>
      );

      const badge = screen.getByRole("status");
      expect(badge).toHaveClass("rounded-full");
    });

    it("applies correct sizing for standard variant", () => {
      render(
        <Badge variant="standard" content={5}>
          <button>Notifications</button>
        </Badge>
      );

      const badge = screen.getByRole("status");
      expect(badge).toHaveClass("min-w-5");
      expect(badge).toHaveClass("h-5");
      expect(badge).toHaveClass("px-1.5");
    });

    it("applies correct sizing for dot variant", () => {
      render(
        <Badge variant="dot">
          <button>Notifications</button>
        </Badge>
      );

      const badge = screen.getByRole("status");
      expect(badge).toHaveClass("w-2");
      expect(badge).toHaveClass("h-2");
    });

    it("applies MD3 motion transitions", () => {
      render(
        <Badge content={5}>
          <button>Notifications</button>
        </Badge>
      );

      const badge = screen.getByRole("status");
      expect(badge).toHaveClass("transition-all");
      expect(badge).toHaveClass("duration-[var(--md-sys-motion-duration-short2)]");
      expect(badge).toHaveClass("ease-[var(--md-sys-motion-easing-standard)]");
    });

    it("applies absolute positioning with z-index", () => {
      render(
        <Badge content={5}>
          <button>Notifications</button>
        </Badge>
      );

      const badge = screen.getByRole("status");
      expect(badge).toHaveClass("absolute");
      expect(badge).toHaveClass("z-10");
    });
  });

  describe("Content Handling", () => {
    it("renders numeric content", () => {
      render(
        <Badge content={42}>
          <button>Notifications</button>
        </Badge>
      );

      const badge = screen.getByRole("status");
      expect(badge).toHaveTextContent("42");
    });

    it("renders string content", () => {
      render(
        <Badge content="NEW">
          <button>Updates</button>
        </Badge>
      );

      const badge = screen.getByRole("status");
      expect(badge).toHaveTextContent("NEW");
    });

    it("renders zero content", () => {
      render(
        <Badge content={0}>
          <button>Notifications</button>
        </Badge>
      );

      const badge = screen.getByRole("status");
      expect(badge).toHaveTextContent("0");
    });

    it("handles undefined content for standard variant", () => {
      render(
        <Badge variant="standard">
          <button>Notifications</button>
        </Badge>
      );

      const badge = screen.getByRole("status");
      expect(badge).not.toHaveTextContent(/./);
    });

    it("handles null content for standard variant", () => {
      render(
        <Badge variant="standard" content={null as unknown as number}>
          <button>Notifications</button>
        </Badge>
      );

      const badge = screen.getByRole("status");
      expect(badge).not.toHaveTextContent(/./);
    });
  });
});
