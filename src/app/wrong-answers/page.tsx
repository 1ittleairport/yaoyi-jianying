"use client";

import { useState, useEffect, useCallback } from "react";
import { getWrongAnswers, removeWrongAnswer, clearWrongAnswers, type WrongAnswer } from "@/lib/store";
import { IconWrong } from "@/components/icons";

export default function WrongAnswersPage() {
  const [items, setItems] = useState<WrongAnswer[]>([]);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retryAnswer, setRetryAnswer] = useState<number | null>(null);
  const [retryResult, setRetryResult] = useState<boolean | null>(null);

  const refresh = useCallback(() => { setItems(getWrongAnswers()); setRetryingId(null); setRetryAnswer(null); setRetryResult(null); }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const handleDelete = (id: string) => { removeWrongAnswer(id); refresh(); };
  const handleClear = () => { if (items.length === 0) return; if (window.confirm("确定清空所有错题？")) { clearWrongAnswers(); refresh(); } };

  const total = items.length;
  return (
    <div className="max-w-3xl mx-auto px-5 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-medium text-[var(--text)] tracking-wide mb-1">错题本</h1>
          <p className="text-xs text-[var(--text-secondary)]">共 {total} 道错题，可重练回顾。</p>
        </div>
        {total > 0 && <button className="btn btn-ghost text-xs" onClick={handleClear}>清空</button>}
      </div>

      {total === 0 ? (
        <div className="text-center py-20 text-[var(--text-tertiary)]">
          <IconWrong className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <p className="text-xs">还没有错题</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => {
            const isRetrying = retryingId === item.id;
            return (
              <div key={item.id} className="glass-card p-4">
                <p className="text-sm font-medium text-[var(--text)] mb-3 leading-relaxed">{item.question}</p>

                {!isRetrying ? (
                  <div className="space-y-1 mb-3">
                    {item.options.map((opt, i) => {
                      let cls = "text-xs px-3 py-1.5 border rounded-lg ";
                      if (i === item.correctAnswer) cls += "border-[var(--success)] bg-[var(--success-bg)] text-[var(--text)]";
                      else if (i === item.userAnswer) cls += "border-[var(--error)] bg-[var(--error-bg)] text-[var(--text)] line-through";
                      else cls += "border-[var(--border-light)] text-[var(--text-secondary)]";
                      return <div key={i} className={cls}><span className="inline-block w-4 text-[11px] text-[var(--text-tertiary)] mr-1">{String.fromCharCode(65 + i)}</span>{opt}</div>;
                    })}
                  </div>
                ) : (
                  <div className="space-y-1 mb-3">
                    {item.options.map((opt, i) => {
                      let cls = "text-xs px-3 py-1.5 border rounded-lg cursor-pointer transition-all ";
                      if (retryResult !== null) {
                        if (i === item.correctAnswer) cls += "border-[var(--success)] bg-[var(--success-bg)] text-[var(--text)]";
                        else if (i === retryAnswer && !retryResult) cls += "border-[var(--error)] bg-[var(--error-bg)] text-[var(--text)]";
                        else cls += "border-[var(--border-light)] text-[var(--text-secondary)]";
                      } else {
                        cls += retryAnswer === i ? "border-[var(--text)] bg-[var(--accent-rose-bg)] text-[var(--text)]" : "border-[var(--border)] text-[var(--text)] hover:border-[var(--text-secondary)]";
                      }
                      return <div key={i} className={cls} onClick={() => !retryResult && (setRetryAnswer(i), setRetryResult(i === item.correctAnswer))}><span className="inline-block w-4 text-[11px] text-[var(--text-tertiary)] mr-1">{String.fromCharCode(65 + i)}</span>{opt}</div>;
                    })}
                    {retryResult !== null && <p className="text-xs mt-2 text-[var(--text)]">{retryResult ? "✓ 这次答对了！" : "✗ 正确答案是 " + String.fromCharCode(65 + item.correctAnswer)}</p>}
                  </div>
                )}

                <p className="text-[11px] text-[var(--text-tertiary)] leading-relaxed mb-2">{item.explanation}</p>
                <div className="flex items-center justify-between border-t border-[var(--border-light)] pt-2">
                  <div className="flex items-center gap-2 text-[11px] text-[var(--text-tertiary)]">
                    <span>{item.subject}</span><span>·</span><span>{item.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {!isRetrying ? (
                      <button className="btn btn-ghost text-xs h-7 px-3" onClick={() => { setRetryingId(item.id); setRetryAnswer(null); setRetryResult(null); }}>重练</button>
                    ) : (
                      <button className="btn btn-ghost text-xs h-7 px-3 text-[var(--text-tertiary)]" onClick={() => setRetryingId(null)}>收起</button>
                    )}
                    <button className="btn btn-ghost text-xs h-7 px-3 text-[var(--text-tertiary)]" onClick={() => handleDelete(item.id)}>删除</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
