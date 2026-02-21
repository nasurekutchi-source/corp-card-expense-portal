import { NextRequest, NextResponse } from "next/server";
import { getCards } from "@/lib/store";
import { getCardService } from "@/lib/card-integration";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filters = {
      status: searchParams.get("status") || undefined,
      employeeId: searchParams.get("employeeId") || undefined,
      type: searchParams.get("type") || undefined,
      search: searchParams.get("search") || undefined,
    };

    const cards = getCards(filters);
    return NextResponse.json({ data: cards, total: cards.length });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch cards", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.employeeId) {
      return NextResponse.json(
        { error: "Missing required field: employeeId" },
        { status: 400 }
      );
    }

    const service = getCardService();
    const result = await service.issueCard({
      employeeId: body.employeeId,
      type: body.type || "VIRTUAL",
      network: body.network,
      spendLimits: body.spendLimits,
      controls: body.controls,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ data: result.card, message: result.message }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create card", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
