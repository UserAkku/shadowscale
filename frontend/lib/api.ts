import { getToken, clearAuth } from "./auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    if (res.status === 401) {
      clearAuth();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith('/auth')) {
        window.location.href = "/auth";
      }
    }
    let error;
    try {
      error = await res.json();
    } catch (e) {
      error = { error: "Something went wrong" };
    }
    throw new Error(error?.error || "Something went wrong");
  }

  return res.json();
}

export const api = {
  shortenURL: (originalUrl: string) =>
    request<any>("/api/urls", { method: "POST", body: JSON.stringify({ originalUrl }) }),

  getMyURLs: () => request<any>("/api/urls/my"),

  claimURL: (claimToken: string) =>
    request<any>("/api/urls/claim", { method: "POST", body: JSON.stringify({ claimToken }) }),

  deleteURL: (shortCode: string, userId: number) =>
    request<any>(`/api/urls/${shortCode}`, { method: "DELETE", body: JSON.stringify({ userId }) }),

  getAnalytics: (shortCode: string) => request<any>(`/api/analytics/${shortCode}`),

  login: (email: string, password: string) =>
    request<any>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),

  signup: (email: string, password: string) =>
    request<any>("/auth/signup", { method: "POST", body: JSON.stringify({ email, password }) }),
};
