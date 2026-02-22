"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { formatINRCompact, formatDate, getFY } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/constants";
import { useUserRole, canSeeWidget, isEmployeeRole } from "@/lib/role-access";
import { useModuleConfig } from "@/components/providers/module-config-provider";
import {
  getStats,
  getAnalytics,
  getTransactions,
  getApprovals,
  getEmployeeDashboard,
  getExpenses,
  getExpenseReports,
} from "@/lib/store";
import {
  TrendingUp,
  TrendingDown,
  CreditCard,
  Receipt,
  CheckSquare,
  Shield,
  ArrowRightLeft,
  Plus,
  ChevronRight,
  IndianRupee,
  Activity,
  PieChart,
  Wallet,
  AlertCircle,
  FileText,
  Banknote,
  Users,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import Link from "next/link";

// ==================== CHART COMPONENTS ====================
function DonutChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let cumulative = 0;
  return (
    <div className="relative w-28 h-28 mx-auto">
      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
        {data.map((item) => {
          const percentage = (item.value / total) * 100;
          const offset = cumulative;
          cumulative += percentage;
          return (
            <circle key={item.name} cx="18" cy="18" r="15.9" fill="none" stroke={item.color} strokeWidth="3"
              strokeDasharray={`${percentage} ${100 - percentage}`} strokeDashoffset={-offset} className="transition-all duration-500" />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs font-bold">{formatINRCompact(total)}</span>
        <span className="text-[9px] text-muted-foreground">Total</span>
      </div>
    </div>
  );
}

function HorizontalBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground truncate flex-1">{label}</span>
        <span className="font-medium ml-2">{formatINRCompact(value)}</span>
        <span className="text-muted-foreground ml-2 w-8 text-right">{pct}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// ==================== EMPLOYEE DASHBOARD ====================
function EmployeeDashboard() {
  const data = getEmployeeDashboard("emp-5");
  const { config: mc } = useModuleConfig();
  const showCards = mc.cardPortal;

  return (
    <div className="space-y-6 animate-in">
      <PageHeader title="My Dashboard" description={`Welcome back | ${getFY()}`} />

      {/* My Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {showCards && (
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">My Spend MTD</p>
              <CurrencyDisplay amount={data.totalSpendMTD} compact className="text-2xl font-bold" />
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                <span className="text-xs text-emerald-500">+{Math.round(((data.totalSpendMTD - data.totalSpendLastMonth) / data.totalSpendLastMonth) * 100)}%</span>
                <span className="text-xs text-muted-foreground">vs last month</span>
              </div>
            </CardContent>
          </Card>
        )}

        {showCards && (
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">Available Limit</p>
              <CurrencyDisplay
                amount={data.myCards.reduce((sum, c) => sum + c.available, 0)}
                compact className="text-2xl font-bold text-emerald-600"
              />
              <p className="text-xs text-muted-foreground mt-1">{data.myCards.length} active cards</p>
            </CardContent>
          </Card>
        )}

        {mc.expenseManagement && (
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">Missing Receipts</p>
              <p className="text-2xl font-bold text-amber-600">{data.missingReceipts}</p>
              <p className="text-xs text-amber-600 mt-1">Action required</p>
            </CardContent>
          </Card>
        )}

        {mc.expenseManagement && (
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">Pending Expenses</p>
              <p className="text-2xl font-bold">{data.pendingExpenses}</p>
              <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* My Cards — only when card portal ON */}
      {showCards && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {data.myCards.map((card) => (
            <Card key={card.last4}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <span className="font-medium">****{card.last4}</span>
                    <Badge variant="outline" className="text-[9px]">{card.type}</Badge>
                    <Badge variant="outline" className="text-[9px]">{card.network}</Badge>
                  </div>
                  <Badge className="text-[9px] bg-emerald-500">{card.status}</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Spent</span>
                    <CurrencyDisplay amount={card.spent} compact className="font-medium" />
                  </div>
                  <Progress value={(card.spent / card.limit) * 100} className="h-2" />
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Available: {formatINRCompact(card.available)}</span>
                    <span className="text-muted-foreground">Limit: {formatINRCompact(card.limit)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">My Recent Transactions</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/transactions" className="text-xs">View all <ChevronRight className="w-3 h-3 ml-1" /></Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.myRecentTransactions.map((txn, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{txn.merchant}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(txn.date)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!txn.hasReceipt && mc.expenseManagement && (
                    <span title="Receipt missing"><AlertCircle className="w-3.5 h-3.5 text-amber-500" /></span>
                  )}
                  <CurrencyDisplay amount={txn.amount} className="text-sm font-medium" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {mc.expenseManagement && (
          <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
            <Link href="/expenses/new"><Receipt className="w-5 h-5" /><span className="text-sm">Submit Expense</span></Link>
          </Button>
        )}
        {mc.expenseManagement && (
          <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
            <Link href="/expense-reports"><FileText className="w-5 h-5" /><span className="text-sm">My Reports</span></Link>
          </Button>
        )}
        {showCards && (
          <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
            <Link href="/cards"><CreditCard className="w-5 h-5" /><span className="text-sm">My Cards</span></Link>
          </Button>
        )}
      </div>
    </div>
  );
}

// ==================== ADMIN/MANAGER DASHBOARD ====================
function AdminDashboard() {
  const { role } = useUserRole();
  const { config: mc } = useModuleConfig();
  const dashboardStats = getStats();
  const analytics = getAnalytics();
  const spendByCategory = analytics.spendByCategory;
  const spendByMonth = analytics.spendByMonth;
  const topSpenders = analytics.topSpenders;
  const hierarchySpend = analytics.hierarchySpend;
  const recentTxns = getTransactions().slice(0, 5);

  const showCards = mc.cardPortal;
  const showExpense = mc.expenseManagement;
  const showBoth = showCards && showExpense;
  const showWidget = (w: Parameters<typeof canSeeWidget>[1]) => canSeeWidget(role, w, mc);

  // --- Expense data (only computed when expense management is ON) ---
  const allExpenses = showExpense ? getExpenses() : [];
  const allExpenseReports = showExpense ? getExpenseReports() : [];

  const receiptCount = allExpenses.filter((e) => e.hasReceipt).length;
  const receiptCoveragePct = allExpenses.length > 0 ? Math.round((receiptCount / allExpenses.length) * 100) : 0;

  const now = new Date();
  const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const mtdExpenses = allExpenses.filter((e) => e.date >= mtdStart);
  const expenseVolumeMTD = mtdExpenses.reduce((sum, e) => sum + e.amount, 0);

  const pipelineCounts = {
    DRAFT: allExpenseReports.filter((r) => r.status === "DRAFT").length,
    SUBMITTED: allExpenseReports.filter((r) => r.status === "SUBMITTED").length,
    IN_REVIEW: allExpenseReports.filter((r) => r.status === "IN_REVIEW").length,
    APPROVED: allExpenseReports.filter((r) => r.status === "APPROVED").length,
    PAID: allExpenseReports.filter((r) => r.status === "PAID").length,
  };
  const pipelineTotal = Object.values(pipelineCounts).reduce((s, v) => s + v, 0);

  const hardViolations = allExpenses.filter((e) => e.policyStatus === "HARD_VIOLATION");
  const softViolations = allExpenses.filter((e) => e.policyStatus === "SOFT_VIOLATION");

  const reimbursementPending = allExpenseReports.filter(
    (r) => r.status === "APPROVED" || r.status === "PROCESSING"
  );
  const reimbursementAmount = reimbursementPending.reduce((sum, r) => sum + r.totalAmount, 0);

  const uniqueExpenseEmployees = new Set(allExpenses.map((e) => e.employeeId)).size;
  const avgExpensePerEmployee = uniqueExpenseEmployees > 0
    ? Math.round(allExpenses.reduce((sum, e) => sum + e.amount, 0) / uniqueExpenseEmployees)
    : 0;
  const categoryTotals = allExpenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});
  const topExpenseCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0] || ["N/A", 0];

  const pipelineStages = [
    { key: "DRAFT", label: "Draft", color: "#94a3b8" },
    { key: "SUBMITTED", label: "Submitted", color: "#3b82f6" },
    { key: "IN_REVIEW", label: "In Review", color: "#f59e0b" },
    { key: "APPROVED", label: "Approved", color: "#10b981" },
    { key: "PAID", label: "Paid", color: "#0d3b66" },
  ];

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Dashboard"
        description={`Overview for ${getFY()} | ${ROLE_LABELS[role]}`}
      >
        <div className="flex items-center gap-2">
          {showExpense && (
            <Button asChild>
              <Link href="/expenses/new"><Plus className="w-4 h-4" />New Expense</Link>
            </Button>
          )}
          {showCards && (
            <Button variant="outline" asChild>
              <Link href="/cards/new"><CreditCard className="w-4 h-4" />Request Card</Link>
            </Button>
          )}
        </div>
      </PageHeader>

      {/* ──────────── PRIMARY KPIs (always 4 columns) ──────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* KPI 1: Card Spend MTD OR Expense Volume MTD */}
        {showCards && showWidget("spend_mtd") && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Card Spend MTD</p>
                  <CurrencyDisplay amount={dashboardStats.totalSpendMTD} compact className="text-2xl font-bold" />
                  <div className="flex items-center gap-1 mt-1">
                    {dashboardStats.spendTrendPercent >= 0
                      ? <TrendingUp className="w-3 h-3 text-emerald-500" />
                      : <TrendingDown className="w-3 h-3 text-red-500" />}
                    <span className={`text-xs ${dashboardStats.spendTrendPercent >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                      {dashboardStats.spendTrendPercent >= 0 ? "+" : ""}{dashboardStats.spendTrendPercent}%
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {!showCards && showExpense && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Expense Volume MTD</p>
                  <CurrencyDisplay amount={expenseVolumeMTD} compact className="text-2xl font-bold" />
                  <div className="flex items-center gap-1 mt-1">
                    <BarChart3 className="w-3 h-3 text-blue-500" />
                    <span className="text-xs text-muted-foreground">{mtdExpenses.length} expenses</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPI 2: Active Cards OR Receipt Coverage */}
        {showCards && showWidget("active_cards") && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Active Cards</p>
                  <p className="text-2xl font-bold">{dashboardStats.activeCards}<span className="text-sm font-normal text-muted-foreground">/{dashboardStats.totalCards}</span></p>
                  <div className="flex items-center gap-1 mt-1">
                    <Activity className="w-3 h-3 text-blue-500" />
                    <span className="text-xs text-muted-foreground">{dashboardStats.totalTransactionsMTD} txns this month</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {!showCards && showExpense && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Receipt Coverage</p>
                  <p className="text-2xl font-bold">{receiptCoveragePct}<span className="text-sm font-normal text-muted-foreground">%</span></p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className={`text-xs ${receiptCoveragePct >= 80 ? "text-emerald-500" : "text-amber-500"}`}>
                      {receiptCount}/{allExpenses.length} expenses
                    </span>
                  </div>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${receiptCoveragePct >= 80 ? "bg-emerald-500/10" : "bg-amber-500/10"}`}>
                  <Receipt className={`w-5 h-5 ${receiptCoveragePct >= 80 ? "text-emerald-500" : "text-amber-500"}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPI 3: Expense Volume MTD (both) OR Card Limit Util (cards only) OR Pending Approvals (expense only) */}
        {showBoth && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Expense Volume MTD</p>
                  <CurrencyDisplay amount={expenseVolumeMTD} compact className="text-2xl font-bold" />
                  <div className="flex items-center gap-1 mt-1">
                    <BarChart3 className="w-3 h-3 text-blue-500" />
                    <span className="text-xs text-muted-foreground">{mtdExpenses.length} expenses</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {showCards && !showExpense && showWidget("limit_utilization") && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Card Limit Utilization</p>
                  <p className="text-2xl font-bold">{dashboardStats.limitUtilizationPercent}<span className="text-sm font-normal text-muted-foreground">%</span></p>
                  <Progress value={dashboardStats.limitUtilizationPercent} className="mt-2 h-1.5" />
                </div>
                <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-violet-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {!showCards && showExpense && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Pending Approvals</p>
                  <p className="text-2xl font-bold">{dashboardStats.pendingApprovals}</p>
                  {dashboardStats.overdueApprovals > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingDown className="w-3 h-3 text-amber-500" />
                      <span className="text-xs text-amber-500">{dashboardStats.overdueApprovals} overdue</span>
                    </div>
                  )}
                </div>
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <CheckSquare className="w-5 h-5 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPI 4: Pending Approvals (both) OR Transactions (cards only) OR Policy Compliance (expense only) */}
        {showBoth && showWidget("pending_approvals") && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Pending Approvals</p>
                  <p className="text-2xl font-bold">{dashboardStats.pendingApprovals}</p>
                  {dashboardStats.overdueApprovals > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingDown className="w-3 h-3 text-amber-500" />
                      <span className="text-xs text-amber-500">{dashboardStats.overdueApprovals} overdue</span>
                    </div>
                  )}
                </div>
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <CheckSquare className="w-5 h-5 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {showCards && !showExpense && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Transactions MTD</p>
                  <p className="text-2xl font-bold">{dashboardStats.totalTransactionsMTD}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Activity className="w-3 h-3 text-emerald-500" />
                    <span className="text-xs text-muted-foreground">this month</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <ArrowRightLeft className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {!showCards && showExpense && showWidget("policy_compliance") && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Policy Compliance</p>
                  <p className="text-2xl font-bold">{dashboardStats.policyComplianceScore}<span className="text-sm font-normal text-muted-foreground">%</span></p>
                  <Progress value={dashboardStats.policyComplianceScore} className="mt-2 h-1.5" />
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ──────────── SECONDARY METRICS (compact strip — only when BOTH modules ON) ──────────── */}
      {showBoth && (
        <Card>
          <CardContent className="p-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-0 sm:divide-x">
              {/* Card Limit Utilization */}
              <div className="sm:px-4 first:sm:pl-0 last:sm:pr-0">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-violet-500 shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Card Limit Util.</p>
                    <p className="text-lg font-bold">{dashboardStats.limitUtilizationPercent}%</p>
                  </div>
                </div>
              </div>
              {/* Receipt Coverage */}
              <div className="sm:px-4 first:sm:pl-0 last:sm:pr-0">
                <div className="flex items-center gap-2">
                  <Receipt className={`w-4 h-4 shrink-0 ${receiptCoveragePct >= 80 ? "text-emerald-500" : "text-amber-500"}`} />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Receipt Coverage</p>
                    <p className="text-lg font-bold">{receiptCoveragePct}%</p>
                  </div>
                </div>
              </div>
              {/* Policy Compliance */}
              <div className="sm:px-4 first:sm:pl-0 last:sm:pr-0">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Policy Compliance</p>
                    <p className="text-lg font-bold">{dashboardStats.policyComplianceScore}%</p>
                  </div>
                </div>
              </div>
              {/* Reimbursement Pending */}
              <div className="sm:px-4 first:sm:pl-0 last:sm:pr-0">
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-orange-500 shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Reimb. Pending</p>
                    <p className="text-lg font-bold">{formatINRCompact(reimbursementAmount)}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ──────────── TRENDS & PIPELINE ──────────── */}
      <div className={showBoth ? "grid grid-cols-1 lg:grid-cols-2 gap-4" : ""}>
        {/* Monthly Spend Trend — card portal */}
        {showCards && showWidget("monthly_trend") && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium">Monthly Spend Trend</CardTitle>
                  <CardDescription className="text-xs">Last 5 months card spend</CardDescription>
                </div>
                <span className="text-xs text-muted-foreground">
                  Avg: {formatINRCompact(spendByMonth.reduce((sum, m) => sum + m.amount, 0) / spendByMonth.length)}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3 h-20">
                {spendByMonth.map((m) => {
                  const maxVal = Math.max(...spendByMonth.map((s) => s.amount));
                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] font-medium">{formatINRCompact(m.amount)}</span>
                      <div className="w-full rounded-t-md bg-primary/80 transition-all" style={{ height: `${(m.amount / maxVal) * 100}%`, minHeight: "8px" }} />
                      <span className="text-[9px] text-muted-foreground">{m.month.split(" ")[0]}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Expense Pipeline — expense management */}
        {showExpense && pipelineTotal > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium">Expense Pipeline</CardTitle>
                  <CardDescription className="text-xs">{pipelineTotal} reports in pipeline</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/expense-reports" className="text-xs">View all <ChevronRight className="w-3 h-3 ml-1" /></Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Horizontal stacked bar */}
              <div className="h-6 rounded-full overflow-hidden flex bg-muted">
                {pipelineStages.map((stage) => {
                  const count = pipelineCounts[stage.key as keyof typeof pipelineCounts];
                  if (count === 0) return null;
                  const widthPct = (count / pipelineTotal) * 100;
                  return (
                    <div key={stage.key} className="h-full transition-all duration-500 flex items-center justify-center"
                      style={{ width: `${widthPct}%`, backgroundColor: stage.color, minWidth: count > 0 ? "24px" : "0" }}
                      title={`${stage.label}: ${count}`}>
                      {widthPct > 8 && <span className="text-[10px] font-medium text-white">{count}</span>}
                    </div>
                  );
                })}
              </div>
              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-3">
                {pipelineStages.map((stage) => (
                  <div key={stage.key} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                    <span className="text-muted-foreground">{stage.label}</span>
                    <span className="font-medium">{pipelineCounts[stage.key as keyof typeof pipelineCounts]}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ──────────── ANALYSIS ROW ──────────── */}
      <div className={
        showBoth
          ? "grid grid-cols-1 lg:grid-cols-3 gap-4"
          : "grid grid-cols-1 lg:grid-cols-2 gap-4"
      }>
        {/* Department Spend vs Limit — card portal */}
        {showCards && showWidget("hierarchy_spend") && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Department Spend vs Limit</CardTitle>
              <CardDescription className="text-xs">Card limit utilization by department</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {hierarchySpend.map((dept) => (
                  <HorizontalBar key={dept.name} label={dept.name} value={dept.spend} max={dept.limit} color={dept.color} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Spend by Category — shared */}
        {showWidget("spend_by_category") && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Spend by Category</CardTitle>
              <CardDescription className="text-xs">{getFY()} breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <DonutChart data={spendByCategory} />
              <div className="mt-3 space-y-1.5">
                {spendByCategory.slice(0, 5).map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-medium">{formatINRCompact(item.value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Policy Violations — expense management */}
        {showExpense && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Policy Violations</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/policies" className="text-xs">View All <ChevronRight className="w-3 h-3 ml-1" /></Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30">
                  <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-700 dark:text-red-400">Hard Violations</p>
                    <p className="text-[11px] text-red-600/70 dark:text-red-400/70">Exceed policy limits</p>
                  </div>
                  <span className="text-xl font-bold text-red-600 dark:text-red-400">{hardViolations.length}</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Soft Violations</p>
                    <p className="text-[11px] text-amber-600/70 dark:text-amber-400/70">Require justification</p>
                  </div>
                  <span className="text-xl font-bold text-amber-600 dark:text-amber-400">{softViolations.length}</span>
                </div>
                <div className="pt-2 border-t flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Total violations</span>
                  <Badge variant="destructive" className="text-xs">{hardViolations.length + softViolations.length}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ──────────── ACTIVITY ROW ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Transactions */}
        {showWidget("recent_transactions") && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Recent Transactions</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/transactions" className="text-xs">View all <ChevronRight className="w-3 h-3 ml-1" /></Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentTxns.map((txn) => (
                  <div key={txn.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{txn.merchantName}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{txn.employeeName}</span><span>&middot;</span><span>{formatDate(txn.timestamp)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <CurrencyDisplay amount={txn.amount} className="text-sm font-medium" />
                      <div className="mt-0.5"><StatusBadge status={txn.status} /></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Right column: Approvals + Spenders */}
        <div className="space-y-4">
          {showWidget("pending_approval_list") && showExpense && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/approvals" className="text-xs">View all <ChevronRight className="w-3 h-3 ml-1" /></Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {getApprovals().slice(0, 3).map((appr) => (
                    <div key={appr.id} className="flex items-center justify-between py-1">
                      <div>
                        <p className="text-sm font-medium">{appr.reportNumber}</p>
                        <p className="text-xs text-muted-foreground">{appr.employeeName} &middot; {appr.department}</p>
                      </div>
                      <CurrencyDisplay amount={appr.amount} compact className="text-sm font-medium" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {showWidget("top_spenders") && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Top Spenders</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {topSpenders.map((spender, i) => (
                    <div key={spender.name} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{spender.name}</p>
                        <p className="text-xs text-muted-foreground">{spender.department}</p>
                      </div>
                      <CurrencyDisplay amount={spender.amount} compact className="text-sm font-medium" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ──────────── EXPENSE INSIGHTS (expense management only) ──────────── */}
      {showExpense && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-indigo-500" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Avg Expense / Employee</p>
                  <CurrencyDisplay amount={avgExpensePerEmployee} compact className="text-lg font-bold" />
                  <p className="text-[11px] text-muted-foreground">{uniqueExpenseEmployees} active employees</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0">
                  <PieChart className="w-4 h-4 text-teal-500" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Top Expense Category</p>
                  <p className="text-lg font-bold truncate">{topExpenseCategory[0]}</p>
                  <CurrencyDisplay amount={topExpenseCategory[1] as number} compact className="text-[11px] text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Duplicate Alerts</p>
                  <p className="text-lg font-bold text-amber-600">3</p>
                  <p className="text-[11px] text-amber-500">potential duplicates detected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ──────────── QUICK ACTIONS ──────────── */}
      {showWidget("quick_actions") && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {showCards && (
            <Button variant="outline" className="h-auto py-3 flex flex-col gap-1.5" asChild>
              <Link href="/cards/new"><CreditCard className="w-4 h-4" /><span className="text-xs">Request Card</span></Link>
            </Button>
          )}
          {showExpense && (
            <Button variant="outline" className="h-auto py-3 flex flex-col gap-1.5" asChild>
              <Link href="/expenses/new"><Receipt className="w-4 h-4" /><span className="text-xs">Create Expense</span></Link>
            </Button>
          )}
          {showExpense && (
            <Button variant="outline" className="h-auto py-3 flex flex-col gap-1.5" asChild>
              <Link href="/approvals"><CheckSquare className="w-4 h-4" /><span className="text-xs">Review Approvals</span></Link>
            </Button>
          )}
          <Button variant="outline" className="h-auto py-3 flex flex-col gap-1.5" asChild>
            <Link href="/reports"><PieChart className="w-4 h-4" /><span className="text-xs">View Reports</span></Link>
          </Button>
        </div>
      )}
    </div>
  );
}

// ==================== MAIN ====================
export default function DashboardPage() {
  const { role, isLoading } = useUserRole();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-muted rounded animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (isEmployeeRole(role)) return <EmployeeDashboard />;
  return <AdminDashboard />;
}
