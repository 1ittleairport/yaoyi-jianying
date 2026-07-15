"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "./auth/AuthProvider";
import { IconQuiz, IconMindMap, IconHotspot, IconMaterials, IconWrong } from "./icons";

const navItems = [
  { href: "/", label: "首页" },
  { href: "/quiz", label: "刷题", icon: IconQuiz },
  { href: "/mindmap", label: "导图", icon: IconMindMap },
  { href: "/hotspot", label: "热点", icon: IconHotspot },
  { href: "/materials", label: "资料", icon: IconMaterials },
  { href: "/wrong-answers", label: "错题本", icon: IconWrong },
  { href: "/history", label: "历史" },
];

export default function Navigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-[var(--border-light)]">
      <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1.5">
          <span className="text-sm tracking-[0.2em] font-light text-[var(--text)]">要义剪影</span>
        </Link>

        <div className="hidden md:flex items-center gap-0.5">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs tracking-wider transition-all rounded-lg ${
                  active
                    ? "text-[var(--text)] bg-[var(--accent-rose-bg)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-white/60"
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                {item.label}
              </Link>
            );
          })}

          {/* 账号 */}
          {user ? (
            <div className="flex items-center gap-1 ml-2 pl-2 border-l border-[var(--border-light)]">
              <span className="text-[10px] text-[var(--text-tertiary)]">{user.name}</span>
              <button className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--error)] px-2 py-1" onClick={() => { logout(); window.location.href = "/"; }}>退出</button>
            </div>
          ) : (
            <Link href="/login" className="text-xs text-[var(--text-secondary)] hover:text-[var(--text)] ml-2 pl-2 border-l border-[var(--border-light)] px-2 py-1">
              登录
            </Link>
          )}
        </div>

        <button className="md:hidden p-1.5" onClick={() => setMobileOpen(!mobileOpen)}>
          <svg className="w-4 h-4 text-[var(--text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--border-light)] bg-white/90 backdrop-blur-xl px-5 py-2">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 py-2.5 text-xs tracking-wider border-b border-[var(--border-light)] last:border-0 ${
                  active ? "text-[var(--text)] font-medium" : "text-[var(--text-secondary)]"
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                {item.label}
              </Link>
            );
          })}
          {user ? (
            <button className="w-full text-left py-2.5 text-xs text-[var(--text-secondary)]" onClick={() => { logout(); setMobileOpen(false); window.location.href = "/"; }}>退出登录</button>
          ) : (
            <Link href="/login" className="block py-2.5 text-xs text-[var(--text-secondary)]" onClick={() => setMobileOpen(false)}>登录</Link>
          )}
        </div>
      )}
    </nav>
  );
}
