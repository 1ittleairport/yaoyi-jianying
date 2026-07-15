import { NextResponse } from "next/server";
import { analyzeHotspot } from "@/lib/deepseek";

export async function POST(req: Request) {
  try {
    const { news, materialContext, subject, angles } = await req.json();

    if (!news) {
      return NextResponse.json({ error: "请提供热点新闻内容" }, { status: 400 });
    }

    const defaultAngles = [
      "政府角度（政策制定与执行）",
      "企业角度（营商环境与市场反应）",
      "社会组织角度（协同治理）",
      "基层治理角度",
      "中央与地方关系角度",
      "法律角度（法律法规与合规）",
      "个人品德与职业道德角度",
    ];

    const result = await analyzeHotspot({
      news,
      materialContext: materialContext || "",
      subject: subject || "未指定",
      angles: angles || defaultAngles,
    });

    return NextResponse.json(result);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "未知错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
