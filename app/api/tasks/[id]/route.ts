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
