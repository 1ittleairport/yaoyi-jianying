"use client";

import { useState, useEffect, useCallback } from "react";
import { getHistory, type Activity } from "@/lib/store";
import Link from "next/link";

export default function HotspotHistoryPage() {
  const [items, setItems] = useState<Activity[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setItems(getHistory().filter((a) => a.type === "hotspot_analyzed"));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const formatTime = (ts: string) => {
    try { return new Date(ts).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }); }
    catch { return ""; }
  };

  const renderAnalysis = (data: any) => {
    if (!data) return <p className="text-xs text-[var(--text-tertiary)]">无详细数据</p>;

    return (
      <div className="space-y-4">
        {/* 概述 */}
        {data.summary && (
          <div>
            <p className="text-[11px] tracking-wider text-[var(--text-tertiary)] mb-1">概述</p>
            <p className="text-xs text-[var(--text)] leading-relaxed">{data.summary}</p>
          </div>
        )}

        {/* 多角度 */}
        {data.angleAnalysis?.length > 0 && (
          <div>
            <p className="text-[11px] tracking-wider text-[var(--text-tertiary)] mb-2">多角度分析</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {data.angleAnalysis.map((a: any, i: number) => (
                <div key={i} className="p-2.5 rounded-lg bg-white/60 border border-[var(--border-light)]">
                  <p className="text-xs font-medium text-[var(--text)] mb-1">{a.angle}</p>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{a.content}</p>
                  {a.materialCorrelation && <p className="text-[10px] text-[var(--text-tertiary)] mt-1">→ {a.materialCorrelation}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 预测题目 */}
        {data.possibleQuestions?.length > 0 && (
          <div>
            <p className="text-[11px] tracking-wider text-[var(--text-tertiary)] mb-2">预测题目</p>
            <div className="space-y-2">
              {data.possibleQuestions.map((q: any, i: number) => (
                <div key={i} className="p-2.5 rounded-lg bg-white/60 border border-[var(--border-light)]">
                  <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-sage-bg)] text-[var(--accent-sage)] font-medium mb-1">{q.type}</span>
                  <p className="text-xs text-[var(--text)]">{q.question}</p>
                  {q.analysisTips && <p className="text-[10px] text-[var(--text-tertiary)] mt-1">💡 {q.analysisTips}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 关键词 */}
        {data.keywords?.length > 0 && (
          <div>
            <p className="text-[11px] tracking-wider text-[var(--text-tertiary)] mb-1">关键词</p>
            <div className="flex flex-wrap gap-1">
              {data.keywords.map((kw: string, i: number) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-white/60 border border-[var(--border-light)] text-[var(--text-secondary)]">{kw}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-5 py-8">
      <div className="mb-6">
        <Link href="/history" className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text)] mb-2 inline-block">← 返回历史</Link>
        <h1 className="text-lg font-medium text-[var(--text)] tracking-wide mb-1">🔥 热点分析记录</h1>
        <p className="text-xs text-[var(--text-secondary)]">共 {items.length} 次分析，点击展开查看完整分析。</p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-[var(--text-tertiary)]">
          <p className="text-xs">还没有热点分析记录</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((act) => {
            const isExpanded = expandedId === act.id;
            let analysisData: any = null;
            if (act.resultData) {
              try { analysisData = JSON.parse(act.resultData); } catch { analysisData = null; }
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
                        {formatTime(act.timestamp)}{act.subject ? ` · ${act.subject}` : ""}
                      </p>
                    </div>
                    <span className={`text-[10px] text-[var(--text-tertiary)] transition-transform ${isExpanded ? "rotate-180" : ""}`}>▼</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-[var(--border-light)] p-4 bg-white/40">
                    {analysisData ? renderAnalysis(analysisData) : (
                      <pre className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap font-sans">{act.resultData || "无详细数据"}</pre>
                    )}
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
