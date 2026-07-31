import { NextResponse } from "next/server";
import db from "@/lib/db";

// GET /api/ping
// Verify that the database is connected and responsive.
export async function GET() {
  try {
    // 1. Insert a ping entry to verify write access
    await db.ping.create({
      data: {
        message: "Ping to database from Next.js server",
      },
    });

    // 2. Count all pings to verify read access
    const count = await db.ping.count();

    // 3. Return status code 200 with the count
    return NextResponse.json({
      status: "success",
      message: "Database connection verified!",
      dbProvider: "PostgreSQL",
      totalPings: count,
    });
  } catch (error) {
    console.error("Database connection verification failed:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to connect to the database.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
