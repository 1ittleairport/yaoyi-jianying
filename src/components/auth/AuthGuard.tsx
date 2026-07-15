"use client";

import { useAuth } from "./AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * 登录守卫组件
 *
 * 包裹需要登录才能访问的页面。
 * 未登录用户会被重定向到 /login，
 * 登录后才显示页面内容。
 */

// 不需要登录的公开页面
const PUBLIC_PAGES = ["/", "/login", "/register"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublic = PUBLIC_PAGES.includes(pathname);

  useEffect(() => {
    if (loading) return;
    if (!isPublic && !user) {
      router.replace("/login");
    }
  }, [loading, user, isPublic, router]);

  // 加载中什么都不显示
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-xs text-[var(--text-tertiary)]">
        加载中…
      </div>
    );
  }

  // 公开页面 → 直接显示
  if (isPublic) return <>{children}</>;

  // 非公开页面但未登录 → 不显示内容（useEffect 会跳转）
  if (!user) return null;

  // 已登录 → 正常显示
  return <>{children}</>;
}
