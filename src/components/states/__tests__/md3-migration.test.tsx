import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingState } from "../LoadingState";
import { ErrorState } from "../ErrorState";
import { EmptyAssets } from "../EmptyAssets";
import { EmptyTransactionFeed } from "../EmptyTransactionFeed";

/**
 * Tests to verify MD3 migration of state components
 * Ensures components render correctly with MD3 design tokens
 */
describe("MD3 State Components Migration", () => {
  describe("LoadingState", () => {
    it("renders with default message", () => {
      render(<LoadingState />);
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("renders with custom message", () => {
      render(<LoadingState message="Please wait..." />);
      expect(screen.getByText("Please wait...")).toBeInTheDocument();
    });

    it("renders CircularProgress component", () => {
      const { container } = render(<LoadingState />);
      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe("ErrorState", () => {
    it("renders with default title and custom message", () => {
      render(<ErrorState message="An error occurred" />);
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      expect(screen.getByText("An error occurred")).toBeInTheDocument();
    });

    it("renders with custom title", () => {
      render(<ErrorState title="Custom Error" message="Error details" />);
      expect(screen.getByText("Custom Error")).toBeInTheDocument();
    });

    it("renders retry button when onRetry is provided", () => {
      const onRetry = vi.fn();
      render(<ErrorState message="Error" onRetry={onRetry} />);
      expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
    });

    it("renders secondary action button when provided", () => {
      const onSecondaryAction = vi.fn();
      render(<ErrorState message="Error" onSecondaryAction={onSecondaryAction} secondaryActionLabel="Go Home" />);
      expect(screen.getByRole("button", { name: /go home/i })).toBeInTheDocument();
    });
  });

  describe("EmptyAssets", () => {
    it("renders empty assets message", () => {
      render(<EmptyAssets />);
      expect(screen.getByText("Nenhum ativo cadastrado")).toBeInTheDocument();
      expect(screen.getByText(/Adicione notas fiscais para rastrear/i)).toBeInTheDocument();
    });
  });

  describe("EmptyTransactionFeed", () => {
    it("renders empty transaction message", () => {
      render(<EmptyTransactionFeed />);
      expect(screen.getByText("Nenhuma transação ainda")).toBeInTheDocument();
      expect(screen.getByText(/Suas transações aparecerão aqui/i)).toBeInTheDocument();
    });
  });
});
