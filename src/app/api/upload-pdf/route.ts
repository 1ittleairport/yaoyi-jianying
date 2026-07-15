import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { Worker } from "worker_threads";

/**
 * 文件上传解析 API
 *
 * 支持 PDF（通过 worker_threads 运行 pdfjs-dist，避免 Next.js 打包路径问题）、
 * Word .docx（mammoth）、TXT
 */

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "未收到文件" }, { status: 400 });
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
        text = await extractPDFWithWorker(uint8);
      } catch (e: unknown) {
        const m = e instanceof Error ? e.message : String(e);
        text = `[文件] ${file.name}（${(file.size / 1024).toFixed(1)} KB）\nPDF解析失败: ${m}\n请尝试将 PDF 内容复制粘贴为文本。`;
      }

      if (!text || text.trim().length < 3) {
        text = `[文件] ${file.name}（${(file.size / 1024).toFixed(1)} KB）\n（该PDF未能提取到文本内容，可能是扫描件/图片型PDF）`;
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
 * 在独立 worker 线程中解析 PDF
 *
 * 原因：pdfjs-dist v4 在 Node.js 中需要加载 worker 文件。
 * 但 Next.js Turbopack 会改写所有 `import()` 路径，
 * 导致 worker 文件的相对路径引用错误。
 *
 * 解决方案：将 pdfjs-dist 放在独立的 .mjs 文件中，
 * 通过 worker_threads 在另一个线程中加载（不经过 Next.js 打包），
 * 从而保留正确的模块解析路径。
 */
async function extractPDFWithWorker(uint8: Uint8Array): Promise<string> {
  const workerPath = path.join(process.cwd(), "src", "lib", "server", "pdf-worker.mjs");

  return new Promise<string>((resolve, reject) => {
    let worker;
    try {
      worker = new Worker(workerPath);
    } catch (e) {
      reject(new Error(`创建工作线程失败: ${e instanceof Error ? e.message : String(e)}`));
      return;
    }

    const timeout = setTimeout(() => {
      worker.terminate();
      reject(new Error("PDF 解析超时（30秒）"));
    }, 30000);

    worker.on("message", (msg) => {
      if (msg.type === "ready") {
        // Worker 就绪，发送 PDF 数据
        worker.postMessage({ type: "parse", data: Array.from(uint8) });
      } else if (msg.type === "result") {
        clearTimeout(timeout);
        worker.terminate();
        resolve(msg.text);
      } else if (msg.type === "error") {
        clearTimeout(timeout);
        worker.terminate();
        reject(new Error(msg.error || "未知错误"));
      }
    });

    worker.on("error", (err) => {
      clearTimeout(timeout);
      reject(new Error(`工作线程错误: ${err.message}`));
    });

    worker.on("exit", (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        reject(new Error(`工作线程异常退出 (code=${code})`));
      }
    });
  });
}
