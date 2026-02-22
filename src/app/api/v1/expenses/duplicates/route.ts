import { NextRequest, NextResponse } from "next/server";
import { detectDuplicateExpenses } from "@/lib/store";

export async function GET(req: NextRequest) {
  const amount = parseFloat(req.nextUrl.searchParams.get("amount") || "0");
  const merchant = req.nextUrl.searchParams.get("merchant") || "";
  const date = req.nextUrl.searchParams.get("date") || new Date().toISOString();
  const employeeId = req.nextUrl.searchParams.get("employeeId") || undefined;
  const excludeId = req.nextUrl.searchParams.get("excludeId") || undefined;

  if (!amount || !merchant) {
    return NextResponse.json([]);
  }

  const duplicates = detectDuplicateExpenses(amount, merchant, date, employeeId, excludeId);
  return NextResponse.json(duplicates);
}
