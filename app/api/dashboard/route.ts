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

    // 1. Fetch User Workspace Membership details
    const membership = await db.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: payload.workspaceId,
          userId: payload.userId,
        },
      },
      include: { workspace: true },
    });

    if (!membership) {
      return NextResponse.json({ error: "Workspace membership not found." }, { status: 403 });
    }

    // 2. Fetch Projects in this Workspace
    const projects = await db.project.findMany({
      where: { workspaceId: payload.workspaceId },
      include: {
        tasks: true,
        members: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Format projects to return task and member counts matching panel props
    const formattedProjects = projects.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      taskCount: p.tasks.length,
      memberCount: p.members.length,
      // Assign custom gradients matching Phase 1 mock styles
      color: p.slug === "product-launch" 
        ? "from-purple-500 to-indigo-600" 
        : p.slug === "team-brainstorm" 
          ? "from-blue-500 to-indigo-500" 
          : "from-teal-400 to-cyan-500",
    }));

    // 3. Fetch Tasks assigned to the logged-in WorkspaceMember
    const tasks = await db.task.findMany({
      where: {
        projectId: { in: projects.map(p => p.id) },
        assigneeId: membership.id,
      },
      include: {
        project: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    // 4. Fetch Goals linked to the projects
    const goals = await db.goal.findMany({
      where: { projectId: { in: projects.map(p => p.id) } },
      include: { project: true },
      orderBy: { percentage: "desc" },
    });

    return NextResponse.json({
      status: "success",
      workspace: {
        id: membership.workspace.id,
        name: membership.workspace.name,
        slug: membership.workspace.slug,
      },
      projects: formattedProjects,
      tasks: tasks.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        projectName: t.project.name,
        projectSlug: t.project.slug,
      })),
      goals: goals.map(g => ({
        id: g.id,
        title: g.title,
        percentage: g.percentage,
        projectName: g.project.name,
      })),
    });
  } catch (error) {
    console.error("GET /api/dashboard failed:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred loading dashboard datasets." },
      { status: 500 }
    );
  }
}
