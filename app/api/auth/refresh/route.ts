import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { 
  verifyRefreshToken, 
  signAccessToken, 
  signRefreshToken, 
  setAuthCookies, 
  clearAuthCookies 
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const oldRefreshToken = req.cookies.get("refreshToken")?.value;

    if (!oldRefreshToken) {
      return NextResponse.json(
        { error: "Refresh token is missing." },
        { status: 401 }
      );
    }

    // 1. Verify token signature and expiration
    const decoded = await verifyRefreshToken(oldRefreshToken);
    if (!decoded) {
      const res = NextResponse.json({ error: "Invalid or expired refresh token." }, { status: 401 });
      clearAuthCookies(res);
      return res;
    }

    // 2. Query database to verify token status
    const dbToken = await db.refreshToken.findUnique({
      where: { token: oldRefreshToken },
    });

    if (!dbToken || dbToken.isRevoked || dbToken.expiresAt < new Date()) {
      // Replay attack or revoked token! Clear cookies for security.
      const res = NextResponse.json({ error: "Refresh token is revoked or expired." }, { status: 401 });
      clearAuthCookies(res);
      return res;
    }

    // 3. Fetch User and Workspace details
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      include: {
        memberships: {
          take: 1,
          include: { workspace: true },
        },
      },
    });

    if (!user || user.memberships.length === 0) {
      return NextResponse.json(
        { error: "User or workspace not found." },
        { status: 401 }
      );
    }

    const membership = user.memberships[0];

    // 4. Generate New Tokens (Rotation)
    const newAccessToken = await signAccessToken({
      userId: user.id,
      email: user.email,
      workspaceId: membership.workspaceId,
      role: membership.role,
    });

    const newRefreshTokenString = await signRefreshToken({ userId: user.id });

    // 5. Database Transactions: Revoke old token and log new rotated token
    await db.$transaction(async (tx) => {
      // Revoke the old token
      await tx.refreshToken.update({
        where: { id: dbToken.id },
        data: { isRevoked: true },
      });

      // Save the new token
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await tx.refreshToken.create({
        data: {
          token: newRefreshTokenString,
          userId: user.id,
          expiresAt,
        },
      });
    });

    // 6. Set new cookies and respond
    const res = NextResponse.json({
      status: "success",
      message: "Tokens rotated successfully.",
    });

    setAuthCookies(res, newAccessToken, newRefreshTokenString);

    return res;
  } catch (error) {
    console.error("Token refresh endpoint failed:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during token refresh." },
      { status: 500 }
    );
  }
}

// Support GET requests as well
export async function GET(req: NextRequest) {
  return POST(req);
}
