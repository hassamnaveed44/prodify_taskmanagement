import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";
import db from "@/lib/db";

// Helper to extract initials
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "U";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Helper for background colors
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

    // 1. Fetch user workspace membership
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

    // 2. Fetch all team channels in this workspace
    let teams = await db.team.findMany({
      where: { workspaceId: payload.workspaceId },
      orderBy: { createdAt: "asc" },
    });

    // 3. Fetch all other users registered in the system (for Direct Messaging DMs)
    const allUsers = await db.user.findMany({
      where: { id: { not: payload.userId } },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });

    // Determine query parameters
    const { searchParams } = new URL(req.url);
    const dmUserId = searchParams.get("dmUserId");

    // Case A: Load Direct Messages history (DM)
    if (dmUserId) {
      const dms = await db.directMessage.findMany({
        where: {
          OR: [
            { senderId: payload.userId, receiverId: dmUserId },
            { senderId: dmUserId, receiverId: payload.userId },
          ],
        },
        include: {
          sender: true,
        },
        orderBy: { createdAt: "asc" },
      });

      const formattedMessages = dms.map((m) => ({
        id: m.id,
        teamId: "",
        authorId: m.senderId,
        content: m.content,
        createdAt: m.createdAt,
        authorName: m.sender.name,
        authorInitials: getInitials(m.sender.name),
        authorColor: getAuthorColor(m.sender.name),
      }));

      return NextResponse.json({
        status: "success",
        currentUserMemberId: payload.userId, // Map memberId directly to userId in DMs
        currentUserName: payload.name,
        currentUserId: payload.userId,
        workspaceId: payload.workspaceId,
        activeTeamId: null,
        activeDmUserId: dmUserId,
        teams: teams.map((t) => ({ id: t.id, name: t.name })),
        users: allUsers,
        messages: formattedMessages,
      });
    }

    // Case B: Load Channel Messages (Default Team)
    if (teams.length === 0) {
      const defaultTeam = await db.$transaction(async (tx) => {
        const newTeam = await tx.team.create({
          data: {
            name: "General Chat",
            workspaceId: payload.workspaceId,
          },
        });

        const allWorkspaceMembers = await tx.workspaceMember.findMany({
          where: { workspaceId: payload.workspaceId },
        });

        for (const member of allWorkspaceMembers) {
          await tx.teamMember.create({
            data: {
              teamId: newTeam.id,
              memberId: member.id,
            },
          });
        }

        await tx.message.create({
          data: {
            teamId: newTeam.id,
            authorId: membership.id,
            content: "Welcome to the workspace General Chat channel! Start typing to message your team in real-time.",
          },
        });

        return newTeam;
      });

      teams = [defaultTeam];
    }

    const targetTeamId = searchParams.get("teamId") || teams[0]?.id;

    if (!targetTeamId) {
      return NextResponse.json({ error: "No channels available." }, { status: 404 });
    }

    const messages = await db.message.findMany({
      where: { teamId: targetTeamId },
      include: {
        author: {
          include: { user: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const formattedMessages = messages.map((m) => ({
      id: m.id,
      teamId: m.teamId,
      authorId: m.authorId,
      content: m.content,
      createdAt: m.createdAt,
      authorName: m.author.user.name,
      authorInitials: getInitials(m.author.user.name),
      authorColor: getAuthorColor(m.author.user.name),
    }));

    return NextResponse.json({
      status: "success",
      currentUserMemberId: membership.id,
      currentUserName: payload.name,
      currentUserId: payload.userId,
      workspaceId: payload.workspaceId,
      activeTeamId: targetTeamId,
      activeDmUserId: null,
      teams: teams.map((t) => ({ id: t.id, name: t.name })),
      users: allUsers,
      messages: formattedMessages,
    });
  } catch (error) {
    console.error("GET /api/inbox failed:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred loading chat transcripts." },
      { status: 500 }
    );
  }
}
