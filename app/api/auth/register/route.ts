import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import db from "@/lib/db";

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
    await db.$transaction(async (tx) => {
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
      await tx.workspaceMember.create({
        data: {
          workspaceId: createdWorkspace.id,
          userId: createdUser.id,
          role: "OWNER",
        },
      });
    });

    // 5. Prepare success response WITHOUT auto-logging in or setting session cookies
    return NextResponse.json({
      status: "success",
      message: "User registered successfully. Please proceed to login.",
    });

  } catch (error) {
    console.error("Registration endpoint failed:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during registration." },
      { status: 500 }
    );
  }
}
