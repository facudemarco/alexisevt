"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";

interface AuthContextType {
  isAuthenticated: boolean;
  role: string | null;
  login: (token: string, userRole: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    // Check initial state from cookies on mount
    const token = Cookies.get("access_token");
    const storedRole = Cookies.get("user_role");
    if (token) {
      setIsAuthenticated(true);
      setRole(storedRole || null);
    }
  }, []);

  const login = (token: string, userRole: string) => {
    Cookies.set("access_token", token, { expires: 7 }); // 7 days
    Cookies.set("user_role", userRole, { expires: 7 });
    setIsAuthenticated(true);
    setRole(userRole);
  };

  const logout = () => {
    Cookies.remove("access_token");
    Cookies.remove("user_role");
    setIsAuthenticated(false);
    setRole(null);
    window.location.href = "/admin/login";
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, role, login, logout }}>
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
