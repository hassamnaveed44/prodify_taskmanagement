import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";
import db from "@/lib/db";
import { TaskStatus, TaskPriority } from "@prisma/client";

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

    const { name, description, status, priority, dueDate, assigneeId } = await req.json();

    // Verify task exists and is within user's workspace
    const existingTask = await db.task.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existingTask || existingTask.project.workspaceId !== payload.workspaceId) {
      return NextResponse.json(
        { error: "Task not found or access denied." },
        { status: 404 }
      );
    }

    // Build update dataset
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status as TaskStatus;
    if (priority !== undefined) updateData.priority = priority as TaskPriority;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId;

    // Perform database update
    const updatedTask = await db.task.update({
      where: { id },
      data: updateData,
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
      
      let message = `📝 Task "${updatedTask.name}" details were updated by ${author}.`;
      if (status !== undefined) {
        if (status === "COMPLETED") {
          message = `✅ Task "${updatedTask.name}" was marked as COMPLETED by ${author}!`;
        } else {
          const statusLabel = status === "IN_PROGRESS" ? "In Progress" : status === "TODO" ? "To Do" : status.toLowerCase();
          message = `🔄 Task "${updatedTask.name}" status was moved to "${statusLabel}" by ${author}!`;
        }
      } else if (priority !== undefined) {
        message = `⚡ Task "${updatedTask.name}" priority was set to "${priority}" by ${author}!`;
      } else if (dueDate !== undefined) {
        message = `📅 Task "${updatedTask.name}" due date was updated by ${author}.`;
      }

      const broadcastMsg = JSON.stringify({
        type: "notification",
        message,
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
        id: updatedTask.id,
        name: updatedTask.name,
        description: updatedTask.description,
        status: updatedTask.status,
        priority: updatedTask.priority,
        dueDate: updatedTask.dueDate,
        projectName: updatedTask.project.name,
        projectSlug: updatedTask.project.slug,
        assignee: updatedTask.assignee?.user.name || null,
      },
    });
  } catch (error) {
    console.error("PATCH /api/tasks/[id] failed:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred updating task." },
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

    // Verify task exists and is within user's workspace
    const existingTask = await db.task.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existingTask || existingTask.project.workspaceId !== payload.workspaceId) {
      return NextResponse.json(
        { error: "Task not found or access denied." },
        { status: 404 }
      );
    }

    // Perform database deletion
    await db.task.delete({
      where: { id },
    });

    return NextResponse.json({
      status: "success",
      message: "Task deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE /api/tasks/[id] failed:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred deleting task." },
      { status: 500 }
    );
  }
}
