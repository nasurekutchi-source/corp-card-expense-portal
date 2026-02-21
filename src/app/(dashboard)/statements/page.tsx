"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Search,
  Filter,
  CreditCard,
  Building2,
  Download,
  Calendar,
  IndianRupee,
  AlertTriangle,
  Clock,
  FileDown,
  Eye,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { formatINR, formatINRCompact } from "@/lib/utils";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────────

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

interface CorporateStatement {
  id: string;
  companyId: string;
  companyName: string;
  statementPeriod: string;
  totalCards: number;
  totalTransactions: number;
  totalAmount: number;
  totalGst: number;
  dueDate: string;
  status: string;
  generatedAt: string;
  pdfUrl: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const PERIODS = ["2026-01", "2025-12", "2025-11"];
const STATUSES = ["ALL", "GENERATED", "SENT", "OVERDUE", "PAID"] as const;

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

// ── PDF Generator ──────────────────────────────────────────────────────────────

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

function generateCorporateStatementPdf(stmt: CorporateStatement) {
  const html = `<!DOCTYPE html>
<html><head><title>Corporate Statement - ${stmt.companyName} - ${formatPeriodLabel(stmt.statementPeriod)}</title>
<style>
  @page { size: A4; margin: 20mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; background: #fff; padding: 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0d3b66; padding-bottom: 20px; margin-bottom: 30px; }
  .brand { font-size: 22px; font-weight: 700; color: #0d3b66; }
  .brand-sub { font-size: 11px; color: #666; margin-top: 4px; }
  .stmt-id { text-align: right; font-size: 12px; color: #666; }
  .stmt-id strong { display: block; font-size: 14px; color: #0d3b66; }
  .company-info { background: #f0f4f8; border-radius: 8px; padding: 20px; margin-bottom: 24px; display: flex; justify-content: space-between; }
  .company-info-left .company-name { font-size: 20px; font-weight: 700; color: #0d3b66; margin-bottom: 6px; }
  .company-info-left div { font-size: 13px; margin-bottom: 4px; }
  .company-info-right { text-align: right; }
  .company-info-right .period { font-size: 16px; font-weight: 600; }
  .company-info-right .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; margin-top: 6px; }
  .status-GENERATED { background: #dbeafe; color: #1e40af; }
  .status-SENT { background: #fef3c7; color: #92400e; }
  .status-PAID { background: #d1fae5; color: #065f46; }
  .status-OVERDUE { background: #fee2e2; color: #991b1b; }
  .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
  .summary-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; text-align: center; }
  .summary-box .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; }
  .summary-box .value { font-size: 18px; font-weight: 700; margin-top: 4px; font-family: 'Courier New', monospace; }
  .gst-section { background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
  .gst-section h3 { font-size: 12px; text-transform: uppercase; color: #166534; margin-bottom: 10px; letter-spacing: 0.5px; }
  .gst-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .gst-grid .item { text-align: center; }
  .gst-grid .item .label { font-size: 10px; color: #64748b; }
  .gst-grid .item .value { font-size: 16px; font-weight: 600; color: #166534; font-family: 'Courier New', monospace; }
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
      <strong>CORPORATE STATEMENT</strong>
      ${stmt.id.toUpperCase()} &bull; Generated ${new Date(stmt.generatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
    </div>
  </div>
  <div class="company-info">
    <div class="company-info-left">
      <div class="company-name">${stmt.companyName}</div>
      <div><strong>Active Cards:</strong> ${stmt.totalCards}</div>
      <div><strong>Total Transactions:</strong> ${stmt.totalTransactions}</div>
    </div>
    <div class="company-info-right">
      <div class="period">${formatPeriodLabel(stmt.statementPeriod)}</div>
      <div class="status status-${stmt.status}">${stmt.status}</div>
    </div>
  </div>
  <div class="summary">
    <div class="summary-box">
      <div class="label">Total Cards</div>
      <div class="value">${stmt.totalCards}</div>
    </div>
    <div class="summary-box">
      <div class="label">Transactions</div>
      <div class="value">${stmt.totalTransactions}</div>
    </div>
    <div class="summary-box">
      <div class="label">Total Amount</div>
      <div class="value">${formatINRPlain(stmt.totalAmount)}</div>
    </div>
    <div class="summary-box">
      <div class="label">GST (18%)</div>
      <div class="value">${formatINRPlain(stmt.totalGst)}</div>
    </div>
  </div>
  <div class="gst-section">
    <h3>GST Breakup</h3>
    <div class="gst-grid">
      <div class="item"><div class="label">CGST (9%)</div><div class="value">${formatINRPlain(stmt.totalGst / 2)}</div></div>
      <div class="item"><div class="label">SGST (9%)</div><div class="value">${formatINRPlain(stmt.totalGst / 2)}</div></div>
      <div class="item"><div class="label">Total GST</div><div class="value">${formatINRPlain(stmt.totalGst)}</div></div>
    </div>
  </div>
  <div class="due-section">
    <div>
      <div class="due-label">TOTAL AMOUNT DUE (incl. GST)</div>
      <div class="due-amount">${formatINRPlain(stmt.totalAmount + stmt.totalGst)}</div>
    </div>
    <div>
      <div class="due-label">DUE DATE</div>
      <div class="due-date">${formatDueDate(stmt.dueDate)}</div>
    </div>
  </div>
  <div class="footer">
    This is a system-generated corporate statement from CorpCard Pro. For queries, contact your relationship manager.<br/>
    Statement ID: ${stmt.id.toUpperCase()} &bull; Company: ${stmt.companyName} &bull; Period: ${formatPeriodLabel(stmt.statementPeriod)}
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

// ── Component ──────────────────────────────────────────────────────────────────

export default function StatementsPage() {
  const router = useRouter();

  // Card statements state
  const [cardPeriod, setCardPeriod] = useState("2026-01");
  const [cardStatus, setCardStatus] = useState<string>("ALL");
  const [cardSearch, setCardSearch] = useState("");
  const [cardStatements, setCardStatements] = useState<CardStatement[]>([]);
  const [cardLoading, setCardLoading] = useState(true);

  // Corporate statements state
  const [corpCompany, setCorpCompany] = useState("All Companies");
  const [corpPeriod, setCorpPeriod] = useState("2026-01");
  const [corpStatements, setCorpStatements] = useState<CorporateStatement[]>([]);
  const [corpLoading, setCorpLoading] = useState(true);

  // Fetch card statements from API
  useEffect(() => {
    setCardLoading(true);
    fetch("/api/v1/statements?type=card")
      .then((r) => r.json())
      .then((data) => {
        setCardStatements(data.data?.cardStatements || []);
        setCardLoading(false);
      })
      .catch(() => {
        setCardLoading(false);
        toast.error("Failed to load card statements");
      });
  }, []);

  // Fetch corporate statements from API
  useEffect(() => {
    setCorpLoading(true);
    fetch("/api/v1/statements?type=corporate")
      .then((r) => r.json())
      .then((data) => {
        setCorpStatements(data.data?.corporateStatements || []);
        setCorpLoading(false);
      })
      .catch(() => {
        setCorpLoading(false);
        toast.error("Failed to load corporate statements");
      });
  }, []);

  // Unique companies for filter dropdown
  const companies = useMemo(() => {
    const names = [...new Set(corpStatements.map((s) => s.companyName))];
    return ["All Companies", ...names.sort()];
  }, [corpStatements]);

  // ── Filtered card statements ─────────────────────────────────────────────

  const filteredCardStatements = useMemo(() => {
    return cardStatements.filter((s) => {
      const matchesPeriod = s.statementPeriod === cardPeriod;
      const matchesStatus = cardStatus === "ALL" || s.status === cardStatus;
      const matchesSearch =
        !cardSearch ||
        s.employeeName.toLowerCase().includes(cardSearch.toLowerCase()) ||
        s.cardLast4.includes(cardSearch);
      return matchesPeriod && matchesStatus && matchesSearch;
    });
  }, [cardStatements, cardPeriod, cardStatus, cardSearch]);

  // ── Filtered corporate statements ────────────────────────────────────────

  const filteredCorpStatements = useMemo(() => {
    return corpStatements.filter((s) => {
      const matchesPeriod = s.statementPeriod === corpPeriod;
      const matchesCompany =
        corpCompany === "All Companies" || s.companyName === corpCompany;
      return matchesPeriod && matchesCompany;
    });
  }, [corpStatements, corpPeriod, corpCompany]);

  // ── Corporate summary stats ──────────────────────────────────────────────

  const corpSummary = useMemo(() => {
    const currentCorpStatements = corpStatements.filter(
      (s) => s.statementPeriod === corpPeriod
    );
    return {
      totalOutstanding: currentCorpStatements
        .filter((s) => s.status !== "PAID")
        .reduce((sum, s) => sum + s.totalAmount, 0),
      totalDueThisMonth: currentCorpStatements.reduce(
        (sum, s) => sum + s.totalAmount,
        0
      ),
      overdueCount: currentCorpStatements.filter((s) => s.status === "OVERDUE")
        .length,
    };
  }, [corpStatements, corpPeriod]);

  // ── Select styling ───────────────────────────────────────────────────────

  const selectClass =
    "h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer";

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Statement Store"
        description="Individual card statements and consolidated corporate statements — download PDF for any statement"
      >
        <Button
          variant="outline"
          onClick={() => toast.info("Bulk download: select statements below and use the PDF button on each row")}
        >
          <Download className="w-4 h-4" />
          Download All
        </Button>
      </PageHeader>

      <Tabs defaultValue="card" className="space-y-4">
        <TabsList>
          <TabsTrigger value="card" className="gap-1.5">
            <CreditCard className="w-4 h-4" />
            Card Statements
          </TabsTrigger>
          <TabsTrigger value="corporate" className="gap-1.5">
            <Building2 className="w-4 h-4" />
            Corporate Statements
          </TabsTrigger>
        </TabsList>

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* CARD STATEMENTS TAB                                               */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <TabsContent value="card" className="space-y-4">
          {/* Filter bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={cardPeriod}
              onChange={(e) => setCardPeriod(e.target.value)}
              className={selectClass}
            >
              {PERIODS.map((p) => (
                <option key={p} value={p}>
                  {formatPeriodLabel(p)}
                </option>
              ))}
            </select>

            <select
              value={cardStatus}
              onChange={(e) => setCardStatus(e.target.value)}
              className={selectClass}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s === "ALL" ? "All Statuses" : s.charAt(0) + s.slice(1).toLowerCase()}
                </option>
              ))}
            </select>

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by employee, card number..."
                value={cardSearch}
                onChange={(e) => setCardSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Card statements table */}
          <Card>
            <CardContent className="p-0">
              {cardLoading ? (
                <div className="py-16 text-center">
                  <Clock className="w-6 h-6 mx-auto text-muted-foreground mb-2 animate-spin" />
                  <p className="text-sm text-muted-foreground">Loading statements...</p>
                </div>
              ) : filteredCardStatements.length === 0 ? (
                <div className="py-16 text-center">
                  <Filter className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No card statements match your filters
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-xs"
                    onClick={() => {
                      setCardPeriod("2026-01");
                      setCardStatus("ALL");
                      setCardSearch("");
                    }}
                  >
                    Clear all filters
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                          Card
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">
                          Period
                        </th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell">
                          Opening
                        </th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                          Closing
                        </th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden xl:table-cell">
                          Debits
                        </th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden xl:table-cell">
                          Credits
                        </th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                          Min Due
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">
                          Due Date
                        </th>
                        <th className="text-center px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                          Status
                        </th>
                        <th className="text-center px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                          PDF
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredCardStatements.map((stmt) => (
                        <tr
                          key={stmt.id}
                          className="hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => router.push(`/statements/${stmt.id}`)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-[#0d3b66]/10 flex items-center justify-center shrink-0">
                                <CreditCard className="w-4 h-4 text-[#0d3b66]" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">
                                  ****{stmt.cardLast4}
                                </p>
                                <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                                  {stmt.employeeName}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm hidden md:table-cell">
                            {formatPeriodLabel(stmt.statementPeriod)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-sm hidden lg:table-cell">
                            {formatINR(stmt.openingBalance)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-sm font-medium">
                            {formatINR(stmt.closingBalance)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-sm text-red-600 hidden xl:table-cell">
                            {formatINR(stmt.totalDebits)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-sm text-emerald-600 hidden xl:table-cell">
                            {formatINR(stmt.totalCredits)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-sm font-semibold">
                            {formatINR(stmt.minimumDue)}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDueDate(stmt.dueDate)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant={getStatusBadgeVariant(stmt.status)}>
                              {stmt.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  generateCardStatementPdf(stmt);
                                }}
                                className="p-1.5 rounded-md hover:bg-[#0d3b66]/10 text-[#0d3b66] transition-colors"
                                title="View & Download PDF"
                              >
                                <FileDown className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Footer */}
              {filteredCardStatements.length > 0 && (
                <div className="px-4 py-3 border-t bg-muted/30 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Showing {filteredCardStatements.length} statement
                    {filteredCardStatements.length !== 1 ? "s" : ""} for{" "}
                    {formatPeriodLabel(cardPeriod)}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Total closing:{" "}
                    </span>
                    <span className="text-xs font-semibold font-mono">
                      {formatINR(
                        filteredCardStatements.reduce(
                          (sum, s) => sum + s.closingBalance,
                          0
                        )
                      )}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* CORPORATE STATEMENTS TAB                                          */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <TabsContent value="corporate" className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <IndianRupee className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Total Outstanding
                    </p>
                    <p className="text-xl font-bold font-mono tabular-nums">
                      {formatINRCompact(corpSummary.totalOutstanding)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-700 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Total Due This Month
                    </p>
                    <p className="text-xl font-bold font-mono tabular-nums">
                      {formatINRCompact(corpSummary.totalDueThisMonth)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-700 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Overdue Count
                    </p>
                    <p className="text-xl font-bold">
                      {corpSummary.overdueCount}
                      {corpSummary.overdueCount > 0 && (
                        <span className="text-sm font-normal text-red-600 dark:text-red-400 ml-1">
                          company{corpSummary.overdueCount !== 1 ? "ies" : "y"}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={corpCompany}
              onChange={(e) => setCorpCompany(e.target.value)}
              className={selectClass}
            >
              {companies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={corpPeriod}
              onChange={(e) => setCorpPeriod(e.target.value)}
              className={selectClass}
            >
              {PERIODS.map((p) => (
                <option key={p} value={p}>
                  {formatPeriodLabel(p)}
                </option>
              ))}
            </select>
          </div>

          {/* Corporate statements table */}
          <Card>
            <CardContent className="p-0">
              {corpLoading ? (
                <div className="py-16 text-center">
                  <Clock className="w-6 h-6 mx-auto text-muted-foreground mb-2 animate-spin" />
                  <p className="text-sm text-muted-foreground">Loading statements...</p>
                </div>
              ) : filteredCorpStatements.length === 0 ? (
                <div className="py-16 text-center">
                  <Filter className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No corporate statements match your filters
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-xs"
                    onClick={() => {
                      setCorpCompany("All Companies");
                      setCorpPeriod("2026-01");
                    }}
                  >
                    Clear all filters
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                          Company
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">
                          Period
                        </th>
                        <th className="text-center px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                          Cards
                        </th>
                        <th className="text-center px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">
                          Txns
                        </th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                          Total Amount
                        </th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell">
                          GST
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">
                          Due Date
                        </th>
                        <th className="text-center px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                          Status
                        </th>
                        <th className="text-center px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                          PDF
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredCorpStatements.map((stmt) => (
                        <tr
                          key={stmt.id}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-[#0d3b66]/10 flex items-center justify-center shrink-0">
                                <Building2 className="w-4 h-4 text-[#0d3b66]" />
                              </div>
                              <p className="font-medium text-sm truncate max-w-[200px]">
                                {stmt.companyName}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm hidden md:table-cell">
                            {formatPeriodLabel(stmt.statementPeriod)}
                          </td>
                          <td className="px-4 py-3 text-center text-sm">
                            <span className="inline-flex items-center gap-1">
                              <CreditCard className="w-3 h-3 text-muted-foreground" />
                              {stmt.totalCards}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-sm hidden md:table-cell">
                            {stmt.totalTransactions.toLocaleString("en-IN")}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-sm font-semibold">
                            {formatINR(stmt.totalAmount)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-sm text-muted-foreground hidden lg:table-cell">
                            {formatINR(stmt.totalGst)}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDueDate(stmt.dueDate)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant={getStatusBadgeVariant(stmt.status)}>
                              {stmt.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => generateCorporateStatementPdf(stmt)}
                                className="p-1.5 rounded-md hover:bg-[#0d3b66]/10 text-[#0d3b66] transition-colors"
                                title="View & Download PDF"
                              >
                                <FileDown className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Footer */}
              {filteredCorpStatements.length > 0 && (
                <div className="px-4 py-3 border-t bg-muted/30 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Showing {filteredCorpStatements.length} corporate statement
                    {filteredCorpStatements.length !== 1 ? "s" : ""} for{" "}
                    {formatPeriodLabel(corpPeriod)}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Total amount:{" "}
                    </span>
                    <span className="text-xs font-semibold font-mono">
                      {formatINR(
                        filteredCorpStatements.reduce(
                          (sum, s) => sum + s.totalAmount,
                          0
                        )
                      )}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
