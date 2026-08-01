import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import db from "@/lib/db";
import { signAccessToken, signRefreshToken, setAuthCookies } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // 1. Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    // 2. Fetch User
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials." },
        { status: 401 }
      );
    }

    // 3. Verify Password
    const passwordMatch = await bcryptjs.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid credentials." },
        { status: 401 }
      );
    }

    // 4. Fetch User's First Workspace Membership
    const membership = await db.workspaceMember.findFirst({
      where: { userId: user.id },
      include: { workspace: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "This user does not belong to any workspace. Contact support." },
        { status: 403 }
      );
    }

    // 5. Generate Access and Refresh Tokens
    const accessToken = await signAccessToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      workspaceId: membership.workspaceId,
      role: membership.role,
    });

    const refreshTokenString = await signRefreshToken({ userId: user.id });

    // 6. Save Refresh Token in Database (Expires in 7 days)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.refreshToken.create({
      data: {
        token: refreshTokenString,
        userId: user.id,
        expiresAt,
      },
    });

    // 7. Prepare Response JSON
    const res = NextResponse.json({
      status: "success",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      workspace: {
        id: membership.workspace.id,
        name: membership.workspace.name,
        slug: membership.workspace.slug,
        role: membership.role,
      },
    });

    // 8. Set Auth Cookies
    setAuthCookies(res, accessToken, refreshTokenString);

    return res;
  } catch (error) {
    console.error("Login endpoint failed:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}
