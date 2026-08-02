import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";
import db from "@/lib/db";

// Helper to extract initials from user name
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "U";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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

    // Fetch the current active workspace details
    const workspace = await db.workspace.findUnique({
      where: { id: payload.workspaceId },
    });

    // Fetch projects in the active workspace
    const dbProjects = await db.project.findMany({
      where: { workspaceId: payload.workspaceId },
      orderBy: { createdAt: "asc" },
    });

    // Assign consistent color values
    const sidebarProjects = dbProjects.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      color: p.slug === "product-launch"
        ? "bg-indigo-600"
        : p.slug === "team-brainstorm"
          ? "bg-indigo-650"
          : p.slug === "branding-launch"
            ? "bg-teal-500"
            : "bg-purple-500", // Fallback color
    }));

    // Fetch all workspaces this user is a member of (invitations/switches)
    const memberships = await db.workspaceMember.findMany({
      where: { userId: payload.userId },
      include: { workspace: true },
    });

    const userWorkspaces = memberships.map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      slug: m.workspace.slug,
      role: m.role,
    }));

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
      projects: sidebarProjects,
      workspaces: userWorkspaces, // Include all workspaces they can switch to
    });
  } catch (error) {
    console.error("GET /api/auth/me failed:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred retrieving user details." },
      { status: 500 }
    );
  }
}
