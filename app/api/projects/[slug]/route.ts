import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";
import db from "@/lib/db";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const accessToken = req.cookies.get("accessToken")?.value;

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyAccessToken(accessToken);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch Project matching slug inside user's workspace
    const project = await db.project.findFirst({
      where: {
        slug,
        workspaceId: payload.workspaceId,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    // 2. Fetch Tasks in Project with assignee detail joins
    const tasks = await db.task.findMany({
      where: { projectId: project.id },
      include: {
        assignee: {
          include: { user: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // 3. Fetch Teammates/Members linked to this Project
    const projectMembers = await db.projectMember.findMany({
      where: { projectId: project.id },
      include: {
        member: {
          include: { user: true },
        },
      },
    });

    // Format teammates data to match frontend layout structure
    const teammates = projectMembers.map((pm) => {
      const u = pm.member.user;
      // Get initials
      const nameParts = u.name.trim().split(/\s+/);
      const initials = nameParts.length > 1 
        ? (nameParts[0]![0] + nameParts[nameParts.length - 1]![0]).toUpperCase()
        : u.name.substring(0, 2).toUpperCase();

      // Color maps
      const colors = ["bg-indigo-600", "bg-orange-500", "bg-emerald-500", "bg-pink-500", "bg-purple-500", "bg-blue-500"];
      const charCodeSum = u.name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const color = colors[charCodeSum % colors.length] || "bg-slate-400";

      return {
        id: pm.member.id,
        name: u.name,
        email: u.email,
        initials,
        color,
      };
    });

    // Format tasks lists
    const formattedTasks = tasks.map((t) => {
      const assigneeName = t.assignee?.user.name || null;
      
      // Determine assignee initials and color
      let initials = "U";
      let assigneeColor = "bg-slate-400";
      if (t.assignee?.user) {
        const u = t.assignee.user;
        const nameParts = u.name.trim().split(/\s+/);
        initials = nameParts.length > 1 
          ? (nameParts[0]![0] + nameParts[nameParts.length - 1]![0]).toUpperCase()
          : u.name.substring(0, 2).toUpperCase();

        const colors = ["bg-indigo-600", "bg-orange-500", "bg-emerald-500", "bg-pink-500", "bg-purple-500", "bg-blue-500"];
        const charCodeSum = u.name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
        assigneeColor = colors[charCodeSum % colors.length] || "bg-slate-400";
      }

      return {
        id: t.id,
        name: t.name,
        description: t.description,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        assignee: assigneeName,
        assigneeInitials: initials,
        assigneeColor,
      };
    });

    return NextResponse.json({
      status: "success",
      project: {
        id: project.id,
        name: project.name,
        slug: project.slug,
        categoryTitle: project.slug === "product-launch" 
          ? "Product Development Goals" 
          : project.slug === "team-brainstorm" 
            ? "Sprint Backlog Goals" 
            : "Marketing & Visual Goals",
        color: project.slug === "product-launch" 
          ? "from-purple-500 to-indigo-600" 
          : project.slug === "team-brainstorm" 
            ? "from-blue-500 to-indigo-500" 
            : "from-teal-400 to-cyan-500",
      },
      tasks: formattedTasks,
      teammates,
    });
  } catch (error) {
    console.error("GET /api/projects/[slug] failed:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred loading project details." },
      { status: 500 }
    );
  }
}
