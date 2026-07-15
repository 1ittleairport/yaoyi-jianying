import { NextResponse } from "next/server";
import { generateQuiz } from "@/lib/deepseek";

export async function POST(req: Request) {
  try {
    const { material, subject } = await req.json();

    if (!material || material.length < 50) {
      return NextResponse.json(
        { error: "材料内容太少，请至少提供 50 字的材料" },
        { status: 400 }
      );
    }

    const questions = await generateQuiz(material, subject || "未指定");
    return NextResponse.json({ questions });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "未知错误";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
