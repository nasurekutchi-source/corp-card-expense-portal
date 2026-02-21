"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { PageHeader } from "@/components/shared/page-header";
import { getApprovals, getExpenseReports } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import {
  CheckSquare,
  Check,
  X,
  Send,
  Clock,
  AlertTriangle,
  ChevronRight,
  Users,
  FileText,
  Filter,
  CheckCheck,
  MessageSquare,
} from "lucide-react";

export default function ApprovalsPage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const pendingApprovals = getApprovals();
  const recentlyApproved = getExpenseReports().filter((r) => r.status === "APPROVED").slice(0, 5);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const getDueStatus = (dueAt: string) => {
    const due = new Date(dueAt);
    const now = new Date();
    const hoursLeft = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursLeft < 0) return { label: "Overdue", color: "text-destructive", bgColor: "bg-destructive/10" };
    if (hoursLeft < 12) return { label: `${Math.ceil(hoursLeft)}h left`, color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-900/30" };
    return { label: `${Math.ceil(hoursLeft)}h left`, color: "text-emerald-600", bgColor: "bg-emerald-100 dark:bg-emerald-900/30" };
  };

  return (
    <div className="space-y-6 animate-in">
      <PageHeader title="Approvals" description={`${pendingApprovals.length} expense reports awaiting your review`}>
        {selectedIds.length > 0 && (
          <Button>
            <CheckCheck className="w-4 h-4" />
            Bulk Approve ({selectedIds.length})
          </Button>
        )}
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-amber-600">{pendingApprovals.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Overdue (SLA)</p>
            <p className="text-2xl font-bold text-destructive">3</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Approved (This Week)</p>
            <p className="text-2xl font-bold text-emerald-600">12</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Avg Approval Time</p>
            <p className="text-2xl font-bold">18h</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Pending Approvals
        </h2>

        {pendingApprovals.map((approval) => {
          const dueStatus = getDueStatus(approval.dueAt);
          const isSelected = selectedIds.includes(approval.id);

          return (
            <Card
              key={approval.id}
              className={`hover:shadow-md transition-all ${isSelected ? "ring-2 ring-primary" : ""}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleSelect(approval.id)}
                    className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground/30 hover:border-primary"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{approval.reportNumber}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${dueStatus.bgColor} ${dueStatus.color} font-medium`}>
                        <Clock className="w-2.5 h-2.5 inline mr-0.5" />
                        {dueStatus.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {approval.employeeName}
                      </span>
                      <span>{approval.department}</span>
                      <span>{approval.expenseCount} expenses</span>
                      <span>Submitted {formatDate(approval.submittedAt!)}</span>
                    </div>

                    {/* Policy Score */}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        variant={approval.policyScore >= 90 ? "success" : approval.policyScore >= 70 ? "warning" : "destructive"}
                        className="text-[9px]"
                      >
                        Policy Score: {approval.policyScore}%
                      </Badge>
                      {approval.policyScore < 90 && (
                        <span className="text-[10px] text-amber-600 flex items-center gap-0.5">
                          <AlertTriangle className="w-3 h-3" />
                          {100 - approval.policyScore}% violations
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right shrink-0">
                    <CurrencyDisplay amount={approval.amount} className="text-lg font-bold" />
                    <p className="text-[10px] text-muted-foreground">Level {approval.level} approval</p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                      <Check className="w-3 h-3" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive">
                      <X className="w-3 h-3" /> Reject
                    </Button>
                    <Button size="sm" variant="outline">
                      <Send className="w-3 h-3" /> Delegate
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recently Approved */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Recently Approved
        </h2>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {recentlyApproved.map((report) => (
                <div key={report.id} className="flex items-center gap-4 px-4 py-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{report.reportNumber}</p>
                    <p className="text-xs text-muted-foreground">{report.employeeName} &middot; {report.department}</p>
                  </div>
                  <CurrencyDisplay amount={report.totalAmount} compact className="text-sm font-medium" />
                  <Badge variant="success" className="text-[9px]">Approved</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CheckCircle(props: React.ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
