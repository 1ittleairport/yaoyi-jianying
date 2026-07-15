"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { MindMapNode } from "@/lib/deepseek";

/* ─── 尺寸常量 ─── */
const NODE_W = 160;
const NODE_H = 44;
const LEVEL_GAP = 72;   // 垂直间距
const SIBLING_GAP = 16; // 水平间距
const PAD = 40;

/* ─── 布局节点 ─── */
interface LayoutNode {
  id: string;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  depth: number;
  hasChildren: boolean;
  expanded: boolean;
}

interface LayoutEdge {
  x1: number; y1: number;
  x2: number; y2: number;
}

/**
 * 自上而下的居中树布局算法
 * 根节点在最上方居中，子节点水平排开在父节点下方居中
 */
function calcLayout(
  root: MindMapNode,
  expanded: Set<string>,
): { nodes: LayoutNode[]; edges: LayoutEdge[]; svgW: number; svgH: number } {
  const nodes: LayoutNode[] = [];
  const edges: LayoutEdge[] = [];
  let maxX = 0;
  let maxY = 0;

  /** 返回子树总宽度 */
  function walk(node: MindMapNode, depth: number, parentCX: number | null): number {
    const id = node.title + depth;
    const isExpanded = expanded.has(id);
    const hc = node.children?.length > 0;

    let myW = NODE_W;

    if (isExpanded && hc) {
      // 先递归计算所有子节点的宽度
      const childWidths = node.children!.map((c) => walk(c, depth + 1, null));
      const totalChildW = childWidths.reduce((a, b) => a + b, 0) + (node.children!.length - 1) * SIBLING_GAP;
      myW = Math.max(NODE_W, totalChildW);
    }

    // 计算本节点位置
    let x: number;
    if (parentCX === null) {
      x = 0; // 根节点或未知→后面统一居中
    } else {
      x = parentCX - myW / 2;
    }

    const y = depth * (NODE_H + LEVEL_GAP);
    nodes.push({ id, title: node.title, x, y, w: NODE_W, h: NODE_H, depth, hasChildren: hc, expanded: isExpanded });

    if (x + myW > maxX) maxX = x + myW;
    if (y + NODE_H > maxY) maxY = y + NODE_H;

    // 放置子节点（如果展开）
    if (isExpanded && hc) {
      const cx = x + myW / 2; // 本节点中心
      const childY = (depth + 1) * (NODE_H + LEVEL_GAP);
      const childWidths = node.children!.map((c) => {
        const w = calcSubtreeWidth(c, expanded, new Map());
        return w;
      });
      const totalW = childWidths.reduce((a, b) => a + b, 0) + (node.children!.length - 1) * SIBLING_GAP;
      const left = cx - totalW / 2;

      let accX = left;
      node.children!.forEach((child, i) => {
        const childW = childWidths[i];
        const childCX = accX + childW / 2;
        const childY2 = childY;

        // 更新刚才 push 的节点位置
        const childId = child.title + (depth + 1);
        const existingIdx = nodes.findIndex((n) => n.id === childId);
        if (existingIdx >= 0) {
          nodes[existingIdx].x = accX + (childW - NODE_W) / 2;
        }

        edges.push({
          x1: cx, y1: y + NODE_H,
          x2: childCX, y2: childY2,
        });

        // 递归放子节点的子节点
        if (expanded.has(childId) && child.children?.length) {
          placeChildren(child, depth + 1, childCX, expanded);
        }

        accX += childW + SIBLING_GAP;
      });
    }

    return myW;
  }

  /** 把子节点的子节点位置补上（递归） */
  function placeChildren(node: MindMapNode, depth: number, parentCX: number, expanded: Set<string>) {
    if (!node.children?.length) return;
    const id = node.title + depth;
    if (!expanded.has(id)) return;

    const childWidths = node.children.map((c) => calcSubtreeWidth(c, expanded, new Map()));
    const totalW = childWidths.reduce((a, b) => a + b, 0) + (node.children.length - 1) * SIBLING_GAP;
    const left = parentCX - totalW / 2;
    const childY2 = (depth + 1) * (NODE_H + LEVEL_GAP);

    let accX = left;
    node.children.forEach((child, i) => {
      const childW = childWidths[i];
      const childCX = accX + childW / 2;
      const childId = child.title + (depth + 1);

      const idx = nodes.findIndex((n) => n.id === childId);
      if (idx >= 0) {
        nodes[idx].x = accX + (childW - NODE_W) / 2;
        nodes[idx].y = childY2;
      }

      edges.push({
        x1: parentCX, y1: depth * (NODE_H + LEVEL_GAP) + NODE_H,
        x2: childCX, y2: childY2,
      });

      if (expanded.has(childId) && child.children?.length) {
        placeChildren(child, depth + 1, childCX, expanded);
      }
      accX += childW + SIBLING_GAP;
    });
  }

  walk(root, 0, null);

  // 将所有节点平移到非负坐标
  const minX = Math.min(...nodes.map((n) => n.x));
  const shiftX = -Math.min(0, minX) + PAD;
  const shiftY = PAD;

  nodes.forEach((n) => { n.x += shiftX; n.y += shiftY; });
  edges.forEach((e) => { e.x1 += shiftX; e.y1 += shiftY; e.x2 += shiftX; e.y2 += shiftY; });

  const svgW = Math.max(...nodes.map((n) => n.x + n.w)) + PAD;
  const svgH = Math.max(...nodes.map((n) => n.y + n.h)) + PAD;

  return { nodes, edges, svgW, svgH };
}

/** 计算子树宽度（含所有展开的后代） */
function calcSubtreeWidth(node: MindMapNode, expanded: Set<string>, memo: Map<string, number>): number {
  const id = node.title + "_w";
  if (memo.has(id)) return memo.get(id)!;
  if (!node.children?.length || !expanded.has(node.title + (0))) return NODE_W;
  const childW = node.children.reduce((sum, c) => sum + calcSubtreeWidth(c, expanded, memo), 0);
  const gaps = (node.children.length - 1) * SIBLING_GAP;
  const total = Math.max(NODE_W, childW + gaps);
  memo.set(id, total);
  return total;
}

/** 收集所有节点 ID（用于展开/折叠） */
function collectAllIds(node: MindMapNode, depth = 0, set = new Set<string>()): Set<string> {
  set.add(node.title + depth);
  if (node.children) node.children.forEach((c) => collectAllIds(c, depth + 1, set));
  return set;
}

/* ════════════════════════════════════════
   组件
   ════════════════════════════════════════ */
export default function MindMapVisual({ root }: { root: MindMapNode }) {
  const allIds = collectAllIds(root);
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    // 默认展开前 2 层
    const s = new Set<string>();
    allIds.forEach((id) => {
      const depth = parseInt(id.split(/(\d+)$/).filter(Boolean).pop() || "0", 10);
      if (depth <= 1) s.add(id);
    });
    return s;
  });

  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const layout = calcLayout(root, expanded);

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <div className="overflow-auto py-4" style={{ minHeight: 200 }}>
      <div className="relative mx-auto" style={{ width: layout.svgW, height: layout.svgH }}>
        {/* 连接线 */}
        <svg className="absolute inset-0 pointer-events-none" width={layout.svgW} height={layout.svgH}>
          {layout.edges.map((e, i) => {
            const midY = (e.y1 + e.y2) / 2;
            // 三步折线：竖→横→竖
            return (
              <path
                key={i}
                d={`M ${e.x1} ${e.y1}
                    L ${e.x1} ${midY}
                    L ${e.x2} ${midY}
                    L ${e.x2} ${e.y2}`}
                fill="none"
                stroke="#d4cfc9"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}
        </svg>

        {/* 节点 */}
        {layout.nodes.map((n) => {
          const isHovered = hoveredId === n.id;
          const isLeaf = !n.hasChildren;
          return (
            <div
              key={n.id}
              className="absolute cursor-pointer select-none transition-all duration-200"
              style={{ left: n.x, top: n.y, width: n.w, height: n.h }}
              onClick={() => !isLeaf && toggle(n.id)}
              onMouseEnter={() => setHoveredId(n.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div
                className={`
                  flex items-center justify-between w-full h-full px-3 text-sm border transition-all
                  ${n.depth === 0
                    ? "border-[#2c2b28] bg-white font-medium text-[#2c2b28]"
                    : n.depth === 1
                    ? "border-[var(--border)] bg-white text-[#2c2b28]"
                    : "border-[var(--border-light)] bg-[var(--card)] text-[var(--text-secondary)]"
                  }
                  ${isHovered && !isLeaf ? "shadow-sm border-[var(--text-secondary)]" : ""}
                  ${isLeaf ? "opacity-80 border-dashed" : ""}
                `}
                style={{ borderRadius: 8 }}
              >
                <span className="truncate text-xs leading-tight flex-1 mr-1">
                  {n.title}
                </span>
                {!isLeaf && (
                  <span className={`flex-shrink-0 text-[10px] transition-transform duration-200 ${n.expanded ? "rotate-180" : ""}`}
                    style={{ color: "var(--text-tertiary)" }}>
                    ▼
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
