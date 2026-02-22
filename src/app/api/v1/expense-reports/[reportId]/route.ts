import { NextRequest, NextResponse } from "next/server";
import {
  getExpenseReport,
  updateExpenseReport,
  deleteExpenseReport,
  addApproval,
  addReimbursement,
} from "@/lib/repository";

// GET /api/v1/expense-reports/[reportId]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const { reportId } = await params;
  const report = await getExpenseReport(reportId);
  if (!report) {
    return NextResponse.json(
      { error: "Expense report not found" },
      { status: 404 }
    );
  }
  return NextResponse.json({ data: report });
}

// PATCH /api/v1/expense-reports/[reportId] — update status, submit, etc.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const { reportId } = await params;
  const body = await req.json();

  const existing = await getExpenseReport(reportId);
  if (!existing) {
    return NextResponse.json(
      { error: "Expense report not found" },
      { status: 404 }
    );
  }

  const updated = await updateExpenseReport(reportId, body);
  if (!updated) {
    return NextResponse.json(
      { error: "Failed to update expense report" },
      { status: 500 }
    );
  }

  // When a report is SUBMITTED, automatically create an approval record
  if (body.status === "SUBMITTED" && existing.status !== "SUBMITTED") {
    await addApproval({
      entityType: "EXPENSE_REPORT",
      entityId: reportId,
      reportNumber: updated.reportNumber,
      employeeName: updated.employeeName,
      department: updated.department,
      amount: updated.totalAmount,
      expenseCount: updated.expenseCount,
      status: "PENDING",
      level: 1,
      submittedAt: updated.submittedAt || new Date().toISOString(),
      dueAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      policyScore: updated.policyScore,
    });
  }

  return NextResponse.json({ data: updated });
}

// DELETE /api/v1/expense-reports/[reportId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const { reportId } = await params;

  const existing = await getExpenseReport(reportId);
  if (!existing) {
    return NextResponse.json(
      { error: "Expense report not found" },
      { status: 404 }
    );
  }

  // Only allow deleting drafts
  if (existing.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Only draft reports can be deleted" },
      { status: 400 }
    );
  }

  const deleted = await deleteExpenseReport(reportId);
  if (!deleted) {
    return NextResponse.json(
      { error: "Failed to delete expense report" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
