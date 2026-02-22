import { NextRequest, NextResponse } from "next/server";
import {
  getScheduledCardActions,
  addScheduledCardAction,
  updateScheduledCardAction,
  deleteScheduledCardAction,
} from "@/lib/repository";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filters = {
      cardId: searchParams.get("cardId") || undefined,
      employeeId: searchParams.get("employeeId") || undefined,
      status: searchParams.get("status") || undefined,
      actionType: searchParams.get("actionType") || undefined,
    };

    const actions = await getScheduledCardActions(filters);
    return NextResponse.json({ data: actions, total: actions.length });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch scheduled actions", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.cardId) {
      return NextResponse.json(
        { error: "Missing required field: cardId" },
        { status: 400 }
      );
    }

    if (!body.actionType) {
      return NextResponse.json(
        { error: "Missing required field: actionType" },
        { status: 400 }
      );
    }

    if (!body.scheduledDate) {
      return NextResponse.json(
        { error: "Missing required field: scheduledDate" },
        { status: 400 }
      );
    }

    const action = await addScheduledCardAction(body);
    return NextResponse.json({ data: action, message: "Scheduled action created" }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create scheduled action", details: error instanceof Error ? error.message : "Unknown error" },
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

    const { id, ...updates } = body;
    const updated = await updateScheduledCardAction(id, updates);

    if (!updated) {
      return NextResponse.json(
        { error: "Scheduled action not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: updated, message: "Scheduled action updated" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update scheduled action", details: error instanceof Error ? error.message : "Unknown error" },
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
        { error: "Missing required query parameter: id" },
        { status: 400 }
      );
    }

    const deleted = await deleteScheduledCardAction(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Scheduled action not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Scheduled action cancelled" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete scheduled action", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
