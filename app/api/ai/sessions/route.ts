export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";
import db from "@/lib/db";

// GET /api/ai/sessions - Retrieve all past chat sessions for user
export async function GET(req: NextRequest) {
  try {
    const accessToken = req.cookies.get("accessToken")?.value;

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyAccessToken(accessToken);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await db.chatSession.findMany({
      where: { userId: payload.userId },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      status: "success",
      sessions: sessions.map((s) => ({
        id: s.id,
        title: s.title,
        createdAt: s.createdAt,
      })),
    });
  } catch (error) {
    console.error("GET /api/ai/sessions failed:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred loading chat sessions." },
      { status: 500 }
    );
  }
}
