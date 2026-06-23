import type {
  ApiErrorResponse,
  DashboardSummary,
  FeedResponse,
  LoginResponse,
  MutableSignalStatus,
  PageResponse,
  SectorStoryResponse,
  SectorsResponse,
  Signal,
  Tropel,
  User,
} from "./types";

type QueryValue = string | number | boolean | null | undefined;

export class ApiError extends Error {
  status: number;
  code: string;
  details: Record<string, unknown>;

  constructor(status: number, response: ApiErrorResponse) {
    super(response.message);
    this.name = "ApiError";
    this.status = status;
    this.code = response.error;
    this.details = response.details;
  }
}

const fallbackBaseUrl = "https://hackaton-20261-front-587720740455.us-east1.run.app/api/v1";

export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? fallbackBaseUrl;

export function buildQuery(params: Record<string, QueryValue>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const serialized = search.toString();
  return serialized ? `?${serialized}` : "";
}

async function parseError(response: Response): Promise<ApiErrorResponse> {
  try {
    return (await response.json()) as ApiErrorResponse;
  } catch {
    return {
      error: "HTTP_ERROR",
      message: `Request failed with status ${response.status}`,
      timestamp: new Date().toISOString(),
      path: response.url,
      details: {},
    };
  }
}

export async function requestJson<T>(
  path: string,
  options: {
    token?: string | null;
    method?: "GET" | "POST" | "PATCH";
    body?: unknown;
    signal?: AbortSignal;
  } = {},
): Promise<T> {
  const headers = new Headers();
  headers.set("Accept", "application/json");
  if (options.body !== undefined) headers.set("Content-Type", "application/json");
  if (options.token) headers.set("Authorization", `Bearer ${options.token}`);

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  });

  if (!response.ok) throw new ApiError(response.status, await parseError(response));
  return (await response.json()) as T;
}

export const api = {
  login: (body: { teamCode: string; email: string; password: string }) =>
    requestJson<LoginResponse>("/auth/login", { method: "POST", body }),
  me: (token: string, signal?: AbortSignal) => requestJson<User>("/auth/me", { token, signal }),
  dashboard: (token: string, signal?: AbortSignal) =>
    requestJson<DashboardSummary>("/dashboard/summary", { token, signal }),
  sectors: (token: string, signal?: AbortSignal) => requestJson<SectorsResponse>("/sectors", { token, signal }),
  tropels: (token: string, params: Record<string, QueryValue>, signal?: AbortSignal) =>
    requestJson<PageResponse<Tropel>>(`/tropels${buildQuery(params)}`, { token, signal }),
  signalFeed: (token: string, params: Record<string, QueryValue>, signal?: AbortSignal) =>
    requestJson<FeedResponse>(`/signals/feed${buildQuery(params)}`, { token, signal }),
  signalDetail: (token: string, id: string, signal?: AbortSignal) =>
    requestJson<Signal>(`/signals/${encodeURIComponent(id)}`, { token, signal }),
  updateSignalStatus: (token: string, id: string, status: MutableSignalStatus) =>
    requestJson<Signal>(`/signals/${encodeURIComponent(id)}/status`, { method: "PATCH", token, body: { status } }),
  sectorStory: (token: string, id: string, signal?: AbortSignal) =>
    requestJson<SectorStoryResponse>(`/sectors/${encodeURIComponent(id)}/story`, { token, signal }),
};
