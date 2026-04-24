export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("shadowscale_token");
}

export function setToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("shadowscale_token", token);
  }
}

export function clearAuth() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("shadowscale_token");
    localStorage.removeItem("shadowscale_user");
  }
}

export function getUser() {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem("shadowscale_user");
  return user ? JSON.parse(user) : null;
}

export function setUser(user: any) {
  if (typeof window !== "undefined") {
    localStorage.setItem("shadowscale_user", JSON.stringify(user));
  }
}
