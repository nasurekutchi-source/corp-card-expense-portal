"use client";

import { use, useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { PageHeader } from "@/components/shared/page-header";
import { formatDate, formatINR } from "@/lib/utils";
import { toast } from "sonner";
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  Clock,
  Receipt,
  Shield,
  AlertTriangle,
  Send,
  XCircle,
  IndianRupee,
  Building2,
  User,
  Loader2,
  Download,
  History,
  Banknote,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";

interface ExpenseReport {
  id: string;
  reportNumber: string;
  employeeId: string;
  employeeName: string;
  department: string;
  title: string;
  status: string;
  totalAmount: number;
  currency: string;
  expenseCount: number;
  period: string;
  submittedAt: string | null;
  approvedAt: string | null;
  paidAt: string | null;
  policyScore: number;
}

interface Expense {
  id: string;
  amount: number;
  category: string;
  merchantName: string;
  date: string;
  policyStatus: string;
  hasReceipt: boolean;
  businessPurpose: string;
  gstDetails?: { gstin: string; cgst: number; sgst: number; igst: number };
  costCenterName?: string;
  glCode?: string;
}

const STATUS_STEPS = [
  { key: "DRAFT", label: "Draft" },
  { key: "SUBMITTED", label: "Submitted" },
  { key: "IN_REVIEW", label: "In Review" },
  { key: "APPROVED", label: "Approved" },
  { key: "PROCESSING", label: "Processing" },
  { key: "PAID", label: "Paid" },
];

function getStepIndex(status: string): number {
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

export default function ExpenseReportDetailPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = use(params);
  const router = useRouter();
  const [report, setReport] = useState<ExpenseReport | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch report data
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/v1/expense-reports/${reportId}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setReport(data.data || data);

        // Fetch expenses for this employee to show in the report
        const empId = (data.data || data).employeeId;
        if (empId) {
          const expRes = await fetch(`/api/v1/expenses?employeeId=${empId}`);
          if (expRes.ok) {
            const expData = await expRes.json();
            // Show up to expenseCount expenses
            setExpenses(
              (expData.data || []).slice(
                0,
                (data.data || data).expenseCount || 10
              )
            );
          }
        }
      } catch {
        toast.error("Expense report not found");
      } finally {
        setLoading(false);
      }
    })();
  }, [reportId]);

  // GST breakdown
  const gstBreakdown = useMemo(() => {
    let cgst = 0,
      sgst = 0,
      igst = 0;
    for (const e of expenses) {
      if (e.gstDetails) {
        cgst += e.gstDetails.cgst || 0;
        sgst += e.gstDetails.sgst || 0;
        igst += e.gstDetails.igst || 0;
      }
    }
    return { cgst, sgst, igst, total: cgst + sgst + igst };
  }, [expenses]);

  // Policy analysis
  const policyAnalysis = useMemo(() => {
    const compliant = expenses.filter(
      (e) => e.policyStatus === "COMPLIANT"
    ).length;
    const violations = expenses.filter((e) =>
      ["SOFT_VIOLATION", "HARD_VIOLATION"].includes(e.policyStatus)
    ).length;
    const total = expenses.length;
    const score = total > 0 ? Math.round((compliant / total) * 100) : 100;
    return { compliant, violations, total, score };
  }, [expenses]);

  // Receipt stats
  const receiptStats = useMemo(() => {
    const withReceipt = expenses.filter((e) => e.hasReceipt).length;
    return {
      withReceipt,
      withoutReceipt: expenses.length - withReceipt,
      pct:
        expenses.length > 0
          ? Math.round((withReceipt / expenses.length) * 100)
          : 0,
    };
  }, [expenses]);

  // Submit report for approval
  const handleSubmit = useCallback(async () => {
    if (!report) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/expense-reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "SUBMITTED",
          submittedAt: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      const data = await res.json();
      setReport(data.data || data);
      toast.success(
        "Report submitted for approval. An approval request has been created."
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to submit report"
      );
    } finally {
      setActionLoading(false);
    }
  }, [report, reportId]);

  // Delete draft report
  const handleDelete = useCallback(async () => {
    if (!report) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/v1/expense-reports/${reportId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Report deleted");
      router.push("/expense-reports");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete report"
      );
    } finally {
      setActionLoading(false);
    }
  }, [report, reportId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading report...</span>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <XCircle className="w-12 h-12 mx-auto text-muted-foreground/40" />
            <h2 className="text-lg font-semibold">Report Not Found</h2>
            <p className="text-sm text-muted-foreground">
              The expense report you are looking for does not exist.
            </p>
            <Button asChild>
              <Link href="/expense-reports">Back to Reports</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStep = getStepIndex(report.status);
  const isRejected = report.status === "REJECTED";

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title={report.reportNumber}
        description={`${report.title} · ${report.employeeName} · ${report.department}`}
      >
        <Button variant="outline" asChild>
          <Link href="/expense-reports">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </Button>
        {report.status === "DRAFT" && (
          <>
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={actionLoading}
              className="text-red-600 hover:text-red-700"
            >
              <XCircle className="w-4 h-4" />
              Delete Draft
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={actionLoading}
              style={{ backgroundColor: "#0d3b66" }}
              className="hover:opacity-90"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Submit for Approval
            </Button>
          </>
        )}
        {report.status === "SUBMITTED" && (
          <Badge variant="warning" className="text-xs">
            Awaiting Approval
          </Badge>
        )}
        {report.status === "APPROVED" && (
          <Badge variant="success" className="text-xs">
            Approved
          </Badge>
        )}
      </PageHeader>

      {/* Status Progress */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            {STATUS_STEPS.map((step, i) => {
              const isActive = i <= currentStep && !isRejected;
              const isCurrent = i === currentStep;
              return (
                <div key={step.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                        isRejected && isCurrent
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : isActive
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isActive && !isRejected ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : isRejected && isCurrent ? (
                        <XCircle className="w-4 h-4" />
                      ) : (
                        i + 1
                      )}
                    </div>
                    <p
                      className={`text-[10px] mt-1 ${
                        isCurrent ? "font-semibold" : "text-muted-foreground"
                      }`}
                    >
                      {isRejected && isCurrent ? "Rejected" : step.label}
                    </p>
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-1 rounded ${
                        i < currentStep && !isRejected
                          ? "bg-emerald-400"
                          : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Amount Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Total Amount
                  </p>
                  <CurrencyDisplay
                    amount={report.totalAmount}
                    className="text-3xl font-bold mt-1"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {report.expenseCount} expense
                    {report.expenseCount !== 1 ? "s" : ""} &middot;{" "}
                    {report.currency}
                  </p>
                </div>
                <StatusBadge status={report.status} />
              </div>

              {gstBreakdown.total > 0 && (
                <div className="mt-4 pt-4 border-t flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <IndianRupee className="w-3.5 h-3.5" />
                    <span>GST: {formatINR(gstBreakdown.total)}</span>
                  </div>
                  {gstBreakdown.cgst > 0 && (
                    <Badge variant="outline" className="text-[9px]">
                      CGST: {formatINR(gstBreakdown.cgst)}
                    </Badge>
                  )}
                  {gstBreakdown.sgst > 0 && (
                    <Badge variant="outline" className="text-[9px]">
                      SGST: {formatINR(gstBreakdown.sgst)}
                    </Badge>
                  )}
                  {gstBreakdown.igst > 0 && (
                    <Badge variant="outline" className="text-[9px]">
                      IGST: {formatINR(gstBreakdown.igst)}
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Report Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Report Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Report Number</span>
                  <span className="font-mono font-medium">
                    {report.reportNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge status={report.status} />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Employee</span>
                  <span>{report.employeeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Department</span>
                  <span>{report.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Period</span>
                  <span>{report.period}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expenses</span>
                  <span>{report.expenseCount}</span>
                </div>
                {report.submittedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Submitted</span>
                    <span>{formatDate(report.submittedAt)}</span>
                  </div>
                )}
                {report.approvedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Approved</span>
                    <span>{formatDate(report.approvedAt)}</span>
                  </div>
                )}
                {report.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid</span>
                    <span>{formatDate(report.paidAt)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Expense Line Items */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                Expenses ({expenses.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No expenses in this report</p>
                  <p className="text-xs mt-1">
                    Expenses will appear here once linked.
                  </p>
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 text-xs text-muted-foreground">
                        <th className="text-left px-3 py-2 font-medium">
                          Merchant
                        </th>
                        <th className="text-left px-3 py-2 font-medium">
                          Category
                        </th>
                        <th className="text-left px-3 py-2 font-medium">
                          Date
                        </th>
                        <th className="text-center px-3 py-2 font-medium">
                          Receipt
                        </th>
                        <th className="text-center px-3 py-2 font-medium">
                          Policy
                        </th>
                        <th className="text-right px-3 py-2 font-medium">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {expenses.map((exp) => (
                        <tr key={exp.id} className="hover:bg-muted/30">
                          <td className="px-3 py-2">
                            <p className="font-medium">{exp.merchantName}</p>
                            {exp.businessPurpose && (
                              <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                                {exp.businessPurpose}
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {exp.category}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {formatDate(exp.date)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {exp.hasReceipt ? (
                              <Badge
                                variant="success"
                                className="text-[9px]"
                              >
                                Yes
                              </Badge>
                            ) : (
                              <Badge
                                variant="destructive"
                                className="text-[9px]"
                              >
                                Missing
                              </Badge>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {exp.policyStatus === "COMPLIANT" ? (
                              <ShieldCheck className="w-4 h-4 text-emerald-500 mx-auto" />
                            ) : (
                              <ShieldAlert className="w-4 h-4 text-amber-500 mx-auto" />
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <CurrencyDisplay
                              amount={exp.amount}
                              className="text-sm font-medium"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/50 font-semibold">
                        <td
                          colSpan={5}
                          className="px-3 py-2 text-right text-xs uppercase tracking-wider text-muted-foreground"
                        >
                          Total
                        </td>
                        <td className="px-3 py-2 text-right">
                          <CurrencyDisplay
                            amount={report.totalAmount}
                            className="text-sm font-bold"
                          />
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Policy Compliance */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Policy Compliance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-3">
                <span
                  className={`text-3xl font-bold ${
                    report.policyScore >= 80
                      ? "text-emerald-600 dark:text-emerald-400"
                      : report.policyScore >= 50
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {report.policyScore}%
                </span>
                <p className="text-[10px] text-muted-foreground">
                  Compliance Score
                </p>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Compliant
                  </span>
                  <span className="font-semibold">
                    {policyAnalysis.compliant}
                  </span>
                </div>
                {policyAnalysis.violations > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      Violations
                    </span>
                    <span className="font-semibold text-amber-600">
                      {policyAnalysis.violations}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Receipt Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                Receipts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Attached
                  </span>
                  <span className="font-semibold">
                    {receiptStats.withReceipt}
                  </span>
                </div>
                {receiptStats.withoutReceipt > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      Missing
                    </span>
                    <span className="font-semibold text-amber-600">
                      {receiptStats.withoutReceipt}
                    </span>
                  </div>
                )}
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${receiptStats.pct}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground text-center">
                  {receiptStats.pct}% receipts attached
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <History className="w-4 h-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    label: "Report created",
                    time: report.period
                      ? `${report.period}-01T00:00:00Z`
                      : null,
                    done: true,
                  },
                  {
                    label: "Submitted for approval",
                    time: report.submittedAt,
                    done: !!report.submittedAt,
                  },
                  {
                    label: "Approved",
                    time: report.approvedAt,
                    done: !!report.approvedAt,
                  },
                  {
                    label: "Reimbursement paid",
                    time: report.paidAt,
                    done: !!report.paidAt,
                  },
                ].map((step, i, arr) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          step.done ? "bg-emerald-500" : "bg-muted"
                        }`}
                      />
                      {i < arr.length - 1 && (
                        <div className="w-px h-full bg-border" />
                      )}
                    </div>
                    <div className="pb-3">
                      <p
                        className={`text-xs font-medium ${
                          step.done ? "" : "text-muted-foreground"
                        }`}
                      >
                        {step.label}
                      </p>
                      {step.time && (
                        <p className="text-[10px] text-muted-foreground">
                          {formatDate(step.time)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {report.status === "DRAFT" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={handleSubmit}
                  disabled={actionLoading}
                >
                  <Send className="w-3.5 h-3.5 mr-2" />
                  Submit for Approval
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  const csv = [
                    "Merchant,Category,Date,Amount,Receipt,Policy",
                    ...expenses.map(
                      (e) =>
                        `"${e.merchantName}","${e.category}","${e.date}",${e.amount},${e.hasReceipt ? "Yes" : "No"},"${e.policyStatus}"`
                    ),
                  ].join("\n");
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${report.reportNumber}-expenses.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success("Expenses exported to CSV");
                }}
              >
                <Download className="w-3.5 h-3.5 mr-2" />
                Export to CSV
              </Button>
              {["APPROVED", "PROCESSING", "PAID"].includes(report.status) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  asChild
                >
                  <Link href="/reimbursements">
                    <Banknote className="w-3.5 h-3.5 mr-2" />
                    View Reimbursement
                  </Link>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                asChild
              >
                <Link href="/expense-reports">
                  <FileText className="w-3.5 h-3.5 mr-2" />
                  All Reports
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
