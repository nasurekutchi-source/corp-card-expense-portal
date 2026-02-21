import { NextRequest, NextResponse } from "next/server";
import {
  getPaymentCycles,
  getPaymentApportionments,
  addPaymentCycle,
  updatePaymentCycle,
} from "@/lib/store";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const cycleFilters = {
      companyId: searchParams.get("companyId") || undefined,
      statementPeriod: searchParams.get("period") || undefined,
      status: searchParams.get("status") || undefined,
    };

    const apportionmentFilters = {
      paymentCycleId: searchParams.get("cycleId") || undefined,
      employeeId: searchParams.get("employeeId") || undefined,
      status: searchParams.get("status") || undefined,
    };

    const paymentCycles = getPaymentCycles(cycleFilters);
    const paymentApportionments = searchParams.get("cycleId")
      ? getPaymentApportionments(apportionmentFilters)
      : [];

    return NextResponse.json({
      data: { paymentCycles, paymentApportionments },
      total: paymentCycles.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch payments", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // If body contains an id and updates, treat as updatePaymentCycle
    if (body.id && body.updates) {
      const updated = updatePaymentCycle(body.id, body.updates);
      if (!updated) {
        return NextResponse.json(
          { error: "Payment cycle not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ data: updated, message: "Payment cycle updated" });
    }

    // Otherwise create a new payment cycle
    if (!body.companyId) {
      return NextResponse.json(
        { error: "Missing required field: companyId" },
        { status: 400 }
      );
    }

    const cycle = addPaymentCycle(body);
    return NextResponse.json({ data: cycle, message: "Payment cycle created" }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process payment", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
