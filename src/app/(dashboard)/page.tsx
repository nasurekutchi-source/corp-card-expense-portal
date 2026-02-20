"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { formatINRCompact, formatDate, getFY } from "@/lib/utils";
import {
  dashboardStats,
  spendByCategory,
  spendByMonth,
  topSpenders,
  demoTransactions,
  demoApprovals,
} from "@/lib/demo-data";
import {
  TrendingUp,
  TrendingDown,
  CreditCard,
  Receipt,
  CheckSquare,
  Shield,
  Users,
  ArrowRightLeft,
  Plus,
  ChevronRight,
  IndianRupee,
  Percent,
  Activity,
  PieChart,
} from "lucide-react";
import Link from "next/link";

// Simple inline chart components (no recharts dependency needed for initial render)
function MiniBarChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((item) => (
        <div key={item.name} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-sm transition-all"
            style={{
              height: `${(item.value / max) * 100}%`,
              backgroundColor: item.color,
              minHeight: "4px",
            }}
          />
          <span className="text-[8px] text-muted-foreground truncate w-full text-center">
            {item.name.split(" ")[0]}
          </span>
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
            <circle
              key={item.name}
              cx="18"
              cy="18"
              r="15.9"
              fill="none"
              stroke={item.color}
              strokeWidth="3"
              strokeDasharray={`${percentage} ${100 - percentage}`}
              strokeDashoffset={-offset}
              className="transition-all duration-500"
            />
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

export default function DashboardPage() {
  const recentTxns = demoTransactions.slice(0, 5);

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Dashboard"
        description={`Overview for ${getFY()} | Last updated: ${formatDate(new Date())}`}
      >
        <Button asChild>
          <Link href="/expenses/new">
            <Plus className="w-4 h-4" />
            New Expense
          </Link>
        </Button>
      </PageHeader>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Spend by Category */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Spend by Category</CardTitle>
            <CardDescription className="text-xs">{getFY()} breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart data={spendByCategory} />
            <div className="mt-4 space-y-2">
              {spendByCategory.slice(0, 4).map((item) => (
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

        {/* Monthly Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly Spend Trend</CardTitle>
            <CardDescription className="text-xs">Last 5 months</CardDescription>
          </CardHeader>
          <CardContent>
            <MiniBarChart
              data={spendByMonth.map((m) => ({
                name: m.month,
                value: m.amount,
                color: "hsl(var(--primary))",
              }))}
            />
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Avg monthly</span>
              <span className="font-medium">
                {formatINRCompact(spendByMonth.reduce((sum, m) => sum + m.amount, 0) / spendByMonth.length)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Budget Utilization */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Budget Utilization</CardTitle>
            <CardDescription className="text-xs">{getFY()} overall</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-4">
              <div className="relative w-32 h-32">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    stroke={dashboardStats.budgetUtilized > 80 ? "#ef4444" : dashboardStats.budgetUtilized > 60 ? "#f97316" : "#22c55e"}
                    strokeWidth="3"
                    strokeDasharray={`${dashboardStats.budgetUtilized} ${100 - dashboardStats.budgetUtilized}`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold">{dashboardStats.budgetUtilized}%</span>
                  <span className="text-[9px] text-muted-foreground">Utilized</span>
                </div>
              </div>
            </div>
            <div className="space-y-2 mt-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">YTD Spend</span>
                <CurrencyDisplay amount={dashboardStats.totalSpendYTD} compact className="text-xs font-medium" />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Annual Budget</span>
                <CurrencyDisplay amount={dashboardStats.totalSpendYTD / (dashboardStats.budgetUtilized / 100)} compact className="text-xs font-medium" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Transactions */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Recent Transactions</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/transactions" className="text-xs">
                  View all <ChevronRight className="w-3 h-3 ml-1" />
                </Link>
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
                      <span>{txn.employeeName}</span>
                      <span>&middot;</span>
                      <span>{formatDate(txn.timestamp)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <CurrencyDisplay amount={txn.amount} className="text-sm font-medium" />
                    <div className="mt-0.5">
                      <StatusBadge status={txn.status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Approvals + Top Spenders */}
        <div className="space-y-4">
          {/* Pending Approvals */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/approvals" className="text-xs">
                    View all <ChevronRight className="w-3 h-3 ml-1" />
                  </Link>
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

          {/* Top Spenders */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Top Spenders</CardTitle>
            </CardHeader>
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
        </div>
      </div>

      {/* Quick Actions + Module Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
          <Link href="/cards/new">
            <CreditCard className="w-5 h-5" />
            <span className="text-sm">Request Card</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
          <Link href="/expenses/new">
            <Receipt className="w-5 h-5" />
            <span className="text-sm">Create Expense</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
          <Link href="/approvals">
            <CheckSquare className="w-5 h-5" />
            <span className="text-sm">Review Approvals</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
          <Link href="/reports">
            <PieChart className="w-5 h-5" />
            <span className="text-sm">View Reports</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
