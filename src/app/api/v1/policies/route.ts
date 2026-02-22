import { NextRequest, NextResponse } from "next/server";
import { getPolicies, addPolicy, updatePolicy, deletePolicy } from "@/lib/store";

export async function GET() {
  try {
    const policies = getPolicies();
    return NextResponse.json({ data: policies, total: policies.length });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch policies", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.type || !body.rules) {
      return NextResponse.json(
        { error: "Missing required fields: name, type, rules" },
        { status: 400 }
      );
    }

    const policy = addPolicy({
      ...body,
      severity: body.severity || "SOFT",
      isActive: body.isActive !== undefined ? body.isActive : true,
      version: body.version || 1,
    });

    return NextResponse.json({ data: policy }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create policy", details: error instanceof Error ? error.message : "Unknown error" },
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

    const policy = updatePolicy(body.id, body);

    if (!policy) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    return NextResponse.json({ data: policy });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update policy", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing required query param: id" }, { status: 400 });
    }
    const deleted = deletePolicy(id);
    if (!deleted) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete policy", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
