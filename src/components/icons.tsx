"use client";

/**
 * 手绘风 SVG 图标合集
 *
 * 每个图标都用不完美的线条、圆头端点、轻微的"抖动画笔"效果
 * 来模拟手绘质感。统一 stroke-width="1.5" 保持协调。
 */

const s = { strokeLinecap: "round" as const, strokeLinejoin: "round" as const, strokeWidth: 1.5, fill: "none" };
const c = "currentColor";

/* ─── 首页 ─── */
export function IconHome({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...s}>
      <path d="M5 12l-2 2m0 0l9 9m-9-9V5a1 1 0 011-1h4" stroke={c} />
      <path d="M19 12l2 2m0 0l-9 9m9-9V5a1 1 0 00-1-1h-4" stroke={c} />
      <path d="M12 3l-4 4m4-4l4 4" stroke={c} />
      <circle cx="12" cy="14" r="2" stroke={c} />
      <path d="M12 16v3" stroke={c} />
    </svg>
  );
}

/* ─── 刷题（纸笔） ─── */
export function IconQuiz({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...s}>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke={c} />
      <path d="M9 5a2 2 0 012-2h2a2 2 0 012 2v0a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke={c} />
      <path d="M9 12l2 2 4-4" stroke={c} />
    </svg>
  );
}

/* ─── 导图（树状分支） ─── */
export function IconMindMap({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...s}>
      <circle cx="12" cy="4" r="2" stroke={c} />
      <circle cx="6" cy="10" r="1.5" stroke={c} />
      <circle cx="18" cy="10" r="1.5" stroke={c} />
      <circle cx="4" cy="18" r="1.5" stroke={c} />
      <circle cx="12" cy="18" r="1.5" stroke={c} />
      <circle cx="20" cy="18" r="1.5" stroke={c} />
      <path d="M12 6v2" stroke={c} />
      <path d="M7.5 10.5l-2 4" stroke={c} />
      <path d="M16.5 10.5l2 4" stroke={c} />
      <path d="M6 11.5v4" stroke={c} />
      <path d="M18 11.5v4" stroke={c} />
      <path d="M12 12v4" stroke={c} />
    </svg>
  );
}

/* ─── 热点（火焰/信号波纹） ─── */
export function IconHotspot({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...s}>
      <path d="M12 2C9 7 4 10.5 4 15a8 8 0 0016 0c0-4.5-5-8-8-13z" stroke={c} />
      <circle cx="12" cy="15" r="2" stroke={c} />
      <path d="M12 17v2" stroke={c} />
      <path d="M8 14a4 4 0 018 0" stroke={c} opacity="0.5" />
    </svg>
  );
}

/* ─── 资料（书/文件夹） ─── */
export function IconMaterials({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...s}>
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke={c} />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke={c} />
      <path d="M8 7h8" stroke={c} />
      <path d="M8 11h6" stroke={c} />
      <path d="M8 15h4" stroke={c} />
    </svg>
  );
}

/* ─── 错题本（循环箭头/重做） ─── */
export function IconWrong({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...s}>
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" stroke={c} />
      <path d="M15 2H9a1 1 0 00-1 1v2a1 1 0 001 1h6a1 1 0 001-1V3a1 1 0 00-1-1z" stroke={c} />
      <path d="M9 13l2 2 4-4" stroke={c} />
      <path d="M9 17l6-6" stroke={c} opacity="0.4" />
    </svg>
  );
}

/* ─── 生成（sparkle） ─── */
export function IconGenerate({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...s}>
      <path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z" stroke={c} />
    </svg>
  );
}

/* ─── 展开/收起 ─── */
export function IconExpand({ className = "w-3 h-3" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...s}>
      <path d="M6 9l6 6 6-6" stroke={c} />
    </svg>
  );
}

export function IconCollapse({ className = "w-3 h-3" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...s}>
      <path d="M18 15l-6-6-6 6" stroke={c} />
    </svg>
  );
}

/* ─── 箭头右 ─── */
export function IconArrowRight({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...s}>
      <path d="M5 12h14m-6-6l6 6-6 6" stroke={c} />
    </svg>
  );
}

/* ─── 设置/齿轮 ─── */
export function IconSettings({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...s}>
      <circle cx="12" cy="12" r="3" stroke={c} />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke={c} />
    </svg>
  );
}

/* ─── 装饰：三个点 ─── */
export function IconDots({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...s}>
      <circle cx="4" cy="12" r="1" stroke={c} opacity="0.3" />
      <circle cx="12" cy="12" r="1" stroke={c} opacity="0.3" />
      <circle cx="20" cy="12" r="1" stroke={c} opacity="0.3" />
    </svg>
  );
}

/* ─── 热点+导图 联动专用图标 ─── */
export function IconLinkMindmap({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" {...s}>
      <circle cx="6" cy="12" r="3" stroke={c} />
      <circle cx="18" cy="8" r="3" stroke={c} />
      <circle cx="18" cy="16" r="3" stroke={c} />
      <path d="M9 12h6" stroke={c} />
      <path d="M15 9l-3 3 3 3" stroke={c} opacity="0.5" />
    </svg>
  );
}
