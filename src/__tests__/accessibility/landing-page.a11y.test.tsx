import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "vitest-axe";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeatureCard } from "@/components/landing/FeatureCard";
import { Building2 } from "lucide-react";

describe("Landing Page Accessibility", () => {
  it("HeroSection should not have accessibility violations", async () => {
    const { container } = render(<HeroSection />);
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it("FeatureCard should not have accessibility violations", async () => {
    const { container } = render(
      <FeatureCard
        icon={<Building2 aria-label="Building icon" />}
        title="Test Feature"
        description="Test Description"
        index={0}
      />
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it("HeroSection has proper heading hierarchy", () => {
    const { container } = render(<HeroSection />);
    const h1 = container.querySelector("h1");
    expect(h1).toBeInTheDocument();
    expect(h1?.textContent).toBeTruthy();
  });

  it("HeroSection CTAs are keyboard accessible", () => {
    const { getAllByRole } = render(<HeroSection />);
    const links = getAllByRole("link");

    // Should have 2 CTA links
    expect(links).toHaveLength(2);

    // Links should have href attributes
    links.forEach((link) => {
      expect(link).toHaveAttribute("href");
    });
  });
});
