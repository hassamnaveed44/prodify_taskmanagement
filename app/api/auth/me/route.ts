import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";
import db from "@/lib/db";

// Helper to extract initials from user name (e.g. "Hassam Naveed" -> "HN")
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "U";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

export async function GET(req: NextRequest) {
  try {
    const accessToken = req.cookies.get("accessToken")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Not authenticated. Token is missing." },
        { status: 401 }
      );
    }

    const payload = await verifyAccessToken(accessToken);
    if (!payload) {
      return NextResponse.json(
        { error: "Not authenticated. Token is invalid or expired." },
        { status: 401 }
      );
    }

    // Fetch the workspace details to return its actual name/slug
    const workspace = await db.workspace.findUnique({
      where: { id: payload.workspaceId },
    });

    return NextResponse.json({
      status: "success",
      user: {
        id: payload.userId,
        email: payload.email,
        name: payload.name,
        initials: getInitials(payload.name),
      },
      workspace: {
        id: payload.workspaceId,
        name: workspace?.name || "Personal Workspace",
        slug: workspace?.slug || "personal-workspace",
        role: payload.role,
      },
    });
  } catch (error) {
    console.error("GET /api/auth/me failed:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred retrieving user details." },
      { status: 500 }
    );
  }
}
