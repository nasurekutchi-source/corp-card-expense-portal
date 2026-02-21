"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { PageHeader } from "@/components/shared/page-header";
import { getExpenses } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  Receipt,
  Shield,
  AlertTriangle,
  Calendar,
  Send,
} from "lucide-react";

export default function NewExpenseReportPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const expenses = getExpenses();
  const unreported = expenses.slice(0, 12);
  const selectedExpenses = unreported.filter((e) => selected.has(e.id));
  const totalAmount = selectedExpenses.reduce((s, e) => s + e.amount, 0);
  const violations = selectedExpenses.filter((e) => e.policyStatus !== "COMPLIANT").length;

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6 animate-in">
      <PageHeader title="Create Expense Report" description="Group expenses into a report for approval">
        <Button variant="outline" asChild>
          <Link href="/expense-reports">
            <ArrowLeft className="w-4 h-4" />
            Cancel
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Report Details */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Report Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Report Title</label>
                  <Input placeholder="e.g. February 2026 Travel Expenses" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Period</label>
                  <Input type="month" defaultValue="2026-02" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expense Selection */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Select Expenses ({selected.size} selected)</CardTitle>
                <Button variant="outline" size="sm" onClick={() => {
                  if (selected.size === unreported.length) setSelected(new Set());
                  else setSelected(new Set(unreported.map((e) => e.id)));
                }}>
                  {selected.size === unreported.length ? "Deselect All" : "Select All"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {unreported.map((exp) => (
                  <div
                    key={exp.id}
                    className={`flex items-center gap-3 py-2 px-2 rounded-md cursor-pointer transition-colors ${
                      selected.has(exp.id) ? "bg-primary/5 border border-primary/20" : "hover:bg-muted/50"
                    }`}
                    onClick={() => toggleSelect(exp.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(exp.id)}
                      onChange={() => toggleSelect(exp.id)}
                      className="rounded"
                    />
                    <div className="w-7 h-7 rounded bg-muted flex items-center justify-center shrink-0">
                      <Receipt className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{exp.merchantName}</p>
                      <p className="text-xs text-muted-foreground">{exp.category} · {formatDate(exp.date)}</p>
                    </div>
                    <StatusBadge status={exp.policyStatus} />
                    <CurrencyDisplay amount={exp.amount} className="text-sm font-medium" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Report Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-center py-2">
                <CurrencyDisplay amount={totalAmount} compact className="text-2xl font-bold" />
                <p className="text-xs text-muted-foreground mt-1">{selected.size} expenses selected</p>
              </div>
              <div className="space-y-2 text-xs border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GST (estimated)</span>
                  <CurrencyDisplay amount={totalAmount * 0.18} compact className="text-xs font-medium" />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">TDS (if applicable)</span>
                  <span className="font-medium">—</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Policy Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {violations > 0 ? (
                <div className="text-center py-2">
                  <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-sm font-medium">{violations} policy violation{violations > 1 ? "s" : ""}</p>
                  <p className="text-xs text-muted-foreground mt-1">Violations will be flagged to approver</p>
                </div>
              ) : selected.size > 0 ? (
                <div className="text-center py-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-emerald-600">All expenses compliant</p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-2">Select expenses to see policy check</p>
              )}
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Button className="w-full" disabled={selected.size === 0}>
              <Send className="w-4 h-4" />
              Submit Report
            </Button>
            <Button variant="outline" className="w-full" disabled={selected.size === 0}>
              Save as Draft
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
