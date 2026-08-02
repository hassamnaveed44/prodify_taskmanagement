import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";
import db from "@/lib/db";

// Helper to get name initials
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "U";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Helper to get consistent background colors
function getAuthorColor(name: string): string {
  const colors = [
    "bg-indigo-650",
    "bg-orange-500",
    "bg-emerald-500",
    "bg-pink-500",
    "bg-purple-500",
    "bg-blue-500",
  ];
  const charCodeSum = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[charCodeSum % colors.length] || "bg-slate-400";
}

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

    const { teamId, receiverId, content } = await req.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Message content is required." }, { status: 400 });
    }

    // Case A: Send Direct Message (DM)
    if (receiverId) {
      const createdDm = await db.directMessage.create({
        data: {
          senderId: payload.userId,
          receiverId,
          content: content.trim(),
        },
        include: {
          sender: true,
        },
      });

      const formattedMessage = {
        id: createdDm.id,
        teamId: "",
        authorId: createdDm.senderId,
        content: createdDm.content,
        createdAt: createdDm.createdAt,
        authorName: createdDm.sender.name,
        authorInitials: getInitials(createdDm.sender.name),
        authorColor: getAuthorColor(createdDm.sender.name),
      };

      // Broadcast via WebSocket strictly to receiver and sender clients
      if ((global as any).wss) {
        const wss = (global as any).wss;
        const broadcastData = JSON.stringify({
          type: "dm",
          message: {
            id: createdDm.id,
            senderId: createdDm.senderId,
            receiverId: createdDm.receiverId,
            content: createdDm.content,
            createdAt: createdDm.createdAt,
            authorName: createdDm.sender.name,
            authorInitials: getInitials(createdDm.sender.name),
            authorColor: getAuthorColor(createdDm.sender.name),
          },
        });

        wss.clients.forEach((client: any) => {
          if (client.readyState === 1 && (client.userId === receiverId || client.userId === payload.userId)) {
            client.send(broadcastData);
          }
        });
      }

      return NextResponse.json({
        status: "success",
        message: formattedMessage,
      });
    }

    // Case B: Send Channel Message (Team Group Chat)
    if (!teamId) {
      return NextResponse.json({ error: "Either teamId or receiverId is required." }, { status: 400 });
    }

    // Get active workspace membership
    const membership = await db.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: payload.workspaceId,
          userId: payload.userId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Workspace membership not found." }, { status: 403 });
    }

    // Write message to database
    const createdMessage = await db.message.create({
      data: {
        teamId,
        authorId: membership.id,
        content: content.trim(),
      },
      include: {
        author: {
          include: { user: true },
        },
      },
    });

    const formattedMessage = {
      id: createdMessage.id,
      teamId: createdMessage.teamId,
      authorId: createdMessage.authorId,
      content: createdMessage.content,
      createdAt: createdMessage.createdAt,
      authorName: createdMessage.author.user.name,
      authorInitials: getInitials(createdMessage.author.user.name),
      authorColor: getAuthorColor(createdMessage.author.user.name),
    };

    // Broadcast to other WebSocket clients if global.wss is running
    if ((global as any).wss) {
      const wss = (global as any).wss;
      const broadcastData = JSON.stringify({
        type: "message",
        message: formattedMessage,
      });
      wss.clients.forEach((client: any) => {
        // Only send to clients who are actively viewing this team room
        if (client.readyState === 1 && client.teamId === teamId) {
          client.send(broadcastData);
        }
      });
    }

    return NextResponse.json({
      status: "success",
      message: formattedMessage,
    });
  } catch (error) {
    console.error("POST /api/inbox/messages failed:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred sending message." },
      { status: 500 }
    );
  }
}
