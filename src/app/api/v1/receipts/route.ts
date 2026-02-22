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

    // Simulate OCR extraction based on file properties
    const ocrResult = simulateOcr(file.name, file.size);

    const receipt = addReceipt({
      expenseId: expenseId || undefined,
      fileName: file.name,
      fileSize: file.size,
      mimeType,
      base64Data: base64,
      uploadedAt: new Date().toISOString(),
      ocrData: ocrResult.fields,
      ocrConfidence: ocrResult.confidence,
      ocrStatus: "COMPLETED",
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

// =============================================================================
// OCR Simulation — generates realistic extracted fields from receipt images
// =============================================================================

function simulateOcr(fileName: string, fileSize: number) {
  const merchants = [
    { name: "Taj Hotels Mumbai", gstin: "27AABCT1234R1ZM", amount: 12500, category: "TRAVEL", subcategory: "TRAVEL_HOTEL" },
    { name: "IndiGo Airlines", gstin: "07AABCI5678S1ZN", amount: 8750, category: "TRAVEL", subcategory: "TRAVEL_AIR" },
    { name: "Uber India Pvt Ltd", gstin: "29AABCU9012T1ZP", amount: 1250, category: "TRAVEL", subcategory: "TRAVEL_GROUND" },
    { name: "Swiggy (Bundl Technologies)", gstin: "29AABCB3456U1ZQ", amount: 850, category: "MEALS", subcategory: "MEALS_BUSINESS" },
    { name: "Amazon India", gstin: "27AABCA7890V1ZR", amount: 15600, category: "OFFICE", subcategory: "OFFICE_SUPPLIES" },
    { name: "WeWork India", gstin: "27AABCW2345W1ZS", amount: 45000, category: "PROFESSIONAL", subcategory: "PROF_CONSULTING" },
    { name: "Starbucks Coffee India", gstin: "27AABCS6789X1ZT", amount: 650, category: "MEALS", subcategory: "MEALS_TEAM" },
    { name: "MakeMyTrip India", gstin: "07AABCM1234Y1ZU", amount: 22000, category: "TRAVEL", subcategory: "TRAVEL_AIR" },
  ];

  // Pick merchant deterministically based on hash of filename for consistency
  const hash = fileName.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const merchant = merchants[hash % merchants.length];
  const dateOffset = (fileSize % 20) + 1;
  const receiptDate = new Date(Date.now() - dateOffset * 86400000)
    .toISOString()
    .split("T")[0];

  const gstRate = 18;
  const baseAmount = Math.round(merchant.amount / 1.18);
  const gstAmount = merchant.amount - baseAmount;

  // Deterministic but varied confidence scores based on hash
  const confSeed = (hash * 7 + fileSize) % 100;
  const merchantConf = 0.93 + (confSeed % 7) / 100;
  const amountConf = 0.96 + (confSeed % 4) / 100;
  const dateConf = 0.90 + (confSeed % 10) / 100;
  const gstinConf = 0.86 + (confSeed % 14) / 100;
  const invConf = 0.83 + (confSeed % 17) / 100;
  const overallConf = 0.89 + (confSeed % 9) / 100;

  return {
    fields: {
      merchantName: merchant.name,
      amount: merchant.amount,
      currency: "INR",
      date: receiptDate,
      gstin: merchant.gstin,
      invoiceNumber: `INV-${String(hash).slice(-6).padStart(6, "0")}`,
      gstRate,
      baseAmount,
      cgst: Math.round(gstAmount / 2),
      sgst: Math.round(gstAmount / 2),
      igst: 0,
      paymentMethod: ["Card", "UPI", "Cash"][hash % 3],
      category: merchant.category,
      subcategory: merchant.subcategory,
    },
    confidence: {
      merchantName: Math.min(merchantConf, 1),
      amount: Math.min(amountConf, 1),
      date: Math.min(dateConf, 1),
      gstin: Math.min(gstinConf, 1),
      invoiceNumber: Math.min(invConf, 1),
      overall: Math.min(overallConf, 1),
    },
  };
}
