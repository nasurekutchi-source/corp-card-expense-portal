"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { PageHeader } from "@/components/shared/page-header";
import { getExpenseReports } from "@/lib/store";
import { formatDate, formatINRCompact } from "@/lib/utils";
import {
  FileText,
  Plus,
  Search,
  Filter,
  ChevronRight,
  Calendar,
  Receipt,
  CheckCircle2,
  Clock,
  XCircle,
  Download,
  Send,
} from "lucide-react";

const statusFilters = ["ALL", "DRAFT", "SUBMITTED", "IN_REVIEW", "APPROVED", "REJECTED", "PROCESSING", "PAID"];

export default function ExpenseReportsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const expenseReports = getExpenseReports();

  const filteredReports = expenseReports.filter((r) => {
    const matchesSearch =
      r.reportNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: expenseReports.length,
    totalAmount: expenseReports.reduce((s, r) => s + r.totalAmount, 0),
    pending: expenseReports.filter((r) => ["SUBMITTED", "IN_REVIEW"].includes(r.status)).length,
    approved: expenseReports.filter((r) => ["APPROVED", "PROCESSING", "PAID"].includes(r.status)).length,
    drafts: expenseReports.filter((r) => r.status === "DRAFT").length,
  };

  return (
    <div className="space-y-6 animate-in">
      <PageHeader title="Expense Reports" description="Create and track expense reports for reimbursement">
        <Button variant="outline">
          <Download className="w-4 h-4" />
          Export
        </Button>
        <Button asChild>
          <Link href="/expense-reports/new">
            <Plus className="w-4 h-4" />
            New Report
          </Link>
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Receipt className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xl font-bold">{formatINRCompact(stats.totalAmount)}</p>
                <p className="text-xs text-muted-foreground">Total Amount</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats.approved}</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <FileText className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats.drafts}</p>
                <p className="text-xs text-muted-foreground">Drafts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {statusFilters.map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="text-xs"
            >
              {status === "ALL" ? "All" : status.replace("_", " ")}
            </Button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        {filteredReports.map((report) => (
          <Card key={report.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>

                {/* Main Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{report.reportNumber}</p>
                    <StatusBadge status={report.status} />
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{report.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{report.employeeName}</span>
                    <span>&middot;</span>
                    <span>{report.department}</span>
                    <span>&middot;</span>
                    <span>{report.expenseCount} expenses</span>
                    {report.submittedAt && (
                      <>
                        <span>&middot;</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(report.submittedAt)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Policy Score */}
                <div className="hidden sm:flex flex-col items-center gap-1">
                  <div className="w-16">
                    <Progress value={report.policyScore} className="h-1.5" />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{report.policyScore}% compliant</span>
                </div>

                {/* Amount */}
                <div className="text-right">
                  <CurrencyDisplay amount={report.totalAmount} compact className="text-lg font-bold" />
                  <p className="text-xs text-muted-foreground">{report.currency}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {report.status === "DRAFT" && (
                    <Button variant="outline" size="sm">
                      <Send className="w-3 h-3 mr-1" />
                      Submit
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/expense-reports/${report.id}`}>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Timeline */}
              {report.status !== "DRAFT" && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t text-[10px]">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span className="text-muted-foreground">Submitted</span>
                  </div>
                  <div className="h-px flex-1 bg-border" />
                  <div className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${["IN_REVIEW", "APPROVED", "PROCESSING", "PAID"].includes(report.status) ? "bg-amber-500" : "bg-muted"}`} />
                    <span className="text-muted-foreground">Reviewed</span>
                  </div>
                  <div className="h-px flex-1 bg-border" />
                  <div className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${["APPROVED", "PROCESSING", "PAID"].includes(report.status) ? "bg-emerald-500" : "bg-muted"}`} />
                    <span className="text-muted-foreground">Approved</span>
                  </div>
                  <div className="h-px flex-1 bg-border" />
                  <div className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${report.status === "PAID" ? "bg-green-600" : "bg-muted"}`} />
                    <span className="text-muted-foreground">Paid</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
