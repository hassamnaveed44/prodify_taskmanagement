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

    // Retrieve daily goals for today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const goals = await db.dailyGoal.findMany({
      where: {
        workspaceId: payload.workspaceId,
        date: {
          gte: startOfToday,
          lte: endOfToday
        }
      },
      orderBy: { createdAt: "asc" }
    });

    return NextResponse.json({
      status: "success",
      goals: goals.map(g => ({
        id: g.id,
        title: g.title,
        completed: g.completed,
        date: g.date
      }))
    });
  } catch (error) {
    console.error("GET /api/daily-goals failed:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred loading goals." },
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

    const { title } = await req.json();

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Title is required." },
        { status: 400 }
      );
    }

    const goal = await db.dailyGoal.create({
      data: {
        title: title.trim(),
        workspaceId: payload.workspaceId
      }
    });

    return NextResponse.json({
      status: "success",
      goal: {
        id: goal.id,
        title: goal.title,
        completed: goal.completed,
        date: goal.date
      }
    });
  } catch (error) {
    console.error("POST /api/daily-goals failed:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred creating goal." },
      { status: 500 }
    );
  }
}
