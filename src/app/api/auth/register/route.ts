import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = typeof body?.username === "string" ? body.username.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const name = typeof body?.name === "string" ? body.name.trim() : "";

    if (!username || username.length < 3 || username.length > 32) {
      return NextResponse.json({ error: "用户名长度需为 3-32 位" }, { status: 400 });
    }

    if (!password || password.length < 6 || password.length > 128) {
      return NextResponse.json({ error: "密码长度需为 6-128 位" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: "用户名已被占用" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        username,
        name: name || username,
        passwordHash,
      },
      select: { id: true, username: true, name: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "注册失败" }, { status: 500 });
  }
}
