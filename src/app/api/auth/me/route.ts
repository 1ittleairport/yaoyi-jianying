import { NextRequest, NextResponse } from "next/server";
import { findUserById, toProfile } from "@/lib/server/userStore";
import { verifyToken } from "@/lib/server/jwt";

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
  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  return NextResponse.json({ user: toProfile(user) });
}
