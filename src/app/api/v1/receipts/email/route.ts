import { NextRequest, NextResponse } from "next/server";
import { addReceipt, addExpense, getReceipts } from "@/lib/store";

// Simulates receiving a forwarded receipt email
// In production: Kafka consumer or webhook from bank's email management system
export async function POST(req: NextRequest) {
  const body = await req.json();

  // Expected payload from email system:
  // { from: string, subject: string, body: string, attachments: [{ fileName, base64Data, mimeType }], employeeId?: string }

  const { from, subject, body: emailBody, attachments, employeeId } = body;

  if (!from || !attachments?.length) {
    return NextResponse.json(
      { error: "Email must have sender and at least one attachment" },
      { status: 400 }
    );
  }

  const results: { receiptId: string; expenseId: string; ocrData: Record<string, any> }[] = [];

  for (const attachment of attachments) {
    // Create receipt record
    const receipt = addReceipt({
      fileName: attachment.fileName || "email-receipt.jpg",
      fileSize: attachment.base64Data
        ? Math.round(attachment.base64Data.length * 0.75)
        : 0,
      mimeType: attachment.mimeType || "image/jpeg",
      base64Data: attachment.base64Data || "",
      uploadedAt: new Date().toISOString(),
      ocrData: simulateEmailOcr(subject, emailBody),
      ocrConfidence: {
        overall: 0.85,
        merchantName: 0.9,
        amount: 0.88,
        date: 0.82,
      },
      ocrStatus: "COMPLETED",
      source: "EMAIL",
    });

    // Auto-create draft expense from OCR data
    const ocrData = receipt.ocrData as Record<string, any>;
    const expense = addExpense({
      amount: ocrData.amount || 0,
      originalCurrency: "INR",
      category: ocrData.category || "Miscellaneous",
      merchantName: ocrData.merchantName || subject || "Unknown",
      date: ocrData.date || new Date().toISOString(),
      employeeId: employeeId || resolveEmployeeFromEmail(from),
      employeeName: "",
      type: "CARD",
      policyStatus: "COMPLIANT",
      hasReceipt: true,
      businessPurpose: `Auto-created from email: ${subject}`,
      status: "DRAFT",
    } as any);

    results.push({
      receiptId: receipt.id,
      expenseId: expense.id,
      ocrData: receipt.ocrData,
    });
  }

  return NextResponse.json(
    {
      message: `Processed ${results.length} attachment(s) from email`,
      results,
    },
    { status: 201 }
  );
}

function simulateEmailOcr(subject: string, body: string) {
  // Extract hints from email subject/body
  const amountMatch = (body || subject || "").match(
    /(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{2})?)/i
  );
  const amount = amountMatch
    ? parseFloat(amountMatch[1].replace(/,/g, ""))
    : Math.round(Math.random() * 15000 + 500);

  const merchants = [
    "Taj Hotels",
    "IndiGo Airlines",
    "Uber India",
    "Amazon India",
    "MakeMyTrip",
  ];
  const hash = (subject || "")
    .split("")
    .reduce((a, c) => a + c.charCodeAt(0), 0);

  return {
    merchantName: merchants[hash % merchants.length],
    amount,
    currency: "INR",
    date: new Date().toISOString().split("T")[0],
    category: "Miscellaneous",
    source: "EMAIL_FORWARD",
  };
}

function resolveEmployeeFromEmail(email: string): string {
  // Map known email addresses to employee IDs
  const emailMap: Record<string, string> = {
    "admin@corpcardpro.com": "emp-1",
    "company@corpcardpro.com": "emp-2",
    "finance@corpcardpro.com": "emp-3",
    "manager@corpcardpro.com": "emp-4",
    "employee@corpcardpro.com": "emp-5",
  };
  return emailMap[email.toLowerCase()] || "emp-1";
}

// GET: List email-sourced receipts
export async function GET() {
  const emailReceipts = getReceipts().filter(
    (r) => r.source === "EMAIL"
  );
  return NextResponse.json(emailReceipts);
}
