import { NextRequest, NextResponse } from "next/server";

/**
 * 文件上传解析 API
 * 支持 PDF / Word (.docx) / TXT
 *
 * Vercel 部署说明：
 * - 环境变量 UPLOAD_MAX_MB 可调整上传限制（默认 4MB）
 * - 生产环境直接用 pdfjs-dist（Vercel 的 Node.js 环境不走 Turbopack）
 * - 本地开发用小线程或 pdfjs-dist 直接加载
 */

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "未收到文件" }, { status: 400 });
    }

    // Vercel 免费版对 serverless 函数有 4.5MB 请求体限制
    const maxBytes = 4.5 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json({
        success: false,
        text: `[文件] ${file.name}（${(file.size / 1024).toFixed(1)} KB）\n文件过大（超过 4.5MB 限制），请拆分后再上传。`,
        fileName: file.name,
        format: "未知",
        charCount: 0,
      });
    }

    const name = file.name.toLowerCase();
    const bytes = await file.arrayBuffer();
    const uint8 = new Uint8Array(bytes);

    let text = "";
    let format = "未知";

    // ─── PDF ───
    if (name.endsWith(".pdf")) {
      format = "PDF";
      try {
        text = await extractPDF(uint8);
        if (!text || text.trim().length < 3) throw new Error("未提取到文本");
      } catch (e: unknown) {
        const m = e instanceof Error ? e.message : String(e);
        text = `[文件] ${file.name}（${(file.size / 1024).toFixed(1)} KB）\nPDF解析失败: ${m}\n请尝试将 PDF 内容复制粘贴为文本。`;
      }

    // ─── Word (.docx) ───
    } else if (name.endsWith(".docx")) {
      format = "Word";
      try {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ buffer: Buffer.from(uint8) });
        text = result.value || "";
      } catch (e: unknown) {
        const m = e instanceof Error ? e.message : String(e);
        text = `[文件] ${file.name}（${(file.size / 1024).toFixed(1)} KB）\nWord解析失败: ${m}`;
      }

    // ─── TXT ───
    } else if (name.endsWith(".txt")) {
      format = "文本";
      const decoder = new TextDecoder("utf-8");
      text = decoder.decode(uint8);
      if (!text.trim()) text = `[文件] ${file.name}（空文件）`;

    } else {
      return NextResponse.json({
        error: "不支持的文件格式，请上传 PDF / Word / TXT",
        text: `[文件] ${file.name}（${(file.size / 1024).toFixed(1)} KB）\n不支持的文件格式`,
        format: "unknown", fileName: file.name,
      });
    }

    text = text.substring(0, 50000);

    return NextResponse.json({ success: true, text, fileName: file.name, format, charCount: text.length });

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "未知错误";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * PDF 文本提取
 *
 * 策略（从最优到降级）：
 *   1. pdfjs-dist/legacy/build/pdf.mjs → 完整解析，支持中文，需 worker
 *   2. 简易文本提取 → 解析 PDF BT/ET 流，不依赖外部库
 *
 * Vercel 生产环境直接用 pdfjs-dist（不走 worker_threads），
 * Turbopack 只影响本地 dev 模式，不影响部署后的 .next 产物。
 */
async function extractPDF(uint8: Uint8Array): Promise<string> {
  // ─── 方案 A：用 pdfjs-dist 完整解析 ───
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

    // 设置 worker：在 Vercel Node.js 环境中用 data URI 方式嵌入
    try {
      const fs = await import("fs");
      const path = await import("path");

      // 尝试读取 worker 文件
      const workerPaths = [
        path.join(process.cwd(), "node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.min.mjs"),
        path.join(process.cwd(), ".next", "server", "chunks", "pdf.worker.min.mjs"),
      ];

      for (const wp of workerPaths) {
        try {
          if (fs.existsSync(wp)) {
            const code = fs.readFileSync(wp, "utf-8");
            pdfjs.GlobalWorkerOptions.workerSrc =
              "data:text/javascript;base64," + Buffer.from(code).toString("base64");
            break;
          }
        } catch { continue; }
      }
    } catch { /* 静默 — 使用默认 worker */ }

    const doc = await pdfjs.getDocument({ data: uint8.slice(0) }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const tc = await page.getTextContent();
      const text = tc.items.map((item: any) => item.str || "").join(" ");
      pages.push(text);
    }
    await doc.destroy();

    const fullText = pages.join("\n\n");
    if (fullText.trim().length >= 10) return fullText;
  } catch {
    // pdfjs 解析失败 → 降级到方案 B
  }

  // ─── 方案 B：简易文本提取（零依赖） ───
  const result = extractPDFTextSimple(uint8);
  if (result.length >= 10) return result;

  throw new Error("无法识别 PDF 中的文本（可能是图片型扫描件）");
}

/**
 * 简易 PDF 文本提取
 * 直接解析 BT...ET 流中的 Tj/TJ 操作符
 */
function extractPDFTextSimple(uint8: Uint8Array): string {
  const text = new TextDecoder("utf-8", { fatal: false }).decode(uint8);
  const texts: string[] = [];

  // 提取 BT ... ET 块
  const btEtRegex = /BT([\s\S]*?)ET/g;
  let match: RegExpExecArray | null;
  while ((match = btEtRegex.exec(text)) !== null) {
    const block = match[1];

    // Tj: (text) Tj
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    let m: RegExpExecArray | null;
    while ((m = tjRegex.exec(block)) !== null) {
      const t = m[1]
        .replace(/\\(.)/g, "$1")
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
        .trim();
      if (t) texts.push(t);
    }
  }

  return texts.join("\n");
}
