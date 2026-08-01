import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { clearAuthCookies } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get("refreshToken")?.value;

    if (refreshToken) {
      // Revoke the refresh token in the database so it can never be used again
      await db.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { isRevoked: true },
      });
    }

    const res = NextResponse.json({
      status: "success",
      message: "Successfully logged out.",
    });

    // Clear cookies in the client browser
    clearAuthCookies(res);

    return res;
  } catch (error) {
    console.error("Logout endpoint failed:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during logout." },
      { status: 500 }
    );
  }
}

// Support GET requests as well for simple links
export async function GET(req: NextRequest) {
  return POST(req);
}
