import { NextRequest, NextResponse } from "next/server";
import { bulkImportEmployees } from "@/lib/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!Array.isArray(body.records)) {
      return NextResponse.json(
        { error: "Request body must contain a 'records' array" },
        { status: 400 }
      );
    }

    if (body.records.length === 0) {
      return NextResponse.json(
        { error: "Records array cannot be empty" },
        { status: 400 }
      );
    }

    const result = bulkImportEmployees(body.records);
    return NextResponse.json(
      { imported: result.imported, errors: result.errors, total: result.total },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to bulk import employees", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
