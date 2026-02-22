import { NextRequest, NextResponse } from "next/server";
import { getExpenseReports, addExpenseReport } from "@/lib/repository";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filters = {
      status: searchParams.get("status") || undefined,
      employeeId: searchParams.get("employeeId") || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      search: searchParams.get("search") || undefined,
    };

    const reports = await getExpenseReports(filters);
    return NextResponse.json({ data: reports, total: reports.length });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch expense reports", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.employeeId || !body.title) {
      return NextResponse.json(
        { error: "Missing required fields: employeeId, title" },
        { status: 400 }
      );
    }

    const report = await addExpenseReport({
      ...body,
      reportNumber: `EXP-2026-${String(Date.now()).slice(-4)}`,
      status: body.status || "DRAFT",
      totalAmount: body.totalAmount || 0,
      currency: body.currency || "INR",
      expenseCount: body.expenseCount || 0,
      period: body.period || new Date().toISOString().slice(0, 7),
      submittedAt: null,
      approvedAt: null,
      paidAt: null,
      policyScore: body.policyScore || 100,
    });

    return NextResponse.json({ data: report }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create expense report", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
