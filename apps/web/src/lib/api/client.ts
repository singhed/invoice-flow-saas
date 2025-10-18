import { env } from "@/env";
import type {
  HealthResponse,
  HelloResponse,
  Expense,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  CategoriesResponse,
  AISuggestionRequest,
  AISuggestionResponse,
  ApiError,
} from "./types";

/**
 * Base API client configuration
 */
const API_BASE_URL = env.NEXT_PUBLIC_API_URL;
const isServer = typeof window === "undefined";

/**
 * Custom error class for API errors
 */
export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: ApiError
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

/**
 * Generic fetch wrapper with error handling
 */
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const method = (options?.method ?? "GET").toString().toUpperCase();

  const finalOptions: RequestInit = {
    ...options,
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options?.headers as any),
    },
  };

  // Enable Next.js fetch caching for server-side GET requests by default
  if (isServer && method === "GET" && !(finalOptions as any).next && !finalOptions.cache) {
    (finalOptions as any).next = { revalidate: 10 };
  }

  try {
    const response = await fetch(url, finalOptions as any);

    // Handle empty responses (e.g., 204 No Content)
    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new ApiClientError(
        (data as any).detail || `API request failed with status ${response.status}`,
        response.status,
        data
      );
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }

    throw new ApiClientError(
      error instanceof Error ? error.message : "Unknown error occurred",
      500
    );
  }
}

/**
 * Health check endpoint
 */
export async function getHealth(opts?: { signal?: AbortSignal; timeoutMs?: number }): Promise<HealthResponse> {
  let controller: AbortController | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;

  if (!opts?.signal && (opts?.timeoutMs ?? 0) > 0) {
    controller = new AbortController();
    timeout = setTimeout(() => controller?.abort(), opts!.timeoutMs);
  }

  try {
    return await fetchApi<HealthResponse>("/healthz", {
      signal: opts?.signal ?? controller?.signal,
      cache: "no-store",
      // keepalive is best-effort in browsers; harmless on server
      // @ts-expect-error keepalive is a valid RequestInit in browsers
      keepalive: true,
    });
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

/**
 * Hello endpoint (example)
 */
export async function getHello(): Promise<HelloResponse> {
  return fetchApi<HelloResponse>("/api/v1/hello");
}

/**
 * Get all expenses
 */
export async function getExpenses(params?: { skip?: number; limit?: number }): Promise<Expense[]> {
  const searchParams = new URLSearchParams();
  if (params?.skip) searchParams.set("skip", params.skip.toString());
  if (params?.limit) searchParams.set("limit", params.limit.toString());

  const query = searchParams.toString();
  const endpoint = query ? `/api/expenses?${query}` : "/api/expenses";

  return fetchApi<Expense[]>(endpoint);
}

/**
 * Get a single expense by ID
 */
export async function getExpense(id: number): Promise<Expense> {
  return fetchApi<Expense>(`/api/expenses/${id}`);
}

/**
 * Create a new expense
 */
export async function createExpense(data: CreateExpenseRequest): Promise<Expense> {
  return fetchApi<Expense>("/api/expenses", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Update an expense
 */
export async function updateExpense(id: number, data: UpdateExpenseRequest): Promise<Expense> {
  return fetchApi<Expense>(`/api/expenses/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Delete an expense
 */
export async function deleteExpense(id: number): Promise<void> {
  return fetchApi<void>(`/api/expenses/${id}`, {
    method: "DELETE",
  });
}

/**
 * Get available categories
 */
export async function getCategories(): Promise<CategoriesResponse> {
  return fetchApi<CategoriesResponse>("/api/categories");
}

/**
 * Get AI suggestion for expense
 */
export async function getAISuggestion(data: AISuggestionRequest): Promise<AISuggestionResponse> {
  return fetchApi<AISuggestionResponse>("/api/expenses/ai-suggest", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
