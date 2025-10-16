import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "vitest-axe";
import { EmptyDashboard } from "@/components/states/EmptyDashboard";

describe("Empty States Accessibility", () => {
  it("EmptyDashboard should not have accessibility violations", async () => {
    const mockOnConnect = vi.fn();
    const { container } = render(
      <EmptyDashboard onConnectBank={mockOnConnect} />
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it("EmptyDashboard has proper heading hierarchy", () => {
    const mockOnConnect = vi.fn();
    const { container } = render(
      <EmptyDashboard onConnectBank={mockOnConnect} />
    );
    const h1 = container.querySelector("h1");
    expect(h1).toBeInTheDocument();
    expect(h1?.textContent).toBe("Conecte sua primeira conta");
  });

  it("EmptyDashboard button is keyboard accessible", () => {
    const mockOnConnect = vi.fn();
    const { getByRole } = render(
      <EmptyDashboard onConnectBank={mockOnConnect} />
    );
    const button = getByRole("button");

    expect(button).toBeInTheDocument();
    expect(button).toHaveAccessibleName();
  });
});
