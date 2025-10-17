import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { CircularProgress } from "../circular-progress";
import { LinearProgress } from "../linear-progress";

describe("CircularProgress", () => {
  describe("Modes", () => {
    it("renders indeterminate mode when value is undefined", () => {
      render(<CircularProgress />);
      const progress = screen.getByRole("progressbar");

      expect(progress).toBeInTheDocument();
      expect(progress).not.toHaveAttribute("aria-valuenow");
      expect(progress).not.toHaveAttribute("aria-valuemin");
      expect(progress).not.toHaveAttribute("aria-valuemax");
      expect(progress).toHaveAttribute("aria-label", "Loading");
    });

    it("renders determinate mode when value is provided", () => {
      render(<CircularProgress value={50} />);
      const progress = screen.getByRole("progressbar");

      expect(progress).toBeInTheDocument();
      expect(progress).toHaveAttribute("aria-valuenow", "50");
      expect(progress).toHaveAttribute("aria-valuemin", "0");
      expect(progress).toHaveAttribute("aria-valuemax", "100");
      expect(progress).toHaveAttribute("aria-label", "50% complete");
    });

    it("clamps value to 0-100 range", () => {
      const { rerender } = render(<CircularProgress value={150} />);
      let progress = screen.getByRole("progressbar");
      expect(progress).toHaveAttribute("aria-valuenow", "100");

      rerender(<CircularProgress value={-10} />);
      progress = screen.getByRole("progressbar");
      expect(progress).toHaveAttribute("aria-valuenow", "0");
    });
  });

  describe("Size Variants", () => {
    it("renders small size correctly", () => {
      render(<CircularProgress size="small" />);
      const progress = screen.getByRole("progressbar");

      expect(progress).toHaveClass("w-8");
      expect(progress).toHaveClass("h-8");
    });

    it("renders medium size correctly (default)", () => {
      render(<CircularProgress size="medium" />);
      const progress = screen.getByRole("progressbar");

      expect(progress).toHaveClass("w-12");
      expect(progress).toHaveClass("h-12");
    });

    it("renders large size correctly", () => {
      render(<CircularProgress size="large" />);
      const progress = screen.getByRole("progressbar");

      expect(progress).toHaveClass("w-16");
      expect(progress).toHaveClass("h-16");
    });
  });

  describe("Color Variants", () => {
    it("renders primary color correctly (default)", () => {
      render(<CircularProgress color="primary" />);
      const progress = screen.getByRole("progressbar");

      expect(progress).toHaveClass("text-[hsl(var(--md-sys-color-primary))]");
    });

    it("renders secondary color correctly", () => {
      render(<CircularProgress color="secondary" />);
      const progress = screen.getByRole("progressbar");

      expect(progress).toHaveClass("text-[hsl(var(--md-sys-color-secondary))]");
    });

    it("renders tertiary color correctly", () => {
      render(<CircularProgress color="tertiary" />);
      const progress = screen.getByRole("progressbar");

      expect(progress).toHaveClass("text-[hsl(var(--md-sys-color-tertiary))]");
    });
  });

  describe("Thickness", () => {
    it("applies custom thickness", () => {
      const { container } = render(<CircularProgress thickness={6} />);
      const circles = container.querySelectorAll("circle");

      circles.forEach((circle) => {
        expect(circle).toHaveAttribute("stroke-width", "6");
      });
    });

    it("uses default thickness of 4", () => {
      const { container } = render(<CircularProgress />);
      const circles = container.querySelectorAll("circle");

      circles.forEach((circle) => {
        expect(circle).toHaveAttribute("stroke-width", "4");
      });
    });
  });

  describe("Accessibility", () => {
    it("has proper progressbar role", () => {
      render(<CircularProgress />);
      const progress = screen.getByRole("progressbar");

      expect(progress).toBeInTheDocument();
    });

    it("has descriptive aria-label for indeterminate mode", () => {
      render(<CircularProgress />);
      const progress = screen.getByRole("progressbar");

      expect(progress).toHaveAttribute("aria-label", "Loading");
    });

    it("has descriptive aria-label for determinate mode", () => {
      render(<CircularProgress value={75} />);
      const progress = screen.getByRole("progressbar");

      expect(progress).toHaveAttribute("aria-label", "75% complete");
    });

    it("passes axe accessibility tests", async () => {
      const { container } = render(<CircularProgress value={50} />);
      const results = await axe(container);

      expect(results.violations).toHaveLength(0);
    });

    it("passes axe accessibility tests in indeterminate mode", async () => {
      const { container } = render(<CircularProgress />);
      const results = await axe(container);

      expect(results.violations).toHaveLength(0);
    });
  });

  describe("SVG Structure", () => {
    it("renders SVG with correct viewBox", () => {
      const { container } = render(<CircularProgress size="medium" />);
      const svg = container.querySelector("svg");

      expect(svg).toHaveAttribute("viewBox", "0 0 48 48");
    });

    it("renders background and progress circles", () => {
      const { container } = render(<CircularProgress value={50} />);
      const circles = container.querySelectorAll("circle");

      expect(circles).toHaveLength(2);
    });
  });
});

describe("LinearProgress", () => {
  describe("Modes", () => {
    it("renders indeterminate mode when value is undefined", () => {
      render(<LinearProgress />);
      const progress = screen.getByRole("progressbar");

      expect(progress).toBeInTheDocument();
      expect(progress).not.toHaveAttribute("aria-valuenow");
      expect(progress).not.toHaveAttribute("aria-valuemin");
      expect(progress).not.toHaveAttribute("aria-valuemax");
      expect(progress).toHaveAttribute("aria-label", "Loading");
    });

    it("renders determinate mode when value is provided", () => {
      render(<LinearProgress value={60} />);
      const progress = screen.getByRole("progressbar");

      expect(progress).toBeInTheDocument();
      expect(progress).toHaveAttribute("aria-valuenow", "60");
      expect(progress).toHaveAttribute("aria-valuemin", "0");
      expect(progress).toHaveAttribute("aria-valuemax", "100");
      expect(progress).toHaveAttribute("aria-label", "60% complete");
    });

    it("clamps value to 0-100 range", () => {
      const { rerender } = render(<LinearProgress value={120} />);
      let progress = screen.getByRole("progressbar");
      expect(progress).toHaveAttribute("aria-valuenow", "100");

      rerender(<LinearProgress value={-20} />);
      progress = screen.getByRole("progressbar");
      expect(progress).toHaveAttribute("aria-valuenow", "0");
    });
  });

  describe("Color Variants", () => {
    it("renders primary color correctly (default)", () => {
      render(<LinearProgress color="primary" />);
      const progress = screen.getByRole("progressbar");

      expect(progress).toHaveClass("[&_.progress-bar]:bg-[hsl(var(--md-sys-color-primary))]");
    });

    it("renders secondary color correctly", () => {
      render(<LinearProgress color="secondary" />);
      const progress = screen.getByRole("progressbar");

      expect(progress).toHaveClass("[&_.progress-bar]:bg-[hsl(var(--md-sys-color-secondary))]");
    });

    it("renders tertiary color correctly", () => {
      render(<LinearProgress color="tertiary" />);
      const progress = screen.getByRole("progressbar");

      expect(progress).toHaveClass("[&_.progress-bar]:bg-[hsl(var(--md-sys-color-tertiary))]");
    });
  });

  describe("Buffer Support", () => {
    it("renders buffer bar when buffer prop is provided", () => {
      const { container } = render(<LinearProgress value={30} buffer={60} />);
      const progressBars = container.querySelectorAll(".progress-bar");

      // Should have buffer bar and progress bar
      expect(progressBars.length).toBeGreaterThanOrEqual(2);
    });

    it("does not render buffer bar in indeterminate mode", () => {
      const { container } = render(<LinearProgress buffer={60} />);
      const bufferBar = container.querySelector(".progress-bar.opacity-30");

      expect(bufferBar).not.toBeInTheDocument();
    });

    it("clamps buffer value to 0-100 range", () => {
      const { container } = render(<LinearProgress value={30} buffer={150} />);
      const bufferBar = container.querySelector(".progress-bar.opacity-30");

      expect(bufferBar).toHaveStyle({ width: "100%" });
    });
  });

  describe("Progress Value Updates", () => {
    it("updates progress bar width when value changes", () => {
      const { container, rerender } = render(<LinearProgress value={25} />);
      let progressBar = container.querySelector(".progress-bar:not(.opacity-30)");

      expect(progressBar).toHaveStyle({ width: "25%" });

      rerender(<LinearProgress value={75} />);
      progressBar = container.querySelector(".progress-bar:not(.opacity-30)");

      expect(progressBar).toHaveStyle({ width: "75%" });
    });
  });

  describe("Accessibility", () => {
    it("has proper progressbar role", () => {
      render(<LinearProgress />);
      const progress = screen.getByRole("progressbar");

      expect(progress).toBeInTheDocument();
    });

    it("has descriptive aria-label for indeterminate mode", () => {
      render(<LinearProgress />);
      const progress = screen.getByRole("progressbar");

      expect(progress).toHaveAttribute("aria-label", "Loading");
    });

    it("has descriptive aria-label for determinate mode", () => {
      render(<LinearProgress value={85} />);
      const progress = screen.getByRole("progressbar");

      expect(progress).toHaveAttribute("aria-label", "85% complete");
    });

    it("passes axe accessibility tests", async () => {
      const { container } = render(<LinearProgress value={50} />);
      const results = await axe(container);

      expect(results.violations).toHaveLength(0);
    });

    it("passes axe accessibility tests in indeterminate mode", async () => {
      const { container } = render(<LinearProgress />);
      const results = await axe(container);

      expect(results.violations).toHaveLength(0);
    });

    it("passes axe accessibility tests with buffer", async () => {
      const { container } = render(<LinearProgress value={40} buffer={70} />);
      const results = await axe(container);

      expect(results.violations).toHaveLength(0);
    });
  });

  describe("Styling", () => {
    it("has correct base styles", () => {
      render(<LinearProgress />);
      const progress = screen.getByRole("progressbar");

      expect(progress).toHaveClass("relative");
      expect(progress).toHaveClass("w-full");
      expect(progress).toHaveClass("h-1");
      expect(progress).toHaveClass("overflow-hidden");
      expect(progress).toHaveClass("rounded-full");
    });

    it("applies custom className", () => {
      render(<LinearProgress className="custom-class" />);
      const progress = screen.getByRole("progressbar");

      expect(progress).toHaveClass("custom-class");
    });
  });
});
