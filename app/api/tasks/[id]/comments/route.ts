import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";
import db from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: taskId } = await params;
    const accessToken = req.cookies.get("accessToken")?.value;

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyAccessToken(accessToken);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify task exists and is within user's workspace
    const task = await db.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task || task.project.workspaceId !== payload.workspaceId) {
      return NextResponse.json(
        { error: "Task not found or access denied." },
        { status: 404 }
      );
    }

    const comments = await db.taskComment.findMany({
      where: { taskId },
      include: {
        author: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "asc" }
    });

    return NextResponse.json({
      status: "success",
      comments: comments.map(c => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt,
        authorName: c.author.user.name,
        authorEmail: c.author.user.email,
        authorInitials: c.author.user.name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)
      }))
    });
  } catch (error) {
    console.error("GET /api/tasks/[id]/comments failed:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred loading comments." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: taskId } = await params;
    const accessToken = req.cookies.get("accessToken")?.value;

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyAccessToken(accessToken);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content } = await req.json();
    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Comment content is required." },
        { status: 400 }
      );
    }

    // Verify task exists and is within user's workspace
    const task = await db.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task || task.project.workspaceId !== payload.workspaceId) {
      return NextResponse.json(
        { error: "Task not found or access denied." },
        { status: 404 }
      );
    }

    // Get user's workspace membership
    const membership = await db.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: payload.workspaceId,
          userId: payload.userId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Workspace membership not found." },
        { status: 403 }
      );
    }

    const comment = await db.taskComment.create({
      data: {
        taskId,
        content: content.trim(),
        authorId: membership.id
      },
      include: {
        author: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      status: "success",
      comment: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        authorName: comment.author.user.name,
        authorEmail: comment.author.user.email,
        authorInitials: comment.author.user.name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)
      }
    });
  } catch (error) {
    console.error("POST /api/tasks/[id]/comments failed:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred adding comment." },
      { status: 500 }
    );
  }
}
