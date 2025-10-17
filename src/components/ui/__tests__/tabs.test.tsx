import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../tabs";

describe("Tabs", () => {
  describe("Rendering", () => {
    it("renders tabs structure correctly", () => {
      render(
        <Tabs>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      expect(screen.getByRole("tablist")).toBeInTheDocument();
      expect(screen.getAllByRole("tab")).toHaveLength(2);
    });

    it("renders TabsList correctly", () => {
      render(
        <Tabs>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      const tablist = screen.getByRole("tablist");
      expect(tablist).toHaveClass("border-b", "bg-[hsl(var(--md-sys-color-surface))]");
    });

    it("renders TabsTrigger correctly", () => {
      render(
        <Tabs>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      const tab = screen.getByRole("tab", { name: /tab 1/i });
      expect(tab).toBeInTheDocument();
      expect(tab).toHaveAttribute("aria-selected", "true");
    });

    it("renders TabsContent correctly", () => {
      render(
        <Tabs>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
        </Tabs>
      );

      expect(screen.getByText("Content 1")).toBeInTheDocument();
    });
  });

  describe("Variants", () => {
    it("renders primary variant correctly (default)", () => {
      render(
        <Tabs variant="primary">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      const tablist = screen.getByRole("tablist");
      expect(tablist).toHaveClass("bg-[hsl(var(--md-sys-color-surface))]");
    });

    it("renders secondary variant correctly", () => {
      render(
        <Tabs variant="secondary">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      const tablist = screen.getByRole("tablist");
      expect(tablist).toHaveClass("bg-[hsl(var(--md-sys-color-surface))]");
    });
  });

  describe("Tab Selection", () => {
    it("selects first tab by default", () => {
      render(
        <Tabs>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      const tab1 = screen.getByRole("tab", { name: /tab 1/i });
      expect(tab1).toHaveAttribute("aria-selected", "true");
    });

    it("changes tab on click", async () => {
      const user = userEvent.setup();
      render(
        <Tabs>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      const tab2 = screen.getByRole("tab", { name: /tab 2/i });
      await user.click(tab2);

      expect(tab2).toHaveAttribute("aria-selected", "true");
    });

    it("calls onValueChange callback when tab changes", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();

      render(
        <Tabs onValueChange={onValueChange}>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      const tab2 = screen.getByRole("tab", { name: /tab 2/i });
      await user.click(tab2);

      expect(onValueChange).toHaveBeenCalledWith("tab2");
    });

    it("displays correct content for selected tab", async () => {
      const user = userEvent.setup();
      render(
        <Tabs>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      expect(screen.getByText("Content 1")).toBeInTheDocument();
      expect(screen.queryByText("Content 2")).not.toBeInTheDocument();

      const tab2 = screen.getByRole("tab", { name: /tab 2/i });
      await user.click(tab2);

      expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
      expect(screen.getByText("Content 2")).toBeInTheDocument();
    });
  });

  describe("Keyboard Navigation", () => {
    it("navigates to next tab with ArrowRight", async () => {
      const user = userEvent.setup();
      render(
        <Tabs>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      const tab1 = screen.getByRole("tab", { name: /tab 1/i });
      tab1.focus();

      await user.keyboard("{ArrowRight}");

      const tab2 = screen.getByRole("tab", { name: /tab 2/i });
      expect(tab2).toHaveFocus();
    });

    it("navigates to previous tab with ArrowLeft", async () => {
      const user = userEvent.setup();
      render(
        <Tabs>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      const tab2 = screen.getByRole("tab", { name: /tab 2/i });
      tab2.focus();

      await user.keyboard("{ArrowLeft}");

      const tab1 = screen.getByRole("tab", { name: /tab 1/i });
      expect(tab1).toHaveFocus();
    });

    it("wraps to last tab when pressing ArrowLeft on first tab", async () => {
      const user = userEvent.setup();
      render(
        <Tabs>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      const tab1 = screen.getByRole("tab", { name: /tab 1/i });
      tab1.focus();

      await user.keyboard("{ArrowLeft}");

      const tab3 = screen.getByRole("tab", { name: /tab 3/i });
      expect(tab3).toHaveFocus();
    });

    it("wraps to first tab when pressing ArrowRight on last tab", async () => {
      const user = userEvent.setup();
      render(
        <Tabs>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      const tab3 = screen.getByRole("tab", { name: /tab 3/i });
      tab3.focus();

      await user.keyboard("{ArrowRight}");

      const tab1 = screen.getByRole("tab", { name: /tab 1/i });
      expect(tab1).toHaveFocus();
    });

    it("navigates to first tab with Home key", async () => {
      const user = userEvent.setup();
      render(
        <Tabs>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      const tab3 = screen.getByRole("tab", { name: /tab 3/i });
      tab3.focus();

      await user.keyboard("{Home}");

      const tab1 = screen.getByRole("tab", { name: /tab 1/i });
      expect(tab1).toHaveFocus();
    });

    it("navigates to last tab with End key", async () => {
      const user = userEvent.setup();
      render(
        <Tabs>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      const tab1 = screen.getByRole("tab", { name: /tab 1/i });
      tab1.focus();

      await user.keyboard("{End}");

      const tab3 = screen.getByRole("tab", { name: /tab 3/i });
      expect(tab3).toHaveFocus();
    });
  });

  describe("Disabled State", () => {
    it("disables individual tab when disabled prop is true", () => {
      render(
        <Tabs>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2" disabled>
              Tab 2
            </TabsTrigger>
          </TabsList>
        </Tabs>
      );

      const tab2 = screen.getByRole("tab", { name: /tab 2/i });
      expect(tab2).toBeDisabled();
    });

    it("prevents clicking disabled tab", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();

      render(
        <Tabs onValueChange={onValueChange}>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2" disabled>
              Tab 2
            </TabsTrigger>
          </TabsList>
        </Tabs>
      );

      const tab2 = screen.getByRole("tab", { name: /tab 2/i });
      await user.click(tab2);

      expect(onValueChange).not.toHaveBeenCalled();
    });
  });

  describe("Icons", () => {
    it("renders leading icon correctly", () => {
      const StarIcon = () => <span data-testid="star-icon">⭐</span>;

      render(
        <Tabs>
          <TabsList>
            <TabsTrigger value="tab1" icon={<StarIcon />} iconPosition="start">
              Tab 1
            </TabsTrigger>
          </TabsList>
        </Tabs>
      );

      expect(screen.getByTestId("star-icon")).toBeInTheDocument();
    });

    it("renders trailing icon correctly", () => {
      const StarIcon = () => <span data-testid="star-icon">⭐</span>;

      render(
        <Tabs>
          <TabsList>
            <TabsTrigger value="tab1" icon={<StarIcon />} iconPosition="end">
              Tab 1
            </TabsTrigger>
          </TabsList>
        </Tabs>
      );

      expect(screen.getByTestId("star-icon")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has correct ARIA attributes", () => {
      render(
        <Tabs>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      const tab1 = screen.getByRole("tab", { name: /tab 1/i });
      const tab2 = screen.getByRole("tab", { name: /tab 2/i });

      expect(tab1).toHaveAttribute("aria-selected", "true");
      expect(tab2).toHaveAttribute("aria-selected", "false");
    });

    it("has tabpanel role on content", () => {
      render(
        <Tabs>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
        </Tabs>
      );

      const tabpanel = screen.getByRole("tabpanel");
      expect(tabpanel).toBeInTheDocument();
    });

    it("passes axe accessibility audit", async () => {
      const { container } = render(
        <Tabs>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      const results = await axe(container);
      expect(results.violations).toHaveLength(0);
    });
  });

  describe("Controlled Component", () => {
    it("works as controlled component with value prop", async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <Tabs value="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      expect(screen.getByText("Content 1")).toBeInTheDocument();

      rerender(
        <Tabs value="tab2">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      expect(screen.getByText("Content 2")).toBeInTheDocument();
    });
  });

  describe("Active Indicator Animation", () => {
    it("displays active indicator on selected tab", async () => {
      const user = userEvent.setup();
      render(
        <Tabs>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      const tab1 = screen.getByRole("tab", { name: /tab 1/i });
      const indicator = tab1.querySelector("div[aria-hidden='true']");

      expect(indicator).toHaveClass("bg-[hsl(var(--md-sys-color-primary))]");
    });

    it("moves active indicator when tab changes", async () => {
      const user = userEvent.setup();
      render(
        <Tabs>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
        </Tabs>
      );

      const tab2 = screen.getByRole("tab", { name: /tab 2/i });
      await user.click(tab2);

      const indicator = tab2.querySelector("div[aria-hidden='true']");
      expect(indicator).toHaveClass("bg-[hsl(var(--md-sys-color-primary))]");
    });
  });

  describe("ForceMount", () => {
    it("renders content even when inactive with forceMount prop", () => {
      render(
        <Tabs>
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2" forceMount>
            Content 2
          </TabsContent>
        </Tabs>
      );

      // Both should be in document but only one visible
      expect(screen.getByText("Content 1")).toBeInTheDocument();
      expect(screen.getByText("Content 2")).toBeInTheDocument();
    });
  });
});
