"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getUser, getToken, setToken as setLocalToken, setUser as setLocalUser, clearAuth } from "@/lib/auth";

interface AuthContextType {
  user: any;
  token: string | null;
  isLoggedIn: boolean;
  login: (token: string, user: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setUser(getUser());
    setToken(getToken());
    setIsMounted(true);
  }, []);

  const login = (newToken: string, newUser: any) => {
    setLocalToken(newToken);
    setLocalUser(newUser);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    clearAuth();
    setToken(null);
    setUser(null);
  };

  if (!isMounted) return null;

  return (
    <AuthContext.Provider value={{ user, token, isLoggedIn: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
