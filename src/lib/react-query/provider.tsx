"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

/**
 * Handle authentication errors by attempting to refresh the token
 */
async function handleAuthError() {
  try {
    const response = await fetch("/api/v1/auth/refresh", {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      // Refresh failed, redirect to login
      window.location.href = "/login";
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to refresh token:", error);
    window.location.href = "/login";
    return false;
  }
}

export function ReactQueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: true,
            retry: (failureCount, error: unknown) => {
              // Don't retry on 401 errors - handle auth error instead
              const err = error as {
                status?: number;
                response?: { status?: number };
              };
              if (err?.status === 401 || err?.response?.status === 401) {
                handleAuthError();
                return false;
              }
              // Retry up to 3 times for other errors
              return failureCount < 3;
            },
          },
          mutations: {
            retry: (failureCount, error: unknown) => {
              // Don't retry on 401 errors
              const err = error as {
                status?: number;
                response?: { status?: number };
              };
              if (err?.status === 401 || err?.response?.status === 401) {
                handleAuthError();
                return false;
              }
              // Don't retry mutations by default
              return false;
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
