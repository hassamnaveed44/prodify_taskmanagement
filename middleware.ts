import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// ─── Rate Limiter ────────────────────────────────────────────────────────────
// Simple in-memory store: Map<ip, { count, resetAt }>
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  "/api/auth/login":    { max: 10, windowMs: 60_000 },
  "/api/auth/register": { max: 5,  windowMs: 60_000 },
  "/api/ai/chat":       { max: 20, windowMs: 60_000 },
};

function checkRateLimit(ip: string, pathname: string): { limited: boolean; retryAfter?: number } {
  const rule = Object.entries(RATE_LIMITS).find(([path]) => pathname.startsWith(path));
  if (!rule) return { limited: false };

  const [, { max, windowMs }] = rule;
  const key = `${ip}:${pathname}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { limited: false };
  }

  if (entry.count >= max) {
    return { limited: true, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count++;
  return { limited: false };
}

// Edge-compatible JWT verification matching lib/auth.ts
async function verifyAccessToken(token: string): Promise<boolean> {
  try {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) return false;
    const encoder = new TextEncoder().encode(secret);
    await jwtVerify(token, encoder);
    return true;
  } catch (error) {
    return false;
  }
}

// Protected dashboard routes
const protectedPaths = [
  "/dashboard",
  "/prodify-ai",
  "/my-tasks",
  "/inbox",
  "/calendar",
  "/reports",
  "/settings",
  "/projects",
];

// Public Auth routes
const authPaths = ["/login", "/register"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ─── Rate Limiting ──────────────────────────────────────────────────────────
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
              req.headers.get("x-real-ip") || "127.0.0.1";
  const { limited, retryAfter } = checkRateLimit(ip, pathname);
  if (limited) {
    return new NextResponse(
      JSON.stringify({ error: "Too many requests. Please slow down.", retryAfter }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": "exceeded",
        },
      }
    );
  }

  const isProtected = protectedPaths.some(path => pathname.startsWith(path)) ||
                      pathname === "/api/auth/me" ||
                      (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/") && !pathname.startsWith("/api/ping"));
  const isAuthPage = authPaths.some(path => pathname.startsWith(path));

  // Extract cookies
  const accessToken = req.cookies.get("accessToken")?.value;
  const refreshToken = req.cookies.get("refreshToken")?.value;

  // Case 1: Route is Protected
  if (isProtected) {
    // A. Access token is present and valid -> Proceed
    if (accessToken && await verifyAccessToken(accessToken)) {
      return NextResponse.next();
    }

    // B. Access token is missing or expired, but we have a refresh token -> Attempt Rotation
    if (refreshToken) {
      try {
        console.log("🔄 Access token expired. Attempting silent token rotation in middleware...");
        
        // Execute sub-request to the refresh endpoint, passing along the request cookies
        const refreshUrl = new URL("/api/auth/refresh", req.url);
        const refreshResponse = await fetch(refreshUrl, {
          method: "POST",
          headers: {
            Cookie: req.headers.get("cookie") || "",
          },
        });

        if (refreshResponse.ok) {
          console.log("✅ Token rotation successful. Continuing request.");
          
          // Recreate request headers so the updated access token is visible in the current execution context
          const response = NextResponse.next();

          // Copy the Set-Cookie headers from the refresh response to our final client response
          const setCookies = refreshResponse.headers.getSetCookie();
          setCookies.forEach((cookieString) => {
            response.headers.append("Set-Cookie", cookieString);
          });

          return response;
        }
      } catch (err) {
        console.error("❌ Silent token rotation failed in middleware:", err);
      }
    }

    // C. No valid session found -> Redirect to login
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    
    // Clear cookies if they were invalid
    const response = NextResponse.redirect(loginUrl);
    response.cookies.set("accessToken", "", { maxAge: 0, path: "/" });
    response.cookies.set("refreshToken", "", { maxAge: 0, path: "/" });
    return response;
  }

  // Case 2: Route is Login/Register page
  if (isAuthPage) {
    // If the user has a valid access token, redirect them to dashboard directly
    if (accessToken && await verifyAccessToken(accessToken)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

// Configure middleware routes matching matcher rules
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (allow authentication routes to compile directly)
     * - api/ping (allow test route to bypass)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/auth|api/ping|api/ws|_next/static|_next/image|favicon.ico).*)",
  ],
};
