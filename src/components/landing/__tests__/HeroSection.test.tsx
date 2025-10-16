import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeroSection } from "../HeroSection";

describe("HeroSection", () => {
  it("renders with default content", () => {
    render(<HeroSection />);

    expect(
      screen.getByText(/O sistema operacional para as finanças da sua família/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Criar Conta Grátis/i)).toBeInTheDocument();
    expect(screen.getByText(/Entrar/i)).toBeInTheDocument();
  });

  it("renders with custom props", () => {
    render(
      <HeroSection
        title="Custom Title"
        subtitle="Custom Subtitle"
        primaryCTA={{ text: "Custom CTA", href: "/custom" }}
        secondaryCTA={{ text: "Custom Secondary", href: "/secondary" }}
      />
    );

    expect(screen.getByText("Custom Title")).toBeInTheDocument();
    expect(screen.getByText("Custom Subtitle")).toBeInTheDocument();
    expect(screen.getByText("Custom CTA")).toBeInTheDocument();
    expect(screen.getByText("Custom Secondary")).toBeInTheDocument();
  });
});
