import { NextRequest, NextResponse } from "next/server";
import { addReceipt, getReceipt, getReceipts, deleteReceipt } from "@/lib/store";

// =============================================================================
// GET /api/v1/receipts?id=xxx or ?expenseId=xxx
// =============================================================================

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (id) {
    const receipt = getReceipt(id);
    if (!receipt) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }
    return NextResponse.json(receipt);
  }
  const expenseId = req.nextUrl.searchParams.get("expenseId");
  return NextResponse.json(getReceipts(expenseId || undefined));
}

// =============================================================================
// POST /api/v1/receipts — multipart/form-data file upload with OCR simulation
// =============================================================================

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
      "application/pdf",
    ];
    if (file.type && !allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Allowed: JPEG, PNG, WebP, HEIC, PDF` },
        { status: 400 }
      );
    }

    // 5MB limit for demo
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    const expenseId = formData.get("expenseId") as string | null;

    // Read file to base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type || "image/jpeg";

    // In demo mode, we store the receipt image but cannot perform real OCR.
    // We do NOT return fake/hardcoded merchant data — that would mislead users.
    const receipt = addReceipt({
      expenseId: expenseId || undefined,
      fileName: file.name,
      fileSize: file.size,
      mimeType,
      base64Data: base64,
      uploadedAt: new Date().toISOString(),
      ocrData: null,
      ocrConfidence: null,
      ocrStatus: "DEMO",
      source: "UPLOAD",
    });

    return NextResponse.json(receipt, { status: 201 });
  } catch (err) {
    console.error("Receipt upload error:", err);
    return NextResponse.json(
      { error: "Failed to process receipt upload" },
      { status: 500 }
    );
  }
}

// =============================================================================
// DELETE /api/v1/receipts?id=xxx
// =============================================================================

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Receipt ID required" }, { status: 400 });
  }
  const deleted = deleteReceipt(id);
  if (!deleted) {
    return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

