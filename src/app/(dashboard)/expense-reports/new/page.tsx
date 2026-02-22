"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { PageHeader } from "@/components/shared/page-header";
import { getExpenses, getCostCenters } from "@/lib/store";
import type { Expense, CostCenter } from "@/lib/store";
import { formatDate, cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ArrowLeft, FileText, CheckCircle2, Receipt, Shield, AlertTriangle,
  Send, Save, Loader2, Search, IndianRupee, Building2, XCircle,
  ReceiptText, Sparkles,
} from "lucide-react";

function getGstBreakdown(expenses: Expense[]) {
  let totalCgst = 0, totalSgst = 0, totalIgst = 0;
  for (const e of expenses) {
    if (e.gstDetails) {
      totalCgst += e.gstDetails.cgst || 0;
      totalSgst += e.gstDetails.sgst || 0;
      totalIgst += e.gstDetails.igst || 0;
    }
  }
  return { totalCgst, totalSgst, totalIgst, totalGst: totalCgst + totalSgst + totalIgst };
}

function getCostCenterSummary(expenses: Expense[], costCenters: CostCenter[]) {
  const map = new Map<string, { name: string; code: string; amount: number; count: number }>();
  for (const e of expenses) {
    const key = e.costCenterId || "unassigned";
    const existing = map.get(key);
    if (existing) { existing.amount += e.amount; existing.count += 1; }
    else {
      const cc = costCenters.find((c) => c.id === key);
      map.set(key, { name: cc?.name || "Unassigned", code: cc?.code || "--", amount: e.amount, count: 1 });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
}

export default function NewExpenseReportPage() {
  const costCenters = getCostCenters();
  const [title, setTitle] = useState("");
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [createdReportNumber, setCreatedReportNumber] = useState("");

  const allExpenses = getExpenses();
  const unreported = useMemo(() => allExpenses.slice(0, 15), [allExpenses]);
  const categories = useMemo(() => {
    const set = new Set(unreported.map((e: Expense) => e.category));
    return Array.from(set).sort();
  }, [unreported]);

  const filteredExpenses = useMemo(() => {
    let result = unreported;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((e: Expense) =>
        e.merchantName.toLowerCase().includes(q) || e.category.toLowerCase().includes(q) || e.businessPurpose.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== "ALL") result = result.filter((e: Expense) => e.category === categoryFilter);
    return result;
  }, [unreported, searchQuery, categoryFilter]);

  const selectedExpenses = useMemo(() => unreported.filter((e: Expense) => selected.has(e.id)), [unreported, selected]);
  const totalAmount = useMemo(() => selectedExpenses.reduce((s: number, e: Expense) => s + e.amount, 0), [selectedExpenses]);
  const gst = useMemo(() => getGstBreakdown(selectedExpenses), [selectedExpenses]);
  const costCenterBreakdown = useMemo(() => getCostCenterSummary(selectedExpenses, costCenters), [selectedExpenses, costCenters]);

  const policyAnalysis = useMemo(() => {
    const compliant = selectedExpenses.filter((e: Expense) => e.policyStatus === "COMPLIANT").length;
    const softViolations = selectedExpenses.filter((e: Expense) => e.policyStatus === "SOFT_VIOLATION").length;
    const hardViolations = selectedExpenses.filter((e: Expense) => e.policyStatus === "HARD_VIOLATION").length;
    const exceptions = selectedExpenses.filter((e: Expense) => e.policyStatus === "EXCEPTION").length;
    const total = selectedExpenses.length;
    const score = total > 0 ? Math.round((compliant / total) * 100) : 100;
    return { compliant, softViolations, hardViolations, exceptions, total, score };
  }, [selectedExpenses]);

  const receiptStats = useMemo(() => {
    const withReceipt = selectedExpenses.filter((e: Expense) => e.hasReceipt).length;
    return { withReceipt, withoutReceipt: selectedExpenses.length - withReceipt };
  }, [selectedExpenses]);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (selected.size === filteredExpenses.length && filteredExpenses.length > 0) {
      setSelected((prev: Set<string>) => {
        const next = new Set(prev);
        filteredExpenses.forEach((e: Expense) => next.delete(e.id));
        return next;
      });
    } else {
      setSelected((prev: Set<string>) => {
        const next = new Set(prev);
        filteredExpenses.forEach((e: Expense) => next.add(e.id));
        return next;
      });
    }
  }, [filteredExpenses, selected.size]);

  const allFilteredSelected = filteredExpenses.length > 0 && filteredExpenses.every((e: Expense) => selected.has(e.id));

  const handleSubmit = useCallback(async (asDraft: boolean) => {
    if (!title.trim()) { toast.error("Report title is required"); return; }
    if (selected.size === 0) { toast.error("Select at least one expense"); return; }
    setSubmitting(true);
    try {
      const period = periodFrom && periodTo ? periodFrom.slice(0, 7) : new Date().toISOString().slice(0, 7);
      const res = await fetch("/api/v1/expense-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedExpenses[0]?.employeeId || "emp-001",
          title: title.trim(),
          status: asDraft ? "DRAFT" : "SUBMITTED",
          totalAmount, currency: "INR", expenseCount: selected.size, period,
          policyScore: policyAnalysis.score,
          submittedAt: asDraft ? null : new Date().toISOString(),
        }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to create report"); }
      const { data } = await res.json();
      setCreatedReportNumber(data.reportNumber || "");
      setSubmitted(true);
      toast.success(asDraft ? "Report saved as draft" : "Report submitted for approval");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally { setSubmitting(false); }
  }, [title, selected, selectedExpenses, totalAmount, policyAnalysis.score, periodFrom, periodTo]);

  // ---- Success State ----
  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Report Created</h2>
              <p className="text-sm text-muted-foreground mt-1">Your expense report has been created successfully.</p>
            </div>
            {createdReportNumber && (
              <div className="bg-muted/50 rounded-lg py-3 px-4">
                <p className="text-xs text-muted-foreground">Report Number</p>
                <p className="text-lg font-mono font-semibold">{createdReportNumber}</p>
              </div>
            )}
            <div className="bg-muted/50 rounded-lg py-3 px-4 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Expenses</p>
                <p className="text-sm font-semibold">{selected.size} items</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <CurrencyDisplay amount={totalAmount} className="text-sm font-semibold" />
              </div>
            </div>
            <Separator />
            <div className="flex gap-2">
              <Button className="flex-1" asChild>
                <Link href="/expense-reports">View All Reports</Link>
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => {
                setSubmitted(false); setSelected(new Set()); setTitle("");
                setPeriodFrom(""); setPeriodTo(""); setCreatedReportNumber("");
              }}>
                Create Another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---- Main Form ----
  return (
    <div className="space-y-6 animate-in">
      <PageHeader title="Create Expense Report" description="Select expenses to group into a voucher for approval">
        <Button variant="outline" asChild>
          <Link href="/expense-reports"><ArrowLeft className="w-4 h-4" />Cancel</Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-4">
          {/* Report Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />Report Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1 space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Report Title <span className="text-destructive">*</span>
                  </label>
                  <Input placeholder="e.g. Feb 2026 Travel Voucher" value={title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Period From</label>
                  <Input type="date" value={periodFrom}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPeriodFrom(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Period To</label>
                  <Input type="date" value={periodTo}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPeriodTo(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expense Selection */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ReceiptText className="w-4 h-4 text-primary" />Unreported Expenses
                  <Badge variant="secondary" className="text-[10px] ml-1">{filteredExpenses.length}</Badge>
                </CardTitle>
                <Button variant={allFilteredSelected ? "secondary" : "outline"} size="sm"
                  onClick={toggleAll} className="text-xs h-7">
                  {allFilteredSelected ? "Deselect All" : "Select All"}
                </Button>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input placeholder="Search merchant, category, purpose..." className="pl-8 h-8 text-xs"
                    value={searchQuery} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)} />
                </div>
                <select className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  value={categoryFilter} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategoryFilter(e.target.value)}>
                  <option value="ALL">All Categories</option>
                  {categories.map((cat: string) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {filteredExpenses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No unreported expenses found</p>
                  <p className="text-xs mt-1">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  <div className="grid grid-cols-[28px_1fr_100px_80px_80px_90px] gap-2 px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider border-b">
                    <div /><div>Merchant / Category</div><div>Date</div>
                    <div className="text-center">Receipt</div><div className="text-center">Policy</div>
                    <div className="text-right">Amount</div>
                  </div>
                  {filteredExpenses.map((exp: Expense) => {
                    const sel = selected.has(exp.id);
                    return (
                      <div key={exp.id} onClick={() => toggleSelect(exp.id)} className={cn(
                        "grid grid-cols-[28px_1fr_100px_80px_80px_90px] gap-2 items-center py-2 px-2 rounded-md cursor-pointer transition-all",
                        sel ? "bg-primary/5 ring-1 ring-primary/20" : "hover:bg-muted/50"
                      )}>
                        <div className="flex items-center justify-center">
                          <div className={cn("w-4 h-4 rounded border-2 flex items-center justify-center transition-colors",
                            sel ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30")}>
                            {sel && <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{exp.merchantName}</p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {exp.category}{exp.businessPurpose ? ` \u00B7 ${exp.businessPurpose}` : ""}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground">{formatDate(exp.date)}</div>
                        <div className="text-center">
                          {exp.hasReceipt
                            ? <Badge variant="success" className="text-[9px] px-1.5">Attached</Badge>
                            : <Badge variant="outline" className="text-[9px] px-1.5 text-muted-foreground">Missing</Badge>}
                        </div>
                        <div className="text-center"><StatusBadge status={exp.policyStatus} /></div>
                        <div className="text-right"><CurrencyDisplay amount={exp.amount} className="text-sm font-semibold" /></div>
                      </div>
                    );
                  })}
                </div>
              )}
              {selected.size > 0 && (
                <div className="mt-3 pt-3 border-t flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{selected.size}</span> expense{selected.size > 1 ? "s" : ""} selected
                  </p>
                  <CurrencyDisplay amount={totalAmount} className="text-sm font-bold" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="space-y-4">
          {/* Report Summary + GST */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-primary" />Report Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-center py-3 bg-muted/30 rounded-lg">
                <CurrencyDisplay amount={totalAmount} className="text-2xl font-bold" />
                <p className="text-xs text-muted-foreground mt-1">{selected.size} expense{selected.size !== 1 ? "s" : ""} selected</p>
              </div>
              <div className="space-y-2 text-xs">
                <p className="font-medium text-muted-foreground uppercase tracking-wider text-[10px]">GST Breakdown</p>
                <div className="space-y-1.5 bg-muted/20 rounded-lg p-3">
                  <div className="flex justify-between"><span className="text-muted-foreground">CGST</span><CurrencyDisplay amount={gst.totalCgst} className="text-xs font-medium" /></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">SGST</span><CurrencyDisplay amount={gst.totalSgst} className="text-xs font-medium" /></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">IGST</span><CurrencyDisplay amount={gst.totalIgst} className="text-xs font-medium" /></div>
                  <Separator className="my-1" />
                  <div className="flex justify-between font-semibold"><span>Total GST</span><CurrencyDisplay amount={gst.totalGst} className="text-xs font-bold" /></div>
                </div>
              </div>
              <div className="flex justify-between text-xs pt-1">
                <span className="text-muted-foreground">Pre-tax Amount</span>
                <CurrencyDisplay amount={totalAmount - gst.totalGst} className="text-xs font-medium" />
              </div>
            </CardContent>
          </Card>

          {/* Policy Check */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />Policy Check
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selected.size === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">Select expenses to see policy analysis</p>
              ) : (
                <div className="space-y-3">
                  <div className="text-center">
                    <span className={cn("text-2xl font-bold",
                      policyAnalysis.score >= 80 ? "text-emerald-600 dark:text-emerald-400"
                        : policyAnalysis.score >= 50 ? "text-amber-600 dark:text-amber-400"
                          : "text-red-600 dark:text-red-400")}>{policyAnalysis.score}%</span>
                    <p className="text-[10px] text-muted-foreground">Compliance Score</p>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />Compliant</span>
                      <span className="font-semibold">{policyAnalysis.compliant}</span>
                    </div>
                    {policyAnalysis.softViolations > 0 && <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-amber-500" />Soft Violations</span>
                      <span className="font-semibold text-amber-600">{policyAnalysis.softViolations}</span>
                    </div>}
                    {policyAnalysis.hardViolations > 0 && <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5 text-red-500" />Hard Violations</span>
                      <span className="font-semibold text-red-600">{policyAnalysis.hardViolations}</span>
                    </div>}
                    {policyAnalysis.exceptions > 0 && <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-blue-500" />Exceptions</span>
                      <span className="font-semibold text-blue-600">{policyAnalysis.exceptions}</span>
                    </div>}
                  </div>
                  {(policyAnalysis.hardViolations > 0 || policyAnalysis.softViolations > 0) && (
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md p-2 text-[11px] text-amber-700 dark:text-amber-400">
                      Violations will be flagged to the approver for review.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Receipts */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Receipt className="w-4 h-4 text-primary" />Receipts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selected.size === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">Select expenses to see receipt status</p>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />Attached</span>
                    <span className="font-semibold">{receiptStats.withReceipt}</span>
                  </div>
                  {receiptStats.withoutReceipt > 0 && <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-amber-500" />Missing</span>
                    <span className="font-semibold text-amber-600">{receiptStats.withoutReceipt}</span>
                  </div>}
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${selected.size > 0 ? (receiptStats.withReceipt / selected.size) * 100 : 0}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center">
                    {selected.size > 0 ? `${Math.round((receiptStats.withReceipt / selected.size) * 100)}% receipts attached` : ""}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cost Center Allocation */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />Cost Center Allocation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selected.size === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">Select expenses to see allocation</p>
              ) : (
                <div className="space-y-2">
                  {costCenterBreakdown.map((cc) => (
                    <div key={cc.code} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium truncate mr-2">{cc.name}</span>
                        <CurrencyDisplay amount={cc.amount} compact className="text-xs font-semibold shrink-0" />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>{cc.code} &middot; {cc.count} expense{cc.count > 1 ? "s" : ""}</span>
                        <span>{totalAmount > 0 ? Math.round((cc.amount / totalAmount) * 100) : 0}%</span>
                      </div>
                      <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary/60 rounded-full transition-all"
                          style={{ width: `${totalAmount > 0 ? (cc.amount / totalAmount) * 100 : 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-2 sticky bottom-4">
            <Button className="w-full" disabled={selected.size === 0 || submitting} onClick={() => handleSubmit(false)}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {submitting ? "Submitting..." : "Submit for Approval"}
            </Button>
            <Button variant="outline" className="w-full" disabled={selected.size === 0 || submitting} onClick={() => handleSubmit(true)}>
              <Save className="w-4 h-4" />Save as Draft
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
