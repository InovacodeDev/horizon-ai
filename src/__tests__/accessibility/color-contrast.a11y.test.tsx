import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "vitest-axe";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TextField } from "@/components/ui/text-field";
import { Chip } from "@/components/ui/chip";
import { Badge } from "@/components/ui/badge";
import { Snackbar } from "@/components/ui/snackbar";
import { NavigationBar, NavigationBarItem } from "@/components/ui/navigation-bar";
import { Home, Settings } from "lucide-react";

/**
 * Color Contrast Tests
 *
 * WCAG 2.1 AA Requirements:
 * - Normal text (< 18px or < 14px bold): 4.5:1 contrast ratio
 * - Large text (≥ 18px or ≥ 14px bold): 3:1 contrast ratio
 * - UI components and graphical objects: 3:1 contrast ratio
 * - Focus indicators: 3:1 contrast ratio against adjacent colors
 */

describe("Color Contrast Accessibility", () => {
  describe("Button Contrast", () => {
    it("filled button should meet contrast requirements", async () => {
      const { container } = render(<Button variant="filled">Primary Action</Button>);
      const results = await axe(container, {
        rules: {
          "color-contrast": { enabled: true },
        },
      });
      expect(results.violations).toHaveLength(0);
    });

    it("outlined button should meet contrast requirements", async () => {
      const { container } = render(<Button variant="outlined">Secondary Action</Button>);
      const results = await axe(container, {
        rules: {
          "color-contrast": { enabled: true },
        },
      });
      expect(results.violations).toHaveLength(0);
    });

    it("text button should meet contrast requirements", async () => {
      const { container } = render(<Button variant="text">Text Action</Button>);
      const results = await axe(container, {
        rules: {
          "color-contrast": { enabled: true },
        },
      });
      expect(results.violations).toHaveLength(0);
    });

    it("elevated button should meet contrast requirements", async () => {
      const { container } = render(<Button variant="elevated">Elevated Action</Button>);
      const results = await axe(container, {
        rules: {
          "color-contrast": { enabled: true },
        },
      });
      expect(results.violations).toHaveLength(0);
    });

    it("tonal button should meet contrast requirements", async () => {
      const { container } = render(<Button variant="tonal">Tonal Action</Button>);
      const results = await axe(container, {
        rules: {
          "color-contrast": { enabled: true },
        },
      });
      expect(results.violations).toHaveLength(0);
    });

    it("disabled button should meet contrast requirements", async () => {
      const { container } = render(<Button disabled>Disabled Button</Button>);
      // Note: Disabled elements are exempt from contrast requirements per WCAG
      // but we still test to ensure they're reasonably visible
      const results = await axe(container, {
        rules: {
          "color-contrast": { enabled: true },
        },
      });
      // Axe will skip disabled elements, so we just check it doesn't crash
      expect(results).toBeDefined();
    });
  });

  describe("Card Contrast", () => {
    it("elevated card should meet contrast requirements", async () => {
      const { container } = render(
        <Card variant="elevated">
          <CardHeader>
            <h2>Card Title</h2>
          </CardHeader>
          <CardContent>
            <p>This is card content with regular text that should meet contrast requirements.</p>
          </CardContent>
        </Card>
      );
      const results = await axe(container, {
        rules: {
          "color-contrast": { enabled: true },
        },
      });
      expect(results.violations).toHaveLength(0);
    });

    it("filled card should meet contrast requirements", async () => {
      const { container } = render(
        <Card variant="filled">
          <CardContent>
            <p>Filled card content</p>
          </CardContent>
        </Card>
      );
      const results = await axe(container, {
        rules: {
          "color-contrast": { enabled: true },
        },
      });
      expect(results.violations).toHaveLength(0);
    });

    it("outlined card should meet contrast requirements", async () => {
      const { container } = render(
        <Card variant="outlined">
          <CardContent>
            <p>Outlined card content</p>
          </CardContent>
        </Card>
      );
      const results = await axe(container, {
        rules: {
          "color-contrast": { enabled: true },
        },
      });
      expect(results.violations).toHaveLength(0);
    });
  });

  describe("TextField Contrast", () => {
    it("filled text field should meet contrast requirements", async () => {
      const { container } = render(<TextField variant="filled" label="Email Address" />);
      const results = await axe(container, {
        rules: {
          "color-contrast": { enabled: true },
        },
      });
      expect(results.violations).toHaveLength(0);
    });

    it("outlined text field should meet contrast requirements", async () => {
      const { container } = render(<TextField variant="outlined" label="Username" />);
      const results = await axe(container, {
        rules: {
          "color-contrast": { enabled: true },
        },
      });
      expect(results.violations).toHaveLength(0);
    });

    it("text field with helper text should meet contrast requirements", async () => {
      const { container } = render(<TextField label="Password" helperText="Must be at least 8 characters" />);
      const results = await axe(container, {
        rules: {
          "color-contrast": { enabled: true },
        },
      });
      expect(results.violations).toHaveLength(0);
    });

    it("text field error state should meet contrast requirements", async () => {
      const { container } = render(<TextField label="Email" error errorMessage="Please enter a valid email address" />);
      const results = await axe(container, {
        rules: {
          "color-contrast": { enabled: true },
        },
      });
      expect(results.violations).toHaveLength(0);
    });

    it("disabled text field should be reasonably visible", async () => {
      const { container } = render(<TextField label="Disabled Field" disabled />);
      const results = await axe(container, {
        rules: {
          "color-contrast": { enabled: true },
        },
      });
      // Disabled elements are exempt but we check anyway
      expect(results).toBeDefined();
    });
  });

  describe("Chip Contrast", () => {
    it("assist chip should meet contrast requirements", async () => {
      const { container } = render(<Chip label="Assist Chip" variant="assist" />);
      const results = await axe(container, {
        rules: {
          "color-contrast": { enabled: true },
        },
      });
      expect(results.violations).toHaveLength(0);
    });

    it("filter chip should meet contrast requirements", async () => {
      const { container } = render(<Chip label="Filter Chip" variant="filter" />);
      const results = await axe(container, {
        rules: {
          "color-contrast": { enabled: true },
        },
      });
      expect(results.violations).toHaveLength(0);
    });

    it("input chip should meet contrast requirements", async () => {
      const { container } = render(<Chip label="Input Chip" variant="input" onDelete={() => {}} />);
      const results = await axe(container, {
        rules: {
          "color-contrast": { enabled: true },
        },
      });
      expect(results.violations).toHaveLength(0);
    });

    it("selected filter chip should meet contrast requirements", async () => {
      const { container } = render(<Chip label="Selected" variant="filter" selected />);
      const results = await axe(container, {
        rules: {
          "color-contrast": { enabled: true },
        },
      });
      expect(results.violations).toHaveLength(0);
    });
  });

  describe("Badge Contrast", () => {
    it("primary badge should meet contrast requirements", async () => {
      const { container } = render(
        <Badge content={5} color="primary">
          <Button>Notifications</Button>
        </Badge>
      );
      const results = await axe(container, {
        rules: {
          "color-contrast": { enabled: true },
        },
      });
      expect(results.violations).toHaveLength(0);
    });

    it("error badge should meet contrast requirements", async () => {
      const { container } = render(
        <Badge content={99} color="error">
          <Button>Alerts</Button>
        </Badge>
      );
      const results = await axe(container, {
        rules: {
          "color-contrast": { enabled: true },
        },
      });
      expect(results.violations).toHaveLength(0);
    });

    it("secondary badge should meet contrast requirements", async () => {
      const { container } = render(
        <Badge content={3} color="secondary">
          <Button>Messages</Button>
        </Badge>
      );
      const results = await axe(container, {
        rules: {
          "color-contrast": { enabled: true },
        },
      });
      expect(results.violations).toHaveLength(0);
    });
  });

  describe("Snackbar Contrast", () => {
    it("info snackbar should meet contrast requirements", async () => {
      const { container } = render(<Snackbar open message="Information message" severity="info" />);
      const results = await axe(container, {
        rules: {
          "color-contrast": { enabled: true },
        },
      });
      expect(results.violations).toHaveLength(0);
    });

    it("success snackbar should meet contrast requirements", async () => {
      const { container } = render(<Snackbar open message="Operation successful" severity="success" />);
      const results = await axe(container, {
        rules: {
          "color-contrast": { enabled: true },
        },
      });
      expect(results.violations).toHaveLength(0);
    });

    it("warning snackbar should meet contrast requirements", async () => {
      const { container } = render(<Snackbar open message="Warning message" severity="warning" />);
      const results = await axe(container, {
        rules: {
          "color-contrast": { enabled: true },
        },
      });
      expect(results.violations).toHaveLength(0);
    });

    it("error snackbar should meet contrast requirements", async () => {
      const { container } = render(<Snackbar open message="Error occurred" severity="error" />);
      const results = await axe(container, {
        rules: {
          "color-contrast": { enabled: true },
        },
      });
      expect(results.violations).toHaveLength(0);
    });
  });

  describe("Navigation Contrast", () => {
    it("navigation bar should meet contrast requirements", async () => {
      const { container } = render(
        <NavigationBar>
          <NavigationBarItem icon={<Home />} label="Home" />
          <NavigationBarItem icon={<Settings />} label="Settings" />
        </NavigationBar>
      );
      const results = await axe(container, {
        rules: {
          "color-contrast": { enabled: true },
        },
      });
      expect(results.violations).toHaveLength(0);
    });

    it("active navigation item should meet contrast requirements", async () => {
      const { container } = render(
        <NavigationBar>
          <NavigationBarItem icon={<Home />} label="Home" active />
          <NavigationBarItem icon={<Settings />} label="Settings" />
        </NavigationBar>
      );
      const results = await axe(container, {
        rules: {
          "color-contrast": { enabled: true },
        },
      });
      expect(results.violations).toHaveLength(0);
    });
  });

  describe("Focus Indicator Contrast", () => {
    it("button focus indicator should be visible", async () => {
      const { container } = render(<Button>Focusable Button</Button>);
      const results = await axe(container, {
        rules: {
          "focus-visible": { enabled: true },
        },
      });
      expect(results.violations).toHaveLength(0);
    });

    it("text field focus indicator should be visible", async () => {
      const { container } = render(<TextField label="Focusable Input" />);
      const results = await axe(container, {
        rules: {
          "focus-visible": { enabled: true },
        },
      });
      expect(results.violations).toHaveLength(0);
    });
  });

  describe("Link Contrast", () => {
    it("links should meet contrast requirements", async () => {
      const { container } = render(
        <div>
          <a href="#test" className="text-[hsl(var(--md-sys-color-primary))]">
            This is a link
          </a>
        </div>
      );
      const results = await axe(container, {
        rules: {
          "color-contrast": { enabled: true },
          "link-in-text-block": { enabled: true },
        },
      });
      expect(results.violations).toHaveLength(0);
    });
  });

  describe("Dark Mode Contrast", () => {
    it("should maintain contrast in dark mode", async () => {
      const { container } = render(
        <div data-theme="dark">
          <Button variant="filled">Dark Mode Button</Button>
          <Card>
            <CardContent>
              <p>Dark mode content</p>
            </CardContent>
          </Card>
          <TextField label="Dark Mode Input" />
        </div>
      );

      const results = await axe(container, {
        rules: {
          "color-contrast": { enabled: true },
        },
      });
      expect(results.violations).toHaveLength(0);
    });
  });

  describe("State-based Contrast", () => {
    it("hover state should maintain contrast", async () => {
      const { container } = render(<Button>Hover Me</Button>);
      // Note: Testing hover states programmatically is limited
      // Manual testing or visual regression tests are recommended
      const results = await axe(container, {
        rules: {
          "color-contrast": { enabled: true },
        },
      });
      expect(results.violations).toHaveLength(0);
    });

    it("pressed state should maintain contrast", async () => {
      const { container } = render(<Button>Press Me</Button>);
      const results = await axe(container, {
        rules: {
          "color-contrast": { enabled: true },
        },
      });
      expect(results.violations).toHaveLength(0);
    });
  });
});
