"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "./types";
import { api } from "./api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, pass: string) => Promise<any>;
  setAuthSession: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => {},
  setAuthSession: () => {},
  logout: () => {},
  isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check saved session in browser sessionStorage (clears automatically when application window/tab is closed)
    try {
      // Clear legacy localStorage session so browser close forces fresh sign in
      if (typeof window !== "undefined") {
        localStorage.removeItem("exposurex_token");
        localStorage.removeItem("exposurex_user");
      }

      const storedToken = typeof window !== "undefined" ? sessionStorage.getItem("exposurex_token") : null;
      const storedUser = typeof window !== "undefined" ? sessionStorage.getItem("exposurex_user") : null;
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("exposurex_token");
        sessionStorage.removeItem("exposurex_user");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setAuthSession = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("exposurex_token", newToken);
      sessionStorage.setItem("exposurex_user", JSON.stringify(newUser));
      // Ensure localStorage has no permanent trace
      localStorage.removeItem("exposurex_token");
      localStorage.removeItem("exposurex_user");
    }
  };

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append("username", email.trim().toLowerCase());
      formData.append("password", pass);
      const res = await api.login(formData);

      if (res.mfa_required) {
        // Return response directly for MFA verification challenge
        return res;
      }

      const u: User = {
        id: res.user_id,
        email: res.email,
        full_name: res.full_name,
        role: res.role,
        is_active: true,
      };
      setAuthSession(res.access_token, u);
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("exposurex_token");
      sessionStorage.removeItem("exposurex_user");
      localStorage.removeItem("exposurex_token");
      localStorage.removeItem("exposurex_user");
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, setAuthSession, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
