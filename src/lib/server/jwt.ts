/**
 * 简易 JWT 实现 — 使用 Node.js 内置 crypto
 * 无需外部依赖
 */

import crypto from "crypto";

// 密钥（生产环境应从环境变量读取）
const SECRET = process.env.JWT_SECRET || "yaoyi_jianying_dev_secret_2026";
const ALG = { alg: "HS256", typ: "JWT" };

function base64url(buf: Buffer): string {
  return buf.toString("base64url");
}

function base64urlDecode(str: string): Buffer {
  return Buffer.from(str, "base64url");
}

function sign(payload: Record<string, unknown>): string {
  const header = base64url(Buffer.from(JSON.stringify(ALG)));
  const body = base64url(Buffer.from(JSON.stringify(payload)));
  const signature = base64url(
    crypto.createHmac("sha256", SECRET).update(`${header}.${body}`).digest(),
  );
  return `${header}.${body}.${signature}`;
}

function verify(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    const expectedSig = base64url(
      crypto.createHmac("sha256", SECRET).update(`${header}.${body}`).digest(),
    );
    // 恒定时间比较
    const sigBuf = base64urlDecode(sig);
    const expBuf = base64urlDecode(expectedSig);
    if (sigBuf.length !== expBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;
    const payload = JSON.parse(base64urlDecode(body).toString("utf-8"));
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/** 签发 token，默认 7 天有效期 */
export function signToken(payload: { userId: string; email: string }): string {
  return sign({ ...payload, exp: Date.now() + 7 * 24 * 3600_000 });
}

/** 验证并解析 token */
export function verifyToken(token: string): { userId: string; email: string } | null {
  const payload = verify(token);
  if (!payload || typeof payload.userId !== "string" || typeof payload.email !== "string") return null;
  return { userId: payload.userId, email: payload.email };
}
