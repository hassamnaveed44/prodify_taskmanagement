import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";
import db from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const accessToken = req.cookies.get("accessToken")?.value;

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyAccessToken(accessToken);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify event exists and belongs to user's active workspace
    const existingEvent = await db.calendarEvent.findUnique({
      where: { id },
    });

    if (!existingEvent || existingEvent.workspaceId !== payload.workspaceId) {
      return NextResponse.json(
        { error: "Event not found or access denied." },
        { status: 404 }
      );
    }

    await db.calendarEvent.delete({
      where: { id },
    });

    return NextResponse.json({
      status: "success",
      message: "Event deleted successfully."
    });
  } catch (error) {
    console.error("DELETE /api/calendar-events/[id] failed:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred deleting event." },
      { status: 500 }
    );
  }
}
