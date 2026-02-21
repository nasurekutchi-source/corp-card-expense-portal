import { NextRequest, NextResponse } from "next/server";
import { getDetectedSubscriptions } from "@/lib/store";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const isActiveParam = searchParams.get("isActive");
    const filters = {
      cardId: searchParams.get("cardId") || undefined,
      employeeId: searchParams.get("employeeId") || undefined,
      isActive: isActiveParam !== null ? isActiveParam === "true" : undefined,
      frequency: searchParams.get("frequency") || undefined,
      search: searchParams.get("search") || undefined,
    };

    const subscriptions = getDetectedSubscriptions(filters);
    return NextResponse.json({ data: subscriptions, total: subscriptions.length });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch subscriptions", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
