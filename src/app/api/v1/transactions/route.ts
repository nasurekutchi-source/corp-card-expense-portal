import { NextRequest, NextResponse } from "next/server";
import { getTransactions, addTransaction } from "@/lib/store";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filters = {
      status: searchParams.get("status") || undefined,
      employeeId: searchParams.get("employeeId") || undefined,
      cardId: searchParams.get("cardId") || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      category: searchParams.get("category") || undefined,
      search: searchParams.get("search") || undefined,
    };

    const transactions = getTransactions(filters);
    return NextResponse.json({ data: transactions, total: transactions.length });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch transactions", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.cardId || !body.amount || !body.merchantName) {
      return NextResponse.json(
        { error: "Missing required fields: cardId, amount, merchantName" },
        { status: 400 }
      );
    }

    const transaction = addTransaction(body);
    return NextResponse.json({ data: transaction }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create transaction", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
