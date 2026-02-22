"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { PageHeader } from "@/components/shared/page-header";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import {
  Receipt,
  Plus,
  Search,
  Download,
  ChevronRight,
  Tag,
  Building2,
  Camera,
  IndianRupee,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  FileText,
} from "lucide-react";

interface Expense {
  id: string;
  merchantName: string;
  amount: number;
  category: string;
  date: string;
  type: string;
  policyStatus: string;
  employeeName: string;
  hasReceipt: boolean;
  gstDetails?: { cgst: number; sgst: number; igst: number; gstin?: string };
  [key: string]: any;
}

export default function ExpensesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/expenses");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setExpenses(Array.isArray(data) ? data : data.data || []);
    } catch {
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch =
      (exp.merchantName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exp.category || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exp.employeeName || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "ALL" || exp.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: expenses.length,
    compliant: expenses.filter((e) => e.policyStatus === "COMPLIANT").length,
    violations: expenses.filter((e) => e.policyStatus !== "COMPLIANT").length,
    totalAmount: expenses.reduce((sum, e) => sum + e.amount, 0),
    withReceipt: expenses.filter((e) => e.hasReceipt).length,
  };

  // Duplicate detection flags (client-side check across loaded expenses)
  const duplicateFlags = useMemo(() => {
    const flagged = new Set<string>();
    for (let i = 0; i < expenses.length; i++) {
      for (let j = i + 1; j < expenses.length; j++) {
        const a = expenses[i], b = expenses[j];
        const amountMatch = Math.abs(a.amount - b.amount) / Math.max(a.amount, 1) < 0.01;
        const merchantMatch = (a.merchantName || "").toLowerCase() === (b.merchantName || "").toLowerCase();
        const dateA = new Date(a.date).getTime(), dateB = new Date(b.date).getTime();
        const dateClose = Math.abs(dateA - dateB) < 3 * 86400000;
        if (amountMatch && merchantMatch && dateClose) {
          flagged.add(a.id);
          flagged.add(b.id);
        }
      }
    }
    return flagged;
  }, [expenses]);

  return (
    <div className="space-y-6 animate-in">
      <PageHeader title="Expenses" description="Manage and track all corporate expenses">
        <Button variant="outline" onClick={() => {
          const csv = ["Merchant,Category,Employee,Amount,Date,Type,Policy Status", ...expenses.map(e => `"${e.merchantName}","${e.category}","${e.employeeName}",${e.amount},"${e.date}","${e.type}","${e.policyStatus}"`)].join("\n");
          const blob = new Blob([csv], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a"); a.href = url; a.download = "expenses.csv"; a.click();
          URL.revokeObjectURL(url);
          toast.success(`Exported ${expenses.length} expenses to CSV`);
        }}>
          <Download className="w-4 h-4" />
          Export
        </Button>
        <Button asChild>
          <Link href="/expenses/new">
            <Plus className="w-4 h-4" />
            New Expense
          </Link>
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Expenses</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Amount</p>
            <CurrencyDisplay amount={stats.totalAmount} compact className="text-2xl font-bold" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Compliant
            </p>
            <p className="text-2xl font-bold text-emerald-600">{stats.compliant}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-500" /> Violations
            </p>
            <p className="text-2xl font-bold text-amber-600">{stats.violations}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Camera className="w-3 h-3" /> Receipts
            </p>
            <p className="text-2xl font-bold">{stats.withReceipt}<span className="text-sm text-muted-foreground">/{stats.total}</span></p>
          </CardContent>
        </Card>
      </div>

      {/* Next Step Guide */}
      {stats.total > 0 && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="p-3 flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-600 shrink-0" />
            <p className="text-sm text-blue-800 dark:text-blue-300 flex-1">
              <span className="font-medium">Next step:</span> Group your expenses into an Expense Report and submit for approval.
            </p>
            <Button size="sm" variant="outline" asChild className="shrink-0 border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300">
              <Link href="/expense-reports/new">
                Create Report <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search merchant, category, employee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {["ALL", "CARD", "CASH", "MILEAGE", "PERSONAL CARD"].map((type) => (
            <Button
              key={type}
              variant={typeFilter === type ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter(type)}
            >
              {type === "ALL" ? "All Types" : type.charAt(0) + type.slice(1).toLowerCase()}
            </Button>
          ))}
        </div>
      </div>

      {/* Expense List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Receipt className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-medium">No expenses yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Create your first expense to get started</p>
              <Button asChild className="mt-4" size="sm">
                <Link href="/expenses/new"><Plus className="w-4 h-4 mr-1" /> New Expense</Link>
              </Button>
            </div>
          ) : (
          <div className="divide-y">
            {filteredExpenses.slice(0, 25).map((expense) => (
              <Link
                key={expense.id}
                href={`/expenses/${expense.id}`}
                className="flex items-center gap-4 px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Receipt className="w-5 h-5 text-muted-foreground" />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">
                      {expense.merchantName}
                      {duplicateFlags.has(expense.id) && (
                        <span title="Potential duplicate"><AlertTriangle className="w-3.5 h-3.5 text-amber-500 inline ml-1" /></span>
                      )}
                    </p>
                    {expense.hasReceipt && <Camera className="w-3 h-3 text-emerald-500" />}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {expense.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {expense.employeeName}
                    </span>
                    <span>{formatDate(expense.date)}</span>
                  </div>
                </div>

                {/* GST indicator */}
                {expense.gstDetails && expense.gstDetails.cgst > 0 && (
                  <Badge variant="outline" className="text-[9px] hidden sm:flex">
                    <IndianRupee className="w-2.5 h-2.5 mr-0.5" />
                    GST
                  </Badge>
                )}

                {/* Type */}
                <Badge variant="secondary" className="text-[9px] hidden sm:flex">
                  {expense.type}
                </Badge>

                {/* Policy Status */}
                <StatusBadge status={expense.policyStatus} />

                {/* Amount */}
                <div className="text-right shrink-0">
                  <CurrencyDisplay amount={expense.amount} className="text-sm font-medium" />
                  {expense.gstDetails && (expense.gstDetails.cgst + expense.gstDetails.sgst) > 0 && (
                    <p className="text-[9px] text-muted-foreground">
                      GST: {((expense.gstDetails.cgst + expense.gstDetails.sgst) / expense.amount * 100).toFixed(0)}%
                    </p>
                  )}
                </div>

                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
