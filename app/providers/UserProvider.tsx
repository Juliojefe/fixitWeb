"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { User } from "@/types/user";
import AuthLoading from "@/components/AuthLoading/AuthLoading";

interface UserContextType {
  user: User | null;
  setUser: (userData: User | null) => void;
  logout: () => void;
  totalUnreadCount: number;           // global unread count
  refreshUnreadCount: () => Promise<void>; // instant refresh helper
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
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();

  const stompClientRef = useRef<any>(null); // persistent global WebSocket

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
    if (stompClientRef.current) {
      stompClientRef.current.deactivate();
      stompClientRef.current = null;
    }
    setTotalUnreadCount(0);
    setUser(null);
    router.push("/login");
  }, [setUser]);

  // initial unread count from backend
  const fetchUnreadCount = useCallback(async () => {
    if (!user?.accessToken) return;
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/unread-count`, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
      });
      setTotalUnreadCount(res.data ?? 0);
    } catch (err) {
      console.error("Failed to fetch unread count", err);
      setTotalUnreadCount(0);
    }
  }, [user?.accessToken]);

  const setupUnreadWebSocket = useCallback(() => {
    if (!user?.accessToken || stompClientRef.current) return;

    const client = new (require('@stomp/stompjs').Client)({
      brokerURL: `${process.env.NEXT_PUBLIC_API_URL?.replace('http', 'ws')}/ws-chat`,
      connectHeaders: { Authorization: `Bearer ${user.accessToken}` },
      reconnectDelay: 5000,
      onConnect: () => {
        // console.log("✅ Global unread count WebSocket connected");
        client.subscribe("/user/queue/unread-count", (message: any) => {
          const count = parseInt(message.body, 10);
          setTotalUnreadCount(isNaN(count) ? 0 : count);
        });
      },
      onStompError: (frame: any) => {
        console.error("STOMP error (unread count)", frame);
      },
    });

    stompClientRef.current = client;
    client.activate();
  }, [user?.accessToken]);

  // Connect WebSocket + fetch initial count whenever user logs in
  useEffect(() => {
    if (user?.accessToken) {
      fetchUnreadCount();
      setupUnreadWebSocket();
    } else {
      setTotalUnreadCount(0);
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      }
    }
  }, [user?.accessToken, fetchUnreadCount, setupUnreadWebSocket]);

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
      refreshTokens();
    } else {
      timer = setTimeout(refreshTokens, timeToRefresh);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [user, refreshTokens, logout]);

  if (!isLoaded) {
    return <AuthLoading />;
  }

  return (
    <UserContext.Provider value={{ user, setUser, logout, totalUnreadCount, refreshUnreadCount: fetchUnreadCount }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used inside UserProvider");
  return ctx;
}