import { NextResponse } from "next/server";
import db from "@/lib/db";

// GET /api/ping
// Verify that the database is connected and responsive using our real User schema.
export async function GET() {
  try {
    // Count seeded users in database to check read connectivity
    const userCount = await db.user.count();

    return NextResponse.json({
      status: "success",
      message: "Database connection verified!",
      dbProvider: "PostgreSQL",
      seededUsers: userCount,
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
