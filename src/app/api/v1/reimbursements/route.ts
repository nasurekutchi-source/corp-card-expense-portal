import { NextRequest, NextResponse } from "next/server";
import {
  getReimbursements,
  initiateReimbursement,
  processReimbursement,
  completeReimbursement,
  failReimbursement,
} from "@/lib/store";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") || undefined;
    const employeeId = searchParams.get("employeeId") || undefined;
    const format = searchParams.get("format");

    const reimbursements = getReimbursements({ status, employeeId });

    // NEFT payment file generation
    if (format === "neft") {
      const pending = reimbursements.filter(
        (r) => r.status === "PENDING" || r.status === "INITIATED"
      );
      if (pending.length === 0) {
        return NextResponse.json(
          { error: "No pending reimbursements for payment file" },
          { status: 400 }
        );
      }

      // Generate NEFT payment instruction CSV
      let csv =
        "Sr No,Beneficiary Name,Account Number,IFSC Code,Bank Name,Amount (INR),Payment Ref,Report Number,Department\n";
      pending.forEach((r, i) => {
        csv += `${i + 1},"${r.employeeName}","${r.bankAccount}","${r.ifscCode}","${r.bankName}",${r.netAmount.toFixed(2)},"NEFT-${Date.now()}-${i + 1}","${r.reportNumber}","${r.department}"\n`;
      });

      // Add summary row
      const totalAmount = pending.reduce((sum, r) => sum + r.netAmount, 0);
      csv += `\n,,,,"TOTAL",${totalAmount.toFixed(2)},,,"${pending.length} payments"\n`;

      const now = new Date().toISOString().split("T")[0];
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="neft-payment-${now}.csv"`,
        },
      });
    }

    return NextResponse.json({ data: reimbursements, total: reimbursements.length });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch reimbursements", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, id, ids, paymentRef, reason } = body;

    if (action === "initiate" && id) {
      const result = initiateReimbursement(id);
      if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ data: result, message: "Reimbursement initiated" });
    }

    if (action === "process" && id) {
      const ref = paymentRef || `NEFT${Date.now()}`;
      const result = processReimbursement(id, ref);
      if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ data: result, message: "Reimbursement processing" });
    }

    if (action === "complete" && id) {
      const result = completeReimbursement(id);
      if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ data: result, message: "Reimbursement completed" });
    }

    if (action === "fail" && id) {
      const result = failReimbursement(id, reason || "Payment failed");
      if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ data: result, message: "Reimbursement failed" });
    }

    // Bulk initiate
    if (action === "bulk-initiate" && Array.isArray(ids)) {
      const results = ids.map((rid: string) => initiateReimbursement(rid)).filter(Boolean);
      return NextResponse.json({ data: { initiated: results.length }, message: `${results.length} reimbursements initiated` });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process reimbursement action", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
