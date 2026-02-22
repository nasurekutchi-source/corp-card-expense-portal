import { NextRequest, NextResponse } from "next/server";
import { bulkImportHierarchy } from "@/lib/repository";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!Array.isArray(body.records)) {
      return NextResponse.json(
        { error: "Request body must contain a 'records' array of { type, record } objects" },
        { status: 400 }
      );
    }

    if (body.records.length === 0) {
      return NextResponse.json(
        { error: "Records array cannot be empty" },
        { status: 400 }
      );
    }

    const validTypes = ["enterprise", "company", "division", "department", "costCenter"];
    const invalidEntries = body.records.filter(
      (r: { type?: string }) => !r.type || !validTypes.includes(r.type)
    );
    if (invalidEntries.length > 0) {
      return NextResponse.json(
        { error: `Each record must have a valid 'type' field. Valid types: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const result = await bulkImportHierarchy(body.records);
    return NextResponse.json(
      { imported: result.imported, errors: result.errors, total: result.total },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to bulk import hierarchy", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
