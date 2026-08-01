import * as jose from "jose";
import { NextResponse } from "next/server";

const getAccessSecret = () => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET is not configured.");
  return new TextEncoder().encode(secret);
};

const getRefreshSecret = () => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error("JWT_REFRESH_SECRET is not configured.");
  return new TextEncoder().encode(secret);
};

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  workspaceId: string;
  role: string;
}

// 1. Sign Access Token (15 mins)
export async function signAccessToken(payload: JWTPayload): Promise<string> {
  const secret = getAccessSecret();
  return await new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secret);
}

// 2. Sign Refresh Token (7 days)
export async function signRefreshToken(payload: { userId: string }): Promise<string> {
  const secret = getRefreshSecret();
  return await new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

// 3. Verify Access Token
export async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
  try {
    const secret = getAccessSecret();
    const { payload } = await jose.jwtVerify(token, secret);
    return payload as unknown as JWTPayload;
  } catch (error) {
    console.error("Access token verification failed:", error);
    return null;
  }
}

// 4. Verify Refresh Token
export async function verifyRefreshToken(token: string): Promise<{ userId: string } | null> {
  try {
    const secret = getRefreshSecret();
    const { payload } = await jose.jwtVerify(token, secret);
    return payload as unknown as { userId: string };
  } catch (error) {
    console.error("Refresh token verification failed:", error);
    return null;
  }
}

// 5. Helper to set secure, httpOnly cookies on response
export function setAuthCookies(
  res: NextResponse, 
  accessToken: string, 
  refreshToken: string
) {
  // Access Token Cookie (15 mins)
  res.cookies.set("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60, // 15 minutes in seconds
  });

  // Refresh Token Cookie (7 days)
  res.cookies.set("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  });
}

// 6. Helper to clear auth cookies on logout
export function clearAuthCookies(res: NextResponse) {
  res.cookies.set("accessToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  res.cookies.set("refreshToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
