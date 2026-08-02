export const dynamic = "force-dynamic";

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

    // 1. Fetch all projects in this workspace
    const projects = await db.project.findMany({
      where: { workspaceId: payload.workspaceId },
      include: {
        tasks: true,
      },
    });

    // 2. Fetch all members in this workspace
    const membersCount = await db.workspaceMember.count({
      where: { workspaceId: payload.workspaceId },
    });

    // 3. Fetch all tasks in the workspace projects
    const allTasks = await db.task.findMany({
      where: {
        projectId: { in: projects.map((p) => p.id) },
      },
    });

    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((t) => t.status === "COMPLETED").length;
    const inProgressTasks = allTasks.filter((t) => t.status === "IN_PROGRESS").length;
    const todoTasks = allTasks.filter((t) => t.status === "TODO").length;

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // 4. Group tasks by Project for comparison chart
    const projectData = projects.map((p) => {
      const projectTasks = allTasks.filter((t) => t.projectId === p.id);
      return {
        name: p.name,
        tasks: projectTasks.length,
        completed: projectTasks.filter((t) => t.status === "COMPLETED").length,
      };
    });

    // 5. Group tasks by Priority
    const highPriority = allTasks.filter((t) => t.priority === "HIGH").length;
    const mediumPriority = allTasks.filter((t) => t.priority === "MEDIUM").length;
    const lowPriority = allTasks.filter((t) => t.priority === "LOW").length;

    const priorityData = [
      { name: "High", count: highPriority },
      { name: "Medium", count: mediumPriority },
      { name: "Low", count: lowPriority },
    ];

    const statusData = [
      { name: "To Do", value: todoTasks },
      { name: "In Progress", value: inProgressTasks },
      { name: "Completed", value: completedTasks },
    ];

    // 6. Calculate weekly completions trend (last 7 days completions)
    // Map day names: Mon, Tue, Wed, Thu, Fri, Sat, Sun
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d;
    }).reverse();

    const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const weeklyTrendData = last7Days.map((date) => {
      const dateStr = date.toISOString().split("T")[0];
      const completionsCount = allTasks.filter((t) => {
        if (t.status !== "COMPLETED" || !t.updatedAt) return false;
        const completionDateStr = new Date(t.updatedAt).toISOString().split("T")[0];
        return completionDateStr === dateStr;
      }).length;

      return {
        name: weekdayNames[date.getDay()],
        Completed: completionsCount,
      };
    });

    // Count tasks that are upcoming (due date is in the future and not completed)
    const now = new Date();
    const upcomingTasksCount = allTasks.filter((t) => {
      return t.status !== "COMPLETED" && t.dueDate && new Date(t.dueDate) >= now;
    }).length;

    return NextResponse.json({
      status: "success",
      metrics: {
        completionRate,
        membersCount,
        upcomingTasksCount,
        totalTasks,
        completedTasks,
      },
      charts: {
        statusData,
        projectData,
        priorityData,
        weeklyTrendData,
      },
    });
  } catch (error) {
    console.error("GET /api/reports failed:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred loading analytics data." },
      { status: 500 }
    );
  }
}
