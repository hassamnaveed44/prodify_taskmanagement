import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";
import db from "@/lib/db";
import { TaskStatus, TaskPriority } from "@prisma/client";

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

    const { name, projectId, description, status, priority, dueDate, assigneeId } = await req.json();

    if (!name || !projectId) {
      return NextResponse.json(
        { error: "Task name and projectId are required." },
        { status: 400 }
      );
    }

    // Verify project belongs to the user's workspace
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        workspaceId: payload.workspaceId,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or access denied." },
        { status: 404 }
      );
    }

    // Set default assignee to the logged-in user membership if no assignee is specified
    let targetAssigneeId = assigneeId;
    if (!targetAssigneeId) {
      const membership = await db.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: payload.workspaceId,
            userId: payload.userId,
          },
        },
      });
      if (membership) {
        targetAssigneeId = membership.id;
      }
    }

    // Create the task in PostgreSQL
    const createdTask = await db.task.create({
      data: {
        name,
        description: description || null,
        status: (status as TaskStatus) || TaskStatus.TODO,
        priority: (priority as TaskPriority) || TaskPriority.MEDIUM,
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assigneeId: targetAssigneeId || null,
      },
      include: {
        project: true,
        assignee: {
          include: { user: true },
        },
      },
    });

    // Trigger real-time WebSocket warning/notification
    if ((global as any).wss) {
      const wss = (global as any).wss;
      const author = payload.name || "A teammate";
      const broadcastMsg = JSON.stringify({
        type: "notification",
        message: `🎉 Task "${createdTask.name}" was added to "${createdTask.project.name}" by ${author}!`,
      });
      wss.clients.forEach((client: any) => {
        if (client.readyState === 1) { // OPEN
          client.send(broadcastMsg);
        }
      });
    }

    return NextResponse.json({
      status: "success",
      task: {
        id: createdTask.id,
        name: createdTask.name,
        description: createdTask.description,
        status: createdTask.status,
        priority: createdTask.priority,
        dueDate: createdTask.dueDate,
        projectName: createdTask.project.name,
        projectSlug: createdTask.project.slug,
        assignee: createdTask.assignee?.user.name || null,
      },
    });
  } catch (error) {
    console.error("POST /api/tasks failed:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred creating task." },
      { status: 500 }
    );
  }
}
