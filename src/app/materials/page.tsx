"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getMaterials, addMaterial, deleteMaterial, bridgeMaterial, logMaterialAdded, type Material } from "@/lib/store";
import { IconMaterials } from "@/components/icons";
import { useRouter } from "next/navigation";

export default function MaterialsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Material[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [textTitle, setTextTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const refresh = useCallback(() => setItems(getMaterials()), []);
  useEffect(() => { refresh(); }, [refresh]);

  const addTextMaterial = () => {
    if (!textTitle.trim() || !textContent.trim()) {
      setUploadError("请填写标题和内容");
      return;
    }
    addMaterial(textTitle, "text", textContent);
    logMaterialAdded(textTitle);
    setTextTitle("");
    setTextContent("");
    setShowAdd(false);
    setUploadError(null);
    refresh();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();

    // ── 前端文件大小检查（Vercel免费版限制 4.5MB） ──
    const MAX_SIZE = 3.8 * 1024 * 1024; // 留出 multipart 开销余量
    if (file.size > MAX_SIZE) {
      setUploadError(`文件过大（${(file.size / 1024 / 1024).toFixed(1)}MB），请上传 3.5MB 以下的文件，或手动复制粘贴文本。`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // PDF / Word / TXT → 走后端解析
    if (ext === "pdf" || ext === "docx" || ext === "txt") {
      setUploading(true);
      setUploadError(null);

      try {
        // 先存一个占位
        const localContent = `[文件] ${file.name}（${(file.size / 1024).toFixed(1)} KB）\n正在解析文件内容……`;
        const placeholder = addMaterial(file.name, ext === "docx" ? "word" : ext === "pdf" ? "pdf" : "text", localContent);
        logMaterialAdded(file.name);

        // 调用后端解析
        const form = new FormData();
        form.append("file", file);

        const res = await fetch("/api/upload-pdf", {
          method: "POST",
          body: form,
        });

        // ⚠ 检查响应是否为 JSON（Vercel 超限会返回 HTML）
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          const htmlText = await res.text();
          console.error("[upload] 非JSON响应（可能是Vercel拒绝大文件）:", htmlText.slice(0, 200));
          throw new Error(`服务器拒绝处理该文件（响应: ${res.status}），可能是文件过大或网络问题。请尝试缩小文件后重试。`);
        }

        const data = await res.json();

        if (data.success && data.text) {
          // 更新材料内容为解析后的文本
          const all = getMaterials();
          const idx = all.findIndex((m) => m.id === placeholder.id);
          if (idx >= 0) {
            all[idx].content = data.text;
            all[idx].charCount = data.text.length;
            localStorage.setItem("yy_materials", JSON.stringify(all));
          }
          refresh();
        } else {
          // 解析失败，保留占位内容但显示错误
          setUploadError(data.error || "文件解析失败");
        }
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "上传失败");
      } finally {
        setUploading(false);
        refresh();
      }

    } else {
      setUploadError("仅支持 PDF / Word (.docx) / TXT 文件");
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleBridge = (m: Material, target: "quiz" | "mindmap" | "hotspot") => {
    const subject = m.title.replace(/\.(pdf|doc|docx|txt)$/i, "").trim();

    // 判断内容是否有效（不是纯文件占位符）
    const isPlaceholder = m.content.startsWith("[文件]") && m.content.includes("KB）") && m.content.length < 300;
    if (isPlaceholder) {
      alert("该文件内容尚未解析完成，请等待解析完成后再使用");
      return;
    }

    bridgeMaterial({ title: m.title, content: m.content, subject }, target);
    if (target === "quiz") router.push("/quiz");
    else if (target === "mindmap") router.push("/mindmap");
    else router.push("/hotspot");
  };

  const togglePreview = (m: Material) => {
    setPreviewId((prev) => (prev === m.id ? null : m.id));
  };

  const typeLabel: Record<string, string> = { text: "文本", pdf: "PDF", word: "Word" };

  return (
    <div className="max-w-3xl mx-auto px-5 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-medium text-[var(--text)] tracking-wide mb-1">资料</h1>
          <p className="text-xs text-[var(--text-secondary)]">管理材料，可发送到刷题 / 导图 / 热点。支持 PDF / Word / TXT。</p>
        </div>
        <button className="btn btn-ghost text-xs" onClick={() => { setShowAdd(!showAdd); setUploadError(null); }}>
          {showAdd ? "取消" : "+ 添加"}
        </button>
      </div>

      {showAdd && (
        <div className="glass-card-static p-4 mb-6 space-y-2.5">
          <input className="input" placeholder="资料标题" value={textTitle} onChange={(e) => setTextTitle(e.target.value)} />
          <textarea className="textarea min-h-[100px]" placeholder="粘贴资料内容……" value={textContent} onChange={(e) => setTextContent(e.target.value)} />
          <div className="flex items-center gap-3">
            <button className="btn btn-primary" onClick={addTextMaterial} disabled={!textTitle.trim() || !textContent.trim()}>保存</button>
            <span className="text-[11px] text-[var(--text-tertiary)]">或</span>
            <label className={`btn btn-ghost cursor-pointer text-xs ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
              {uploading ? "解析中…" : "上传文件 (PDF/Word/TXT)"}
              <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleFileUpload} disabled={uploading} />
            </label>
          </div>
          {uploadError && <p className="text-xs text-[var(--error)]">{uploadError}</p>}
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-20 text-[var(--text-tertiary)]">
          <IconMaterials className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <p className="text-xs">还没有资料</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {items.map((m) => {
            const isPreviewOpen = previewId === m.id;
            const isPlaceholder = m.content.startsWith("[文件]") && m.content.includes("正在解析");
            return (
              <div key={m.id} className="glass-card overflow-hidden">
                <div className="p-4 group">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text)] truncate flex items-center gap-2">
                        {m.title}
                        {isPlaceholder && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200">解析中</span>}
                      </p>
                      <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                        {m.date} · {typeLabel[m.type] || "文件"} · {m.charCount || 0} 字
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="btn btn-ghost text-xs h-7 px-2.5" onClick={() => togglePreview(m)}>
                        {isPreviewOpen ? "收起" : "预览"}
                      </button>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="btn btn-ghost text-xs h-7 px-2" title="用于刷题" onClick={() => handleBridge(m, "quiz")}>📝</button>
                        <button className="btn btn-ghost text-xs h-7 px-2" title="用于导图" onClick={() => handleBridge(m, "mindmap")}>🧠</button>
                        <button className="btn btn-ghost text-xs h-7 px-2" title="用于热点" onClick={() => handleBridge(m, "hotspot")}>🔥</button>
                      </div>
                      <button className="btn btn-ghost text-xs h-7 px-2.5 text-[var(--text-tertiary)] hover:text-[var(--error)]" onClick={() => { deleteMaterial(m.id); refresh(); setPreviewId(null); }}>删除</button>
                    </div>
                  </div>
                </div>

                {isPreviewOpen && (
                  <div className="border-t border-[var(--border-light)] px-4 py-3.5 bg-white/50">
                    <pre className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap font-sans leading-relaxed max-h-[240px] overflow-y-auto">
                      {m.content.slice(0, 3000)}
                      {m.content.length > 3000 && "\n\n……（内容过长，已截取前 3000 字）"}
                    </pre>
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
