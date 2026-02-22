"use client";

import { use } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { PageHeader } from "@/components/shared/page-header";
import { getExpense, getExpenses, getTransaction } from "@/lib/store";
import { formatINR, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import {
  ArrowLeft,
  Edit,
  Send,
  Trash2,
  Store,
  Calendar,
  Tag,
  FileText,
  Briefcase,
  Building2,
  User,
  Receipt,
  Upload,
  Camera,
  CreditCard,
  LinkIcon,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  History,
  IndianRupee,
  Hash,
  Percent,
} from "lucide-react";

// ── Category icon mapping ──
const categoryIcons: Record<string, React.ReactNode> = {
  "Travel - Air": <Briefcase className="w-4 h-4" />,
  "Travel - Hotel": <Building2 className="w-4 h-4" />,
  "Travel - Ground": <CreditCard className="w-4 h-4" />,
  "Meals & Entertainment": <Store className="w-4 h-4" />,
  "Office Supplies": <FileText className="w-4 h-4" />,
  "Software & Subscriptions": <Tag className="w-4 h-4" />,
  "Client Entertainment": <Store className="w-4 h-4" />,
  "Training & Development": <Briefcase className="w-4 h-4" />,
};

// ── Policy compliance color helpers ──
function policyStatusColor(status: string) {
  switch (status) {
    case "COMPLIANT":
      return "text-emerald-600 bg-emerald-50 border-emerald-200";
    case "SOFT_VIOLATION":
      return "text-amber-600 bg-amber-50 border-amber-200";
    case "HARD_VIOLATION":
      return "text-red-600 bg-red-50 border-red-200";
    default:
      return "text-muted-foreground bg-muted border-border";
  }
}

function policyStatusIcon(status: string) {
  switch (status) {
    case "COMPLIANT":
      return <ShieldCheck className="w-5 h-5 text-emerald-600" />;
    case "SOFT_VIOLATION":
      return <ShieldAlert className="w-5 h-5 text-amber-600" />;
    case "HARD_VIOLATION":
      return <ShieldX className="w-5 h-5 text-red-600" />;
    default:
      return <ShieldCheck className="w-5 h-5 text-muted-foreground" />;
  }
}

// ── Hardcoded demo data for cards that need it ──
function getDemoPolicyChecks(expense: { amount: number; hasReceipt: boolean; policyStatus: string; category: string }) {
  const amountOk = expense.amount < 50000;
  const receiptOk = expense.hasReceipt || expense.amount <= 500;
  const mccOk = expense.policyStatus !== "HARD_VIOLATION";
  const budgetOk = expense.policyStatus === "COMPLIANT";

  return [
    { label: "Amount vs category cap", status: amountOk ? "pass" : expense.policyStatus === "SOFT_VIOLATION" ? "warn" : "fail" },
    { label: "Receipt requirement", status: receiptOk ? "pass" : "warn" },
    { label: "MCC category allowed", status: mccOk ? "pass" : "fail" },
    { label: "Budget check", status: budgetOk ? "pass" : expense.policyStatus === "SOFT_VIOLATION" ? "warn" : "fail" },
  ];
}

function policyScore(status: string): number {
  switch (status) {
    case "COMPLIANT":
      return 100;
    case "SOFT_VIOLATION":
      return 72;
    case "HARD_VIOLATION":
      return 35;
    default:
      return 85;
  }
}

function getDemoAuditTrail(expense: { merchantName: string; amount: number; category: string; date: string }) {
  const d = new Date(expense.date);
  return [
    { action: `Expense created from card transaction`, user: "System", timestamp: new Date(d.getTime()).toISOString() },
    { action: `Category set to "${expense.category}"`, user: "System (auto-categorized)", timestamp: new Date(d.getTime() + 60000).toISOString() },
    { action: `Amount confirmed: ${formatINR(expense.amount)}`, user: "System", timestamp: new Date(d.getTime() + 120000).toISOString() },
    { action: "Receipt uploaded via mobile camera", user: "Employee", timestamp: new Date(d.getTime() + 3600000).toISOString() },
  ];
}

function getDemoApprovalHistory(expense: { policyStatus: string; employeeName: string; date: string }) {
  const d = new Date(expense.date);
  const steps: { label: string; date: string | null; by: string | null; comment: string | null; status: "done" | "pending" }[] = [
    { label: "Created", date: d.toISOString(), by: expense.employeeName, comment: null, status: "done" },
    { label: "Submitted", date: new Date(d.getTime() + 86400000).toISOString(), by: expense.employeeName, comment: null, status: "done" },
  ];

  type Step = (typeof steps)[number];
  if (expense.policyStatus === "COMPLIANT") {
    steps.push(
      { label: "Reviewed", date: new Date(d.getTime() + 172800000).toISOString(), by: "Vikram Patel (Manager)", comment: null, status: "done" } satisfies Step,
      { label: "Approved", date: new Date(d.getTime() + 259200000).toISOString(), by: "Vikram Patel (Manager)", comment: "Looks good. Approved.", status: "done" } satisfies Step,
    );
  } else if (expense.policyStatus === "SOFT_VIOLATION") {
    steps.push(
      { label: "Reviewed", date: new Date(d.getTime() + 172800000).toISOString(), by: "Vikram Patel (Manager)", comment: "Policy warning noted", status: "done" } satisfies Step,
      { label: "Pending Approval", date: null, by: null, comment: null, status: "pending" } satisfies Step,
    );
  } else {
    steps.push(
      { label: "Reviewed", date: new Date(d.getTime() + 172800000).toISOString(), by: "Vikram Patel (Manager)", comment: "Hard violation — escalated", status: "done" } satisfies Step,
      { label: "Rejected", date: new Date(d.getTime() + 345600000).toISOString(), by: "Priya Sharma (Finance)", comment: "Exceeds policy limit. Please split or provide justification.", status: "done" } satisfies Step,
    );
  }

  return steps;
}

// ── Main Page Component ──
export default function ExpenseDetailPage({ params }: { params: Promise<{ expenseId: string }> }) {
  const { expenseId } = use(params);
  const expense = getExpense(expenseId);
  const allExpenses = getExpenses();

  if (!expense) {
    return (
      <div className="space-y-6 animate-in">
        <PageHeader title="Expense Not Found" description={`No expense found with ID "${expenseId}"`}>
          <Button variant="outline" asChild>
            <Link href="/expenses">
              <ArrowLeft className="w-4 h-4" />
              Back to Expenses
            </Link>
          </Button>
        </PageHeader>
        <Card>
          <CardContent className="p-12 text-center">
            <Receipt className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">The requested expense could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Linked transaction (if card expense)
  const linkedTxn = expense.transactionId ? getTransaction(expense.transactionId) : null;

  // Related expenses: same employee, same month
  const expenseMonth = expense.date.slice(0, 7);
  const relatedExpenses = allExpenses
    .filter((e) => e.employeeId === expense.employeeId && e.date.slice(0, 7) === expenseMonth && e.id !== expense.id)
    .slice(0, 4);
  const monthlyTotal = allExpenses
    .filter((e) => e.employeeId === expense.employeeId && e.date.slice(0, 7) === expenseMonth)
    .reduce((sum, e) => sum + e.amount, 0);

  // Demo data
  const policyChecks = getDemoPolicyChecks(expense);
  const score = policyScore(expense.policyStatus);
  const auditTrail = getDemoAuditTrail(expense);
  const approvalHistory = getDemoApprovalHistory(expense);

  // GST computations
  const gst = expense.gstDetails;
  const gstTotal = gst.cgst + gst.sgst + gst.igst;
  const baseAmount = expense.amount - gstTotal;
  const gstSlabPct = expense.amount > 0 ? Math.round((gstTotal / baseAmount) * 100) : 0;

  // Demo status — derive from policyStatus for action button logic
  const expenseStatus = expense.policyStatus === "COMPLIANT" ? "APPROVED" : expense.policyStatus === "SOFT_VIOLATION" ? "SUBMITTED" : "DRAFT";
  const isDraft = expenseStatus === "DRAFT";

  return (
    <div className="space-y-6 animate-in">
      {/* ── Header ── */}
      <PageHeader
        title={`Expense #${expense.id}`}
        description={`${expense.merchantName} · ${formatDate(expense.date)}`}
      >
        <Button variant="outline" asChild>
          <Link href="/expenses">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </Button>
        <StatusBadge status={expenseStatus} />
        {isDraft && (
          <>
            <Button
              variant="outline"
              onClick={() => toast.info("Edit mode — redirecting to edit form")}
            >
              <Edit className="w-4 h-4" />
              Edit
            </Button>
            <Button
              onClick={() => toast.success("Expense submitted for approval")}
            >
              <Send className="w-4 h-4" />
              Submit
            </Button>
            <Button
              variant="destructive"
              onClick={() => toast.error("Expense deleted")}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </>
        )}
      </PageHeader>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ════════ Left Column (60%) ════════ */}
        <div className="lg:col-span-3 space-y-4">
          {/* 1. Expense Summary */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-lg font-semibold">{expense.merchantName}</p>
                  <CurrencyDisplay amount={expense.amount} className="text-3xl font-bold" />
                </div>
                <Badge variant="secondary" className="text-xs">{expense.type}</Badge>
              </div>

              <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Date</span>
                  <span className="ml-auto font-medium">{formatDate(expense.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Category</span>
                  <span className="ml-auto font-medium flex items-center gap-1.5">
                    {categoryIcons[expense.category] || <Tag className="w-3.5 h-3.5" />}
                    {expense.category}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <IndianRupee className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Currency</span>
                  <span className="ml-auto font-medium">{expense.originalCurrency}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Purpose</span>
                  <span className="ml-auto font-medium text-right max-w-[200px] truncate">{expense.businessPurpose}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Allocation Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Allocation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cost Center</span>
                  <span className="font-medium">{expense.costCenterName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GL Code</span>
                  <span className="font-mono text-xs">{expense.glCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Project</span>
                  <span className="font-medium">Q4-2026 Initiative</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Department</span>
                  <span className="font-medium">{expense.costCenterName.split(" ")[0]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Employee</span>
                  <span className="font-medium flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {expense.employeeName}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. GST Details Card */}
          {gst && (gst.cgst > 0 || gst.sgst > 0 || gst.igst > 0) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <IndianRupee className="w-4 h-4" />
                  GST Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Supplier GSTIN</span>
                    <span className="font-mono text-xs">{gst.gstin}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">HSN/SAC Code</span>
                    <span className="font-mono text-xs">9963</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base Amount</span>
                    <span className="font-medium">{formatINR(baseAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CGST</span>
                    <span className="font-medium">{formatINR(gst.cgst)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SGST</span>
                    <span className="font-medium">{formatINR(gst.sgst)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IGST</span>
                    <span className="font-medium">{formatINR(gst.igst)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total (incl. GST)</span>
                    <CurrencyDisplay amount={expense.amount} className="font-semibold text-sm" />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GST Slab</span>
                    <Badge variant="outline" className="text-[9px]">
                      <Percent className="w-2.5 h-2.5 mr-0.5" />
                      {gstSlabPct}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 4. TDS Details Card (demo: show for amounts > 30000) */}
          {expense.amount > 30000 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  TDS Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">TDS Section</span>
                    <span className="font-mono text-xs">194C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">PAN</span>
                    <span className="font-mono text-xs">AABCU9603R</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">TDS Rate</span>
                    <span className="font-medium">2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">TDS Amount</span>
                    <span className="font-medium">{formatINR(expense.amount * 0.02)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 5. Receipt Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                Receipt
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expense.hasReceipt ? (
                <div>
                  <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center mb-3">
                    <Receipt className="w-12 h-12 text-muted-foreground/30" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Uploaded via <span className="font-medium text-foreground">mobile camera</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(expense.date)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => toast.info("Opening full receipt view")}>
                        View Full
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => toast.info("Re-upload receipt")}>
                        <Upload className="w-3 h-3 mr-1" />
                        Re-upload
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => toast.warning("Receipt removed")}>
                        <Trash2 className="w-3 h-3 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  {expense.amount > 500 && (
                    <div className="flex items-start gap-2 p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-sm mb-4">
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium">Receipt missing</p>
                        <p className="text-xs mt-0.5 text-amber-700">
                          Receipts are required for expenses exceeding {formatINR(500)}. Please upload a receipt.
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Camera className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="font-medium text-sm">No receipt attached</p>
                    <p className="text-xs text-muted-foreground mt-1">Upload a receipt image or PDF</p>
                    <div className="flex justify-center gap-2 mt-4">
                      <Button variant="outline" size="sm" onClick={() => toast.info("Upload dialog opened")}>
                        <Upload className="w-3 h-3 mr-1" />
                        Upload
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => toast.info("Camera capture initiated")}>
                        <Camera className="w-3 h-3 mr-1" />
                        Camera
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 6. Linked Transaction Card */}
          {linkedTxn && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  Linked Transaction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transaction ID</span>
                    <Link
                      href={`/transactions/${linkedTxn.id}`}
                      className="font-mono text-xs text-[#0d3b66] hover:underline"
                    >
                      {linkedTxn.id}
                    </Link>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Card</span>
                    <span className="flex items-center gap-1">
                      <CreditCard className="w-3 h-3" />
                      ****{linkedTxn.cardLast4}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Auth Code</span>
                    <span className="font-mono text-xs">{linkedTxn.authCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Settlement Status</span>
                    <StatusBadge status={linkedTxn.status} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ════════ Right Column (40%) ════════ */}
        <div className="lg:col-span-2 space-y-4">
          {/* 1. Policy Compliance Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {policyStatusIcon(expense.policyStatus)}
                Policy Compliance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Overall status */}
              <div className={`flex items-center gap-3 p-3 rounded-md border ${policyStatusColor(expense.policyStatus)}`}>
                {policyStatusIcon(expense.policyStatus)}
                <div>
                  <p className="font-semibold text-sm">
                    {expense.policyStatus === "COMPLIANT" && "Fully Compliant"}
                    {expense.policyStatus === "SOFT_VIOLATION" && "Soft Violation"}
                    {expense.policyStatus === "HARD_VIOLATION" && "Hard Violation"}
                  </p>
                  <p className="text-xs opacity-80">
                    {expense.policyStatus === "COMPLIANT" && "This expense meets all policy requirements."}
                    {expense.policyStatus === "SOFT_VIOLATION" && "Minor policy deviations detected. Manager approval may be required."}
                    {expense.policyStatus === "HARD_VIOLATION" && "Critical policy violations found. Finance review required."}
                  </p>
                </div>
              </div>

              {/* Individual checks */}
              <div className="space-y-2">
                {policyChecks.map((check, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{check.label}</span>
                    {check.status === "pass" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    {check.status === "warn" && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                    {check.status === "fail" && <XCircle className="w-4 h-4 text-red-500" />}
                  </div>
                ))}
              </div>

              {/* Policy score */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-muted-foreground">Policy Score</span>
                  <span className="font-semibold">{score}%</span>
                </div>
                <Progress
                  value={score}
                  className={`h-2 ${score >= 80 ? "[&>div]:bg-emerald-500" : score >= 50 ? "[&>div]:bg-amber-500" : "[&>div]:bg-red-500"}`}
                />
              </div>
            </CardContent>
          </Card>

          {/* 2. Approval History Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Approval History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                {approvalHistory.map((step, i, arr) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-2.5 h-2.5 rounded-full mt-1.5 ${
                          step.status === "done" ? "bg-emerald-500" : "bg-muted-foreground/30"
                        }`}
                      />
                      {i < arr.length - 1 && <div className="w-px flex-1 bg-border" />}
                    </div>
                    <div className="pb-4">
                      <p className={`text-xs font-medium ${step.status === "done" ? "" : "text-muted-foreground"}`}>
                        {step.label}
                      </p>
                      {step.date && (
                        <p className="text-[10px] text-muted-foreground">
                          {formatDate(step.date)} {new Date(step.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                      {step.by && (
                        <p className="text-[10px] text-muted-foreground">by {step.by}</p>
                      )}
                      {step.comment && (
                        <p className="text-xs mt-1 italic text-muted-foreground border-l-2 border-border pl-2">
                          {step.comment}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 3. Audit Trail Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <History className="w-4 h-4" />
                Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {auditTrail.map((entry, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 mt-2 shrink-0" />
                    <div>
                      <p className="text-xs">{entry.action}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {entry.user} &middot; {new Date(entry.timestamp).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 4. Related Expenses Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Related Expenses
              </CardTitle>
              <p className="text-[10px] text-muted-foreground">
                Other expenses from {expense.employeeName} this month
              </p>
            </CardHeader>
            <CardContent>
              {relatedExpenses.length > 0 ? (
                <div className="space-y-2">
                  {relatedExpenses.map((rel) => (
                    <Link
                      key={rel.id}
                      href={`/expenses/${rel.id}`}
                      className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-muted/50 transition-colors text-sm"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{rel.merchantName}</p>
                        <p className="text-[10px] text-muted-foreground">{formatDate(rel.date)}</p>
                      </div>
                      <CurrencyDisplay amount={rel.amount} className="text-xs font-medium shrink-0" />
                    </Link>
                  ))}
                  <div className="pt-2 border-t flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Monthly Total</span>
                    <CurrencyDisplay amount={monthlyTotal} className="font-semibold text-sm" />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No other expenses found for this employee this month.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
