"use client";

/**
 * 要义剪影 - 统一客户端存储
 * 错题本 / 材料库 / 活动历史（含完整结果）/ 功能间桥梁 / 页面状态持久化
 */

// ═════════════════════════════ 类型定义 ═════════════════════════════

export interface WrongAnswer {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  userAnswer: number;
  explanation: string;
  subject: string;
  date: string;
}

export interface Material {
  id: string;
  title: string;
  type: "text" | "pdf" | "word";
  date: string;
  content: string;
  charCount: number;
}

/** 活动历史（含完整结果数据） */
export interface Activity {
  id: string;
  type: "quiz_attempt" | "mindmap_generated" | "hotspot_analyzed" | "material_added";
  summary: string;
  detail: string;
  timestamp: string;
  subject?: string;
  materialTitle?: string;
  score?: { correct: number; total: number };
  /** 完整结果数据（JSON 字符串），历史页可展开查看 */
  resultData?: string;
}

export interface PendingMaterial {
  material: { title: string; content: string; subject: string };
  target: "quiz" | "mindmap" | "hotspot";
}

interface PendingMaterialStored extends PendingMaterial {
  consumed: boolean;
  id: string;
}

// ═════════════════════════════ 工具函数 ═════════════════════════════

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function setItem(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* 静默 */ }
}

function makeId(): string { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function today(): string { return new Date().toLocaleDateString("zh-CN"); }
function nowISO(): string { return new Date().toISOString(); }

const KEYS = {
  WRONG: "yy_wrong_answers",
  MATERIALS: "yy_materials",
  HISTORY: "yy_history",
  BRIDGE: "yy_pending_material",
  PAGE_STATE: "yy_page_state",
};

// ═════════════════════════════ 1. 错题本 ═════════════════════════════

export function getWrongAnswers(): WrongAnswer[] { return getItem<WrongAnswer[]>(KEYS.WRONG, []); }
export function addWrongAnswer(wa: Omit<WrongAnswer, "id" | "date">) {
  const list = getWrongAnswers();
  list.unshift({ ...wa, id: makeId(), date: today() });
  setItem(KEYS.WRONG, list);
}
export function removeWrongAnswer(id: string) { setItem(KEYS.WRONG, getWrongAnswers().filter((w) => w.id !== id)); }
export function clearWrongAnswers() { localStorage.removeItem(KEYS.WRONG); }

// ═════════════════════════════ 2. 材料持久化 ═════════════════════════════

export function getMaterials(): Material[] { return getItem<Material[]>(KEYS.MATERIALS, []); }
export function addMaterial(title: string, type: Material["type"], content: string): Material {
  const list = getMaterials();
  const m: Material = { id: makeId(), title, type, date: today(), content, charCount: content.length };
  list.unshift(m);
  setItem(KEYS.MATERIALS, list);
  return m;
}
export function deleteMaterial(id: string) { setItem(KEYS.MATERIALS, getMaterials().filter((m) => m.id !== id)); }

// ═════════════════════════════ 3. 活动历史（含完整结果） ═════════════════════════════

export function getHistory(): Activity[] { return getItem<Activity[]>(KEYS.HISTORY, []); }

function addHistory(act: Omit<Activity, "id" | "timestamp">) {
  const list = getHistory();
  list.unshift({ ...act, id: makeId(), timestamp: nowISO() });
  // 只保留最近 50 条
  if (list.length > 50) list.length = 50;
  setItem(KEYS.HISTORY, list);
}

export function logQuizAttempt(
  subject: string, correct: number, total: number,
  materialTitle?: string, resultData?: string,
) {
  addHistory({
    type: "quiz_attempt",
    summary: `刷题：${correct}/${total} 正确`,
    detail: `${subject || "未分类"} · ${total} 题 · 正确 ${correct} 题`,
    subject, materialTitle, resultData,
    score: { correct, total },
  });
}

export function logMindMapGenerated(subject: string, materialTitle?: string, resultData?: string) {
  addHistory({
    type: "mindmap_generated",
    summary: `生成思维导图`,
    detail: `${subject || "未分类"}${materialTitle ? ` · 材料：${materialTitle}` : ""}`,
    subject, materialTitle, resultData,
  });
}

export function logHotspotAnalyzed(subject: string, materialTitle?: string, resultData?: string) {
  addHistory({
    type: "hotspot_analyzed",
    summary: `热点分析`,
    detail: `${subject || "未分类"}${materialTitle ? ` · 材料：${materialTitle}` : ""}`,
    subject, materialTitle, resultData,
  });
}

export function logMaterialAdded(title: string) {
  addHistory({ type: "material_added", summary: `添加资料：${title}`, detail: today(), materialTitle: title });
}

export function clearHistory() { localStorage.removeItem(KEYS.HISTORY); }

// ═════════════════════════════ 4. 功能间材料桥梁 ═════════════════════════════

let bridgeCounter = 0;

export function bridgeMaterial(
  material: { title: string; content: string; subject: string },
  target: "quiz" | "mindmap" | "hotspot",
) {
  setItem(KEYS.BRIDGE, {
    material, target, consumed: false, id: `bridge_${Date.now()}_${++bridgeCounter}`,
  } satisfies PendingMaterialStored);
}

export function takeBridgedMaterial(): PendingMaterial | null {
  const raw = getItem<PendingMaterialStored | null>(KEYS.BRIDGE, null);
  if (!raw || raw.consumed) return null;
  raw.consumed = true;
  setItem(KEYS.BRIDGE, raw);
  return { material: raw.material, target: raw.target };
}

export function clearBridgedMaterial() {
  const raw = getItem<PendingMaterialStored | null>(KEYS.BRIDGE, null);
  if (raw?.consumed) localStorage.removeItem(KEYS.BRIDGE);
}

// ═════════════════════════════ 5. 页面状态持久化 ═════════════════════════════

interface PageState {
  [pageKey: string]: {
    [field: string]: string;
  };
}

export function savePageState(page: string, field: string, value: string) {
  const all = getItem<PageState>(KEYS.PAGE_STATE, {});
  if (!all[page]) all[page] = {};
  all[page][field] = value;
  setItem(KEYS.PAGE_STATE, all);
}

export function loadPageState(page: string, field: string, fallback = ""): string {
  const all = getItem<PageState>(KEYS.PAGE_STATE, {});
  return all[page]?.[field] ?? fallback;
}

export function clearPageState(page: string) {
  const all = getItem<PageState>(KEYS.PAGE_STATE, {});
  delete all[page];
  setItem(KEYS.PAGE_STATE, all);
}
