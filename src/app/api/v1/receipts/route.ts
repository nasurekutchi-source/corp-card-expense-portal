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
// OCR: Extract text from image using Tesseract.js, then parse fields
// =============================================================================

async function runOcr(imageBuffer: Buffer): Promise<{
  rawText: string;
  fields: Record<string, any>;
  confidence: Record<string, number>;
}> {
  // Dynamic import — tesseract.js is in serverExternalPackages so Node resolves it directly
  const Tesseract = await import("tesseract.js");

  // Let Tesseract auto-detect Node.js worker paths (do NOT override with dist/ browser bundle)
  const worker = await Tesseract.createWorker("eng", undefined, {
    cachePath: "/tmp/tesseract-cache",
  });
  try {
    const { data } = await worker.recognize(imageBuffer);
    const rawText = data.text;
    const overallConfidence = data.confidence; // 0-100

    // Parse structured fields from raw OCR text
    const fields = parseReceiptText(rawText);

    const conf = (overallConfidence || 0) / 100; // normalize to 0-1
    const confidence: Record<string, number> = {
      overall: conf,
      merchantName: fields.merchantName ? conf : 0,
      amount: fields.amount ? Math.min(conf + 0.05, 1) : 0,
      date: fields.date ? conf : 0,
      gstin: fields.gstin ? Math.min(conf + 0.1, 1) : 0,
    };

    return { rawText, fields, confidence };
  } finally {
    await worker.terminate();
  }
}

// =============================================================================
// Parse receipt text into structured fields
// =============================================================================

function parseReceiptText(text: string): Record<string, any> {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const fullText = text.toUpperCase();
  const fields: Record<string, any> = {};

  // --- Merchant Name: usually one of the first non-empty lines ---
  // Skip lines that look like addresses, dates, or numbers
  for (const line of lines.slice(0, 8)) {
    const clean = line.trim();
    if (!clean || clean.length < 3) continue;
    // Skip if it's mostly numbers, a date, or a common header like "TAX INVOICE"
    if (/^\d[\d\s.,:/-]+$/.test(clean)) continue;
    if (/^(TAX\s+INVOICE|INVOICE|RECEIPT|BILL|ORIGINAL|DUPLICATE|CASH\s+MEMO)/i.test(clean)) continue;
    if (/^(GST|GSTIN|PAN|CIN|TIN|FSSAI)/i.test(clean)) continue;
    if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(clean)) continue;
    // This is likely the merchant name
    fields.merchantName = clean.replace(/[|]/g, "").trim();
    break;
  }

  // --- Amount: look for total/grand total/amount due patterns ---
  // Match patterns like "Total: 929.26", "Grand Total ₹1,234.56", "AMOUNT DUE: Rs. 500"
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

  // If no total found, look for the largest amount on the receipt
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

  // --- Date: look for date patterns ---
  const datePatterns = [
    // DD/MM/YYYY or DD-MM-YYYY
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](20\d{2})/,
    // DD Mon YYYY or DD Mon 'YY
    /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,']+(\d{2,4})/i,
    // YYYY-MM-DD
    /(20\d{2})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
  ];
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        let dateStr = match[0];
        // Try to parse it
        const d = new Date(dateStr);
        if (!isNaN(d.getTime()) && d.getFullYear() >= 2020) {
          fields.date = d.toISOString().split("T")[0];
          break;
        }
        // Try DD/MM/YYYY manually
        if (/(\d{1,2})[\/\-](\d{1,2})[\/\-](20\d{2})/.test(dateStr)) {
          const parts = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](20\d{2})/);
          if (parts) {
            const day = parseInt(parts[1]);
            const month = parseInt(parts[2]);
            const year = parseInt(parts[3]);
            if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
              fields.date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              break;
            }
          }
        }
        // Try DD Mon YYYY
        const monthMap: Record<string, string> = {
          jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
          jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
        };
        const monMatch = dateStr.match(/(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,']+(\d{2,4})/i);
        if (monMatch) {
          const day = monMatch[1].padStart(2, "0");
          const mon = monthMap[monMatch[2].toLowerCase().slice(0, 3)] || "01";
          let year = monMatch[3];
          if (year.length === 2) year = "20" + year;
          fields.date = `${year}-${mon}-${day}`;
          break;
        }
      } catch {
        // skip invalid date
      }
    }
  }

  // --- GSTIN: 15-char alphanumeric pattern ---
  const gstinMatch = text.match(/\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z\d][A-Z\d]/);
  if (gstinMatch) {
    fields.gstin = gstinMatch[0];
  }

  // --- GST amounts: CGST, SGST, IGST ---
  const cgstMatch = text.match(/CGST[:\s@%0-9.]*[₹Rs.\s]*([0-9,]+\.?\d{0,2})/i);
  if (cgstMatch) fields.cgst = parseFloat(cgstMatch[1].replace(/,/g, ""));

  const sgstMatch = text.match(/SGST[:\s@%0-9.]*[₹Rs.\s]*([0-9,]+\.?\d{0,2})/i);
  if (sgstMatch) fields.sgst = parseFloat(sgstMatch[1].replace(/,/g, ""));

  const igstMatch = text.match(/IGST[:\s@%0-9.]*[₹Rs.\s]*([0-9,]+\.?\d{0,2})/i);
  if (igstMatch) fields.igst = parseFloat(igstMatch[1].replace(/,/g, ""));

  // --- GST rate ---
  const gstRateMatch = text.match(/(?:GST|TAX)[:\s@]*(\d{1,2}(?:\.\d+)?)\s*%/i);
  if (gstRateMatch) fields.gstRate = parseFloat(gstRateMatch[1]);

  // --- Invoice number ---
  const invMatch = text.match(/(?:INVOICE|INV|BILL)\s*(?:NO|NUMBER|#)?[:\s]*([A-Z0-9\-\/]+)/i);
  if (invMatch) fields.invoiceNumber = invMatch[1];

  // --- Category guess based on keywords ---
  if (fullText.includes("HOTEL") || fullText.includes("LODGE") || fullText.includes("ROOM") || fullText.includes("CHECK-IN") || fullText.includes("IBIS") || fullText.includes("TAJ") || fullText.includes("MARRIOTT") || fullText.includes("HYATT")) {
    fields.category = "Travel";
    fields.subcategory = "Hotel / Lodging";
  } else if (fullText.includes("AIRLINE") || fullText.includes("FLIGHT") || fullText.includes("BOARDING") || fullText.includes("INDIGO") || fullText.includes("SPICEJET") || fullText.includes("AIR INDIA")) {
    fields.category = "Travel";
    fields.subcategory = "Airfare";
  } else if (fullText.includes("UBER") || fullText.includes("OLA") || fullText.includes("CAB") || fullText.includes("TAXI") || fullText.includes("RIDE")) {
    fields.category = "Travel";
    fields.subcategory = "Ground Transportation";
  } else if (fullText.includes("RESTAURANT") || fullText.includes("CAFE") || fullText.includes("COFFEE") || fullText.includes("FOOD") || fullText.includes("MEAL") || fullText.includes("DINING") || fullText.includes("KITCHEN") || fullText.includes("KHICHADI") || fullText.includes("BIRYANI") || fullText.includes("DAL")) {
    fields.category = "Meals";
    fields.subcategory = "Business Meals";
  } else if (fullText.includes("STARBUCKS") || fullText.includes("CCD") || fullText.includes("CHAAYOS")) {
    fields.category = "Meals";
    fields.subcategory = "Business Meals";
  }

  return fields;
}

// =============================================================================
// POST /api/v1/receipts — multipart/form-data file upload with real OCR
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

    // 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    const expenseId = formData.get("expenseId") as string | null;

    // Read file to buffer and base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const mimeType = file.type || "image/jpeg";

    // Run real OCR on the image
    let ocrData: Record<string, any> | null = null;
    let ocrConfidence: Record<string, number> | null = null;
    let ocrStatus: "COMPLETED" | "FAILED" = "FAILED";

    try {
      const isImage = mimeType.startsWith("image/");
      if (isImage) {
        const result = await runOcr(buffer);
        if (result.rawText && result.rawText.trim().length > 0) {
          ocrData = result.fields;
          ocrData._rawText = result.rawText; // include raw text for debugging
          ocrConfidence = result.confidence;
          ocrStatus = "COMPLETED";
        }
      }
    } catch (ocrErr) {
      console.error("OCR processing error:", ocrErr);
      // OCR failed but receipt is still stored
    }

    const receipt = addReceipt({
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
    return NextResponse.json({ error: "Receipt ID required" }, { status: 400 });
  }
  const deleted = deleteReceipt(id);
  if (!deleted) {
    return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
