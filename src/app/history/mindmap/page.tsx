"use client";

import { useState, useEffect, useCallback } from "react";
import { getHistory, type Activity } from "@/lib/store";
import dynamic from "next/dynamic";
import Link from "next/link";

const MindMapVisual = dynamic(() => import("@/components/MindMapVisual"), { ssr: false });

export default function MindMapHistoryPage() {
  const [items, setItems] = useState<Activity[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setItems(getHistory().filter((a) => a.type === "mindmap_generated"));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const formatTime = (ts: string) => {
    try { return new Date(ts).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }); }
    catch { return ""; }
  };

  return (
    <div className="max-w-5xl mx-auto px-5 py-8">
      <div className="mb-6">
        <Link href="/history" className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text)] mb-2 inline-block">← 返回历史</Link>
        <h1 className="text-lg font-medium text-[var(--text)] tracking-wide mb-1">🧠 导图记录</h1>
        <p className="text-xs text-[var(--text-secondary)]">共 {items.length} 次生成，点击可展开查看完整导图。</p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-[var(--text-tertiary)]">
          <p className="text-xs">还没有导图记录</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((act) => {
            const isExpanded = expandedId === act.id;
            let mindMapData: any = null;
            if (act.resultData) {
              try { mindMapData = JSON.parse(act.resultData); } catch { mindMapData = null; }
            }

            return (
              <div key={act.id} className="glass-card overflow-hidden">
                <div
                  className="p-4 cursor-pointer hover:bg-white/40 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : act.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[var(--text)]">{act.summary}</p>
                      <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
                        {formatTime(act.timestamp)}{act.subject ? ` · ${act.subject}` : ""}{act.materialTitle ? ` · 材料：${act.materialTitle}` : ""}
                      </p>
                    </div>
                    <span className={`text-[10px] text-[var(--text-tertiary)] transition-transform ${isExpanded ? "rotate-180" : ""}`}>▼</span>
                  </div>
                </div>

                {isExpanded && mindMapData && mindMapData.title && (
                  <div className="border-t border-[var(--border-light)] p-4">
                    <MindMapVisual root={mindMapData} />
                  </div>
                )}

                {isExpanded && (!mindMapData || !mindMapData.title) && (
                  <div className="border-t border-[var(--border-light)] p-4">
                    <pre className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap font-sans">{act.resultData || "无详细数据"}</pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
