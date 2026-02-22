import { NextRequest, NextResponse } from "next/server";
import {
  getCardControlPolicies,
  getCardControlPolicyByNode,
  addCardControlPolicy,
  updateCardControlPolicy,
  deleteCardControlPolicy,
  getEffectiveCardControlPolicy,
} from "@/lib/repository";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nodeId = searchParams.get("nodeId");
    const effective = searchParams.get("effective");

    // Get effective (inherited/resolved) policy for a node
    if (nodeId && effective === "true") {
      const nodeType = (searchParams.get("nodeType") || "company") as "company" | "division" | "department";
      const result = await getEffectiveCardControlPolicy(nodeId, nodeType);
      return NextResponse.json({ data: result });
    }

    // Get direct policy for a specific node
    if (nodeId) {
      const policy = await getCardControlPolicyByNode(nodeId);
      if (!policy) {
        return NextResponse.json(
          { data: null, message: "No direct policy found for this node" },
          { status: 200 }
        );
      }
      return NextResponse.json({ data: policy });
    }

    // Get all card control policies
    const policies = await getCardControlPolicies();
    return NextResponse.json({ data: policies });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch card control policies", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.nodeId || !body.nodeType) {
      return NextResponse.json(
        { error: "Missing required fields: nodeId, nodeType" },
        { status: 400 }
      );
    }

    const validNodeTypes = ["company", "division", "department"];
    if (!validNodeTypes.includes(body.nodeType)) {
      return NextResponse.json(
        { error: `Invalid nodeType. Must be one of: ${validNodeTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const policy = await addCardControlPolicy(body);
    return NextResponse.json({ data: policy }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create card control policy", details: error instanceof Error ? error.message : "Unknown error" },
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

    const updated = await updateCardControlPolicy(body.id, body);
    if (!updated) {
      return NextResponse.json(
        { error: "Card control policy not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update card control policy", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing required parameter: id" },
        { status: 400 }
      );
    }

    const deleted = await deleteCardControlPolicy(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Card control policy not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete card control policy", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
