import { NextRequest, NextResponse } from "next/server";
import { findUserById, getUserData, saveUserData } from "@/lib/server/userStore";
import { verifyToken } from "@/lib/server/jwt";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const payload = verifyToken(auth.slice(7));
  if (!payload) {
    return NextResponse.json({ error: "登录已过期" }, { status: 401 });
  }

  const user = await findUserById(payload.userId);
  if (!user) return NextResponse.json({ error: "用户不存在" }, { status: 404 });

  try {
    const { data } = await req.json();
    await saveUserData(payload.userId, data || {});
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "数据格式错误" }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const payload = verifyToken(auth.slice(7));
  if (!payload) {
    return NextResponse.json({ error: "登录已过期" }, { status: 401 });
  }

  const user = await findUserById(payload.userId);
  if (!user) return NextResponse.json({ error: "用户不存在" }, { status: 404 });

  const data = await getUserData(payload.userId);
  return NextResponse.json({ data });
}
