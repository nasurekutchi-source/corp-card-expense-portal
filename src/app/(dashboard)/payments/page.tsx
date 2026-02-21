"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/page-header";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { formatDate } from "@/lib/utils";
import {
  Banknote,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Building2,
  CreditCard,
  AlertCircle,
  Loader2,
} from "lucide-react";

// =============================================================================
// Types
// =============================================================================

interface PaymentCycle {
  id: string;
  companyId: string;
  companyName: string;
  statementPeriod: string;
  dueDate: string;
  totalDue: number;
  status: string;
  paymentRef: string;
  paymentDate: string | null;
  paymentMode: string | null;
  apportionmentStatus: string;
  cardCount: number;
}

interface PaymentApportionment {
  id: string;
  paymentCycleId: string;
  cardId: string;
  cardLast4: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  costCenterName: string;
  amount: number;
  status: string;
}

// =============================================================================
// Constants
// =============================================================================

const CYCLE_STATUSES = [
  { value: "ALL", label: "All Statuses" },
  { value: "DUE", label: "Due" },
  { value: "PAYMENT_INITIATED", label: "Payment Initiated" },
  { value: "PAYMENT_RECEIVED", label: "Payment Received" },
  { value: "APPORTIONED", label: "Apportioned" },
  { value: "RECONCILED", label: "Reconciled" },
];

const PERIODS = [
  { value: "ALL", label: "All Periods" },
  { value: "2026-01", label: "Jan 2026" },
  { value: "2025-12", label: "Dec 2025" },
  { value: "2025-11", label: "Nov 2025" },
];

const formatINRAmount = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

// =============================================================================
// Status Badge helpers
// =============================================================================

const cycleStatusConfig: Record<string, { color: string; label: string }> = {
  DUE: { color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", label: "Due" },
  PAYMENT_INITIATED: { color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", label: "Initiated" },
  PAYMENT_RECEIVED: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", label: "Received" },
  APPORTIONED: { color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", label: "Apportioned" },
  RECONCILED: { color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", label: "Reconciled" },
};

const apportionmentStatusConfig: Record<string, { color: string; label: string }> = {
  PENDING: { color: "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400", label: "Pending" },
  IN_PROGRESS: { color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", label: "In Progress" },
  APPORTIONED: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", label: "Apportioned" },
  COMPLETED: { color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", label: "Completed" },
  RECONCILED: { color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", label: "Reconciled" },
};

function CycleStatusBadge({ status }: { status: string }) {
  const config = cycleStatusConfig[status] || { color: "bg-gray-100 text-gray-800", label: status };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${config.color}`}>
      {config.label}
    </span>
  );
}

function ApportionmentStatusBadge({ status }: { status: string }) {
  const config = apportionmentStatusConfig[status] || { color: "bg-gray-100 text-gray-800", label: status };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${config.color}`}>
      {config.label}
    </span>
  );
}

// =============================================================================
// Period formatting
// =============================================================================

function formatPeriod(period: string): string {
  const [year, month] = period.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

// =============================================================================
// Main Component
// =============================================================================

export default function PaymentsPage() {
  const [paymentCycles, setPaymentCycles] = useState<PaymentCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [companyFilter, setCompanyFilter] = useState("ALL");
  const [periodFilter, setPeriodFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Expanded row for apportionment detail
  const [expandedCycleId, setExpandedCycleId] = useState<string | null>(null);
  const [apportionments, setApportionments] = useState<PaymentApportionment[]>([]);
  const [loadingApportionments, setLoadingApportionments] = useState(false);

  // ---------------------------------------------------------------------------
  // Fetch payment cycles
  // ---------------------------------------------------------------------------
  const fetchCycles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (companyFilter !== "ALL") params.set("companyId", companyFilter);
      if (periodFilter !== "ALL") params.set("period", periodFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/v1/payments?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch payment cycles");

      const json = await res.json();
      setPaymentCycles(json.data.paymentCycles || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [companyFilter, periodFilter, statusFilter]);

  useEffect(() => {
    fetchCycles();
  }, [fetchCycles]);

  // ---------------------------------------------------------------------------
  // Fetch apportionments for an expanded row
  // ---------------------------------------------------------------------------
  const handleRowClick = useCallback(
    async (cycleId: string) => {
      if (expandedCycleId === cycleId) {
        setExpandedCycleId(null);
        setApportionments([]);
        return;
      }

      setExpandedCycleId(cycleId);
      setLoadingApportionments(true);

      try {
        const res = await fetch(`/api/v1/payments?cycleId=${cycleId}`);
        if (!res.ok) throw new Error("Failed to fetch apportionments");
        const json = await res.json();
        setApportionments(json.data.paymentApportionments || []);
      } catch {
        setApportionments([]);
      } finally {
        setLoadingApportionments(false);
      }
    },
    [expandedCycleId]
  );

  // ---------------------------------------------------------------------------
  // Derived: unique company list from data
  // ---------------------------------------------------------------------------
  const companies = useMemo(() => {
    const map = new Map<string, string>();
    paymentCycles.forEach((c) => map.set(c.companyId, c.companyName));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [paymentCycles]);

  // ---------------------------------------------------------------------------
  // Summary stats (computed from ALL cycles, not filtered — except company)
  // ---------------------------------------------------------------------------
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const totalOutstanding = paymentCycles
      .filter((c) => c.status === "DUE")
      .reduce((sum, c) => sum + c.totalDue, 0);

    const paymentsThisMonth = paymentCycles.filter(
      (c) =>
        ["PAYMENT_RECEIVED", "APPORTIONED", "RECONCILED"].includes(c.status) &&
        c.paymentDate &&
        c.paymentDate.startsWith(currentMonth)
    ).length;

    const pendingApportionment = paymentCycles.filter(
      (c) => c.apportionmentStatus !== "COMPLETED"
    ).length;

    const reconciled = paymentCycles.filter(
      (c) => c.status === "RECONCILED"
    ).length;

    return { totalOutstanding, paymentsThisMonth, pendingApportionment, reconciled };
  }, [paymentCycles]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Payment Cycles"
        description="Consolidated corporate payments and card-level apportionment"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Banknote className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-xs text-muted-foreground">Total Outstanding</p>
            </div>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 font-mono tabular-nums">
              {formatINRAmount(stats.totalOutstanding)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <ArrowRightLeft className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-xs text-muted-foreground">Payments This Month</p>
            </div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.paymentsThisMonth}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-xs text-muted-foreground">Pending Apportionment</p>
            </div>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pendingApportionment}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-xs text-muted-foreground">Reconciled</p>
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.reconciled}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground uppercase">Company</label>
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="ALL">All Companies</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground uppercase">Period</label>
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground uppercase">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {CYCLE_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Payment Cycles Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-6 h-6 mx-auto text-muted-foreground animate-spin mb-2" />
              <p className="text-sm text-muted-foreground">Loading payment cycles...</p>
            </div>
          ) : error ? (
            <div className="py-16 text-center">
              <AlertCircle className="w-6 h-6 mx-auto text-destructive mb-2" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          ) : paymentCycles.length === 0 ? (
            <div className="py-16 text-center">
              <Banknote className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No payment cycles found</p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="hidden lg:grid lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr_0.9fr_1fr_0.8fr_0.8fr_0.9fr_0.5fr] gap-2 px-4 py-2.5 bg-muted/50 border-b text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                <span>Company</span>
                <span>Period</span>
                <span>Due Date</span>
                <span className="text-right">Total Due</span>
                <span>Status</span>
                <span>Payment Ref</span>
                <span>Payment Date</span>
                <span>Mode</span>
                <span>Apportionment</span>
                <span className="text-center">Cards</span>
              </div>

              {/* Table Rows */}
              <div className="divide-y">
                {paymentCycles.map((cycle) => (
                  <div key={cycle.id}>
                    {/* Main Row */}
                    <div
                      className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr_0.9fr_1fr_0.8fr_0.8fr_0.9fr_0.5fr] gap-2 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer items-center"
                      onClick={() => handleRowClick(cycle.id)}
                    >
                      {/* Company */}
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium truncate">{cycle.companyName}</span>
                        {expandedCycleId === cycle.id ? (
                          <ChevronUp className="w-3.5 h-3.5 text-muted-foreground lg:hidden" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground lg:hidden" />
                        )}
                      </div>

                      {/* Period */}
                      <div className="text-sm text-muted-foreground">
                        <span className="lg:hidden text-[10px] font-medium text-muted-foreground uppercase mr-2">Period:</span>
                        {formatPeriod(cycle.statementPeriod)}
                      </div>

                      {/* Due Date */}
                      <div className="text-sm text-muted-foreground">
                        <span className="lg:hidden text-[10px] font-medium text-muted-foreground uppercase mr-2">Due:</span>
                        {formatDate(cycle.dueDate)}
                      </div>

                      {/* Total Due */}
                      <div className="text-right">
                        <span className="lg:hidden text-[10px] font-medium text-muted-foreground uppercase mr-2">Total Due:</span>
                        <span className="text-sm font-semibold font-mono tabular-nums">
                          {formatINRAmount(cycle.totalDue)}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-1 hidden xl:inline">
                          ({(cycle.totalDue / 100000).toFixed(1)}L)
                        </span>
                      </div>

                      {/* Status */}
                      <div>
                        <CycleStatusBadge status={cycle.status} />
                      </div>

                      {/* Payment Ref */}
                      <div className="text-xs text-muted-foreground font-mono truncate">
                        {cycle.paymentRef || <span className="text-muted-foreground/50">---</span>}
                      </div>

                      {/* Payment Date */}
                      <div className="text-sm text-muted-foreground">
                        {cycle.paymentDate ? formatDate(cycle.paymentDate) : <span className="text-muted-foreground/50">---</span>}
                      </div>

                      {/* Payment Mode */}
                      <div>
                        {cycle.paymentMode ? (
                          <Badge variant="outline" className="text-[10px]">
                            {cycle.paymentMode}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground/50 text-xs">---</span>
                        )}
                      </div>

                      {/* Apportionment Status */}
                      <div>
                        <ApportionmentStatusBadge status={cycle.apportionmentStatus} />
                      </div>

                      {/* Cards count */}
                      <div className="flex items-center justify-center gap-1">
                        <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">{cycle.cardCount}</span>
                        {expandedCycleId === cycle.id ? (
                          <ChevronUp className="w-3.5 h-3.5 text-muted-foreground hidden lg:block" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden lg:block" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Apportionment Detail */}
                    {expandedCycleId === cycle.id && (
                      <div className="bg-muted/30 border-t px-4 py-4">
                        <div className="flex items-center gap-2 mb-3">
                          <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Card-Level Apportionment
                          </h3>
                          <span className="text-[10px] text-muted-foreground">
                            ({cycle.companyName} / {formatPeriod(cycle.statementPeriod)})
                          </span>
                        </div>

                        {loadingApportionments ? (
                          <div className="py-6 text-center">
                            <Loader2 className="w-5 h-5 mx-auto text-muted-foreground animate-spin mb-1" />
                            <p className="text-xs text-muted-foreground">Loading apportionments...</p>
                          </div>
                        ) : apportionments.length === 0 ? (
                          <div className="py-6 text-center">
                            <p className="text-xs text-muted-foreground">No apportionments available for this cycle</p>
                          </div>
                        ) : (
                          <div className="rounded-lg border bg-background overflow-hidden">
                            {/* Apportionment Table Header */}
                            <div className="hidden sm:grid sm:grid-cols-[0.6fr_1fr_1fr_1fr_0.8fr_0.6fr] gap-2 px-4 py-2 bg-muted/50 border-b text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                              <span>Card</span>
                              <span>Employee</span>
                              <span>Department</span>
                              <span>Cost Center</span>
                              <span className="text-right">Amount</span>
                              <span className="text-center">Status</span>
                            </div>

                            {/* Apportionment Rows */}
                            <div className="divide-y">
                              {apportionments.map((appr) => (
                                <div
                                  key={appr.id}
                                  className="grid grid-cols-1 sm:grid-cols-[0.6fr_1fr_1fr_1fr_0.8fr_0.6fr] gap-2 px-4 py-2.5 items-center hover:bg-muted/30 transition-colors"
                                >
                                  {/* Card Last 4 */}
                                  <div className="flex items-center gap-1.5">
                                    <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span className="text-xs font-mono">****{appr.cardLast4}</span>
                                  </div>

                                  {/* Employee */}
                                  <div className="text-xs truncate">{appr.employeeName}</div>

                                  {/* Department */}
                                  <div className="text-xs text-muted-foreground truncate">{appr.departmentName}</div>

                                  {/* Cost Center */}
                                  <div className="text-xs text-muted-foreground truncate">
                                    {appr.costCenterName || <span className="text-muted-foreground/50">---</span>}
                                  </div>

                                  {/* Amount */}
                                  <div className="text-right">
                                    <span className="text-xs font-semibold font-mono tabular-nums">
                                      {formatINRAmount(appr.amount)}
                                    </span>
                                  </div>

                                  {/* Status */}
                                  <div className="flex justify-center">
                                    <ApportionmentStatusBadge status={appr.status} />
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Apportionment Total */}
                            <div className="grid grid-cols-1 sm:grid-cols-[0.6fr_1fr_1fr_1fr_0.8fr_0.6fr] gap-2 px-4 py-2.5 bg-muted/50 border-t">
                              <div className="sm:col-span-4 text-xs font-semibold text-muted-foreground">
                                Total ({apportionments.length} cards)
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-bold font-mono tabular-nums">
                                  {formatINRAmount(apportionments.reduce((sum, a) => sum + a.amount, 0))}
                                </span>
                              </div>
                              <div />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Pipeline Legend */}
      <Card>
        <CardContent className="p-4">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Payment Pipeline
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-4">
              <CycleStatusBadge status="DUE" />
              <span className="text-muted-foreground text-xs">&#8594;</span>
              <CycleStatusBadge status="PAYMENT_INITIATED" />
              <span className="text-muted-foreground text-xs">&#8594;</span>
              <CycleStatusBadge status="PAYMENT_RECEIVED" />
              <span className="text-muted-foreground text-xs">&#8594;</span>
              <CycleStatusBadge status="APPORTIONED" />
              <span className="text-muted-foreground text-xs">&#8594;</span>
              <CycleStatusBadge status="RECONCILED" />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Statement &rarr; Due Date &rarr; Payment &rarr; Apportionment &rarr; Reconciliation
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
