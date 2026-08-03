import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";
import db from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
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

    const { completed } = await req.json();

    const existingGoal = await db.dailyGoal.findUnique({
      where: { id }
    });

    if (!existingGoal || existingGoal.workspaceId !== payload.workspaceId) {
      return NextResponse.json(
        { error: "Goal not found or access denied." },
        { status: 404 }
      );
    }

    const updated = await db.dailyGoal.update({
      where: { id },
      data: {
        completed: typeof completed === "boolean" ? completed : existingGoal.completed
      }
    });

    return NextResponse.json({
      status: "success",
      goal: updated
    });
  } catch (error) {
    console.error("PATCH /api/daily-goals/[id] failed:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred updating goal." },
      { status: 500 }
    );
  }
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

    const existingGoal = await db.dailyGoal.findUnique({
      where: { id }
    });

    if (!existingGoal || existingGoal.workspaceId !== payload.workspaceId) {
      return NextResponse.json(
        { error: "Goal not found or access denied." },
        { status: 404 }
      );
    }

    await db.dailyGoal.delete({
      where: { id }
    });

    return NextResponse.json({
      status: "success",
      message: "Goal deleted successfully."
    });
  } catch (error) {
    console.error("DELETE /api/daily-goals/[id] failed:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred deleting goal." },
      { status: 500 }
    );
  }
}
