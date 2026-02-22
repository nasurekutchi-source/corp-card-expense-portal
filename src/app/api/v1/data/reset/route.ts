import { NextResponse } from "next/server";
import { resetStore } from "@/lib/repository";

export async function POST() {
  try {
    await resetStore();
    return NextResponse.json({
      success: true,
      message: "Data reset to demo defaults",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to reset data", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
