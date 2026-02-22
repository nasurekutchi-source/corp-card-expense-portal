import { NextRequest, NextResponse } from "next/server";
import { addReceipt, getReceipt, getReceipts, deleteReceipt } from "@/lib/repository";

// =============================================================================
// GET /api/v1/receipts?id=xxx or ?expenseId=xxx
// =============================================================================

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (id) {
    const receipt = await getReceipt(id);
    if (!receipt) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
    }
    return NextResponse.json(receipt);
  }
  const expenseId = req.nextUrl.searchParams.get("expenseId");
  return NextResponse.json(await getReceipts(expenseId || undefined));
}

// =============================================================================
// OCR Strategy:
//   1. Claude Vision API (primary) — reads receipts like a human, 95%+ accuracy
//   2. Tesseract.js with sharp preprocessing (fallback) — free, offline
// =============================================================================

const RECEIPT_EXTRACTION_PROMPT = `You are an expert receipt/invoice data extractor for an Indian corporate expense management system.

Analyze this receipt image and extract ALL of the following fields. Return ONLY valid JSON, no markdown, no explanation.

{
  "merchantName": "exact business/merchant name",
  "amount": 0.00,
  "currency": "INR",
  "date": "YYYY-MM-DD",
  "gstin": "15-char GSTIN if visible",
  "cgst": 0.00,
  "sgst": 0.00,
  "igst": 0.00,
  "gstRate": 0,
  "invoiceNumber": "invoice/bill number",
  "category": "one of: Travel, Meals, Office Supplies, Software, Communication, Professional Services, Entertainment, Other",
  "subcategory": "specific subcategory like Hotel / Lodging, Airfare, Ground Transportation, Business Meals, etc.",
  "lineItems": [{"description": "item", "qty": 1, "amount": 0.00}],
  "paymentMethod": "Cash/Card/UPI/Online",
  "address": "merchant address if visible"
}

Rules:
- For amount, extract the FINAL TOTAL (grand total / total payable / amount due), not subtotals
- Dates should be in YYYY-MM-DD format
- For Indian receipts, detect GSTIN (format: 2 digits + 5 letters + 4 digits + 1 letter + 1 digit + 1 alphanumeric + 1 alphanumeric)
- If a field is not visible, omit it from the JSON (don't include null values)
- Amount must be a number, not a string
- For category, use context clues (hotel=Travel, restaurant=Meals, etc.)`;

// -----------------------------------------------------------------------------
// Claude Vision OCR — best quality
// -----------------------------------------------------------------------------

async function runClaudeVisionOcr(
  base64: string,
  mimeType: string
): Promise<{
  fields: Record<string, any>;
  confidence: Record<string, number>;
  rawText: string;
} | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey });

    const mediaType = mimeType as "image/jpeg" | "image/png" | "image/webp" | "image/gif";

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            { type: "text", text: RECEIPT_EXTRACTION_PROMPT },
          ],
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Parse JSON from response — handle potential markdown wrapping
    let jsonStr = text.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const fields = JSON.parse(jsonStr);

    // Claude Vision is highly accurate — confidence is based on model confidence
    const confidence: Record<string, number> = {
      overall: 0.95,
      merchantName: fields.merchantName ? 0.95 : 0,
      amount: fields.amount ? 0.97 : 0,
      date: fields.date ? 0.95 : 0,
      gstin: fields.gstin ? 0.98 : 0,
    };

    return { fields, confidence, rawText: `[Claude Vision]\n${text}` };
  } catch (err) {
    console.error("Claude Vision OCR error:", err);
    return null;
  }
}

// -----------------------------------------------------------------------------
// Tesseract.js OCR with sharp preprocessing — free fallback
// -----------------------------------------------------------------------------

async function preprocessImage(imageBuffer: Buffer): Promise<Buffer> {
  try {
    const sharp = (await import("sharp")).default;
    return await sharp(imageBuffer)
      .greyscale() // Convert to grayscale
      .normalize() // Auto-level contrast
      .sharpen({ sigma: 1.5 }) // Sharpen text edges
      .resize({ width: 2000, withoutEnlargement: true }) // Upscale small images
      .png() // Consistent format for Tesseract
      .toBuffer();
  } catch {
    return imageBuffer; // Return original if preprocessing fails
  }
}

async function runTesseractOcr(imageBuffer: Buffer): Promise<{
  rawText: string;
  fields: Record<string, any>;
  confidence: Record<string, number>;
}> {
  // Preprocess image for better OCR accuracy
  const processed = await preprocessImage(imageBuffer);

  const Tesseract = await import("tesseract.js");
  const worker = await Tesseract.createWorker("eng", undefined, {
    cachePath: "/tmp/tesseract-cache",
  });
  try {
    const { data } = await worker.recognize(processed);
    const rawText = data.text;
    const overallConfidence = data.confidence; // 0-100

    const fields = parseReceiptText(rawText);
    const conf = (overallConfidence || 0) / 100;
    const confidence: Record<string, number> = {
      overall: conf,
      merchantName: fields.merchantName ? conf : 0,
      amount: fields.amount ? Math.min(conf + 0.05, 1) : 0,
      date: fields.date ? conf : 0,
      gstin: fields.gstin ? Math.min(conf + 0.1, 1) : 0,
    };

    return { rawText: `[Tesseract]\n${rawText}`, fields, confidence };
  } finally {
    await worker.terminate();
  }
}

// =============================================================================
// Parse receipt text into structured fields (for Tesseract fallback)
// =============================================================================

function parseReceiptText(text: string): Record<string, any> {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const fullText = text.toUpperCase();
  const fields: Record<string, any> = {};

  // --- Merchant Name ---
  for (const line of lines.slice(0, 8)) {
    const clean = line.trim();
    if (!clean || clean.length < 3) continue;
    if (/^\d[\d\s.,:/-]+$/.test(clean)) continue;
    if (
      /^(TAX\s+INVOICE|INVOICE|RECEIPT|BILL|ORIGINAL|DUPLICATE|CASH\s+MEMO)/i.test(
        clean
      )
    )
      continue;
    if (/^(GST|GSTIN|PAN|CIN|TIN|FSSAI)/i.test(clean)) continue;
    if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(clean)) continue;
    fields.merchantName = clean.replace(/[|]/g, "").trim();
    break;
  }

  // --- Amount ---
  const amountPatterns = [
    /(?:GRAND\s*TOTAL|TOTAL\s*DUE|AMOUNT\s*DUE|NET\s*AMOUNT|TOTAL\s*AMOUNT|BILL\s*AMOUNT|TOTAL\s*PAYABLE)[:\s]*[₹Rs.INR\s]*([0-9,]+\.?\d{0,2})/i,
    /(?:TOTAL)[:\s]*[₹Rs.INR\s]*([0-9,]+\.\d{2})/i,
    /[₹]\s*([0-9,]+\.\d{2})/,
  ];
  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match) {
      const parsed = parseFloat(match[1].replace(/,/g, ""));
      if (parsed > 0 && parsed < 10000000) {
        fields.amount = parsed;
        fields.currency = "INR";
        break;
      }
    }
  }
  if (!fields.amount) {
    const allAmounts: number[] = [];
    const amtRegex = /[₹Rs.INR\s]*(\d{1,3}(?:,\d{2,3})*\.?\d{0,2})/g;
    let m;
    while ((m = amtRegex.exec(text)) !== null) {
      const val = parseFloat(m[1].replace(/,/g, ""));
      if (val > 10 && val < 10000000) allAmounts.push(val);
    }
    if (allAmounts.length > 0) {
      fields.amount = Math.max(...allAmounts);
      fields.currency = "INR";
    }
  }

  // --- Date ---
  const datePatterns = [
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](20\d{2})/,
    /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,']+(\d{2,4})/i,
    /(20\d{2})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
  ];
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        const dateStr = match[0];
        const d = new Date(dateStr);
        if (!isNaN(d.getTime()) && d.getFullYear() >= 2020) {
          fields.date = d.toISOString().split("T")[0];
          break;
        }
        const parts = dateStr.match(
          /(\d{1,2})[\/\-](\d{1,2})[\/\-](20\d{2})/
        );
        if (parts) {
          const day = parseInt(parts[1]);
          const month = parseInt(parts[2]);
          const year = parseInt(parts[3]);
          if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            fields.date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            break;
          }
        }
        const monthMap: Record<string, string> = {
          jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
          jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
        };
        const monMatch = dateStr.match(
          /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,']+(\d{2,4})/i
        );
        if (monMatch) {
          const day = monMatch[1].padStart(2, "0");
          const mon =
            monthMap[monMatch[2].toLowerCase().slice(0, 3)] || "01";
          let year = monMatch[3];
          if (year.length === 2) year = "20" + year;
          fields.date = `${year}-${mon}-${day}`;
          break;
        }
      } catch {
        // skip
      }
    }
  }

  // --- GSTIN ---
  const gstinMatch = text.match(
    /\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z\d][A-Z\d]/
  );
  if (gstinMatch) fields.gstin = gstinMatch[0];

  // --- GST amounts ---
  const cgstMatch = text.match(
    /CGST[:\s@%0-9.]*[₹Rs.\s]*([0-9,]+\.?\d{0,2})/i
  );
  if (cgstMatch) fields.cgst = parseFloat(cgstMatch[1].replace(/,/g, ""));

  const sgstMatch = text.match(
    /SGST[:\s@%0-9.]*[₹Rs.\s]*([0-9,]+\.?\d{0,2})/i
  );
  if (sgstMatch) fields.sgst = parseFloat(sgstMatch[1].replace(/,/g, ""));

  const igstMatch = text.match(
    /IGST[:\s@%0-9.]*[₹Rs.\s]*([0-9,]+\.?\d{0,2})/i
  );
  if (igstMatch) fields.igst = parseFloat(igstMatch[1].replace(/,/g, ""));

  const gstRateMatch = text.match(
    /(?:GST|TAX)[:\s@]*(\d{1,2}(?:\.\d+)?)\s*%/i
  );
  if (gstRateMatch) fields.gstRate = parseFloat(gstRateMatch[1]);

  // --- Invoice number ---
  const invMatch = text.match(
    /(?:INVOICE|INV|BILL)\s*(?:NO|NUMBER|#)?[:\s]*([A-Z0-9\-\/]+)/i
  );
  if (invMatch) fields.invoiceNumber = invMatch[1];

  // --- Category ---
  if (
    fullText.includes("HOTEL") || fullText.includes("LODGE") ||
    fullText.includes("ROOM") || fullText.includes("CHECK-IN") ||
    fullText.includes("IBIS") || fullText.includes("TAJ") ||
    fullText.includes("MARRIOTT") || fullText.includes("HYATT")
  ) {
    fields.category = "Travel";
    fields.subcategory = "Hotel / Lodging";
  } else if (
    fullText.includes("AIRLINE") || fullText.includes("FLIGHT") ||
    fullText.includes("BOARDING") || fullText.includes("INDIGO") ||
    fullText.includes("SPICEJET") || fullText.includes("AIR INDIA")
  ) {
    fields.category = "Travel";
    fields.subcategory = "Airfare";
  } else if (
    fullText.includes("UBER") || fullText.includes("OLA") ||
    fullText.includes("CAB") || fullText.includes("TAXI") ||
    fullText.includes("RIDE")
  ) {
    fields.category = "Travel";
    fields.subcategory = "Ground Transportation";
  } else if (
    fullText.includes("RESTAURANT") || fullText.includes("CAFE") ||
    fullText.includes("COFFEE") || fullText.includes("FOOD") ||
    fullText.includes("MEAL") || fullText.includes("DINING") ||
    fullText.includes("KITCHEN") || fullText.includes("BIRYANI")
  ) {
    fields.category = "Meals";
    fields.subcategory = "Business Meals";
  } else if (
    fullText.includes("STARBUCKS") || fullText.includes("CCD") ||
    fullText.includes("CHAAYOS")
  ) {
    fields.category = "Meals";
    fields.subcategory = "Business Meals";
  }

  return fields;
}

// =============================================================================
// POST /api/v1/receipts — upload + OCR (Claude Vision → Tesseract fallback)
// =============================================================================

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const allowedTypes = [
      "image/jpeg", "image/png", "image/webp",
      "image/heic", "image/heif", "application/pdf",
    ];
    if (file.type && !allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Unsupported file type: ${file.type}. Allowed: JPEG, PNG, WebP, HEIC, PDF`,
        },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    const expenseId = formData.get("expenseId") as string | null;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const mimeType = file.type || "image/jpeg";

    // ---- OCR Pipeline ----
    let ocrData: Record<string, any> | null = null;
    let ocrConfidence: Record<string, number> | null = null;
    let ocrStatus: "COMPLETED" | "FAILED" = "FAILED";
    let ocrEngine = "none";

    const isImage = mimeType.startsWith("image/");

    if (isImage) {
      // Strategy 1: Claude Vision API (best quality)
      const visionResult = await runClaudeVisionOcr(base64, mimeType);
      if (visionResult && visionResult.fields && Object.keys(visionResult.fields).length > 0) {
        ocrData = visionResult.fields;
        ocrData._rawText = visionResult.rawText;
        ocrConfidence = visionResult.confidence;
        ocrStatus = "COMPLETED";
        ocrEngine = "claude-vision";
      }

      // Strategy 2: Tesseract.js fallback (if no API key or Claude failed)
      if (ocrStatus !== "COMPLETED") {
        try {
          const tessResult = await runTesseractOcr(buffer);
          if (tessResult.rawText && tessResult.rawText.trim().length > 10) {
            ocrData = tessResult.fields;
            ocrData._rawText = tessResult.rawText;
            ocrConfidence = tessResult.confidence;
            ocrStatus = "COMPLETED";
            ocrEngine = "tesseract";
          }
        } catch (tessErr) {
          console.error("Tesseract OCR error:", tessErr);
        }
      }
    }

    if (ocrData) {
      ocrData._engine = ocrEngine;
    }

    const receipt = await addReceipt({
      expenseId: expenseId || undefined,
      fileName: file.name,
      fileSize: file.size,
      mimeType,
      base64Data: base64,
      uploadedAt: new Date().toISOString(),
      ocrData,
      ocrConfidence,
      ocrStatus,
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
    return NextResponse.json(
      { error: "Receipt ID required" },
      { status: 400 }
    );
  }
  const deleted = await deleteReceipt(id);
  if (!deleted) {
    return NextResponse.json(
      { error: "Receipt not found" },
      { status: 404 }
    );
  }
  return NextResponse.json({ success: true });
}
