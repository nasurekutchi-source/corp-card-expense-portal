import { NextRequest, NextResponse } from "next/server";
import { getApprovals, updateApproval } from "@/lib/repository";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filters = {
      status: searchParams.get("status") || undefined,
      search: searchParams.get("search") || undefined,
    };

    const approvals = await getApprovals(filters);
    return NextResponse.json({ data: approvals, total: approvals.length });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch approvals", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id || !body.status) {
      return NextResponse.json(
        { error: "Missing required fields: id, status (APPROVED or REJECTED)" },
        { status: 400 }
      );
    }

    const validStatuses = ["APPROVED", "REJECTED", "DELEGATED", "ESCALATED"];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const approval = await updateApproval(body.id, {
      status: body.status,
    }, body.comment);

    if (!approval) {
      return NextResponse.json({ error: "Approval not found" }, { status: 404 });
    }

    return NextResponse.json({ data: approval });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process approval", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
