"use client";

import { useState, useEffect, useMemo } from "react";
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
  cardLast4: string;
  employeeName: string;
  department: string;
  period: string;
  openingBalance: number;
  closingBalance: number;
  totalDebits: number;
  totalCredits: number;
  minimumDue: number;
  dueDate: string;
  status: "GENERATED" | "SENT" | "PAID" | "OVERDUE";
  transactionCount: number;
}

interface CorporateStatement {
  id: string;
  companyName: string;
  period: string;
  totalCards: number;
  transactionCount: number;
  totalAmount: number;
  gstAmount: number;
  dueDate: string;
  status: "GENERATED" | "SENT" | "PAID" | "OVERDUE";
}

// ── Demo Data ──────────────────────────────────────────────────────────────────

const DEMO_CARD_STATEMENTS: CardStatement[] = [
  {
    id: "CS-001",
    cardLast4: "1005",
    employeeName: "Rajesh Kumar",
    department: "Sales & Marketing",
    period: "2026-01",
    openingBalance: 45200,
    closingBalance: 128750,
    totalDebits: 156800,
    totalCredits: 73250,
    minimumDue: 12875,
    dueDate: "2026-02-15",
    status: "SENT",
    transactionCount: 24,
  },
  {
    id: "CS-002",
    cardLast4: "2210",
    employeeName: "Priya Sharma",
    department: "Engineering",
    period: "2026-01",
    openingBalance: 0,
    closingBalance: 67430,
    totalDebits: 67430,
    totalCredits: 0,
    minimumDue: 6743,
    dueDate: "2026-02-15",
    status: "GENERATED",
    transactionCount: 12,
  },
  {
    id: "CS-003",
    cardLast4: "3347",
    employeeName: "Amit Patel",
    department: "Operations",
    period: "2026-01",
    openingBalance: 12500,
    closingBalance: 89320,
    totalDebits: 112000,
    totalCredits: 35180,
    minimumDue: 8932,
    dueDate: "2026-02-15",
    status: "PAID",
    transactionCount: 18,
  },
  {
    id: "CS-004",
    cardLast4: "4412",
    employeeName: "Sneha Reddy",
    department: "HR & Admin",
    period: "2026-01",
    openingBalance: 8900,
    closingBalance: 34560,
    totalDebits: 42700,
    totalCredits: 17040,
    minimumDue: 3456,
    dueDate: "2026-02-15",
    status: "SENT",
    transactionCount: 9,
  },
  {
    id: "CS-005",
    cardLast4: "5589",
    employeeName: "Vikram Singh",
    department: "Procurement",
    period: "2026-01",
    openingBalance: 225000,
    closingBalance: 487500,
    totalDebits: 562500,
    totalCredits: 300000,
    minimumDue: 48750,
    dueDate: "2026-02-15",
    status: "OVERDUE",
    transactionCount: 31,
  },
  {
    id: "CS-006",
    cardLast4: "6601",
    employeeName: "Meera Iyer",
    department: "Finance",
    period: "2026-01",
    openingBalance: 5600,
    closingBalance: 23400,
    totalDebits: 28900,
    totalCredits: 11100,
    minimumDue: 2340,
    dueDate: "2026-02-15",
    status: "PAID",
    transactionCount: 7,
  },
  {
    id: "CS-007",
    cardLast4: "7723",
    employeeName: "Arjun Nair",
    department: "Customer Support",
    period: "2026-01",
    openingBalance: 0,
    closingBalance: 15670,
    totalDebits: 15670,
    totalCredits: 0,
    minimumDue: 1567,
    dueDate: "2026-02-15",
    status: "GENERATED",
    transactionCount: 5,
  },
  {
    id: "CS-008",
    cardLast4: "8856",
    employeeName: "Kavitha Menon",
    department: "Executive Office",
    period: "2026-01",
    openingBalance: 134000,
    closingBalance: 298700,
    totalDebits: 345200,
    totalCredits: 180500,
    minimumDue: 29870,
    dueDate: "2026-02-15",
    status: "OVERDUE",
    transactionCount: 22,
  },
  // Previous month statements
  {
    id: "CS-009",
    cardLast4: "1005",
    employeeName: "Rajesh Kumar",
    department: "Sales & Marketing",
    period: "2025-12",
    openingBalance: 12000,
    closingBalance: 45200,
    totalDebits: 78500,
    totalCredits: 45300,
    minimumDue: 4520,
    dueDate: "2026-01-15",
    status: "PAID",
    transactionCount: 19,
  },
  {
    id: "CS-010",
    cardLast4: "2210",
    employeeName: "Priya Sharma",
    department: "Engineering",
    period: "2025-12",
    openingBalance: 23400,
    closingBalance: 0,
    totalDebits: 34500,
    totalCredits: 57900,
    minimumDue: 0,
    dueDate: "2026-01-15",
    status: "PAID",
    transactionCount: 15,
  },
  {
    id: "CS-011",
    cardLast4: "5589",
    employeeName: "Vikram Singh",
    department: "Procurement",
    period: "2025-12",
    openingBalance: 145000,
    closingBalance: 225000,
    totalDebits: 380000,
    totalCredits: 300000,
    minimumDue: 22500,
    dueDate: "2026-01-15",
    status: "PAID",
    transactionCount: 28,
  },
  {
    id: "CS-012",
    cardLast4: "3347",
    employeeName: "Amit Patel",
    department: "Operations",
    period: "2025-11",
    openingBalance: 0,
    closingBalance: 12500,
    totalDebits: 56700,
    totalCredits: 44200,
    minimumDue: 1250,
    dueDate: "2025-12-15",
    status: "PAID",
    transactionCount: 14,
  },
];

const DEMO_CORPORATE_STATEMENTS: CorporateStatement[] = [
  {
    id: "CORP-001",
    companyName: "TechNova Solutions Pvt Ltd",
    period: "2026-01",
    totalCards: 45,
    transactionCount: 312,
    totalAmount: 2845600,
    gstAmount: 512208,
    dueDate: "2026-02-20",
    status: "SENT",
  },
  {
    id: "CORP-002",
    companyName: "Bharat Manufacturing Corp",
    period: "2026-01",
    totalCards: 120,
    transactionCount: 876,
    totalAmount: 8920000,
    gstAmount: 1605600,
    dueDate: "2026-02-20",
    status: "GENERATED",
  },
  {
    id: "CORP-003",
    companyName: "Pinnacle Services Ltd",
    period: "2026-01",
    totalCards: 28,
    transactionCount: 145,
    totalAmount: 1234500,
    gstAmount: 222210,
    dueDate: "2026-02-20",
    status: "OVERDUE",
  },
  {
    id: "CORP-004",
    companyName: "TechNova Solutions Pvt Ltd",
    period: "2025-12",
    totalCards: 43,
    transactionCount: 289,
    totalAmount: 2567800,
    gstAmount: 462204,
    dueDate: "2026-01-20",
    status: "PAID",
  },
  {
    id: "CORP-005",
    companyName: "Bharat Manufacturing Corp",
    period: "2025-12",
    totalCards: 118,
    transactionCount: 812,
    totalAmount: 7845000,
    gstAmount: 1412100,
    dueDate: "2026-01-20",
    status: "PAID",
  },
  {
    id: "CORP-006",
    companyName: "Pinnacle Services Ltd",
    period: "2025-12",
    totalCards: 26,
    transactionCount: 134,
    totalAmount: 1123400,
    gstAmount: 202212,
    dueDate: "2026-01-20",
    status: "PAID",
  },
  {
    id: "CORP-007",
    companyName: "TechNova Solutions Pvt Ltd",
    period: "2025-11",
    totalCards: 41,
    transactionCount: 267,
    totalAmount: 2345600,
    gstAmount: 422208,
    dueDate: "2025-12-20",
    status: "PAID",
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

const PERIODS = ["2026-01", "2025-12", "2025-11"];
const STATUSES = ["ALL", "GENERATED", "SENT", "OVERDUE", "PAID"] as const;
const COMPANIES = [
  "All Companies",
  "TechNova Solutions Pvt Ltd",
  "Bharat Manufacturing Corp",
  "Pinnacle Services Ltd",
];

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

type StatementStatus = "GENERATED" | "SENT" | "PAID" | "OVERDUE";

function getStatusBadgeVariant(
  status: StatementStatus
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
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function StatementsPage() {
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

  // Simulate fetching card statements from API
  useEffect(() => {
    setCardLoading(true);
    const timer = setTimeout(() => {
      // In production: fetch(`/api/v1/statements?type=card&period=${cardPeriod}`)
      setCardStatements(DEMO_CARD_STATEMENTS);
      setCardLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Simulate fetching corporate statements from API
  useEffect(() => {
    setCorpLoading(true);
    const timer = setTimeout(() => {
      // In production: fetch(`/api/v1/statements?type=corporate&period=${corpPeriod}`)
      setCorpStatements(DEMO_CORPORATE_STATEMENTS);
      setCorpLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // ── Filtered card statements ─────────────────────────────────────────────

  const filteredCardStatements = useMemo(() => {
    return cardStatements.filter((s) => {
      const matchesPeriod = s.period === cardPeriod;
      const matchesStatus = cardStatus === "ALL" || s.status === cardStatus;
      const matchesSearch =
        !cardSearch ||
        s.employeeName.toLowerCase().includes(cardSearch.toLowerCase()) ||
        s.cardLast4.includes(cardSearch) ||
        s.department.toLowerCase().includes(cardSearch.toLowerCase());
      return matchesPeriod && matchesStatus && matchesSearch;
    });
  }, [cardStatements, cardPeriod, cardStatus, cardSearch]);

  // ── Filtered corporate statements ────────────────────────────────────────

  const filteredCorpStatements = useMemo(() => {
    return corpStatements.filter((s) => {
      const matchesPeriod = s.period === corpPeriod;
      const matchesCompany =
        corpCompany === "All Companies" || s.companyName === corpCompany;
      return matchesPeriod && matchesCompany;
    });
  }, [corpStatements, corpPeriod, corpCompany]);

  // ── Corporate summary stats ──────────────────────────────────────────────

  const corpSummary = useMemo(() => {
    const currentCorpStatements = corpStatements.filter(
      (s) => s.period === corpPeriod
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
        description="Individual card statements and consolidated corporate statements"
      >
        <Button
          variant="outline"
          onClick={() => toast.info("Statement download will be available once API is connected")}
        >
          <Download className="w-4 h-4" />
          Download
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
                placeholder="Search by employee, card, department..."
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
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                          Period
                        </th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                          Opening Bal
                        </th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                          Closing Bal
                        </th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell">
                          Total Debits
                        </th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell">
                          Total Credits
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
                          Txns
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredCardStatements.map((stmt) => (
                        <tr
                          key={stmt.id}
                          className="hover:bg-muted/50 transition-colors cursor-pointer"
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
                          <td className="px-4 py-3 text-sm">
                            {formatPeriodLabel(stmt.period)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-sm">
                            {formatINR(stmt.openingBalance)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-sm font-medium">
                            {formatINR(stmt.closingBalance)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-sm text-red-600 hidden lg:table-cell">
                            {formatINR(stmt.totalDebits)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-sm text-emerald-600 hidden lg:table-cell">
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
                            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                              <FileText className="w-3 h-3" />
                              {stmt.transactionCount}
                            </span>
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
              {COMPANIES.map((c) => (
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
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                          Period
                        </th>
                        <th className="text-center px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                          Cards
                        </th>
                        <th className="text-center px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                          Transactions
                        </th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                          Total Amount
                        </th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">
                          GST
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">
                          Due Date
                        </th>
                        <th className="text-center px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredCorpStatements.map((stmt) => (
                        <tr
                          key={stmt.id}
                          className="hover:bg-muted/50 transition-colors cursor-pointer"
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
                          <td className="px-4 py-3 text-sm">
                            {formatPeriodLabel(stmt.period)}
                          </td>
                          <td className="px-4 py-3 text-center text-sm">
                            <span className="inline-flex items-center gap-1">
                              <CreditCard className="w-3 h-3 text-muted-foreground" />
                              {stmt.totalCards}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-sm">
                            {stmt.transactionCount.toLocaleString("en-IN")}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-sm font-semibold">
                            {formatINR(stmt.totalAmount)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-sm text-muted-foreground hidden md:table-cell">
                            {formatINR(stmt.gstAmount)}
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
