"use client";

import { useState, useEffect, useCallback } from "react";
import { getHistory, type Activity } from "@/lib/store";
import Link from "next/link";

export default function QuizHistoryPage() {
  const [items, setItems] = useState<Activity[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setItems(getHistory().filter((a) => a.type === "quiz_attempt"));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const formatTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
    } catch { return ""; }
  };

  return (
    <div className="max-w-3xl mx-auto px-5 py-8">
      <div className="mb-6">
        <Link href="/history" className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text)] mb-2 inline-block">← 返回历史</Link>
        <h1 className="text-lg font-medium text-[var(--text)] tracking-wide mb-1">📝 刷题记录</h1>
        <p className="text-xs text-[var(--text-secondary)]">共 {items.length} 次练习，点击展开查看完整题目。</p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-[var(--text-tertiary)]">
          <p className="text-xs">还没有刷题记录</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((act) => {
            const isExpanded = expandedId === act.id;
            let questions: any[] = [];
            if (act.resultData) {
              try { questions = JSON.parse(act.resultData); } catch { questions = []; }
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
                  {act.score && (
                    <div className="mt-2">
                      <div className="w-full h-1 bg-[var(--border-light)] rounded">
                        <div className="h-full bg-[var(--text)] rounded transition-all" style={{ width: `${Math.round((act.score.correct / act.score.total) * 100)}%` }} />
                      </div>
                    </div>
                  )}
                </div>

                {isExpanded && questions.length > 0 && (
                  <div className="border-t border-[var(--border-light)] p-4 space-y-4 bg-white/40">
                    {questions.map((q, qi) => (
                      <div key={qi} className="p-3 rounded-lg bg-white/60 border border-[var(--border-light)]">
                        <p className="text-xs font-medium text-[var(--text)] mb-2">
                          {qi + 1}. {q.question}
                        </p>
                        <div className="space-y-1">
                          {(q.options || []).map((opt: string, oi: number) => {
                            const isAnswer = oi === q.answer;
                            return (
                              <div key={oi} className={`text-xs px-2.5 py-1.5 rounded border ${isAnswer ? "border-[var(--success)] bg-[var(--success-bg)] text-[var(--text)]" : "border-[var(--border-light)] text-[var(--text-secondary)]"}`}>
                                <span className="text-[10px] text-[var(--text-tertiary)] mr-1">{String.fromCharCode(65 + oi)}</span>
                                {opt}
                                {isAnswer && <span className="ml-1 text-[var(--success)]">✓</span>}
                              </div>
                            );
                          })}
                        </div>
                        {q.explanation && (
                          <p className="text-[10px] text-[var(--text-tertiary)] mt-1.5 leading-relaxed">{q.explanation}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {isExpanded && questions.length === 0 && (
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
