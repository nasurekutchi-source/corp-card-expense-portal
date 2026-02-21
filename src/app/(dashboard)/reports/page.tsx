"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { PageHeader } from "@/components/shared/page-header";
import {
  getAnalytics,
  getStats,
  getDepartments,
  getCostCenters,
  getCompanies,
} from "@/lib/store";
import { formatINRCompact } from "@/lib/utils";
import {
  BarChart3,
  Download,
  PieChart,
  TrendingUp,
  IndianRupee,
  Building2,
  Calendar,
  Filter,
  FileSpreadsheet,
  Receipt,
  ArrowUpDown,
} from "lucide-react";

function BarChartViz({ data }: { data: { label: string; value: number; color?: string }[] }) {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div className="space-y-2">
      {data.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-28 truncate">{item.label}</span>
          <div className="flex-1 h-6 bg-muted rounded-sm overflow-hidden">
            <div
              className="h-full rounded-sm transition-all duration-500"
              style={{
                width: `${(item.value / max) * 100}%`,
                backgroundColor: item.color || "hsl(var(--primary))",
              }}
            />
          </div>
          <span className="text-xs font-medium w-16 text-right">{formatINRCompact(item.value)}</span>
        </div>
      ))}
    </div>
  );
}

function DonutViz({ data }: { data: { name: string; value: number; color: string }[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let cumulative = 0;
  return (
    <div className="flex items-center gap-6">
      <div className="relative w-40 h-40 shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          {data.map((item) => {
            const pct = (item.value / total) * 100;
            const offset = cumulative;
            cumulative += pct;
            return (
              <circle
                key={item.name}
                cx="18" cy="18" r="15.9"
                fill="none" stroke={item.color} strokeWidth="3"
                strokeDasharray={`${pct} ${100 - pct}`}
                strokeDashoffset={-offset}
                className="transition-all duration-500"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold">{formatINRCompact(total)}</span>
          <span className="text-[9px] text-muted-foreground">Total Spend</span>
        </div>
      </div>
      <div className="space-y-2 flex-1">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-muted-foreground">{item.name}</span>
            </div>
            <div className="text-right">
              <span className="font-medium">{formatINRCompact(item.value)}</span>
              <span className="text-muted-foreground ml-1">({Math.round((item.value / total) * 100)}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const analytics = getAnalytics();
  const stats = getStats();
  const departments = getDepartments();
  const costCenters = getCostCenters();
  const companies = getCompanies();

  const deptSpend = departments.slice(0, 6).map((dept, idx) => ({
    label: dept.name,
    value: dept.budget * (0.3 + Math.random() * 0.5),
    budget: dept.budget,
    color: ["#3b82f6", "#8b5cf6", "#f97316", "#06b6d4", "#22c55e", "#ec4899"][idx % 6],
  }));

  const gstData = companies.map((comp) => ({
    company: comp.name,
    gstin: comp.gstin,
    cgst: Math.round(Math.random() * 500000),
    sgst: Math.round(Math.random() * 500000),
    igst: Math.round(Math.random() * 300000),
  }));

  return (
    <div className="space-y-6 animate-in">
      <PageHeader title="Reports & Analytics" description="Comprehensive spend analytics and compliance reports">
        <Button variant="outline">
          <Calendar className="w-4 h-4" />
          FY 2025-26
        </Button>
        <Button variant="outline">
          <Download className="w-4 h-4" />
          Export All
        </Button>
      </PageHeader>

      <Tabs defaultValue="spend" className="space-y-4">
        <TabsList>
          <TabsTrigger value="spend">Spend Summary</TabsTrigger>
          <TabsTrigger value="budget">Budget vs Actual</TabsTrigger>
          <TabsTrigger value="gst">GST Report</TabsTrigger>
          <TabsTrigger value="export">Export Center</TabsTrigger>
        </TabsList>

        {/* Spend Summary */}
        <TabsContent value="spend" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">YTD Spend</p>
                <CurrencyDisplay amount={stats.totalSpendYTD} compact className="text-2xl font-bold" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">MTD Spend</p>
                <CurrencyDisplay amount={stats.totalSpendMTD} compact className="text-2xl font-bold" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Avg per Transaction</p>
                <CurrencyDisplay amount={stats.avgTransactionValue} className="text-2xl font-bold" />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <PieChart className="w-4 h-4" />
                  Spend by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DonutViz data={analytics.spendByCategory} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Monthly Spend Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BarChartViz
                  data={analytics.spendByMonth.map((m) => ({
                    label: m.month,
                    value: m.amount,
                  }))}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Spend by Department
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BarChartViz
                data={deptSpend.map((d) => ({
                  label: d.label,
                  value: d.value,
                  color: d.color,
                }))}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Top Spenders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.topSpenders.map((spender, i) => (
                  <div key={spender.name} className="flex items-center gap-3">
                    <span className="text-sm font-bold text-muted-foreground w-6">{i + 1}.</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{spender.name}</p>
                      <p className="text-xs text-muted-foreground">{spender.department}</p>
                    </div>
                    <CurrencyDisplay amount={spender.amount} compact className="text-sm font-medium" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Budget vs Actual */}
        <TabsContent value="budget" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Budget Utilization by Department</CardTitle>
              <CardDescription className="text-xs">FY 2025-26 — April to March</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deptSpend.map((dept) => {
                  const utilization = Math.round((dept.value / dept.budget) * 100);
                  return (
                    <div key={dept.label} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{dept.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {formatINRCompact(dept.value)} / {formatINRCompact(dept.budget)}
                          </span>
                          <Badge
                            variant={utilization > 80 ? "destructive" : utilization > 60 ? "warning" : "success"}
                            className="text-[9px] w-12 justify-center"
                          >
                            {utilization}%
                          </Badge>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(utilization, 100)}%`,
                            backgroundColor: utilization > 80 ? "#ef4444" : utilization > 60 ? "#f97316" : "#22c55e",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cost Center Utilization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {costCenters.map((cc) => {
                  const util = Math.round((cc.utilized / cc.budget) * 100);
                  return (
                    <div key={cc.id} className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{cc.name}</p>
                        <p className="text-xs text-muted-foreground">{cc.code} &middot; GL: {cc.glCode}</p>
                      </div>
                      <div className="w-32">
                        <Progress value={util} className="h-1.5" />
                      </div>
                      <div className="text-right w-20">
                        <p className="text-xs font-medium">{util}%</p>
                        <p className="text-[10px] text-muted-foreground">{formatINRCompact(cc.utilized)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GST Report */}
        <TabsContent value="gst" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                GST Summary by Company
              </CardTitle>
              <CardDescription className="text-xs">CGST / SGST / IGST breakdown for ITC claims</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 font-medium text-xs text-muted-foreground">Company</th>
                      <th className="pb-2 font-medium text-xs text-muted-foreground">GSTIN</th>
                      <th className="pb-2 font-medium text-xs text-muted-foreground text-right">CGST</th>
                      <th className="pb-2 font-medium text-xs text-muted-foreground text-right">SGST</th>
                      <th className="pb-2 font-medium text-xs text-muted-foreground text-right">IGST</th>
                      <th className="pb-2 font-medium text-xs text-muted-foreground text-right">Total GST</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gstData.map((row) => (
                      <tr key={row.gstin} className="border-b last:border-0">
                        <td className="py-3 font-medium">{row.company}</td>
                        <td className="py-3">
                          <Badge variant="outline" className="text-[10px] font-mono">{row.gstin}</Badge>
                        </td>
                        <td className="py-3 text-right">{formatINRCompact(row.cgst)}</td>
                        <td className="py-3 text-right">{formatINRCompact(row.sgst)}</td>
                        <td className="py-3 text-right">{formatINRCompact(row.igst)}</td>
                        <td className="py-3 text-right font-medium">{formatINRCompact(row.cgst + row.sgst + row.igst)}</td>
                      </tr>
                    ))}
                    <tr className="font-bold">
                      <td className="pt-3" colSpan={2}>Total</td>
                      <td className="pt-3 text-right">{formatINRCompact(gstData.reduce((s, r) => s + r.cgst, 0))}</td>
                      <td className="pt-3 text-right">{formatINRCompact(gstData.reduce((s, r) => s + r.sgst, 0))}</td>
                      <td className="pt-3 text-right">{formatINRCompact(gstData.reduce((s, r) => s + r.igst, 0))}</td>
                      <td className="pt-3 text-right">{formatINRCompact(gstData.reduce((s, r) => s + r.cgst + r.sgst + r.igst, 0))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export Center */}
        <TabsContent value="export" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: "Spend Summary Report", desc: "Category-wise spend breakdown", icon: PieChart, format: "CSV / Excel" },
              { title: "Transaction Detail Report", desc: "All transactions with merchant data", icon: ArrowUpDown, format: "CSV / Excel" },
              { title: "Budget vs Actual Report", desc: "Department and cost center utilization", icon: BarChart3, format: "CSV / Excel" },
              { title: "GST Summary Report", desc: "CGST/SGST/IGST for ITC filing", icon: Receipt, format: "CSV / Excel" },
              { title: "Employee Expense Report", desc: "Per-employee expense summary", icon: IndianRupee, format: "CSV / Excel" },
              { title: "AP Export File", desc: "Accounts payable integration file", icon: FileSpreadsheet, format: "CSV / SAP / Tally" },
            ].map((report) => (
              <Card key={report.title} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <report.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{report.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{report.desc}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-[9px]">{report.format}</Badge>
                        <Button variant="outline" size="sm" className="h-6 text-xs ml-auto">
                          <Download className="w-3 h-3 mr-1" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
