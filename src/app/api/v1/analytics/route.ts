import { NextResponse } from "next/server";
import { getStats, getAnalytics } from "@/lib/repository";

export async function GET() {
  try {
    const stats = await getStats();
    const analytics = await getAnalytics();

    return NextResponse.json({
      data: {
        stats,
        analytics,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch analytics", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
