"use client";

import { useState, useEffect, useCallback } from "react";

interface NewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
}

interface NewsFeedProps {
  onSelectNews: (news: string) => void;
}

export default function NewsFeed({ onSelectNews }: NewsFeedProps) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/news-feed");
      const data = await res.json();
      if (data.items?.length) setItems(data.items);
    } catch {
      // 静默失败
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
    // 每 5 分钟自动刷新
    const interval = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNews]);

  // 自动轮播
  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % Math.min(items.length, 8));
    }, 6000);
    return () => clearInterval(t);
  }, [items.length]);

  const active = items[activeIndex];

  const handleClick = (item: NewsItem) => {
    const newsText = `【${item.source}】${item.title}\n${item.description}\n原文：${item.link}`;
    onSelectNews(newsText);
  };

  if (loading && items.length === 0) {
    return (
      <div className="glass-card-static p-4 mb-6">
        <p className="text-xs text-[var(--text-tertiary)] tracking-wider">加载新闻中…</p>
      </div>
    );
  }

  return (
    <div className="glass-card-static p-4 mb-6">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#e06060] animate-pulse" />
          <span className="text-[11px] tracking-[0.15em] text-[var(--text-secondary)] font-medium">
            时事热点
          </span>
          <span className="text-[10px] text-[var(--text-tertiary)]">
            人民网 · 自动更新
          </span>
        </div>
        <button
          className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text)] transition-colors"
          onClick={fetchNews}
        >
          刷新
        </button>
      </div>

      {/* 主卡片 */}
      {active && (
        <div
          className="bg-white/60 backdrop-blur-sm border border-[var(--border-light)] rounded-xl p-3.5 cursor-pointer hover:bg-white/80 transition-all group mb-2"
          onClick={() => handleClick(active)}
        >
          <div className="flex items-start gap-2.5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-rose-bg)] text-[var(--accent-rose)] font-medium">
                  {active.source}
                </span>
                <span className="text-[10px] text-[var(--text-tertiary)]">
                  {formatDate(active.pubDate)}
                </span>
              </div>
              <p className="text-sm font-medium text-[var(--text)] leading-snug line-clamp-2 group-hover:text-[var(--accent-rose)] transition-colors">
                {active.title}
              </p>
              {active.description && (
                <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2 leading-relaxed">
                  {active.description}
                </p>
              )}
            </div>
            <span className="text-[10px] text-[var(--text-tertiary)] flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              用于分析 →
            </span>
          </div>
        </div>
      )}

      {/* 轮播指示器 + 更多 */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1.5">
          {items.slice(0, 8).map((_, i) => (
            <button
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                i === activeIndex ? "bg-[var(--text)] w-3" : "bg-[var(--border)] hover:bg-[var(--text-tertiary)]"
              }`}
              onClick={() => setActiveIndex(i)}
            />
          ))}
        </div>
        {items.length > 0 && (
          <span className="text-[10px] text-[var(--text-tertiary)]">
            点击新闻可载入分析
          </span>
        )}
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffH = Math.floor((now.getTime() - d.getTime()) / 3600000);
    if (diffH < 1) return "刚刚";
    if (diffH < 24) return `${diffH}小时前`;
    return `${Math.floor(diffH / 24)}天前`;
  } catch {
    return "";
  }
}
