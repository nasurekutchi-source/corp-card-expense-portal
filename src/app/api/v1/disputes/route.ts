import { NextRequest, NextResponse } from "next/server";
import { getDisputes, getDispute, addDispute, updateDispute } from "@/lib/repository";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filters = {
      status: searchParams.get("status") || undefined,
      employeeId: searchParams.get("employeeId") || undefined,
      cardId: searchParams.get("cardId") || undefined,
      search: searchParams.get("search") || undefined,
    };

    const disputes = await getDisputes(filters);
    return NextResponse.json({ data: disputes, total: disputes.length });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch disputes", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.transactionId && !body.cardId) {
      return NextResponse.json(
        { error: "Missing required field: transactionId or cardId" },
        { status: 400 }
      );
    }

    if (!body.reason) {
      return NextResponse.json(
        { error: "Missing required field: reason" },
        { status: 400 }
      );
    }

    const dispute = await addDispute(body);
    return NextResponse.json({ data: dispute, message: "Dispute raised" }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to raise dispute", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 }
      );
    }

    // Verify the dispute exists
    const existing = await getDispute(body.id);
    if (!existing) {
      return NextResponse.json(
        { error: "Dispute not found" },
        { status: 404 }
      );
    }

    const { id, ...updates } = body;
    const updated = await updateDispute(id, updates);

    if (!updated) {
      return NextResponse.json(
        { error: "Failed to update dispute" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: updated, message: "Dispute updated" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update dispute", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
