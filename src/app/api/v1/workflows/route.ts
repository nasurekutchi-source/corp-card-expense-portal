import { NextRequest, NextResponse } from "next/server";
import {
  getWorkflowRequests,
  getWorkflowRequest,
  addWorkflowRequest,
  approveWorkflowStep,
  rejectWorkflowStep,
} from "@/lib/repository";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filters = {
      type: searchParams.get("type") || undefined,
      status: searchParams.get("status") || undefined,
      requestorId: searchParams.get("requestorId") || undefined,
      search: searchParams.get("search") || undefined,
    };

    const workflows = await getWorkflowRequests(filters);
    return NextResponse.json({ data: workflows, total: workflows.length });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch workflows", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.type || !body.requestorId) {
      return NextResponse.json(
        { error: "Missing required fields: type, requestorId" },
        { status: 400 }
      );
    }

    const workflow = await addWorkflowRequest(body);
    return NextResponse.json({ data: workflow, message: "Workflow request created" }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create workflow request", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id || !body.action || !body.approverName) {
      return NextResponse.json(
        { error: "Missing required fields: id, action, approverName" },
        { status: 400 }
      );
    }

    // Verify the workflow exists
    const existing = await getWorkflowRequest(body.id);
    if (!existing) {
      return NextResponse.json(
        { error: "Workflow request not found" },
        { status: 404 }
      );
    }

    let result;
    if (body.action === "approve") {
      result = await approveWorkflowStep(body.id, body.approverName, body.comment);
    } else if (body.action === "reject") {
      result = await rejectWorkflowStep(body.id, body.approverName, body.comment);
    } else {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    if (!result) {
      return NextResponse.json(
        { error: "Failed to process workflow action" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: result,
      message: `Workflow request ${body.action === "approve" ? "approved" : "rejected"}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update workflow", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
