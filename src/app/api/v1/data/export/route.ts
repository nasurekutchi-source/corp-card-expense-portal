import { NextResponse } from "next/server";
import { exportStore } from "@/lib/repository";

export async function GET() {
  try {
    const data = await exportStore();
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to export data", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
