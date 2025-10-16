import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FeatureCard } from "../FeatureCard";

describe("FeatureCard", () => {
  it("renders feature content correctly", () => {
    const icon = <svg data-testid="test-icon" />;

    render(
      <FeatureCard
        icon={icon}
        title="Test Feature"
        description="Test Description"
        index={0}
      />
    );

    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
    expect(screen.getByText("Test Feature")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
  });
});
