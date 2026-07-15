/**
 * PDF 解析 Worker
 *
 * 此文件不经过 Next.js 打包，由 Node.js 的 worker_threads 直接加载。
 * 因此 pdfjs-dist 的 import 路径不会被 Turbopack 改写，
 * 内部的 worker 加载也能正常工作。
 */

import { parentPort, workerData } from "worker_threads";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

// 修复：在 worker 中手动指定 worker 文件路径
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workerPath = path.resolve(
  __dirname, "..", "..", "..",
  "node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.min.mjs",
);
const workerCode = fs.readFileSync(workerPath, "utf-8");
pdfjs.GlobalWorkerOptions.workerSrc =
  "data:text/javascript;base64," + Buffer.from(workerCode).toString("base64");

async function extractText(uint8) {
  const doc = await pdfjs.getDocument({ data: uint8.slice(0) }).promise;
  const pages = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const tc = await page.getTextContent();
    const text = tc.items.map((item) => item.str || "").join(" ");
    pages.push(text);
  }

  await doc.destroy();
  return pages.join("\n\n");
}

// 接收主线程的消息
parentPort.on("message", async (msg) => {
  if (msg.type === "parse") {
    try {
      const uint8 = new Uint8Array(msg.data);
      const text = await extractText(uint8);
      parentPort.postMessage({ type: "result", text });
    } catch (e) {
      parentPort.postMessage({
        type: "error",
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }
});

// 通知主线程 worker 已就绪
parentPort.postMessage({ type: "ready" });
