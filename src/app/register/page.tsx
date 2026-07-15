"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const err = await register(email, password, name || undefined);
    setBusy(false);
    if (err) setError(err);
    else router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="glass-card-static p-8 w-full max-w-sm">
        <h1 className="text-lg font-medium text-[var(--text)] tracking-wide mb-1 text-center">注册</h1>
        <p className="text-xs text-[var(--text-secondary)] text-center mb-6">创建账号，数据可跨设备同步</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input className="input" type="email" placeholder="邮箱" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="input" placeholder="昵称（选填）" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input" type="password" placeholder="密码（至少6位）" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />

          {error && <p className="text-xs text-[var(--error)]">{error}</p>}

          <button className="btn btn-primary w-full" disabled={busy}>
            {busy ? "注册中…" : "注册"}
          </button>
        </form>

        <p className="text-xs text-[var(--text-tertiary)] text-center mt-4">
          已有账号？<Link href="/login" className="text-[var(--text)] underline">登录</Link>
        </p>
      </div>
    </div>
  );
}
