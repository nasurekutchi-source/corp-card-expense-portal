"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { PageHeader } from "@/components/shared/page-header";
import { demoExpenses } from "@/lib/demo-data";
import { formatDate } from "@/lib/utils";
import {
  Receipt,
  Plus,
  Search,
  Download,
  ChevronRight,
  Tag,
  Building2,
  FileText,
  Camera,
  IndianRupee,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

export default function ExpensesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  const filteredExpenses = demoExpenses.filter((exp) => {
    const matchesSearch =
      exp.merchantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.employeeName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "ALL" || exp.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: demoExpenses.length,
    compliant: demoExpenses.filter((e) => e.policyStatus === "COMPLIANT").length,
    violations: demoExpenses.filter((e) => e.policyStatus !== "COMPLIANT").length,
    totalAmount: demoExpenses.reduce((sum, e) => sum + e.amount, 0),
    withReceipt: demoExpenses.filter((e) => e.hasReceipt).length,
  };

  return (
    <div className="space-y-6 animate-in">
      <PageHeader title="Expenses" description="Manage and track all corporate expenses">
        <Button variant="outline">
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
          {["ALL", "CARD", "CASH", "MILEAGE"].map((type) => (
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
                    <p className="text-sm font-medium truncate">{expense.merchantName}</p>
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
                  {expense.gstDetails && (
                    <p className="text-[9px] text-muted-foreground">
                      GST: {((expense.gstDetails.cgst + expense.gstDetails.sgst) / expense.amount * 100).toFixed(0)}%
                    </p>
                  )}
                </div>

                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
