import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, signAccessToken } from "@/lib/auth";
import db from "@/lib/db";

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

    const { workspaceId } = await req.json();

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required." }, { status: 400 });
    }

    // 1. Verify user is a member of target workspace
    const membership = await db.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: payload.userId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Access denied. You are not a member of this workspace." },
        { status: 403 }
      );
    }

    // 2. Generate a new JWT Access Token containing updated workspaceId and role
    const newAccessToken = await signAccessToken({
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
      workspaceId,
      role: membership.role,
    });

    // 3. Set new access token cookie
    const response = NextResponse.json({
      status: "success",
      message: "Switched workspace successfully.",
    });

    response.cookies.set("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60, // 15 minutes
    });

    return response;
  } catch (error) {
    console.error("POST /api/workspace/switch failed:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred switching workspace." },
      { status: 500 }
    );
  }
}
