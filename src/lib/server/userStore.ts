/**
 * 用户数据存储 — Supabase 版
 *
 * 在 Vercel 上永久保存账号和用户数据，
 * 不会因为服务器重启而丢失。
 *
 * 环境变量：
 *   SUPABASE_URL      = 你的 Supabase 项目地址
 *   SUPABASE_SERVICE_KEY = Service Role Key（服务器端全权限）
 */

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  password: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

/* ─── 调用 Supabase REST API ─── */

async function supaFetch(path: string, options: RequestInit = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Prefer": "return=representation",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase ${res.status}: ${text.slice(0, 200)}`);
  }
  return res;
}

/* ─── 用户 CRUD ─── */

export async function findUserByEmail(email: string): Promise<StoredUser | undefined> {
  try {
    const res = await supaFetch(`users?email=eq.${encodeURIComponent(email.toLowerCase())}&select=*`, {
      method: "GET",
    });
    const users: StoredUser[] = await res.json();
    return users[0];
  } catch {
    return undefined;
  }
}

export async function findUserById(id: string): Promise<StoredUser | undefined> {
  try {
    const res = await supaFetch(`users?id=eq.${encodeURIComponent(id)}&select=*`, {
      method: "GET",
    });
    const users: StoredUser[] = await res.json();
    return users[0];
  } catch {
    return undefined;
  }
}

export async function createUser(
  email: string, name: string, hashedPassword: string,
): Promise<UserProfile> {
  const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();

  await supaFetch("users", {
    method: "POST",
    body: JSON.stringify({
      id,
      email: email.toLowerCase(),
      name,
      password: hashedPassword,
      created_at: now,
    }),
  });

  return { id, email: email.toLowerCase(), name, createdAt: now };
}

export async function getUserData(userId: string): Promise<Record<string, any>> {
  try {
    const res = await supaFetch(`user_data?user_id=eq.${encodeURIComponent(userId)}&select=data`, {
      method: "GET",
    });
    const rows = await res.json();
    return rows[0]?.data || {};
  } catch {
    return {};
  }
}

export async function saveUserData(userId: string, data: Record<string, any>) {
  await supaFetch("user_data", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, data, updated_at: new Date().toISOString() }),
    headers: {
      "Prefer": "return=representation,resolution=merge-duplicates",
    } as any,
  });
}

export function toProfile(user: StoredUser): UserProfile {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.created_at,
  };
}
