import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUserByEmail, createUser } from "@/lib/server/userStore";
import { signToken } from "@/lib/server/jwt";

export async function POST(req: NextRequest) {
  try {
    const { email, name, password } = await req.json();

    if (!email || !password || password.length < 6) {
      return NextResponse.json({ error: "邮箱和密码（至少6位）为必填" }, { status: 400 });
    }

    const existing = findUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "该邮箱已注册" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const profile = createUser(email, name || email.split("@")[0], hashed);
    const token = signToken({ userId: profile.id, email: profile.email });

    return NextResponse.json({ user: profile, token });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "注册失败" }, { status: 500 });
  }
}
