import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";
import db from "@/lib/db";

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

    const { email } = await req.json();

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: "Email address is required." },
        { status: 400 }
      );
    }

    // 1. Find user by email in database
    const targetUser = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found. They must sign up for an account first." },
        { status: 404 }
      );
    }

    // 2. Check if already member of workspace
    const existingMembership = await db.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: payload.workspaceId,
          userId: targetUser.id,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: `${targetUser.name} is already a member of this workspace.` },
        { status: 400 }
      );
    }

    // 3. Add to workspace and join all existing teams/channels
    const newMember = await db.$transaction(async (tx) => {
      // Create Workspace Member
      const member = await tx.workspaceMember.create({
        data: {
          workspaceId: payload.workspaceId,
          userId: targetUser.id,
          role: "MEMBER",
        },
      });

      // Join all workspace teams/channels
      const teams = await tx.team.findMany({
        where: { workspaceId: payload.workspaceId },
      });

      for (const team of teams) {
        await tx.teamMember.create({
          data: {
            teamId: team.id,
            memberId: member.id,
          },
        });
      }

      // Join all workspace projects (optional, but ensures they see projects in sidebar!)
      const projects = await tx.project.findMany({
        where: { workspaceId: payload.workspaceId },
      });

      for (const project of projects) {
        await tx.projectMember.create({
          data: {
            projectId: project.id,
            memberId: member.id,
          },
        });
      }

      return member;
    });

    // 4. Trigger WebSocket warning/notification to alert workspace users
    if ((global as any).wss) {
      const wss = (global as any).wss;
      const broadcastMsg = JSON.stringify({
        type: "notification",
        message: `👤 ${targetUser.name} was added to the workspace by ${payload.name}!`,
      });
      wss.clients.forEach((client: any) => {
        if (client.readyState === 1 && client.workspaceId === payload.workspaceId) {
          client.send(broadcastMsg);
        }
      });
    }

    return NextResponse.json({
      status: "success",
      message: `${targetUser.name} was successfully invited to the workspace.`,
      member: {
        id: newMember.id,
        name: targetUser.name,
        email: targetUser.email,
      },
    });
  } catch (error) {
    console.error("POST /api/workspace/members failed:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred inviting workspace member." },
      { status: 500 }
    );
  }
}
