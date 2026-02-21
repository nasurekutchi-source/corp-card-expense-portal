"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  Calendar,
  FileDown,
  Clock,
  IndianRupee,
  AlertCircle,
  CheckCircle2,
  ShoppingBag,
  Tag,
  Hash,
  Wifi,
  TrendingDown,
  TrendingUp,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { formatINR } from "@/lib/utils";
import { toast } from "sonner";

// -- Types ------------------------------------------------------------------

interface CardStatement {
  id: string;
  cardId: string;
  cardLast4: string;
  employeeId: string;
  employeeName: string;
  companyId: string;
  statementPeriod: string;
  openingBalance: number;
  closingBalance: number;
  totalDebits: number;
  totalCredits: number;
  minimumDue: number;
  dueDate: string;
  status: string;
  transactionCount: number;
  generatedAt: string;
  pdfUrl: string | null;
}

interface TransactionLocation {
  city: string;
  country: string;
}

interface Transaction {
  id: string;
  cardId: string;
  cardLast4: string;
  employeeId: string;
  employeeName: string;
  eventType: string;
  amount: number;
  currency: string;
  billingAmount: number;
  billingCurrency: string;
  merchantName: string;
  mcc: string;
  mccCategory: string;
  status: string;
  authCode: string;
  channel: string;
  location: TransactionLocation;
  timestamp: string;
  hasReceipt: boolean;
  gstAmount: number;
}

// -- Helpers ----------------------------------------------------------------

function formatPeriodLabel(period: string): string {
  const [year, month] = period.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function formatDueDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTransactionDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTransactionTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatINRPlain(amount: number): string {
  const abs = Math.abs(amount);
  const parts = abs.toFixed(2).split(".");
  const intPart = parts[0];
  const decPart = parts[1];
  let result = "";
  if (intPart.length <= 3) {
    result = intPart;
  } else {
    const last3 = intPart.slice(-3);
    const remaining = intPart.slice(0, -3);
    const groups = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
    result = groups + "," + last3;
  }
  return (amount < 0 ? "-" : "") + "Rs. " + result + "." + decPart;
}

type StatementStatus = "GENERATED" | "SENT" | "PAID" | "OVERDUE";

function getStatusBadgeVariant(
  status: string
): "info" | "warning" | "success" | "destructive" {
  switch (status) {
    case "GENERATED":
      return "info";
    case "SENT":
      return "warning";
    case "PAID":
      return "success";
    case "OVERDUE":
      return "destructive";
    default:
      return "info";
  }
}

function getTransactionStatusColor(status: string): string {
  switch (status) {
    case "SETTLED":
      return "text-emerald-600";
    case "PENDING":
      return "text-amber-600";
    case "DECLINED":
      return "text-red-600";
    case "REVERSED":
      return "text-orange-500";
    default:
      return "text-muted-foreground";
  }
}

function getTransactionStatusBadge(
  status: string
): "success" | "warning" | "destructive" | "info" {
  switch (status) {
    case "SETTLED":
      return "success";
    case "PENDING":
      return "warning";
    case "DECLINED":
      return "destructive";
    case "REVERSED":
      return "info";
    default:
      return "info";
  }
}

function getAmountColor(eventType: string): string {
  switch (eventType) {
    case "AUTHORIZATION":
    case "SETTLEMENT":
      return "text-red-600";
    case "REFUND":
    case "REVERSAL":
      return "text-emerald-600";
    default:
      return "text-foreground";
  }
}

function getAmountPrefix(eventType: string): string {
  switch (eventType) {
    case "AUTHORIZATION":
    case "SETTLEMENT":
      return "- ";
    case "REFUND":
    case "REVERSAL":
      return "+ ";
    default:
      return "";
  }
}

function getAmountIcon(eventType: string) {
  switch (eventType) {
    case "AUTHORIZATION":
    case "SETTLEMENT":
      return TrendingDown;
    case "REFUND":
    case "REVERSAL":
      return RotateCcw;
    default:
      return TrendingUp;
  }
}

/** Deterministic pseudo-random from string seed (for reconciliation status) */
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash % 100) / 100;
}

// -- PDF Generator (reused from parent page) --------------------------------

function generateCardStatementPdf(stmt: CardStatement) {
  const html = `<!DOCTYPE html>
<html><head><title>Card Statement - ****${stmt.cardLast4} - ${formatPeriodLabel(stmt.statementPeriod)}</title>
<style>
  @page { size: A4; margin: 20mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; background: #fff; padding: 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0d3b66; padding-bottom: 20px; margin-bottom: 30px; }
  .brand { font-size: 22px; font-weight: 700; color: #0d3b66; }
  .brand-sub { font-size: 11px; color: #666; margin-top: 4px; }
  .stmt-id { text-align: right; font-size: 12px; color: #666; }
  .stmt-id strong { display: block; font-size: 14px; color: #0d3b66; }
  .card-info { background: #f0f4f8; border-radius: 8px; padding: 20px; margin-bottom: 24px; display: flex; justify-content: space-between; }
  .card-info-left div { margin-bottom: 6px; font-size: 13px; }
  .card-info-left .card-num { font-size: 18px; font-weight: 700; letter-spacing: 2px; color: #0d3b66; }
  .card-info-right { text-align: right; }
  .card-info-right .period { font-size: 16px; font-weight: 600; }
  .card-info-right .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; margin-top: 6px; }
  .status-GENERATED { background: #dbeafe; color: #1e40af; }
  .status-SENT { background: #fef3c7; color: #92400e; }
  .status-PAID { background: #d1fae5; color: #065f46; }
  .status-OVERDUE { background: #fee2e2; color: #991b1b; }
  .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
  .summary-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; text-align: center; }
  .summary-box .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; }
  .summary-box .value { font-size: 18px; font-weight: 700; margin-top: 4px; font-family: 'Courier New', monospace; }
  .summary-box .value.debit { color: #dc2626; }
  .summary-box .value.credit { color: #16a34a; }
  .due-section { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
  .due-section .due-label { font-size: 12px; color: #92400e; }
  .due-section .due-amount { font-size: 24px; font-weight: 700; color: #92400e; font-family: 'Courier New', monospace; }
  .due-section .due-date { font-size: 13px; color: #92400e; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; text-align: center; }
  @media print { body { padding: 0; } .no-print { display: none; } }
</style></head><body>
  <div class="header">
    <div>
      <div class="brand">CorpCard Pro</div>
      <div class="brand-sub">Corporate Card Portal &amp; Expense Management</div>
    </div>
    <div class="stmt-id">
      <strong>CARD STATEMENT</strong>
      ${stmt.id.toUpperCase()} &bull; Generated ${new Date(stmt.generatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
    </div>
  </div>
  <div class="card-info">
    <div class="card-info-left">
      <div class="card-num">&bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; ${stmt.cardLast4}</div>
      <div><strong>Cardholder:</strong> ${stmt.employeeName}</div>
      <div><strong>Transactions:</strong> ${stmt.transactionCount}</div>
    </div>
    <div class="card-info-right">
      <div class="period">${formatPeriodLabel(stmt.statementPeriod)}</div>
      <div class="status status-${stmt.status}">${stmt.status}</div>
    </div>
  </div>
  <div class="summary">
    <div class="summary-box">
      <div class="label">Opening Balance</div>
      <div class="value">${formatINRPlain(stmt.openingBalance)}</div>
    </div>
    <div class="summary-box">
      <div class="label">Total Debits</div>
      <div class="value debit">${formatINRPlain(stmt.totalDebits)}</div>
    </div>
    <div class="summary-box">
      <div class="label">Total Credits</div>
      <div class="value credit">${formatINRPlain(stmt.totalCredits)}</div>
    </div>
    <div class="summary-box">
      <div class="label">Closing Balance</div>
      <div class="value">${formatINRPlain(stmt.closingBalance)}</div>
    </div>
  </div>
  <div class="due-section">
    <div>
      <div class="due-label">MINIMUM AMOUNT DUE</div>
      <div class="due-amount">${formatINRPlain(stmt.minimumDue)}</div>
    </div>
    <div>
      <div class="due-label">DUE DATE</div>
      <div class="due-date">${formatDueDate(stmt.dueDate)}</div>
    </div>
  </div>
  <div class="footer">
    This is a system-generated statement from CorpCard Pro. For queries, contact your corporate card administrator.<br/>
    Statement ID: ${stmt.id.toUpperCase()} &bull; Period: ${formatPeriodLabel(stmt.statementPeriod)} &bull; Card: ****${stmt.cardLast4}
  </div>
  <div class="no-print" style="text-align:center;margin-top:30px;">
    <button onclick="window.print()" style="padding:10px 28px;background:#0d3b66;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px;">
      Download as PDF
    </button>
  </div>
</body></html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
  } else {
    toast.error("Pop-up blocked. Please allow pop-ups for this site.");
  }
}

// -- Component --------------------------------------------------------------

export default function StatementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const statementId = params.statementId as string;

  const [statement, setStatement] = useState<CardStatement | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [txnLoading, setTxnLoading] = useState(true);

  // Fetch statement
  useEffect(() => {
    setLoading(true);
    fetch("/api/v1/statements?type=card")
      .then((r) => r.json())
      .then((data) => {
        const stmts: CardStatement[] = data.data?.cardStatements || [];
        const found = stmts.find((s) => s.id === statementId);
        setStatement(found || null);
        setLoading(false);

        // Fetch transactions for this card if statement found
        if (found) {
          setTxnLoading(true);
          fetch(`/api/v1/transactions?cardId=${found.cardId}`)
            .then((r) => r.json())
            .then((txnData) => {
              const allTxns: Transaction[] = txnData.data || [];
              // Filter to statement period
              const [year, month] = found.statementPeriod.split("-");
              const periodStart = new Date(Number(year), Number(month) - 1, 1);
              const periodEnd = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
              const filtered = allTxns.filter((t) => {
                const txnDate = new Date(t.timestamp);
                return txnDate >= periodStart && txnDate <= periodEnd;
              });
              // Sort by date descending
              filtered.sort(
                (a, b) =>
                  new Date(b.timestamp).getTime() -
                  new Date(a.timestamp).getTime()
              );
              setTransactions(filtered);
              setTxnLoading(false);
            })
            .catch(() => {
              setTxnLoading(false);
              toast.error("Failed to load transactions");
            });
        } else {
          setTxnLoading(false);
        }
      })
      .catch(() => {
        setLoading(false);
        setTxnLoading(false);
        toast.error("Failed to load statement");
      });
  }, [statementId]);

  // Reconciliation stats (deterministic per-transaction seed)
  const reconciliation = useMemo(() => {
    if (transactions.length === 0) return { reconciled: 0, total: 0 };
    const total = transactions.length;
    const reconciled = transactions.filter(
      (t) => seededRandom(t.id + "reconciled") > 0.35
    ).length;
    return { reconciled, total };
  }, [transactions]);

  const reconPercent =
    reconciliation.total > 0
      ? Math.round((reconciliation.reconciled / reconciliation.total) * 100)
      : 0;

  // Transaction totals
  const txnTotals = useMemo(() => {
    const debits = transactions
      .filter(
        (t) =>
          t.eventType === "AUTHORIZATION" || t.eventType === "SETTLEMENT"
      )
      .reduce((sum, t) => sum + t.billingAmount, 0);
    const credits = transactions
      .filter(
        (t) => t.eventType === "REFUND" || t.eventType === "REVERSAL"
      )
      .reduce((sum, t) => sum + t.billingAmount, 0);
    return { debits, credits };
  }, [transactions]);

  // -- Loading state --------------------------------------------------------

  if (loading) {
    return (
      <div className="space-y-6 animate-in">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/statements")}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        </div>
        <div className="py-24 text-center">
          <Clock className="w-8 h-8 mx-auto text-muted-foreground mb-3 animate-spin" />
          <p className="text-sm text-muted-foreground">
            Loading statement details...
          </p>
        </div>
      </div>
    );
  }

  // -- Not found ------------------------------------------------------------

  if (!statement) {
    return (
      <div className="space-y-6 animate-in">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/statements")}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        </div>
        <div className="py-24 text-center">
          <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <h2 className="text-lg font-semibold mb-1">Statement Not Found</h2>
          <p className="text-sm text-muted-foreground mb-4">
            The statement you are looking for does not exist or may have been
            removed.
          </p>
          <Button onClick={() => router.push("/statements")}>
            Go to Statements
          </Button>
        </div>
      </div>
    );
  }

  // -- Render ---------------------------------------------------------------

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/statements")}
            className="shrink-0"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div className="h-8 w-px bg-border hidden sm:block" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#0d3b66]/10 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 text-[#0d3b66]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight">
                  ****{statement.cardLast4}
                </h1>
                <span className="text-muted-foreground">
                  &bull;
                </span>
                <span className="text-sm text-muted-foreground">
                  {statement.employeeName}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {formatPeriodLabel(statement.statementPeriod)}
                </span>
                <Badge
                  variant={getStatusBadgeVariant(statement.status)}
                  className="ml-1"
                >
                  {statement.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        <Button
          onClick={() => generateCardStatementPdf(statement)}
          className="bg-[#0d3b66] hover:bg-[#0d3b66]/90 text-white shrink-0"
        >
          <FileDown className="w-4 h-4 mr-2" />
          Download PDF
        </Button>
      </div>

      {/* Balance Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <IndianRupee className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Opening Balance
                </p>
                <p className="text-lg font-bold font-mono tabular-nums">
                  {formatINR(statement.openingBalance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Debits</p>
                <p className="text-lg font-bold font-mono tabular-nums text-red-600">
                  {formatINR(statement.totalDebits)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Credits</p>
                <p className="text-lg font-bold font-mono tabular-nums text-emerald-600">
                  {formatINR(statement.totalCredits)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#0d3b66]/10 flex items-center justify-center">
                <IndianRupee className="w-4 h-4 text-[#0d3b66]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Closing Balance
                </p>
                <p className="text-lg font-bold font-mono tabular-nums">
                  {formatINR(statement.closingBalance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Due Section */}
      <Card className="border-amber-200 dark:border-amber-800">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-700 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  Minimum Amount Due
                </p>
                <p className="text-2xl font-bold font-mono tabular-nums text-amber-700 dark:text-amber-400">
                  {formatINR(statement.minimumDue)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground sm:text-right">
              <Calendar className="w-4 h-4 text-amber-600" />
              <div>
                <p className="text-xs text-muted-foreground">Due Date</p>
                <p className="font-semibold text-foreground">
                  {formatDueDate(statement.dueDate)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reconciliation Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-semibold">
                Statement Reconciliation
              </h3>
            </div>
            <span className="text-sm font-mono tabular-nums text-muted-foreground">
              {reconciliation.reconciled} of {reconciliation.total} transactions
              reconciled
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${reconPercent}%`,
                backgroundColor:
                  reconPercent === 100
                    ? "#16a34a"
                    : reconPercent >= 75
                    ? "#0d3b66"
                    : reconPercent >= 50
                    ? "#f59e0b"
                    : "#ef4444",
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {reconPercent}% complete
            {reconPercent === 100
              ? " -- All transactions have been reconciled"
              : reconPercent >= 75
              ? " -- Almost there"
              : " -- Reconciliation in progress"}
          </p>
        </CardContent>
      </Card>

      {/* Statemented Transactions Table */}
      <Card>
        <CardContent className="p-0">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#0d3b66]" />
              Statemented Transactions
            </h3>
            <span className="text-xs text-muted-foreground">
              {transactions.length} transaction
              {transactions.length !== 1 ? "s" : ""} in{" "}
              {formatPeriodLabel(statement.statementPeriod)}
            </span>
          </div>

          {txnLoading ? (
            <div className="py-16 text-center">
              <Clock className="w-6 h-6 mx-auto text-muted-foreground mb-2 animate-spin" />
              <p className="text-sm text-muted-foreground">
                Loading transactions...
              </p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-16 text-center">
              <ShoppingBag className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No transactions found for this statement period
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                      Date
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                      Merchant
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">
                      Category
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell">
                      Auth Code
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell">
                      Channel
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transactions.map((txn) => {
                    const AmountIcon = getAmountIcon(txn.eventType);
                    return (
                      <tr
                        key={txn.id}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium">
                              {formatTransactionDate(txn.timestamp)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatTransactionTime(txn.timestamp)}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium truncate max-w-[180px]">
                              {txn.merchantName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {txn.location.city}, {txn.location.country}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="flex items-center gap-1.5">
                            <Tag className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm truncate max-w-[120px]">
                              {txn.mccCategory}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="flex items-center gap-1.5">
                            <Hash className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm font-mono">
                              {txn.authCode}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="flex items-center gap-1.5">
                            <Wifi className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm">{txn.channel}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div
                            className={`flex items-center justify-end gap-1 font-mono tabular-nums font-semibold ${getAmountColor(txn.eventType)}`}
                          >
                            <AmountIcon className="w-3 h-3" />
                            <span>
                              {getAmountPrefix(txn.eventType)}
                              {formatINR(txn.billingAmount)}
                            </span>
                          </div>
                          {txn.gstAmount > 0 && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              GST: {formatINR(txn.gstAmount)}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge
                            variant={getTransactionStatusBadge(txn.status)}
                          >
                            {txn.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals footer */}
          {transactions.length > 0 && (
            <div className="px-4 py-3 border-t bg-muted/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {transactions.length} transaction
                  {transactions.length !== 1 ? "s" : ""} &bull; Statement
                  period: {formatPeriodLabel(statement.statementPeriod)}
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">
                      Debits:
                    </span>
                    <span className="text-xs font-semibold font-mono text-red-600">
                      {formatINR(txnTotals.debits)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">
                      Credits:
                    </span>
                    <span className="text-xs font-semibold font-mono text-emerald-600">
                      {formatINR(txnTotals.credits)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Net:</span>
                    <span className="text-xs font-semibold font-mono">
                      {formatINR(txnTotals.debits - txnTotals.credits)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statement Metadata Footer */}
      <div className="text-center text-xs text-muted-foreground py-4 border-t">
        <p>
          Statement ID: {statement.id.toUpperCase()} &bull; Generated on{" "}
          {formatDueDate(statement.generatedAt)} &bull; Card: ****
          {statement.cardLast4}
        </p>
        <p className="mt-1">
          This is a system-generated statement from CorpCard Pro. For queries,
          contact your corporate card administrator.
        </p>
      </div>
    </div>
  );
}
