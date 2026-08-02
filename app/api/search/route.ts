import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

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

    const { searchParams } = req.nextUrl;
    const query = searchParams.get("q") || "";

    if (!query.trim()) {
      return NextResponse.json({ tasks: [], projects: [], members: [] });
    }

    // Get user's active workspace or first membership
    const member = await db.workspaceMember.findFirst({
      where: { userId: payload.userId },
      orderBy: { createdAt: "asc" }
    });

    if (!member) {
      return NextResponse.json({ tasks: [], projects: [], members: [] });
    }

    const workspaceId = member.workspaceId;

    // Search Projects
    const projects = await db.project.findMany({
      where: {
        workspaceId,
        name: { contains: query, mode: "insensitive" }
      },
      select: {
        id: true,
        name: true,
        slug: true
      },
      take: 5
    });

    const formattedProjects = projects.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      color: p.slug === "product-launch" 
        ? "bg-purple-500" 
        : p.slug === "team-brainstorm" 
          ? "bg-blue-500" 
          : "bg-teal-500"
    }));

    // Search Tasks in projects belonging to workspace
    const tasks = await db.task.findMany({
      where: {
        project: { workspaceId },
        name: { contains: query, mode: "insensitive" }
      },
      select: {
        id: true,
        name: true,
        status: true,
        priority: true,
        project: {
          select: {
            name: true,
            slug: true
          }
        }
      },
      take: 5
    });

    // Search Workspace Members
    const members = await db.workspaceMember.findMany({
      where: {
        workspaceId,
        user: {
          name: { contains: query, mode: "insensitive" }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      take: 5
    });

    const formattedMembers = members.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      initials: m.user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2)
    }));

    return NextResponse.json({
      tasks,
      projects: formattedProjects,
      members: formattedMembers
    });
  } catch (err) {
    console.error("Search API failure:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
