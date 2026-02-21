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

    if (!body.amount || !body.category || !body.employeeId) {
      return NextResponse.json(
        { error: "Missing required fields: amount, category, employeeId" },
        { status: 400 }
      );
    }

    const expense = addExpense(body);
    return NextResponse.json({ data: expense }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create expense", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
