/**
 * 用户数据存储
 *
 * 本地开发：JSON 文件（src/data/）
 * Vercel 生产：内存 Map（需部署后替换为数据库）
 *
 * ⚠ 重要：Vercel serverless 函数不支持写入文件系统。
 * 当前的生产解决方案是「localStorage + 内存 Map」组合：
 *   - 用户的错题/材料/历史存在 localStorage（前端）✅ 支持 Vercel
 *   - 账号注册/登录验证存在内存 Map（服务端）⚠ 重启后丢失
 *   - 长久的解决方案：迁移到 Supabase / Vercel KV
 *
 * ✅ 现在先部署验证功能，后续一步到位换数据库
 */

import fs from "fs";
import path from "path";
import os from "os";

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  password: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

// 检测是否可以写入文件系统
function canWriteFS(): boolean {
  try {
    const testPath = path.join(os.tmpdir(), ".yy_test_" + Date.now());
    fs.writeFileSync(testPath, "test", "utf-8");
    fs.unlinkSync(testPath);
    return true;
  } catch {
    return false;
  }
}

const USE_FS = canWriteFS();
const DATA_DIR = USE_FS
  ? path.join(process.cwd(), "src", "data")
  : path.join(os.tmpdir(), "yaoyi_data");

// 内存备用存储（Vercel 环境）
const memUsers: StoredUser[] = [];

/* ─── 文件系统读写 ─── */

function ensureDir() {
  if (!USE_FS) return;
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    const f = path.join(DATA_DIR, "users.json");
    if (!fs.existsSync(f)) fs.writeFileSync(f, "[]", "utf-8");
  } catch { /* 静默 */ }
}

function readUsers(): StoredUser[] {
  if (!USE_FS) return memUsers;
  ensureDir();
  try {
    const f = path.join(DATA_DIR, "users.json");
    return JSON.parse(fs.readFileSync(f, "utf-8"));
  } catch { return []; }
}

function writeUsers(users: StoredUser[]) {
  if (!USE_FS) {
    memUsers.length = 0;
    memUsers.push(...users);
    return;
  }
  ensureDir();
  try {
    fs.writeFileSync(path.join(DATA_DIR, "users.json"), JSON.stringify(users, null, 2), "utf-8");
  } catch { /* 静默 */ }
}

/* ─── 公开 API ─── */

export function findUserByEmail(email: string): StoredUser | undefined {
  return readUsers().find((u) => u.email === email.toLowerCase());
}

export function findUserById(id: string): StoredUser | undefined {
  return readUsers().find((u) => u.id === id);
}

export function createUser(email: string, name: string, hashedPassword: string): UserProfile {
  const users = readUsers();
  const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const user: StoredUser = {
    id, email: email.toLowerCase(), name, password: hashedPassword, createdAt: new Date().toISOString(),
  };
  users.push(user);
  writeUsers(users);
  return { id, email: user.email, name: user.name, createdAt: user.createdAt };
}

export function getUserData(userId: string): Record<string, any> {
  if (!USE_FS) return {}; // Vercel 上不持久化服务端数据
  try {
    const f = path.join(DATA_DIR, "userdata", `${userId}.json`);
    if (!fs.existsSync(f)) return {};
    return JSON.parse(fs.readFileSync(f, "utf-8"));
  } catch { return {}; }
}

export function saveUserData(userId: string, data: Record<string, any>) {
  if (!USE_FS) return; // Vercel 上不持久化服务端数据
  try {
    const d = path.join(DATA_DIR, "userdata");
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
    fs.writeFileSync(path.join(d, `${userId}.json`), JSON.stringify(data, null, 2), "utf-8");
  } catch { /* 静默 */ }
}

export function toProfile(user: StoredUser): UserProfile {
  return { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt };
}
