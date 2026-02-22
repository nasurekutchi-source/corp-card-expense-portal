import { NextRequest, NextResponse } from "next/server";
import { getExpenses, addExpense } from "@/lib/store";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filters = {
      employeeId: searchParams.get("employeeId") || undefined,
      category: searchParams.get("category") || undefined,
      policyStatus: searchParams.get("policyStatus") || undefined,
      type: searchParams.get("type") || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      search: searchParams.get("search") || undefined,
    };

    const expenses = getExpenses(filters);
    return NextResponse.json({ data: expenses, total: expenses.length });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch expenses", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const missing: string[] = [];
    if (!body.amount || Number(body.amount) <= 0) missing.push("amount");
    if (!body.category) missing.push("category");
    if (!body.employeeId) missing.push("employeeId");

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate amount is a valid number
    const amount = Number(body.amount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number" },
        { status: 400 }
      );
    }

    // Normalize the payload
    const expenseData = {
      ...body,
      amount,
      hasReceipt: body.hasReceipt === true,
    };

    const expense = addExpense(expenseData);
    return NextResponse.json({ data: expense }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create expense", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
