import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdminAuth } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

const checkAdmin = checkAdminAuth;

export async function GET() {
  try {
    const holidays = await prisma.holiday.findMany({ orderBy: { date: "asc" } });
    return NextResponse.json(holidays);
  } catch (e) {
    console.error("holidays-get error:", e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  const { date, name } = await request.json();
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "日付形式が不正です (YYYY-MM-DD)" }, { status: 400 });
  }
  if (name && name.length > 100) {
    return NextResponse.json({ error: "名称は100文字以内にしてください" }, { status: 400 });
  }
  try {
    const holiday = await prisma.holiday.upsert({
      where: { date },
      update: { name: name || "" },
      create: { date, name: name || "" },
    });
    return NextResponse.json(holiday);
  } catch (e) {
    console.error("holidays-post error:", e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await checkAdmin())) return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  const { date } = await request.json();
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "日付形式が不正です (YYYY-MM-DD)" }, { status: 400 });
  }
  try {
    await prisma.holiday.delete({ where: { date } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("holidays-delete error:", e);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
