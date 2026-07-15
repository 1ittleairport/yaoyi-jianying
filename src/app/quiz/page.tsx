"use client";

import { useState, useEffect, useCallback } from "react";
import type { QuizQuestion } from "@/lib/deepseek";
import {
  addWrongAnswer, logQuizAttempt, takeBridgedMaterial, clearBridgedMaterial,
  savePageState, loadPageState, clearPageState,
} from "@/lib/store";
import { IconGenerate, IconQuiz } from "@/components/icons";
import Link from "next/link";

const PAGE_KEY = "quiz";

export default function QuizPage() {
  const [material, setMaterial] = useState("");
  const [subject, setSubject] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [materialTitle, setMaterialTitle] = useState<string | undefined>();

  const current = questions[currentIndex] || null;

  // 页面加载 → 恢复状态 / 接受桥接材料
  useEffect(() => {
    const bridged = takeBridgedMaterial();
    if (bridged && bridged.target === "quiz") {
      setMaterial(bridged.material.content);
      setSubject(bridged.material.subject);
      setMaterialTitle(bridged.material.title);
    } else {
      // 没有桥接 → 恢复之前输入的内容
      const savedM = loadPageState(PAGE_KEY, "material");
      const savedS = loadPageState(PAGE_KEY, "subject");
      if (savedM) setMaterial(savedM);
      if (savedS) setSubject(savedS);
    }
  }, []);

  // 输入变化 → 自动保存
  const saveMaterial = useCallback((v: string) => { setMaterial(v); savePageState(PAGE_KEY, "material", v); }, []);
  const saveSubject = useCallback((v: string) => { setSubject(v); savePageState(PAGE_KEY, "subject", v); }, []);

  const generate = useCallback(async () => {
    if (!material.trim()) return;
    setLoading(true);
    setQuestions([]);
    setCurrentIndex(0);
    setSelected(null);
    setShowResult(false);
    setScore(0);
    setAnswered(0);
    try {
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ material, subject: subject || "未指定" }),
      });
      const data = await res.json();
      if (data.questions) {
        setQuestions(data.questions);
        clearBridgedMaterial();
        clearPageState(PAGE_KEY);
      } else alert("生成失败");
    } catch {
      alert("网络错误");
    } finally {
      setLoading(false);
    }
  }, [material, subject]);

  const handleSelect = useCallback((index: number) => {
    if (showResult || !current) return;
    setSelected(index);
    setShowResult(true);
    setAnswered((a) => a + 1);
    if (index === current.answer) setScore((s) => s + 1);
    else addWrongAnswer({
      question: current.question, options: current.options,
      correctAnswer: current.answer, userAnswer: index,
      explanation: current.explanation, subject: subject || "未分类",
    });
  }, [showResult, current, subject]);

  const handleFinish = useCallback(() => {
    if (!showResult || currentIndex < questions.length - 1) return;
    // 保存完整结果到历史
    logQuizAttempt(
      subject || "未分类", score, questions.length,
      materialTitle, JSON.stringify(questions, null, 2),
    );
  }, [showResult, currentIndex, questions, subject, score, materialTitle]);

  useEffect(() => {
    if (showResult && currentIndex === questions.length - 1 && questions.length > 0) {
      handleFinish();
    }
  }, [showResult, currentIndex, questions.length, handleFinish]);

  const nextQuestion = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
      setShowResult(false);
    }
  }, [currentIndex, questions.length]);

  return (
    <div className="max-w-3xl mx-auto px-5 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-medium text-[var(--text)] tracking-wide mb-1">刷题</h1>
          <p className="text-xs text-[var(--text-secondary)]">
            粘贴材料，AI 自动出题
            {materialTitle && <span className="ml-1 text-[var(--accent-rose)]">· 来自：{materialTitle}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/wrong-answers" className="badge hover:bg-white transition-colors">错题本 →</Link>
          <Link href="/history" className="badge hover:bg-white transition-colors">历史</Link>
        </div>
      </div>

      <div className="glass-card-static p-4 mb-6">
        <textarea
          className="textarea min-h-[90px]"
          placeholder="粘贴学习材料内容……"
          value={material}
          onChange={(e) => saveMaterial(e.target.value)}
        />
        <div className="flex items-center gap-3 mt-2.5">
          <input
            className="input flex-1"
            placeholder="学科（选填）"
            value={subject}
            onChange={(e) => saveSubject(e.target.value)}
          />
          <button className="btn btn-primary" onClick={generate} disabled={loading || !material.trim()}>
            <IconGenerate className="w-3 h-3" />
            {loading ? "出题中…" : (questions.length > 0 ? "重新出题" : "生成题目")}
          </button>
        </div>
      </div>

      {current && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] tracking-wider text-[var(--text-tertiary)]">
              {currentIndex + 1} / {questions.length}
            </span>
            <span className="text-[11px] text-[var(--text-tertiary)]">正确 {score}/{answered}</span>
          </div>
          <div className="h-px bg-[var(--border-light)] mb-4" />
          <p className="text-sm font-medium text-[var(--text)] mb-5 leading-relaxed">{current.question}</p>

          <div className="space-y-1.5">
            {current.options.map((opt, i) => {
              let cls = "w-full text-left px-4 py-3 text-sm border rounded-xl transition-all bg-white/60 ";
              if (!showResult) {
                cls += selected === i
                  ? "border-[var(--text)] bg-[var(--accent-rose-bg)] text-[var(--text)]"
                  : "border-[var(--border)] text-[var(--text)] hover:border-[var(--text-secondary)]";
              } else {
                if (i === current.answer) cls += " border-[var(--success)] bg-[var(--success-bg)] text-[var(--text)]";
                else if (i === selected && i !== current.answer) cls += " border-[var(--border)] text-[var(--text-tertiary)]";
                else cls += " border-[var(--border-light)] text-[var(--text-tertiary)]";
              }
              return (
                <button key={i} className={cls} onClick={() => handleSelect(i)}>
                  <span className="inline-block w-4 text-[11px] tracking-wider mr-2 text-[var(--text-tertiary)]">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>

          {showResult && (
            <div className="mt-4 pt-4 border-t border-[var(--border-light)]">
              <p className="text-xs font-medium text-[var(--text)] mb-1">
                {selected === current.answer ? "✓ 正确" : "✗ 错误"}
                {selected !== current.answer && <span className="ml-2 text-[11px] text-[var(--text-tertiary)] font-normal">（已加入错题本）</span>}
              </p>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{current.explanation}</p>
              {currentIndex < questions.length - 1 ? (
                <button className="btn btn-primary mt-3 text-xs" onClick={nextQuestion}>下一题</button>
              ) : (
                <p className="text-xs text-[var(--text-tertiary)] mt-3">已全部完成，结果已保存至历史记录</p>
              )}
            </div>
          )}
        </div>
      )}

      {questions.length > 0 && currentIndex === questions.length - 1 && showResult && (
        <div className="glass-card p-6 mt-4 text-center">
          <p className="text-sm text-[var(--text)] mb-1">完成</p>
          <p className="text-xs text-[var(--text-secondary)] mb-4">
            {questions.length} 题 · 正确率 {questions.length > 0 ? Math.round((score / questions.length) * 100) : 0}%
          </p>
          <button className="btn btn-primary" onClick={() => {
            setQuestions([]); setCurrentIndex(0); setSelected(null);
            setShowResult(false); setScore(0); setAnswered(0);
          }}>再来一组</button>
        </div>
      )}

      {questions.length === 0 && !loading && (
        <div className="text-center py-16 text-[var(--text-tertiary)]">
          <IconQuiz className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <p className="text-xs">粘贴材料，点击「生成题目」</p>
        </div>
      )}
    </div>
  );
}
