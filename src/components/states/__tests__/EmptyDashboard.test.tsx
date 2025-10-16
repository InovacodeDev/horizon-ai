import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EmptyDashboard } from "../EmptyDashboard";

describe("EmptyDashboard", () => {
  it("renders empty state message", () => {
    const mockOnConnect = vi.fn();

    render(<EmptyDashboard onConnectBank={mockOnConnect} />);

    expect(screen.getByText("Conecte sua primeira conta")).toBeInTheDocument();
    expect(
      screen.getByText(/Conecte sua primeira conta para começar/i)
    ).toBeInTheDocument();
  });

  it("calls onConnectBank when button is clicked", () => {
    const mockOnConnect = vi.fn();

    render(<EmptyDashboard onConnectBank={mockOnConnect} />);

    const button = screen.getByRole("button", { name: /Conectar conta/i });
    fireEvent.click(button);

    expect(mockOnConnect).toHaveBeenCalledTimes(1);
  });
});
