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

    const { name } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Project name is required." },
        { status: 400 }
      );
    }

    // Generate unique slug for project in this workspace
    const baseSlug = name.toLowerCase().trim().replace(/[^a-z0-9]/g, "-");
    
    // Check if slug exists in workspace, append numeric suffix if it does
    const existingProject = await db.project.findFirst({
      where: {
        slug: baseSlug,
        workspaceId: payload.workspaceId,
      },
    });

    const finalSlug = existingProject
      ? `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`
      : baseSlug;

    // Create Project inside transaction
    const newProject = await db.$transaction(async (tx) => {
      // 1. Create project
      const createdProj = await tx.project.create({
        data: {
          name: name.trim(),
          slug: finalSlug,
          workspaceId: payload.workspaceId,
        },
      });

      // 2. Fetch logged in workspace member id to make them project member
      const membership = await tx.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: payload.workspaceId,
            userId: payload.userId,
          },
        },
      });

      if (membership) {
        // 3. Add as project member
        await tx.projectMember.create({
          data: {
            projectId: createdProj.id,
            memberId: membership.id,
          },
        });
      }

      return createdProj;
    });

    return NextResponse.json({
      status: "success",
      project: {
        id: newProject.id,
        name: newProject.name,
        slug: newProject.slug,
      },
    });
  } catch (error) {
    console.error("POST /api/projects failed:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred creating project." },
      { status: 500 }
    );
  }
}
