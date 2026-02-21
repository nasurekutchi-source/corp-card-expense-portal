import { NextRequest, NextResponse } from "next/server";
import { getCardById, deleteCard } from "@/lib/store";
import {
  getCardService,
  getCardControls,
  type CardControls,
} from "@/lib/card-integration";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const { cardId } = await params;
    const card = getCardById(cardId);

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    // Include controls in the response
    const controls = getCardControls(cardId);

    return NextResponse.json({ data: { ...card, controls } });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch card", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const { cardId } = await params;
    const body = await request.json();
    const service = getCardService();

    // Handle specific action types via the integration service
    if (body.action === "freeze") {
      const result = await service.freezeCard(cardId);
      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 });
      }
      return NextResponse.json({ data: result.card, message: result.message });
    }

    if (body.action === "unfreeze") {
      const result = await service.unfreezeCard(cardId);
      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 });
      }
      return NextResponse.json({ data: result.card, message: result.message });
    }

    if (body.action === "cancel") {
      const result = await service.cancelCard(cardId, body.reason || "Admin cancelled");
      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 });
      }
      return NextResponse.json({ data: result.card, message: result.message });
    }

    // Handle spend limits update
    if (body.spendLimits) {
      const result = await service.updateLimits(cardId, body.spendLimits);
      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 });
      }
      return NextResponse.json({ data: result.card, message: result.message });
    }

    // Handle controls update
    if (body.controls) {
      const controls: CardControls = body.controls;
      const result = await service.updateControls(cardId, controls);
      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 });
      }
      // Return the card with controls
      const updatedControls = getCardControls(cardId);
      return NextResponse.json({
        data: { ...result.card, controls: updatedControls },
        message: result.message,
      });
    }

    // Fallback: generic card field update (backward-compatible)
    const { action: _action, ...updateFields } = body;
    if (Object.keys(updateFields).length > 0) {
      const result = await service.getCardDetails(cardId);
      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 404 });
      }
      // Direct store update for other fields
      const { updateCard } = await import("@/lib/store");
      const card = updateCard(cardId, updateFields);
      if (!card) {
        return NextResponse.json({ error: "Card not found" }, { status: 404 });
      }
      return NextResponse.json({ data: card });
    }

    return NextResponse.json({ error: "No update fields provided" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update card", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const { cardId } = await params;
    const deleted = deleteCard(cardId);

    if (!deleted) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Card deleted" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete card", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
