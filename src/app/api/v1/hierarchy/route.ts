import { NextRequest, NextResponse } from "next/server";
import { getHierarchy, addHierarchyNode } from "@/lib/store";

export async function GET() {
  try {
    const hierarchy = getHierarchy();
    return NextResponse.json({ data: hierarchy });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch hierarchy", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.type || !body.record) {
      return NextResponse.json(
        { error: "Missing required fields: type, record" },
        { status: 400 }
      );
    }

    const validTypes = ["enterprise", "company", "division", "department", "costCenter"];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const node = addHierarchyNode(body);
    return NextResponse.json({ data: node }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create hierarchy node", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
