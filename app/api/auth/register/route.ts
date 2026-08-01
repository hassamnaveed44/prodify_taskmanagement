import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import db from "@/lib/db";
import { signAccessToken, signRefreshToken, setAuthCookies } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    // 1. Basic validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // 2. Check if email exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered." },
        { status: 400 }
      );
    }

    // 3. Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // 4. Database Transaction to guarantee all or nothing
    // Creates User, default Workspace, and WorkspaceMember
    const { user, workspace, member } = await db.$transaction(async (tx) => {
      // Create user
      const createdUser = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          name,
        },
      });

      // Generate unique slug for workspace
      const baseSlug = `${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-workspace`;
      // Check if slug exists, append random suffix if it does
      const slugExists = await tx.workspace.findUnique({ where: { slug: baseSlug } });
      const finalSlug = slugExists 
        ? `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}` 
        : baseSlug;

      // Create default workspace
      const createdWorkspace = await tx.workspace.create({
        data: {
          name: `${name}'s Workspace`,
          slug: finalSlug,
          ownerId: createdUser.id,
        },
      });

      // Join owner workspace membership
      const createdMember = await tx.workspaceMember.create({
        data: {
          workspaceId: createdWorkspace.id,
          userId: createdUser.id,
          role: "OWNER",
        },
      });

      return { user: createdUser, workspace: createdWorkspace, member: createdMember };
    });

    // 5. Generate and Sign Tokens
    const accessToken = await signAccessToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      workspaceId: workspace.id,
      role: member.role,
    });

    const refreshTokenString = await signRefreshToken({ userId: user.id });

    // 6. Save Refresh Token in Database
    // Set expiry to 7 days
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.refreshToken.create({
      data: {
        token: refreshTokenString,
        userId: user.id,
        expiresAt,
      },
    });

    // 7. Prepare response
    const res = NextResponse.json({
      status: "success",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        role: member.role,
      },
    });

    // 8. Set secure cookies
    setAuthCookies(res, accessToken, refreshTokenString);

    return res;
  } catch (error) {
    console.error("Registration endpoint failed:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during registration." },
      { status: 500 }
    );
  }
}
