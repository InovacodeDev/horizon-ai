import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DashboardPage from "@/app/(app)/dashboard/page";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock fetch
global.fetch = vi.fn();

describe("Dashboard Access Integration", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  it("shows empty state when no bank connections exist", async () => {
    // Mock API response with no accounts
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        consolidatedBalance: {
          total: 0,
          currency: "BRL",
          byType: {},
        },
        accounts: [],
        transactions: {
          data: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            hasMore: false,
          },
        },
      }),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>
    );

    // Should show empty state
    await waitFor(() => {
      expect(
        screen.getByText("Conecte sua primeira conta")
      ).toBeInTheDocument();
    });
  });

  it("shows dashboard content when bank connections exist", async () => {
    // Mock API response with accounts
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        consolidatedBalance: {
          total: 5000,
          currency: "BRL",
          byType: { CHECKING: 5000 },
        },
        accounts: [
          {
            id: "1",
            name: "Conta Corrente",
            accountType: "CHECKING",
            accountNumber: "12345",
            balance: 5000,
            currency: "BRL",
            institutionName: "Banco Teste",
            lastSync: new Date().toISOString(),
            status: "ACTIVE",
            connectionId: "conn-1",
          },
        ],
        transactions: {
          data: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            hasMore: false,
          },
        },
      }),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>
    );

    // Should show dashboard header
    await waitFor(() => {
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });
  });
});
