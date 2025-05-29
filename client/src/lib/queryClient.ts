import { QueryClient, QueryFunction } from "@tanstack/react-query";

/**
 * Utility function to handle HTTP response errors
 * Throws an error with status code and response text for failed requests
 */
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      const text = await res.text();
      const errorMessage = text || res.statusText || `HTTP ${res.status}`;
      throw new Error(`${res.status}: ${errorMessage}`);
    } catch (parseError) {
      throw new Error(`${res.status}: ${res.statusText}`);
    }
  }
}

/**
 * Make authenticated API requests with proper error handling
 * @param method - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param url - API endpoint URL
 * @param data - Request body data (will be JSON stringified)
 * @returns Response object after validation
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    const res = await fetch(url, {
      method,
      headers: {
        ...(data ? { "Content-Type": "application/json" } : {}),
        "Accept": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    // Log error for debugging while preserving original error
    console.error(`API request failed: ${method} ${url}`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";

/**
 * Create a query function with configurable unauthorized behavior
 * @param options - Configuration options for handling 401 responses
 * @returns TanStack Query-compatible query function
 */
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey, signal }) => {
    try {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
        signal, // Support request cancellation
        headers: {
          "Accept": "application/json",
        },
      });

      // Handle unauthorized responses based on configuration
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      // Enhanced error logging with query key context
      console.error(`Query failed for ${queryKey[0]}:`, error);
      throw error;
    }
  };

/**
 * Global query client configuration
 * Optimized for download management application with conservative settings
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false, // No automatic refetching for downloads
      refetchOnWindowFocus: false, // Don't refetch when user returns to tab
      staleTime: 30 * 1000, // Consider data stale after 30 seconds
      gcTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes
      retry: (failureCount, error) => {
        // Don't retry client errors (4xx), only server errors (5xx)
        if (error instanceof Error && error.message.includes('4')) {
          return false;
        }
        return failureCount < 2; // Retry up to 2 times for server errors
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
    mutations: {
      retry: false, // Don't retry mutations to avoid duplicate operations
    },
  },
});
