import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../tabs";
import { Home, User, Settings } from "lucide-react";

describe("Tabs", () => {
  describe("Tab Selection and onChange Callback", () => {
    it("renders tabs with default selected tab", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      const tab1 = screen.getByRole("tab", { name: /tab 1/i });
      expect(tab1).toHaveAttribute("data-state", "active");
      expect(tab1).toHaveAttribute("aria-selected", "true");
    });

    it("changes selected tab when clicked", async () => {
      const user = userEvent.setup();
      render(
        <Tabs defaultValue="tab1">
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

      await waitFor(() => {
        expect(tab2).toHaveAttribute("data-state", "active");
        expect(tab2).toHaveAttribute("aria-selected", "true");
      });
    });

    it("calls onValueChange when tab is selected", async () => {
      const handleValueChange = vi.fn();
      const user = userEvent.setup();

      render(
        <Tabs defaultValue="tab1" onValueChange={handleValueChange}>
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

      expect(handleValueChange).toHaveBeenCalledWith("tab2");
    });

    it("displays content for selected tab", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      const tabPanels = screen.getAllByRole("tabpanel", { hidden: true });
      const activePanel = tabPanels.find((panel) => panel.getAttribute("data-state") === "active");
      const inactivePanel = tabPanels.find((panel) => panel.getAttribute("data-state") === "inactive");

      expect(activePanel).toHaveTextContent("Content 1");
      expect(inactivePanel).toHaveAttribute("hidden");
    });

    it("switches content when tab changes", async () => {
      const user = userEvent.setup();
      render(
        <Tabs defaultValue="tab1">
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

      await waitFor(() => {
        const tabPanels = screen.getAllByRole("tabpanel", { hidden: true });
        const activePanel = tabPanels.find((panel) => panel.getAttribute("data-state") === "active");
        const inactivePanel = tabPanels.find((panel) => panel.getAttribute("data-state") === "inactive");

        expect(activePanel).toHaveTextContent("Content 2");
        expect(inactivePanel).toHaveAttribute("hidden");
      });
    });
  });

  describe("Primary and Secondary Variants", () => {
    it("renders primary variant with filled indicator", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList variant="primary">
            <TabsTrigger variant="primary" value="tab1">
              Tab 1
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
        </Tabs>
      );

      const tabsList = screen.getByRole("tablist");
      expect(tabsList).toHaveClass("bg-[hsl(var(--md-sys-color-surface-container))]");
      expect(tabsList).toHaveClass("rounded-[var(--md-sys-shape-corner-full)]");

      const tab = screen.getByRole("tab", { name: /tab 1/i });
      expect(tab).toHaveClass("data-[state=active]:bg-[hsl(var(--md-sys-color-secondary-container))]");
    });

    it("renders secondary variant with underline indicator", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList variant="secondary">
            <TabsTrigger variant="secondary" value="tab1">
              Tab 1
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
        </Tabs>
      );

      const tabsList = screen.getByRole("tablist");
      expect(tabsList).toHaveClass("border-b");
      expect(tabsList).toHaveClass("border-[hsl(var(--md-sys-color-surface-variant))]");

      const tab = screen.getByRole("tab", { name: /tab 1/i });
      expect(tab).toHaveClass("data-[state=active]:border-[hsl(var(--md-sys-color-primary))]");
    });

    it("applies correct styling for active primary tab", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList variant="primary">
            <TabsTrigger variant="primary" value="tab1">
              Tab 1
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
        </Tabs>
      );

      const tab = screen.getByRole("tab", { name: /tab 1/i });
      expect(tab).toHaveAttribute("data-state", "active");
      expect(tab).toHaveClass("data-[state=active]:bg-[hsl(var(--md-sys-color-secondary-container))]");
      expect(tab).toHaveClass("data-[state=active]:text-[hsl(var(--md-sys-color-on-secondary-container))]");
    });

    it("applies correct styling for active secondary tab", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList variant="secondary">
            <TabsTrigger variant="secondary" value="tab1">
              Tab 1
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
        </Tabs>
      );

      const tab = screen.getByRole("tab", { name: /tab 1/i });
      expect(tab).toHaveAttribute("data-state", "active");
      expect(tab).toHaveClass("data-[state=active]:text-[hsl(var(--md-sys-color-primary))]");
      expect(tab).toHaveClass("data-[state=active]:border-[hsl(var(--md-sys-color-primary))]");
    });
  });

  describe("Keyboard Navigation", () => {
    it("navigates tabs with Arrow Right key", async () => {
      const user = userEvent.setup();
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
          <TabsContent value="tab3">Content 3</TabsContent>
        </Tabs>
      );

      const tab1 = screen.getByRole("tab", { name: /tab 1/i });
      tab1.focus();

      await user.keyboard("{ArrowRight}");

      const tab2 = screen.getByRole("tab", { name: /tab 2/i });
      expect(tab2).toHaveFocus();
    });

    it("navigates tabs with Arrow Left key", async () => {
      const user = userEvent.setup();
      render(
        <Tabs defaultValue="tab2">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
          <TabsContent value="tab3">Content 3</TabsContent>
        </Tabs>
      );

      const tab2 = screen.getByRole("tab", { name: /tab 2/i });
      tab2.focus();

      await user.keyboard("{ArrowLeft}");

      const tab1 = screen.getByRole("tab", { name: /tab 1/i });
      expect(tab1).toHaveFocus();
    });

    it("navigates to first tab with Home key", async () => {
      const user = userEvent.setup();
      render(
        <Tabs defaultValue="tab3">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
          <TabsContent value="tab3">Content 3</TabsContent>
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
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
          <TabsContent value="tab3">Content 3</TabsContent>
        </Tabs>
      );

      const tab1 = screen.getByRole("tab", { name: /tab 1/i });
      tab1.focus();

      await user.keyboard("{End}");

      const tab3 = screen.getByRole("tab", { name: /tab 3/i });
      expect(tab3).toHaveFocus();
    });

    it("skips disabled tabs during keyboard navigation", async () => {
      const user = userEvent.setup();
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2" disabled>
              Tab 2
            </TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
          <TabsContent value="tab3">Content 3</TabsContent>
        </Tabs>
      );

      const tab1 = screen.getByRole("tab", { name: /tab 1/i });
      tab1.focus();

      await user.keyboard("{ArrowRight}");

      const tab3 = screen.getByRole("tab", { name: /tab 3/i });
      expect(tab3).toHaveFocus();
    });
  });

  describe("Disabled Tabs", () => {
    it("renders disabled tab with proper styling", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2" disabled>
              Tab 2
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      const tab2 = screen.getByRole("tab", { name: /tab 2/i });
      expect(tab2).toHaveAttribute("disabled");
      expect(tab2).toHaveClass("disabled:pointer-events-none");
      expect(tab2).toHaveClass("disabled:opacity-38");
    });

    it("does not select disabled tab when clicked", async () => {
      const user = userEvent.setup();
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2" disabled>
              Tab 2
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      const tab2 = screen.getByRole("tab", { name: /tab 2/i });
      await user.click(tab2);

      expect(tab2).toHaveAttribute("data-state", "inactive");
      expect(tab2).toHaveAttribute("aria-selected", "false");
    });
  });

  describe("Tabs with Icons", () => {
    it("renders tabs with leading icons", () => {
      render(
        <Tabs defaultValue="home">
          <TabsList>
            <TabsTrigger value="home" icon={<Home data-testid="home-icon" />}>
              Home
            </TabsTrigger>
            <TabsTrigger value="profile" icon={<User data-testid="user-icon" />}>
              Profile
            </TabsTrigger>
            <TabsTrigger value="settings" icon={<Settings data-testid="settings-icon" />}>
              Settings
            </TabsTrigger>
          </TabsList>
          <TabsContent value="home">Home Content</TabsContent>
          <TabsContent value="profile">Profile Content</TabsContent>
          <TabsContent value="settings">Settings Content</TabsContent>
        </Tabs>
      );

      expect(screen.getByTestId("home-icon")).toBeInTheDocument();
      expect(screen.getByTestId("user-icon")).toBeInTheDocument();
      expect(screen.getByTestId("settings-icon")).toBeInTheDocument();
    });

    it("renders icon-only tabs with aria-label", () => {
      render(
        <Tabs defaultValue="home">
          <TabsList>
            <TabsTrigger value="home" icon={<Home />} aria-label="Home" />
            <TabsTrigger value="profile" icon={<User />} aria-label="Profile" />
          </TabsList>
          <TabsContent value="home">Home Content</TabsContent>
          <TabsContent value="profile">Profile Content</TabsContent>
        </Tabs>
      );

      const homeTab = screen.getByRole("tab", { name: /home/i });
      const profileTab = screen.getByRole("tab", { name: /profile/i });

      expect(homeTab).toBeInTheDocument();
      expect(profileTab).toBeInTheDocument();
    });
  });

  describe("MD3 Styling", () => {
    it("applies MD3 title-small typography to tabs", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
        </Tabs>
      );

      const tab = screen.getByRole("tab", { name: /tab 1/i });
      expect(tab).toHaveClass("text-[length:var(--md-sys-typescale-title-small-size)]");
      expect(tab).toHaveClass("leading-[var(--md-sys-typescale-title-small-line-height)]");
      expect(tab).toHaveClass("font-[number:var(--md-sys-typescale-title-small-weight)]");
      expect(tab).toHaveClass("tracking-[var(--md-sys-typescale-title-small-tracking)]");
    });

    it("applies MD3 motion easing to transitions", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
        </Tabs>
      );

      const tab = screen.getByRole("tab", { name: /tab 1/i });
      expect(tab).toHaveClass("duration-[var(--md-sys-motion-duration-short4)]");
      expect(tab).toHaveClass("ease-[var(--md-sys-motion-easing-standard)]");
    });

    it("applies MD3 shape tokens to primary variant", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList variant="primary">
            <TabsTrigger variant="primary" value="tab1">
              Tab 1
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
        </Tabs>
      );

      const tabsList = screen.getByRole("tablist");
      expect(tabsList).toHaveClass("rounded-[var(--md-sys-shape-corner-full)]");

      const tab = screen.getByRole("tab", { name: /tab 1/i });
      expect(tab).toHaveClass("rounded-[var(--md-sys-shape-corner-full)]");
    });

    it("applies content animations with MD3 motion", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
        </Tabs>
      );

      const content = screen.getByRole("tabpanel");
      expect(content).toHaveClass("data-[state=active]:duration-[var(--md-sys-motion-duration-short4)]");
      expect(content).toHaveClass("data-[state=inactive]:duration-[var(--md-sys-motion-duration-short2)]");
    });
  });

  describe("Accessibility", () => {
    it("has role='tablist' on tabs container", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
        </Tabs>
      );

      expect(screen.getByRole("tablist")).toBeInTheDocument();
    });

    it("tabs have role='tab'", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      const tabs = screen.getAllByRole("tab");
      expect(tabs).toHaveLength(2);
    });

    it("active tab has aria-selected='true'", () => {
      render(
        <Tabs defaultValue="tab1">
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

    it("tab content has role='tabpanel'", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
        </Tabs>
      );

      expect(screen.getByRole("tabpanel")).toBeInTheDocument();
    });

    it("disabled tabs have proper aria attributes", () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2" disabled>
              Tab 2
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      );

      const tab2 = screen.getByRole("tab", { name: /tab 2/i });
      expect(tab2).toHaveAttribute("disabled");
    });

    it("passes axe accessibility tests with primary variant", async () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList variant="primary">
            <TabsTrigger variant="primary" value="tab1" icon={<Home />}>
              Home
            </TabsTrigger>
            <TabsTrigger variant="primary" value="tab2" icon={<User />}>
              Profile
            </TabsTrigger>
            <TabsTrigger variant="primary" value="tab3" icon={<Settings />}>
              Settings
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Home Content</TabsContent>
          <TabsContent value="tab2">Profile Content</TabsContent>
          <TabsContent value="tab3">Settings Content</TabsContent>
        </Tabs>
      );

      const results = await axe(container);
      expect(results.violations).toHaveLength(0);
    });

    it("passes axe accessibility tests with secondary variant", async () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList variant="secondary">
            <TabsTrigger variant="secondary" value="tab1">
              Overview
            </TabsTrigger>
            <TabsTrigger variant="secondary" value="tab2">
              Analytics
            </TabsTrigger>
            <TabsTrigger variant="secondary" value="tab3" disabled>
              Reports
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Overview Content</TabsContent>
          <TabsContent value="tab2">Analytics Content</TabsContent>
          <TabsContent value="tab3">Reports Content</TabsContent>
        </Tabs>
      );

      const results = await axe(container);
      expect(results.violations).toHaveLength(0);
    });

    it("passes axe accessibility tests with icon-only tabs", async () => {
      const { container } = render(
        <Tabs defaultValue="home">
          <TabsList variant="primary">
            <TabsTrigger variant="primary" value="home" icon={<Home />} aria-label="Home" />
            <TabsTrigger variant="primary" value="profile" icon={<User />} aria-label="Profile" />
            <TabsTrigger variant="primary" value="settings" icon={<Settings />} aria-label="Settings" />
          </TabsList>
          <TabsContent value="home">Home Content</TabsContent>
          <TabsContent value="profile">Profile Content</TabsContent>
          <TabsContent value="settings">Settings Content</TabsContent>
        </Tabs>
      );

      const results = await axe(container);
      expect(results.violations).toHaveLength(0);
    });
  });
});
