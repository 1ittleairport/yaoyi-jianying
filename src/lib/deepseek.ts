/**
 * DeepSeek API 客户端
 *
 * 【知识点简释】
 * 这个文件负责和 DeepSeek 的 AI 模型通信。
 * 你可以把它想象成一个"快递员"——
 *   我们把问题（prompt）交给它，它送到 DeepSeek 那边，
 *   等 DeepSeek 想好答案，再送回来给我们。
 *
 * 使用方式（以出题为例）：
 *   1. 调用 generateQuiz("上传的教材内容", "行政管理学")
 *   2. 得到 JSON 格式的题目列表
 *   3. 渲染到页面上给用户做
 */

// DeepSeek API 的地址（和 OpenAI 兼容）
const API_BASE = "https://api.deepseek.com/v1";
// 使用的模型版本（性价比最高的选择）
const MODEL = "deepseek-v4-flash";

/**
 * 向 DeepSeek 发送消息并获取回复
 * @param messages - 对话历史（数组形式，每条有 role 和 content）
 * @returns AI 回复的文本内容
 */
export async function chatCompletion(
  messages: { role: "system" | "user" | "assistant"; content: string }[]
): Promise<string> {
  // 从环境变量读取 API Key（安全，不会暴露给前端用户）
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    throw new Error("请先设置 DEEPSEEK_API_KEY 环境变量");
  }

  const res = await fetch(`${API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.7, // 0=严谨 1=创意，0.7 适合出题
      max_tokens: 4096, // 每次回复最大长度
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepSeek API 错误: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

/**
 * 从文本中提取 JSON（AI 有时会在 JSON 外面包一层 ``` 代码块）
 */
function extractJSON(text: string): string {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  return jsonMatch ? jsonMatch[1] : text;
}

// =============== 以下是专用功能函数 ===============

/**
 * 生成选择题（名词解释辨析版 —— 类似"不背单词"）
 */
export async function generateQuiz(
  material: string,
  subject: string
): Promise<QuizQuestion[]> {
  const prompt = `你是一个${subject}考研出题专家。请根据我给你的文本材料，严格按照要求生成题目。

## 要求
1. 不要回答任何无关内容，不要解释，不要提问
2. 只输出纯 JSON 数组，不要 markdown 代码块标记
3. 生成 5 道选择题，每个题目是一个核心名词/概念
4. 每个题给出 4 个选项，只有 1 个是正确的
5. 干扰项要逼真
6. 附上解析（为什么对、为什么错）

## 文本材料
${material.substring(0, 8000)}

## 输出格式（只输出这个数组，不要其他任何内容）
[{"question":"概念名称","options":["A","B","C","D"],"answer":0,"explanation":"解析"}]`;

  const text = await chatCompletion([
    { role: "system", content: "你是一个严格的JSON生成器。只输出纯JSON数组，不要任何说明文字、不要代码块、不要Markdown。" },
    { role: "user", content: prompt },
  ]);

  // 尝试多种方式提取 JSON
  const json = extractJSONStrict(text);
  try {
    return JSON.parse(json);
  } catch {
    console.error("AI 返回解析失败:", text);
    throw new Error("AI 返回格式异常，请重试");
  }
}

/** 更严格的 JSON 提取：逐级降级尝试 */
function extractJSONStrict(text: string): string {
  // 1. 尝试 ```json ... ```
  const block = text.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
  if (block) return block[1];
  // 2. 尝试找到 [ 开头，然后数花括号匹配到正确的 ]
  const startIdx = text.indexOf('[');
  if (startIdx !== -1) {
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = startIdx; i < text.length; i++) {
      const ch = text[i];
      if (escape) { escape = false; continue; }
      if (ch === '\\' && inString) { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (!inString) {
        if (ch === '[' || ch === '{') depth++;
        else if (ch === ']' || ch === '}') {
          depth--;
          if (ch === ']' && depth === 0) {
            return text.substring(startIdx, i + 1);
          }
        }
      }
    }
  }
  // 3. 原样返回
  return text;
}

/**
 * 生成思维导图结构
 *
 * 逻辑：让 AI 理解材料章节结构，输出层级化的知识树
 */
export async function generateMindMap(
  material: string
): Promise<MindMapNode> {
  const prompt = `请分析以下学习材料，生成一个层级化的思维导图结构。

要求：
1. 根节点为学科名称
2. 按章节/主题分为一级节点
3. 每级节点下展开 2-4 个子节点
4. 叶子节点标注"关键词"或"考点"

材料内容：
${material.substring(0, 8000)}

请以 JSON 格式返回：
{
  "title": "学科名称",
  "children": [
    {
      "title": "第一章标题",
      "children": [
        { "title": "知识点1", "children": [] },
        { "title": "知识点2", "children": [] }
      ]
    }
  ]
}`;

  const text = await chatCompletion([
    { role: "system", content: "你是一个知识图谱构建专家。请严格按 JSON 格式输出。" },
    { role: "user", content: prompt },
  ]);

  try {
    return JSON.parse(extractJSON(text));
  } catch {
    console.error("AI 返回解析失败:", text);
    throw new Error("AI 返回格式异常，请重试");
  }
}

/**
 * 联网热点 + 论述题分析
 *
 * 逻辑：给一个热点新闻 + 材料 + 分析角度，AI 输出多角度分析 + 预测考题
 */
export async function analyzeHotspot(params: {
  news: string;
  materialContext: string;
  subject: string;
  angles: string[];
}): Promise<HotspotAnalysis> {
  const prompt = `你是一个${params.subject}考研辅导专家。

## 热点新闻
${params.news}

## 材料背景
${params.materialContext.substring(0, 4000)}

## 分析要求
请从以下 ${params.angles.length} 个角度进行深入分析：
${params.angles.map((a, i) => `${i + 1}. ${a}`).join("\n")}

请返回 JSON 格式：
{
  "summary": "热点事件概述及与考试材料的关联",
  "angleAnalysis": [
    {
      "angle": "角度名称",
      "content": "该角度的详细分析",
      "materialCorrelation": "对应教材的哪个章节/知识点"
    }
  ],
  "possibleQuestions": [
    {
      "type": "论述题/案例分析题/材料分析题",
      "question": "预测题目",
      "analysisTips": "答题思路点拨"
    }
  ],
  "keywords": ["关键词1", "关键词2"]
}`;

  const text = await chatCompletion([
    { role: "system", content: "你是一个考研热点分析专家，善于结合理论知识分析时政热点。" },
    { role: "user", content: prompt },
  ]);

  try {
    return JSON.parse(extractJSON(text));
  } catch {
    console.error("AI 返回解析失败:", text);
    throw new Error("AI 返回格式异常，请重试");
  }
}

// =============== 类型定义 ===============

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;    // 正确答案索引 (0-3)
  explanation: string;
}

export interface MindMapNode {
  title: string;
  children: MindMapNode[];
}

export interface HotspotAnalysis {
  summary: string;
  angleAnalysis: {
    angle: string;
    content: string;
    materialCorrelation: string;
  }[];
  possibleQuestions: {
    type: string;
    question: string;
    analysisTips: string;
  }[];
  keywords: string[];
}
