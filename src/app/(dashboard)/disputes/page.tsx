"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/page-header";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  Search,
  Shield,
  CheckCircle2,
  Clock,
  XCircle,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Plus,
} from "lucide-react";
import { getDisputes, addDispute, type Dispute } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

const DISPUTE_REASONS = [
  "Unauthorized transaction",
  "Duplicate charge",
  "Wrong amount charged",
  "Service not received",
  "Fraudulent transaction",
];

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "RAISED", label: "Raised" },
  { value: "INVESTIGATING", label: "Investigating" },
  { value: "PROVISIONAL_CREDIT", label: "Provisional Credit" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "REJECTED", label: "Rejected" },
];

function getStatusBadge(status: string) {
  switch (status) {
    case "RAISED":
      return (
        <Badge variant="info" className="text-[10px]">
          <Clock className="w-3 h-3 mr-1" />
          Raised
        </Badge>
      );
    case "INVESTIGATING":
      return (
        <Badge variant="warning" className="text-[10px]">
          <Search className="w-3 h-3 mr-1" />
          Investigating
        </Badge>
      );
    case "PROVISIONAL_CREDIT":
      return (
        <Badge className="text-[10px] border-transparent bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
          <Shield className="w-3 h-3 mr-1" />
          Provisional Credit
        </Badge>
      );
    case "RESOLVED":
      return (
        <Badge variant="success" className="text-[10px]">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Resolved
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge variant="destructive" className="text-[10px]">
          <XCircle className="w-3 h-3 mr-1" />
          Rejected
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-[10px]">
          {status}
        </Badge>
      );
  }
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

export default function DisputesPage() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Raise dispute form state
  const [formTransactionId, setFormTransactionId] = useState("");
  const [formReason, setFormReason] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const disputes = useMemo(() => {
    const filters: { status?: string; search?: string } = {};
    if (statusFilter !== "ALL") filters.status = statusFilter;
    if (searchQuery) filters.search = searchQuery;
    return getDisputes(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, searchQuery, refreshKey]);

  const allDisputes = useMemo(() => getDisputes(), [refreshKey]);

  const stats = useMemo(
    () => ({
      total: allDisputes.length,
      raised: allDisputes.filter((d) => d.status === "RAISED").length,
      investigating: allDisputes.filter((d) => d.status === "INVESTIGATING").length,
      provisionalCredit: allDisputes.filter((d) => d.status === "PROVISIONAL_CREDIT").length,
      resolved: allDisputes.filter((d) => d.status === "RESOLVED").length,
    }),
    [allDisputes]
  );

  const handleToggleExpand = useCallback(
    (id: string) => {
      setExpandedId(expandedId === id ? null : id);
    },
    [expandedId]
  );

  const handleRaiseDispute = useCallback(async () => {
    if (!formTransactionId.trim() || !formReason || !formDescription.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setSubmitting(true);
    try {
      addDispute({
        transactionId: formTransactionId.trim(),
        reason: formReason,
        description: formDescription.trim(),
      });

      toast.success("Dispute raised successfully");
      setFormTransactionId("");
      setFormReason("");
      setFormDescription("");
      setDialogOpen(false);
      setRefreshKey((k) => k + 1);
    } catch {
      toast.error("Failed to raise dispute");
    } finally {
      setSubmitting(false);
    }
  }, [formTransactionId, formReason, formDescription]);

  return (
    <div className="space-y-6 animate-in">
      <PageHeader title="Disputes" description="Transaction dispute management — raise, investigate, resolve">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4" />
              Raise Dispute
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Raise a Dispute</DialogTitle>
              <DialogDescription>
                Submit a transaction dispute for investigation. Provide the transaction ID, reason, and a detailed description.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {/* Transaction ID */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Transaction ID</label>
                <Input
                  placeholder="e.g. txn-5"
                  value={formTransactionId}
                  onChange={(e) => setFormTransactionId(e.target.value)}
                />
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Reason</label>
                <select
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select a reason...</option>
                  {DISPUTE_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  placeholder="Provide details about the dispute..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRaiseDispute} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Dispute"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Total Disputes</p>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-blue-600" />
              <p className="text-xs text-muted-foreground">Raised</p>
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.raised}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Search className="w-4 h-4 text-amber-600" />
              <p className="text-xs text-muted-foreground">Investigating</p>
            </div>
            <p className="text-2xl font-bold text-amber-600">{stats.investigating}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-purple-600" />
              <p className="text-xs text-muted-foreground">Provisional Credit</p>
            </div>
            <p className="text-2xl font-bold text-purple-600">{stats.provisionalCredit}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <p className="text-xs text-muted-foreground">Resolved</p>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{stats.resolved}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search employee, reason, card..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[180px]"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Disputes Table */}
      <Card>
        <CardContent className="p-0">
          {/* Table Header */}
          <div className="hidden lg:grid lg:grid-cols-[120px_1fr_80px_1fr_100px_1fr_auto_100px_100px_100px] gap-2 px-4 py-3 border-b bg-muted/50 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            <span>Dispute ID</span>
            <span>Transaction</span>
            <span>Card</span>
            <span>Employee</span>
            <span>Amount</span>
            <span>Reason</span>
            <span>Status</span>
            <span>Prov. Credit</span>
            <span>Created</span>
            <span>Resolved</span>
          </div>

          <div className="divide-y">
            {disputes.length === 0 ? (
              <div className="py-12 text-center">
                <AlertTriangle className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No disputes found</p>
                {(statusFilter !== "ALL" || searchQuery) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStatusFilter("ALL");
                      setSearchQuery("");
                    }}
                    className="mt-2 text-xs"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              disputes.map((dispute) => (
                <div key={dispute.id}>
                  {/* Row */}
                  <div
                    className="flex flex-col lg:grid lg:grid-cols-[120px_1fr_80px_1fr_100px_1fr_auto_100px_100px_100px] gap-2 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer items-center"
                    onClick={() => handleToggleExpand(dispute.id)}
                  >
                    {/* Dispute ID */}
                    <div className="flex items-center gap-2 w-full lg:w-auto">
                      <div className="lg:hidden">
                        {expandedId === dispute.id ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <span className="text-sm font-mono font-medium">{dispute.id}</span>
                    </div>

                    {/* Transaction */}
                    <span className="text-xs text-muted-foreground font-mono truncate">
                      {dispute.transactionId}
                    </span>

                    {/* Card */}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <CreditCard className="w-3 h-3" />
                      ****{dispute.cardLast4}
                    </span>

                    {/* Employee */}
                    <span className="text-sm truncate">{dispute.employeeName}</span>

                    {/* Amount */}
                    <span className="text-sm font-medium font-mono tabular-nums">
                      {formatCurrency(dispute.amount)}
                    </span>

                    {/* Reason */}
                    <span className="text-xs text-muted-foreground truncate">{dispute.reason}</span>

                    {/* Status */}
                    {getStatusBadge(dispute.status)}

                    {/* Provisional Credit */}
                    <span className="text-xs font-mono tabular-nums">
                      {dispute.provisionalCreditAmount
                        ? formatCurrency(dispute.provisionalCreditAmount)
                        : "--"}
                    </span>

                    {/* Created */}
                    <span className="text-xs text-muted-foreground">
                      {formatDate(dispute.createdAt)}
                    </span>

                    {/* Resolved */}
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">
                        {dispute.resolvedAt ? formatDate(dispute.resolvedAt) : "--"}
                      </span>
                      <div className="hidden lg:block">
                        {expandedId === dispute.id ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {expandedId === dispute.id && (
                    <div className="px-4 pb-4 pt-1 bg-muted/30 border-t border-dashed">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        {/* Description */}
                        <div className="space-y-1">
                          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                            Description
                          </p>
                          <p className="text-sm">{dispute.description}</p>
                        </div>

                        {/* Resolution */}
                        <div className="space-y-1">
                          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                            Resolution
                          </p>
                          <p className="text-sm">
                            {dispute.resolution || (
                              <span className="text-muted-foreground italic">Pending resolution</span>
                            )}
                          </p>
                        </div>

                        {/* Dates */}
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                              Created
                            </p>
                            <p className="text-sm">{formatDate(dispute.createdAt)}</p>
                          </div>
                          {dispute.provisionalCreditDate && (
                            <div className="space-y-1">
                              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                Provisional Credit Date
                              </p>
                              <p className="text-sm">{formatDate(dispute.provisionalCreditDate)}</p>
                            </div>
                          )}
                          {dispute.provisionalCreditAmount && (
                            <div className="space-y-1">
                              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                Provisional Credit Amount
                              </p>
                              <CurrencyDisplay amount={dispute.provisionalCreditAmount} className="text-sm text-purple-600" />
                            </div>
                          )}
                          {dispute.resolvedAt && (
                            <div className="space-y-1">
                              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                Resolved
                              </p>
                              <p className="text-sm">{formatDate(dispute.resolvedAt)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
