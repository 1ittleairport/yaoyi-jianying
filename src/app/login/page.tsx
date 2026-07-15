"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const err = await login(email, password);
    setBusy(false);
    if (err) setError(err);
    else router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="glass-card-static p-8 w-full max-w-sm">
        <h1 className="text-lg font-medium text-[var(--text)] tracking-wide mb-1 text-center">登录</h1>
        <p className="text-xs text-[var(--text-secondary)] text-center mb-6">登录后可跨设备同步数据</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input className="input" type="email" placeholder="邮箱" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="input" type="password" placeholder="密码（至少6位）" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />

          {error && <p className="text-xs text-[var(--error)]">{error}</p>}

          <button className="btn btn-primary w-full" disabled={busy}>
            {busy ? "登录中…" : "登录"}
          </button>
        </form>

        <p className="text-xs text-[var(--text-tertiary)] text-center mt-4">
          还没有账号？<Link href="/register" className="text-[var(--text)] underline">注册</Link>
        </p>
      </div>
    </div>
  );
}
