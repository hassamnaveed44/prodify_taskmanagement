import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";
import db from "@/lib/db";

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

    const events = await db.calendarEvent.findMany({
      where: { workspaceId: payload.workspaceId },
      orderBy: { date: "asc" }
    });

    return NextResponse.json({
      status: "success",
      events: events.map(e => ({
        id: e.id,
        title: e.title,
        description: e.description,
        date: e.date,
      }))
    });
  } catch (error) {
    console.error("GET /api/calendar-events failed:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred loading calendar events." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const accessToken = req.cookies.get("accessToken")?.value;

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyAccessToken(accessToken);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description, date } = await req.json();

    if (!title || !title.trim() || !date) {
      return NextResponse.json(
        { error: "Title and date are required." },
        { status: 400 }
      );
    }

    const createdEvent = await db.calendarEvent.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        date: (() => {
          const d = new Date(date);
          if (d.getFullYear() < 2020) d.setFullYear(2026);
          return d;
        })(),
        workspaceId: payload.workspaceId
      }
    });

    return NextResponse.json({
      status: "success",
      event: {
        id: createdEvent.id,
        title: createdEvent.title,
        description: createdEvent.description,
        date: createdEvent.date,
      }
    });
  } catch (error) {
    console.error("POST /api/calendar-events failed:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred creating calendar event." },
      { status: 500 }
    );
  }
}
