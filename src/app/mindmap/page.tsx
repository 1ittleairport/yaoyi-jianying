"use client";

import { useState, useEffect, useCallback } from "react";
import type { MindMapNode } from "@/lib/deepseek";
import {
  logMindMapGenerated, takeBridgedMaterial, clearBridgedMaterial,
  savePageState, loadPageState, clearPageState,
} from "@/lib/store";
import dynamic from "next/dynamic";
import { IconGenerate, IconMindMap } from "@/components/icons";

const MindMapVisual = dynamic(() => import("@/components/MindMapVisual"), { ssr: false });
const PAGE_KEY = "mindmap";

export default function MindMapPage() {
  const [material, setMaterial] = useState("");
  const [subject, setSubject] = useState("");
  const [mindmap, setMindmap] = useState<MindMapNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [materialTitle, setMaterialTitle] = useState<string | undefined>();

  useEffect(() => {
    const bridged = takeBridgedMaterial();
    if (bridged && bridged.target === "mindmap") {
      setMaterial(bridged.material.content);
      setSubject(bridged.material.subject);
      setMaterialTitle(bridged.material.title);
    } else {
      const savedM = loadPageState(PAGE_KEY, "material");
      const savedS = loadPageState(PAGE_KEY, "subject");
      if (savedM) setMaterial(savedM);
      if (savedS) setSubject(savedS);
    }
  }, []);

  const saveMaterial = useCallback((v: string) => { setMaterial(v); savePageState(PAGE_KEY, "material", v); }, []);
  const saveSubject = useCallback((v: string) => { setSubject(v); savePageState(PAGE_KEY, "subject", v); }, []);

  const generate = useCallback(async () => {
    if (!material.trim()) return;
    setLoading(true);
    setMindmap(null);
    try {
      const res = await fetch("/api/generate-mindmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ material }),
      });
      const data = await res.json();
      if (data.mindmap) {
        setMindmap(data.mindmap);
        logMindMapGenerated(subject || "未分类", materialTitle, JSON.stringify(data.mindmap, null, 2));
        clearBridgedMaterial();
        clearPageState(PAGE_KEY);
      } else alert("生成失败");
    } catch {
      alert("网络错误");
    } finally {
      setLoading(false);
    }
  }, [material, subject, materialTitle]);

  return (
    <div className="max-w-5xl mx-auto px-5 py-8">
      <div className="mb-6">
        <h1 className="text-lg font-medium text-[var(--text)] tracking-wide mb-1">导图</h1>
        <p className="text-xs text-[var(--text-secondary)]">
          粘贴教材，AI 自动生成知识树
          {materialTitle && <span className="ml-1 text-[var(--accent-sage)]">· 来自：{materialTitle}</span>}
        </p>
      </div>

      <div className="glass-card-static p-4 mb-6">
        <textarea
          className="textarea min-h-[100px]"
          placeholder="粘贴教材内容（整章或整节效果更佳）……"
          value={material}
          onChange={(e) => saveMaterial(e.target.value)}
        />
        <div className="flex items-center gap-3 mt-2.5">
          <input className="input flex-1" placeholder="学科（选填）" value={subject} onChange={(e) => saveSubject(e.target.value)} />
          <button className="btn btn-primary" onClick={generate} disabled={loading || !material.trim()}>
            <IconGenerate className="w-3 h-3" />
            {loading ? "生成中…" : "生成导图"}
          </button>
        </div>
      </div>

      {mindmap && (
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-[var(--border-light)]">
            <span className="text-[11px] tracking-wider text-[var(--text-tertiary)]">知识树</span>
            <span className="text-xs text-[var(--text)] font-medium">{mindmap.title}</span>
          </div>
          <MindMapVisual root={mindmap} />
        </div>
      )}

      {!mindmap && !loading && (
        <div className="text-center py-16 text-[var(--text-tertiary)]">
          <IconMindMap className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <p className="text-xs">粘贴教材内容，点击「生成导图」</p>
        </div>
      )}
    </div>
  );
}
