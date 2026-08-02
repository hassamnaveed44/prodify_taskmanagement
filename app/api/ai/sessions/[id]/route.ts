export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";
import db from "@/lib/db";

// GET /api/ai/sessions/[id] - Load messages for a session
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessToken = req.cookies.get("accessToken")?.value;

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyAccessToken(accessToken);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: sessionId } = await params;

    const session = await db.chatSession.findUnique({
      where: { id: sessionId, userId: payload.userId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Chat session not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: "success",
      session: {
        id: session.id,
        title: session.title,
        messages: session.messages.map((m) => ({
          sender: m.sender.toLowerCase(), // "user" or "ai"
          text: m.content,
          createdAt: m.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("GET /api/ai/sessions/[id] failed:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred loading chat messages." },
      { status: 500 }
    );
  }
}

// DELETE /api/ai/sessions/[id] - Delete a chat session
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accessToken = req.cookies.get("accessToken")?.value;

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyAccessToken(accessToken);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: sessionId } = await params;

    await db.chatSession.delete({
      where: {
        id: sessionId,
        userId: payload.userId,
      },
    });

    return NextResponse.json({
      status: "success",
    });
  } catch (error) {
    console.error("DELETE /api/ai/sessions/[id] failed:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred deleting chat session." },
      { status: 500 }
    );
  }
}
