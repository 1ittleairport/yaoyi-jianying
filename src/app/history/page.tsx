"use client";

import { useState, useEffect, useCallback } from "react";
import { getHistory, clearHistory, type Activity } from "@/lib/store";
import Link from "next/link";

const CATEGORIES = [
  { type: "quiz_attempt", label: "刷题", icon: "📝", href: "/history/quiz", color: "bg-[var(--accent-rose-bg)] border-[var(--accent-rose)]/20" },
  { type: "mindmap_generated", label: "导图", icon: "🧠", href: "/history/mindmap", color: "bg-[var(--accent-sage-bg)] border-[var(--accent-sage)]/20" },
  { type: "hotspot_analyzed", label: "热点", icon: "🔥", href: "/history/hotspot", color: "bg-[var(--accent-peach-bg)] border-[var(--accent-peach)]/20" },
  { type: "material_added", label: "资料", icon: "📚", href: "/materials", color: "bg-[var(--accent-lavender-bg)] border-[var(--accent-lavender)]/20" },
];

const TYPE_LABEL: Record<string, string> = {
  quiz_attempt: "📝 刷题",
  mindmap_generated: "🧠 导图",
  hotspot_analyzed: "🔥 热点分析",
  material_added: "📚 添加资料",
};

export default function HistoryPage() {
  const [items, setItems] = useState<Activity[]>([]);
  const refresh = useCallback(() => setItems(getHistory()), []);
  useEffect(() => { refresh(); }, [refresh]);

  const handleClear = () => {
    if (items.length === 0) return;
    if (window.confirm("确定清空所有历史记录？")) { clearHistory(); refresh(); }
  };

  const formatTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
    } catch { return ""; }
  };

  return (
    <div className="max-w-3xl mx-auto px-5 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-medium text-[var(--text)] tracking-wide mb-1">历史</h1>
          <p className="text-xs text-[var(--text-secondary)]">按功能分类查看，点击进入查看完整结果。</p>
        </div>
        {items.length > 0 && <button className="btn btn-ghost text-xs" onClick={handleClear}>清空</button>}
      </div>

      {/* 分类卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {CATEGORIES.map((cat) => {
          const count = items.filter((a) => a.type === cat.type).length;
          const latest = items.find((a) => a.type === cat.type);
          return (
            <Link key={cat.type} href={count > 0 ? cat.href : "#"} className={`glass-card p-4 ${count === 0 ? "opacity-50" : ""}`}>
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${cat.color} border flex items-center justify-center text-lg`}>
                  {cat.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-[var(--text)]">{cat.label}</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">{count} 条记录</p>
                  {latest && (
                    <p className="text-[10px] text-[var(--text-tertiary)] mt-1 truncate">
                      {latest.summary} · {formatTime(latest.timestamp)}
                    </p>
                  )}
                </div>
                {count > 0 && <span className="text-xs text-[var(--text-tertiary)]">→</span>}
              </div>
            </Link>
          );
        })}
      </div>

      {/* 最近记录 */}
      {items.length > 0 && (
        <div>
          <p className="text-[11px] tracking-wider text-[var(--text-tertiary)] mb-3">全部记录</p>
          <div className="space-y-1.5">
            {items.slice(0, 20).map((act) => (
              <Link
                key={act.id}
                href={
                  act.type === "quiz_attempt" ? "/history/quiz" :
                  act.type === "mindmap_generated" ? "/history/mindmap" :
                  act.type === "hotspot_analyzed" ? "/history/hotspot" : "#"
                }
                className="glass-card p-3 block"
              >
                <div className="flex items-center gap-2">
                  <span>{TYPE_LABEL[act.type] || "📌"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[var(--text)] truncate">{act.summary}</p>
                    <p className="text-[10px] text-[var(--text-tertiary)]">{formatTime(act.timestamp)}{act.materialTitle ? ` · ${act.materialTitle}` : ""}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="text-center py-16 text-[var(--text-tertiary)]">
          <p className="text-2xl mb-2 opacity-40">📋</p>
          <p className="text-xs">还没有活动记录</p>
        </div>
      )}
    </div>
  );
}
