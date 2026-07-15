"use client";

import { useState, useEffect, useCallback } from "react";
import type { HotspotAnalysis, MindMapNode } from "@/lib/deepseek";
import {
  logHotspotAnalyzed, takeBridgedMaterial, clearBridgedMaterial,
  savePageState, loadPageState, clearPageState,
} from "@/lib/store";
import dynamic from "next/dynamic";
import { IconHotspot, IconGenerate } from "@/components/icons";

const MindMapVisual = dynamic(() => import("@/components/MindMapVisual"), { ssr: false });
const PAGE_KEY = "hotspot";

const DEFAULT_ANGLES = [
  "政府角度（政策制定与执行）",
  "企业角度（营商环境与市场反应）",
  "社会组织角度（协同治理）",
  "基层治理角度",
  "中央与地方关系角度",
  "法律角度（法律法规与合规）",
  "个人品德与职业道德角度",
];

export default function HotspotPage() {
  const [news, setNews] = useState("");
  const [materialContext, setMaterialContext] = useState("");
  const [subject, setSubject] = useState("");
  const [analysis, setAnalysis] = useState<HotspotAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [mindmapFromAnalysis, setMindmapFromAnalysis] = useState<MindMapNode | null>(null);
  const [mmLoading, setMmLoading] = useState(false);
  const [materialTitle, setMaterialTitle] = useState<string | undefined>();
  // 新闻列表和加载状态
  const [newsItems, setNewsItems] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState<string | null>(null);

  // 恢复状态 / 接受桥接
  useEffect(() => {
    const bridged = takeBridgedMaterial();
    if (bridged && bridged.target === "hotspot") {
      setNews(bridged.material.content);
      setSubject(bridged.material.subject);
      setMaterialTitle(bridged.material.title);
    } else {
      const savedN = loadPageState(PAGE_KEY, "news");
      const savedM = loadPageState(PAGE_KEY, "material");
      const savedS = loadPageState(PAGE_KEY, "subject");
      if (savedN) setNews(savedN);
      if (savedM) setMaterialContext(savedM);
      if (savedS) setSubject(savedS);
    }
  }, []);

  const saveNews = useCallback((v: string) => { setNews(v); savePageState(PAGE_KEY, "news", v); }, []);
  const saveMat = useCallback((v: string) => { setMaterialContext(v); savePageState(PAGE_KEY, "material", v); }, []);
  const saveSubj = useCallback((v: string) => { setSubject(v); savePageState(PAGE_KEY, "subject", v); }, []);

  // 拉取实时新闻
  const fetchNews = useCallback(async (category?: string) => {
    setNewsLoading(true);
    setNewsError(null);
    try {
      const url = category
        ? `/api/news-feed?category=${encodeURIComponent(category)}`
        : "/api/news-feed";
      const res = await fetch(url);
      const data = await res.json();
      if (data.items?.length > 0) {
        setNewsItems(data.items);
      } else {
        setNewsError("暂未获取到新闻");
      }
    } catch {
      setNewsError("新闻获取失败");
    } finally {
      setNewsLoading(false);
    }
  }, []);

  useEffect(() => { fetchNews(); }, [fetchNews]);

  const handleSelectNews = useCallback((item: any) => {
    const newsText = `【${item.source}】${item.title}\n${item.description || ""}\n原文：${item.link}`;
    saveNews(newsText);
  }, [saveNews]);

  const analyze = useCallback(async () => {
    if (!news.trim()) return;
    setLoading(true);
    setAnalysis(null);
    setMindmapFromAnalysis(null);
    try {
      const res = await fetch("/api/analyze-hotspot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ news, materialContext, subject: subject || "公共管理", angles: DEFAULT_ANGLES }),
      });
      const data = await res.json();
      if (data.summary) {
        setAnalysis(data);
        logHotspotAnalyzed(subject || "公共管理", materialTitle, JSON.stringify(data, null, 2));
        clearBridgedMaterial();
        clearPageState(PAGE_KEY);
      } else alert("分析失败");
    } catch {
      alert("网络错误");
    } finally {
      setLoading(false);
    }
  }, [news, materialContext, subject, materialTitle]);

  const generateMindMapFromAnalysis = useCallback(async () => {
    if (!analysis) return;
    setMmLoading(true);
    setMindmapFromAnalysis(null);
    const analysisText = [
      `主题：${subject || "未指定"}`,
      `热点概述：${analysis.summary}`,
      "", "多角度分析：",
      ...analysis.angleAnalysis.map((a) => `- ${a.angle}：${a.content}`),
      "", "预测题目：",
      ...analysis.possibleQuestions.map((q) => `- ${q.type}：${q.question}`),
    ].join("\n");
    try {
      const res = await fetch("/api/generate-mindmap", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ material: analysisText }),
      });
      const data = await res.json();
      if (data.mindmap) setMindmapFromAnalysis(data.mindmap);
      else alert("导图生成失败");
    } catch { alert("网络错误"); }
    finally { setMmLoading(false); }
  }, [analysis, subject]);

  return (
    <div className="max-w-4xl mx-auto px-5 py-8">
      <div className="mb-6">
        <h1 className="text-lg font-medium text-[var(--text)] tracking-wide mb-1">热点</h1>
        <p className="text-xs text-[var(--text-secondary)]">
          实时新闻 + 专业分析。AI 多角度拆解论述题。
        </p>
      </div>

      {/* ─── 新闻流 ─── */}
      <div className="glass-card-static p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e06060] animate-pulse" />
            <span className="text-[11px] tracking-[0.15em] text-[var(--text-secondary)] font-medium">时事热点</span>
            <span className="text-[10px] text-[var(--text-tertiary)]">自动更新</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="text-[10px] px-2 py-1 border border-[var(--border)] bg-white/60 rounded"
              onChange={(e) => fetchNews(e.target.value)}
              defaultValue=""
            >
              <option value="">全部分类</option>
              <option value="public_admin">公共管理</option>
              <option value="economy">经济</option>
              <option value="law">法律</option>
            </select>
            <button className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text)]" onClick={() => fetchNews()}>刷新</button>
          </div>
        </div>

        {newsLoading && <p className="text-xs text-[var(--text-tertiary)] py-2">加载中…</p>}
        {newsError && <p className="text-xs text-[var(--error)] py-2">{newsError}</p>}

        {!newsLoading && newsItems.length > 0 && (
          <div className="space-y-1 max-h-[320px] overflow-y-auto">
            {newsItems.slice(0, 15).map((item: any, i: number) => (
              <div
                key={i}
                className="flex items-start gap-2 p-2 rounded-lg cursor-pointer hover:bg-white/60 transition-colors text-xs"
                onClick={() => handleSelectNews(item)}
              >
                <span className="text-[10px] px-1 py-0.5 rounded bg-[var(--accent-rose-bg)] text-[var(--accent-rose)] font-medium whitespace-nowrap flex-shrink-0">
                  {item.source}
                </span>
                <p className="text-[var(--text)] leading-snug flex-1 min-w-0 line-clamp-2">{item.title}</p>
              </div>
            ))}
          </div>
        )}

        {!newsLoading && newsItems.length === 0 && !newsError && (
          <p className="text-xs text-[var(--text-tertiary)] py-2">暂无新闻，点击刷新</p>
        )}
      </div>

      {/* ─── 输入区 ─── */}
      <div className="glass-card-static p-4 mb-6 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] tracking-wider text-[var(--text-tertiary)]">分析内容</span>
          {news && <button className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text)]" onClick={() => saveNews("")}>清空</button>}
        </div>
        <textarea
          className="textarea min-h-[80px]"
          placeholder="点击上方新闻自动载入，或手动粘贴热点内容……"
          value={news} onChange={(e) => saveNews(e.target.value)}
        />
        <textarea
          className="textarea min-h-[60px]"
          placeholder="相关教材 / 专业材料（选填）……"
          value={materialContext} onChange={(e) => saveMat(e.target.value)}
        />
        <div className="flex items-center gap-3">
          <input className="input flex-1" placeholder="学科（选填）" value={subject} onChange={(e) => saveSubj(e.target.value)} />
          <button className="btn btn-primary" onClick={analyze} disabled={loading || !news.trim()}>
            <IconGenerate className="w-3 h-3" />
            {loading ? "分析中…" : "分析"}
          </button>
        </div>
      </div>

      {/* ─── 结果 ─── */}
      {analysis && (
        <div className="space-y-4">
          <div className="glass-card-static p-5">
            <p className="text-[11px] tracking-wider text-[var(--text-tertiary)] mb-2">概述</p>
            <p className="text-sm text-[var(--text)] leading-relaxed">{analysis.summary}</p>
          </div>

          <div className="glass-card-static p-5">
            <p className="text-[11px] tracking-wider text-[var(--text-tertiary)] mb-3">多角度分析</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {analysis.angleAnalysis.map((item, i) => (
                <div key={i} className="bg-white/50 backdrop-blur-sm rounded-xl p-3.5 border border-[var(--border-light)]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-rose-bg)] text-[var(--accent-rose)] font-medium">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-xs font-medium text-[var(--text)]">{item.angle}</h3>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-1.5">{item.content}</p>
                  {item.materialCorrelation && <span className="text-[11px] text-[var(--text-tertiary)] block">→ {item.materialCorrelation}</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card-static p-5">
            <p className="text-[11px] tracking-wider text-[var(--text-tertiary)] mb-3">预测题目</p>
            <div className="space-y-2.5">
              {analysis.possibleQuestions.map((q, i) => (
                <div key={i} className="bg-white/50 backdrop-blur-sm rounded-xl p-3.5 border border-[var(--border-light)]">
                  <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-[var(--accent-sage-bg)] text-[var(--accent-sage)] font-medium mb-1.5">
                    {q.type}
                  </span>
                  <p className="text-sm text-[var(--text)] mb-1.5 leading-relaxed">{q.question}</p>
                  <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">💡 {q.analysisTips}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card-static p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-[11px] tracking-wider text-[var(--text-tertiary)] mb-2">关键词</p>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.keywords.map((kw, i) => (
                    <span key={i} className="text-[11px] px-2.5 py-1 rounded-full bg-white/60 border border-[var(--border-light)] text-[var(--text-secondary)]">{kw}</span>
                  ))}
                </div>
              </div>
              <button className="btn btn-ghost text-xs whitespace-nowrap" onClick={generateMindMapFromAnalysis} disabled={mmLoading}>
                {mmLoading ? "生成中…" : "生成分析导图"}
              </button>
            </div>
          </div>

          {mindmapFromAnalysis && (
            <div className="glass-card-static p-4">
              <div className="flex items-center gap-2 pb-3 mb-3 border-b border-[var(--border-light)]">
                <span className="text-[11px] tracking-wider text-[var(--text-tertiary)]">分析框架</span>
                <span className="text-xs text-[var(--text)] font-medium">{mindmapFromAnalysis.title}</span>
              </div>
              <MindMapVisual root={mindmapFromAnalysis} />
            </div>
          )}
        </div>
      )}

      {!analysis && !loading && (
        <div className="text-center py-16 text-[var(--text-tertiary)]">
          <IconHotspot className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <p className="text-xs">点击上方新闻加载，或手动粘贴内容后点击「分析」</p>
        </div>
      )}
    </div>
  );
}
