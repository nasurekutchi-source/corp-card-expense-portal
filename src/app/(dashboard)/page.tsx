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
import { useUserRole, canSeeWidget, defaultModuleConfig, isEmployeeRole } from "@/lib/role-access";
import {
  dashboardStats,
  spendByCategory,
  spendByMonth,
  topSpenders,
  demoTransactions,
  demoApprovals,
  hierarchySpend,
  employeeDashboardData,
} from "@/lib/demo-data";
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
} from "lucide-react";
import Link from "next/link";

// ==================== CHART COMPONENTS ====================
function MiniBarChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((item) => (
        <div key={item.name} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-sm transition-all"
            style={{ height: `${(item.value / max) * 100}%`, backgroundColor: item.color, minHeight: "4px" }}
          />
          <span className="text-[8px] text-muted-foreground truncate w-full text-center">{item.name.split(" ")[0]}</span>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let cumulative = 0;
  return (
    <div className="relative w-32 h-32 mx-auto">
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
  const data = employeeDashboardData;
  const mc = defaultModuleConfig;

  return (
    <div className="space-y-6 animate-in">
      <PageHeader title="My Dashboard" description={`Welcome back | ${getFY()}`} />

      {/* My Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* My Cards */}
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
      {mc.expenseManagement && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
            <Link href="/expenses/new"><Receipt className="w-5 h-5" /><span className="text-sm">Submit Expense</span></Link>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
            <Link href="/expense-reports"><FileText className="w-5 h-5" /><span className="text-sm">My Reports</span></Link>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
            <Link href="/cards"><CreditCard className="w-5 h-5" /><span className="text-sm">My Cards</span></Link>
          </Button>
        </div>
      )}
    </div>
  );
}

// ==================== ADMIN/MANAGER DASHBOARD ====================
function AdminDashboard() {
  const { role } = useUserRole();
  const mc = defaultModuleConfig;
  const recentTxns = demoTransactions.slice(0, 5);

  const showExpense = mc.expenseManagement;
  const showWidget = (w: Parameters<typeof canSeeWidget>[1]) => canSeeWidget(role, w, mc);

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Dashboard"
        description={`Overview for ${getFY()} | Last updated: ${formatDate(new Date())} | ${ROLE_LABELS[role]}`}
      >
        {showExpense && (
          <Button asChild>
            <Link href="/expenses/new"><Plus className="w-4 h-4" />New Expense</Link>
          </Button>
        )}
      </PageHeader>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {showWidget("spend_mtd") && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Spend MTD</p>
                  <CurrencyDisplay amount={dashboardStats.totalSpendMTD} compact className="text-2xl font-bold" />
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                    <span className="text-xs text-emerald-500">+12.5%</span>
                    <span className="text-xs text-muted-foreground">vs last month</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {showWidget("active_cards") && (
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

        {showWidget("limit_utilization") && (
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

        {showWidget("pending_approvals") && showExpense && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Pending Approvals</p>
                  <p className="text-2xl font-bold">{dashboardStats.pendingApprovals}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingDown className="w-3 h-3 text-amber-500" />
                    <span className="text-xs text-amber-500">3 overdue</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <CheckSquare className="w-5 h-5 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {showWidget("policy_compliance") && showExpense && (
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

      {/* Monthly Spend Trend (horizontal) */}
      {showWidget("monthly_trend") && (
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

      {/* Department Spend + Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {showWidget("hierarchy_spend") && (
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

        {showWidget("spend_by_category") && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Spend by Category</CardTitle>
              <CardDescription className="text-xs">{getFY()} breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <DonutChart data={spendByCategory} />
              <div className="mt-4 space-y-2">
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
      </div>

      {/* Recent Transactions + Approvals/Spenders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                  {demoApprovals.slice(0, 3).map((appr) => (
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

      {/* Quick Actions */}
      {showWidget("quick_actions") && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
            <Link href="/cards/new"><CreditCard className="w-5 h-5" /><span className="text-sm">Request Card</span></Link>
          </Button>
          {showExpense && (
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <Link href="/expenses/new"><Receipt className="w-5 h-5" /><span className="text-sm">Create Expense</span></Link>
            </Button>
          )}
          {showExpense && (
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <Link href="/approvals"><CheckSquare className="w-5 h-5" /><span className="text-sm">Review Approvals</span></Link>
            </Button>
          )}
          <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
            <Link href="/reports"><PieChart className="w-5 h-5" /><span className="text-sm">View Reports</span></Link>
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
