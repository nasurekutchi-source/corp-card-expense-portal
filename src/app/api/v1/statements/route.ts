import { NextRequest, NextResponse } from "next/server";
import { getCardStatements, getCorporateStatements } from "@/lib/repository";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || undefined;

    const cardFilters = {
      cardId: searchParams.get("cardId") || undefined,
      employeeId: searchParams.get("employeeId") || undefined,
      companyId: searchParams.get("companyId") || undefined,
      statementPeriod: searchParams.get("period") || undefined,
      status: searchParams.get("status") || undefined,
      search: searchParams.get("search") || undefined,
    };

    const corporateFilters = {
      companyId: searchParams.get("companyId") || undefined,
      statementPeriod: searchParams.get("period") || undefined,
      status: searchParams.get("status") || undefined,
    };

    // If type is specified, only return that type; otherwise return both
    const cardStatements = type === "corporate" ? [] : await getCardStatements(cardFilters);
    const corporateStatements = type === "card" ? [] : await getCorporateStatements(corporateFilters);

    return NextResponse.json({
      data: { cardStatements, corporateStatements },
      total: cardStatements.length + corporateStatements.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch statements", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
