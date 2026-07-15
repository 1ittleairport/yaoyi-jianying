"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface AuthContext {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  register: (email: string, password: string, name?: string) => Promise<string | null>;
  logout: () => void;
  syncData: () => Promise<void>;
}

const Ctx = createContext<AuthContext>({
  user: null, token: null, loading: true,
  login: async () => null, register: async () => null,
  logout: () => {}, syncData: async () => {},
});

/** 所有以 yy_ 开头的 localStorage key 都会被账号系统管理 */
const APP_KEYS = [
  "yy_wrong_answers", "yy_materials", "yy_history",
  "yy_pending_material", "yy_page_state",
  "yy_auth_token", "yy_auth_user",
];

/** 清除所有用户数据（退出时调用，防止下一个人看到上一个人的隐私） */
function clearAllUserData() {
  for (const k of APP_KEYS) {
    try { localStorage.removeItem(k); } catch { /* 静默 */ }
  }
}

/** 从服务器加载用户数据到 localStorage */
function loadDataToLocal(data: Record<string, any>) {
  for (const k of APP_KEYS) {
    if (k === "yy_auth_token" || k === "yy_auth_user") continue; // 这些由 AuthProvider 管理
    if (data[k] !== undefined) {
      try { localStorage.setItem(k, JSON.stringify(data[k])); } catch { /* 静默 */ }
    }
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 初始化：清除所有开发遗留数据 + 检查登录状态
  useEffect(() => {
    const savedToken = localStorage.getItem("yy_auth_token");
    const savedUser = localStorage.getItem("yy_auth_user");

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        clearAllUserData();
      }
    } else {
      // 没有登录 → 清除所有遗留数据（确保全新用户看到空白开始）
      clearAllUserData();
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return data.error || "登录失败";

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem("yy_auth_token", data.token);
      localStorage.setItem("yy_auth_user", JSON.stringify(data.user));

      // 从服务器加载该用户的云端数据
      try {
        const syncRes = await fetch("/api/auth/sync", {
          headers: { Authorization: `Bearer ${data.token}` },
        });
        const syncData = await syncRes.json();
        if (syncData.data) loadDataToLocal(syncData.data);
      } catch { /* 无云端数据不影响 */ }

      return null;
    } catch {
      return "网络错误";
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string): Promise<string | null> => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) return data.error || "注册失败";
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem("yy_auth_token", data.token);
      localStorage.setItem("yy_auth_user", JSON.stringify(data.user));
      return null;
    } catch {
      return "网络错误";
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    // 登出前先上传数据到云端（如果已登录）
    const currentToken = localStorage.getItem("yy_auth_token");
    if (currentToken) {
      const keys = ["yy_wrong_answers", "yy_materials", "yy_history"];
      const data: Record<string, any> = {};
      for (const k of keys) {
        try {
          const raw = localStorage.getItem(k);
          if (raw) data[k] = JSON.parse(raw);
        } catch { /* 静默 */ }
      }
      if (Object.keys(data).length > 0) {
        fetch("/api/auth/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${currentToken}` },
          body: JSON.stringify({ data }),
        }).catch(() => {});
      }
    }
    // 清除所有用户隐私数据
    clearAllUserData();
  }, []);

  const syncData = useCallback(async () => {
    const currentToken = localStorage.getItem("yy_auth_token");
    if (!currentToken) return;
    const keys = ["yy_wrong_answers", "yy_materials", "yy_history"];
    const data: Record<string, any> = {};
    for (const k of keys) {
      try { const raw = localStorage.getItem(k); if (raw) data[k] = JSON.parse(raw); } catch { /* 静默 */ }
    }
    try {
      await fetch("/api/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${currentToken}` },
        body: JSON.stringify({ data }),
      });
    } catch { /* 静默 */ }
  }, []);

  return (
    <Ctx.Provider value={{ user, token, loading, login, register, logout, syncData }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
