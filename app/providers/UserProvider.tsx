"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { User } from "@/types/user";
import AuthLoading from "@/components/AuthLoading/AuthLoading";

interface UserContextType {
  user: User | null;
  setUser: (userData: User | null) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

function decodeJwt(token: string): { exp: number } | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();

  // Load from localStorage on app start
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const userData = JSON.parse(stored);
        if (!userData.accessTokenExpiresAt || !userData.refreshTokenExpiresAt) {
          localStorage.removeItem("user");
          setUserState(null);
        } else {
          userData.accessTokenExpiresAt = new Date(userData.accessTokenExpiresAt);
          userData.refreshTokenExpiresAt = new Date(userData.refreshTokenExpiresAt);
          setUserState(userData);
        }
      } catch {
        localStorage.removeItem("user");
        setUserState(null);
      }
    } else {
      setUserState(null);
    }
    setIsLoaded(true);
  }, []);

  // Wrapper so we sync context + localStorage, and compute expirations
  const setUser = useCallback((userData: User | null) => {
    let finalData: User | null = null;
    if (userData) {
      const accessPayload = decodeJwt(userData.accessToken);
      const refreshPayload = decodeJwt(userData.refreshToken);
      if (accessPayload?.exp && refreshPayload?.exp) {
        const bufferMs = 60000; // 1 minute before actual

        finalData = {
          ...userData,
          accessTokenExpiresAt: new Date(accessPayload.exp * 1000 - bufferMs),
          refreshTokenExpiresAt: new Date(refreshPayload.exp * 1000 - bufferMs),
        };
      } else {
        // Invalid tokens; treat as null
        finalData = null;
      }
    }
    if (finalData) {
      localStorage.setItem("user", JSON.stringify(finalData));
    } else {
      localStorage.removeItem("user");
    }
    setUserState(finalData);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    router.push("/login");
  }, [setUser]);

  // Auto-refresh logic
  const refreshTokens = useCallback(async () => {
    if (!user?.refreshToken || !user?.accessToken) {
      logout();
      return;
    }
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`, { refreshToken: user.refreshToken }, { headers });

      const data = response.data;
      if (data.success) {
        setUser({ ...user, accessToken: data.accessToken, refreshToken: data.refreshToken });
      } else {
        console.error(data.message);
        logout();
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const errorMessage = err.response.data?.message || err.response.data || "Refresh failed";
        console.error(`Refresh failed with status ${err.response.status}: ${errorMessage}`);
      } else {
        console.error(err);
      }
      logout();
    }
  }, [user, setUser, logout]);

  useEffect(() => {
    if (!user) return;

    const now = Date.now();
    if (now >= user.refreshTokenExpiresAt.getTime()) {
      logout();
      return;
    }

    const timeToRefresh = user.accessTokenExpiresAt.getTime() - now;
    let timer: NodeJS.Timeout | null = null;
    if (timeToRefresh <= 0) {
      // Access token already "expired" (past buffer); attempt refresh anyway, but endpoint may reject if actually expired
      refreshTokens();
    } else {
      // Schedule refresh at the buffered expiration time (a few minutes/seconds before actual)
      timer = setTimeout(refreshTokens, timeToRefresh);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [user, refreshTokens, logout]);

  if (!isLoaded) {
    return <AuthLoading />; // Prevent children from rendering until loaded
  }

  return (
    <UserContext.Provider value={{ user, setUser, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used inside UserProvider");
  return ctx;
}