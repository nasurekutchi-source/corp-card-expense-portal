"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { PageHeader } from "@/components/shared/page-header";
import { formatDate } from "@/lib/utils";
import {
  Check,
  X,
  Send,
  Clock,
  AlertTriangle,
  Users,
  FileText,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Search,
  ArrowUpDown,
  Receipt,
  MessageSquare,
  Timer,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  History,
  Settings,
  Zap,
} from "lucide-react";

// -- Types matching store.ts --

interface Approval {
  id: string;
  entityType: string;
  entityId: string;
  reportNumber: string;
  employeeName: string;
  department: string;
  amount: number;
  expenseCount: number;
  status: string;
  level: number;
  submittedAt: string | null;
  dueAt: string;
  policyScore: number;
}

interface Expense {
  id: string;
  amount: number;
  category: string;
  merchantName: string;
  date: string;
  policyStatus: string;
  hasReceipt: boolean;
  businessPurpose: string;
}

interface TimelineEntry {
  action: string;
  by: string;
  at: string;
  comment?: string;
}

type SortKey = "age" | "amount" | "department";

// -- Simulated approvers for delegation --
const APPROVERS = [
  { id: "mgr-1", name: "Rajesh Kumar", role: "Senior Manager" },
  { id: "mgr-2", name: "Priya Sharma", role: "Finance Controller" },
  { id: "mgr-3", name: "Vikram Singh", role: "Department Head" },
  { id: "mgr-4", name: "Anita Desai", role: "VP Finance" },
];

// ============================================================================
// Helper: SLA timer display
// ============================================================================

function getSlaInfo(dueAt: string) {
  const due = new Date(dueAt).getTime();
  const now = Date.now();
  const hoursLeft = (due - now) / (1000 * 60 * 60);

  if (hoursLeft < 0) {
    const overdue = Math.abs(Math.round(hoursLeft));
    return {
      label: `${overdue}h overdue`,
      color: "text-red-700 dark:text-red-400",
      bg: "bg-red-100 dark:bg-red-900/30",
      ring: "ring-red-200 dark:ring-red-800",
      level: "overdue" as const,
    };
  }
  if (hoursLeft <= 24) {
    return {
      label: `${Math.ceil(hoursLeft)}h left`,
      color: "text-amber-700 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-900/20",
      ring: "ring-amber-200 dark:ring-amber-800",
      level: "warning" as const,
    };
  }
  return {
    label: `${Math.ceil(hoursLeft)}h left`,
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    ring: "ring-emerald-200 dark:ring-emerald-800",
    level: "ok" as const,
  };
}

// ============================================================================
// Main Component
// ============================================================================

export default function ApprovalsPage() {
  // -- State --
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<Record<string, Expense[]>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("PENDING");
  const [sortBy, setSortBy] = useState<SortKey>("age");
  const [comment, setComment] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Dialog states
  const [rejectDialog, setRejectDialog] = useState<Approval | null>(null);
  const [delegateDialog, setDelegateDialog] = useState<Approval | null>(null);
  const [rejectComment, setRejectComment] = useState("");
  const [delegateTo, setDelegateTo] = useState("");
  const [bulkConfirm, setBulkConfirm] = useState(false);

  // Escalation settings state
  const [escalationDialog, setEscalationDialog] = useState(false);
  const [escConfig, setEscConfig] = useState({
    enabled: true,
    slaHours: 48,
    escalateTo: "SKIP_LEVEL" as "SKIP_LEVEL" | "FINANCE" | "ADMIN",
    maxEscalations: 2,
    notifyOriginalApprover: true,
  });
  const [escLoading, setEscLoading] = useState(false);
  const [escRunResult, setEscRunResult] = useState<{ escalated: string[]; checked: number } | null>(null);

  // Simulated timeline per approval
  const [timelines] = useState<Record<string, TimelineEntry[]>>(() => ({}));

  // -- Fetch approvals --
  const fetchApprovals = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (activeTab !== "ALL") params.set("status", activeTab);
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`/api/v1/approvals?${params.toString()}`);
      const json = await res.json();
      setApprovals(json.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    setLoading(true);
    fetchApprovals();
  }, [fetchApprovals]);

  // -- Fetch escalation config on mount --
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/v1/approvals/escalation");
        if (res.ok) {
          const data = await res.json();
          setEscConfig(data);
        }
      } catch {
        // silent
      }
    })();
  }, []);

  // -- Save escalation config --
  async function saveEscalationConfig() {
    setEscLoading(true);
    try {
      const res = await fetch("/api/v1/approvals/escalation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(escConfig),
      });
      if (res.ok) {
        const data = await res.json();
        setEscConfig(data);
      }
    } catch {
      // silent
    } finally {
      setEscLoading(false);
    }
  }

  // -- Run escalation check --
  async function runEscalationCheck() {
    setEscLoading(true);
    setEscRunResult(null);
    try {
      const res = await fetch("/api/v1/approvals/escalation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run" }),
      });
      if (res.ok) {
        const data = await res.json();
        setEscRunResult(data);
        // Refresh approvals to reflect escalated items
        fetchApprovals();
      }
    } catch {
      // silent
    } finally {
      setEscLoading(false);
    }
  }

  // -- Build a timeline for an approval (simulated history) --
  function getTimeline(a: Approval): TimelineEntry[] {
    if (timelines[a.id]) return timelines[a.id];
    const entries: TimelineEntry[] = [];
    if (a.submittedAt) {
      entries.push({ action: "Submitted", by: a.employeeName, at: a.submittedAt });
    }
    entries.push({
      action: "Assigned for review",
      by: "System",
      at: a.submittedAt || new Date().toISOString(),
    });
    if (a.status === "APPROVED") {
      entries.push({ action: "Approved", by: "Finance Controller", at: new Date().toISOString(), comment: "Looks good" });
    } else if (a.status === "REJECTED") {
      entries.push({ action: "Rejected", by: "Finance Controller", at: new Date().toISOString(), comment: "Policy violation" });
    }
    return entries;
  }

  // -- Fetch expenses for expanded card --
  async function loadExpenses(approval: Approval) {
    if (expenses[approval.id]) return;
    try {
      const res = await fetch(`/api/v1/expenses?employeeId=${approval.entityId}`);
      const json = await res.json();
      setExpenses((prev) => ({
        ...prev,
        [approval.id]: (json.data || []).slice(0, approval.expenseCount),
      }));
    } catch {
      // Generate placeholder expenses
      const placeholder: Expense[] = Array.from({ length: approval.expenseCount }, (_, i) => ({
        id: `exp-placeholder-${i}`,
        amount: Math.round((approval.amount / approval.expenseCount) * 100) / 100,
        category: ["Travel - Air", "Meals & Entertainment", "Travel - Hotel", "Office Supplies"][i % 4],
        merchantName: ["Air India", "Taj Hotels", "Uber", "Amazon"][i % 4],
        date: approval.submittedAt || new Date().toISOString(),
        policyStatus: approval.policyScore >= 90 ? "COMPLIANT" : "VIOLATION",
        hasReceipt: i % 3 !== 0,
        businessPurpose: "Business travel expense",
      }));
      setExpenses((prev) => ({ ...prev, [approval.id]: placeholder }));
    }
  }

  // -- Actions --
  async function handleAction(id: string, status: string, actionComment?: string) {
    setActionLoading(id);
    try {
      const res = await fetch("/api/v1/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, comment: actionComment, reviewedBy: "current-user" }),
      });
      if (res.ok) {
        setApprovals((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status } : a))
        );
        setSelectedIds((prev) => prev.filter((sid) => sid !== id));
        setExpandedId(null);
        setComment("");
      }
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  }

  async function handleBulkApprove() {
    setActionLoading("bulk");
    for (const id of selectedIds) {
      await handleAction(id, "APPROVED", "Bulk approved");
    }
    setSelectedIds([]);
    setBulkConfirm(false);
    setActionLoading(null);
    fetchApprovals();
  }

  function handleRejectConfirm() {
    if (!rejectDialog || !rejectComment.trim()) return;
    handleAction(rejectDialog.id, "REJECTED", rejectComment);
    setRejectDialog(null);
    setRejectComment("");
  }

  function handleDelegateConfirm() {
    if (!delegateDialog || !delegateTo) return;
    handleAction(delegateDialog.id, "DELEGATED", `Delegated to ${APPROVERS.find((a) => a.id === delegateTo)?.name}`);
    setDelegateDialog(null);
    setDelegateTo("");
  }

  // -- Toggle card expand --
  function toggleExpand(approval: Approval) {
    if (expandedId === approval.id) {
      setExpandedId(null);
    } else {
      setExpandedId(approval.id);
      loadExpenses(approval);
    }
  }

  // -- Checkbox toggle --
  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  // -- Filtered + sorted list --
  const filtered = useMemo(() => {
    let list = [...approvals];

    // Sort
    if (sortBy === "age") {
      list.sort((a, b) => new Date(a.submittedAt || 0).getTime() - new Date(b.submittedAt || 0).getTime());
    } else if (sortBy === "amount") {
      list.sort((a, b) => b.amount - a.amount);
    } else if (sortBy === "department") {
      list.sort((a, b) => a.department.localeCompare(b.department));
    }

    return list;
  }, [approvals, sortBy]);

  // -- Stats --
  const stats = useMemo(() => {
    const pending = approvals.filter((a) => a.status === "PENDING").length;
    const overdue = approvals.filter((a) => {
      if (a.status !== "PENDING") return false;
      return new Date(a.dueAt).getTime() < Date.now();
    }).length;
    const approved = approvals.filter((a) => a.status === "APPROVED").length;
    const totalAmount = approvals
      .filter((a) => a.status === "PENDING")
      .reduce((sum, a) => sum + a.amount, 0);
    return { pending, overdue, approved, totalAmount };
  }, [approvals]);

  const pendingForSelect = filtered.filter((a) => a.status === "PENDING");
  const allSelected = pendingForSelect.length > 0 && pendingForSelect.every((a) => selectedIds.includes(a.id));

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingForSelect.map((a) => a.id));
    }
  }

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Approval Inbox"
        description="Review and action expense reports awaiting your approval"
      >
        <Button variant="outline" size="sm" onClick={() => setEscalationDialog(true)}>
          <Settings className="w-4 h-4" />
          Escalation Settings
        </Button>
        {selectedIds.length > 0 && (
          <Button onClick={() => setBulkConfirm(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <CheckCheck className="w-4 h-4" />
            Approve Selected ({selectedIds.length})
          </Button>
        )}
      </PageHeader>

      {/* -- Stats Cards -- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Timer className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">SLA Breached</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Approved</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.approved}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending Amount</p>
              <CurrencyDisplay amount={stats.totalAmount} compact className="text-xl font-bold" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* -- Toolbar: Search + Sort + Filter Tabs -- */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSelectedIds([]); }}>
          <TabsList>
            <TabsTrigger value="ALL">All</TabsTrigger>
            <TabsTrigger value="PENDING">Pending</TabsTrigger>
            <TabsTrigger value="ESCALATED">Escalated</TabsTrigger>
            <TabsTrigger value="APPROVED">Approved</TabsTrigger>
            <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search reports, employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
              className="pl-9 w-64"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ArrowUpDown className="w-4 h-4" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sort By</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortBy("age")}>
                <Clock className="w-4 h-4" /> Age (oldest first)
                {sortBy === "age" && <Check className="w-4 h-4 ml-auto" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("amount")}>
                <Receipt className="w-4 h-4" /> Amount (highest first)
                {sortBy === "amount" && <Check className="w-4 h-4 ml-auto" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("department")}>
                <Users className="w-4 h-4" /> Department
                {sortBy === "department" && <Check className="w-4 h-4 ml-auto" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* -- Select All (when on Pending tab) -- */}
      {activeTab === "PENDING" && pendingForSelect.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button
            onClick={toggleSelectAll}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
              allSelected
                ? "bg-primary border-primary text-primary-foreground"
                : "border-muted-foreground/30 hover:border-primary"
            }`}
          >
            {allSelected && <Check className="w-3 h-3" />}
          </button>
          <span>
            {allSelected ? "Deselect all" : `Select all ${pendingForSelect.length} pending approvals`}
          </span>
        </div>
      )}

      {/* -- Approval Cards -- */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading approvals...</span>
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ShieldCheck className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-lg font-medium text-muted-foreground">No approvals found</p>
            <p className="text-sm text-muted-foreground/70">
              {activeTab === "PENDING" ? "You are all caught up!" : "No items match the current filter."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((approval) => {
            const sla = getSlaInfo(approval.dueAt);
            const isSelected = selectedIds.includes(approval.id);
            const isExpanded = expandedId === approval.id;
            const isPending = approval.status === "PENDING";
            const expenseList = expenses[approval.id] || [];
            const timeline = getTimeline(approval);

            return (
              <Card
                key={approval.id}
                className={`transition-all duration-200 ${
                  isSelected ? "ring-2 ring-primary shadow-md" : "hover:shadow-md"
                } ${isExpanded ? "shadow-lg" : ""}`}
              >
                <CardContent className="p-0">
                  {/* -- Main Row -- */}
                  <div className="flex items-start gap-3 p-4">
                    {/* Checkbox */}
                    {isPending && (
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleSelect(approval.id); }}
                        className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/30 hover:border-primary"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </button>
                    )}

                    {/* Clickable content area */}
                    <button
                      className="flex-1 min-w-0 text-left"
                      onClick={() => toggleExpand(approval)}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="font-semibold text-sm">{approval.reportNumber}</span>
                        <StatusBadge status={approval.status} />
                        {isPending && (
                          <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${sla.bg} ${sla.color}`}>
                            <Clock className="w-2.5 h-2.5" />
                            {sla.label}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {approval.employeeName}
                        </span>
                        <span>{approval.department}</span>
                        <span>{approval.expenseCount} expense{approval.expenseCount !== 1 ? "s" : ""}</span>
                        {approval.submittedAt && (
                          <span>Submitted {formatDate(approval.submittedAt)}</span>
                        )}
                      </div>

                      {/* Policy + Level */}
                      <div className="flex items-center gap-2">
                        <PolicyBadge score={approval.policyScore} />
                        <span className="text-[10px] text-muted-foreground">
                          Level {approval.level} approval
                        </span>
                      </div>
                    </button>

                    {/* Amount */}
                    <div className="text-right shrink-0 mr-2">
                      <CurrencyDisplay amount={approval.amount} className="text-lg font-bold" />
                    </div>

                    {/* Actions */}
                    {isPending && (
                      <div className="flex flex-col gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          disabled={actionLoading === approval.id}
                          onClick={(e) => { e.stopPropagation(); handleAction(approval.id, "APPROVED", comment || undefined); }}
                        >
                          {actionLoading === approval.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={actionLoading === approval.id}
                          onClick={(e) => { e.stopPropagation(); setRejectDialog(approval); }}
                        >
                          <X className="w-3 h-3" /> Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoading === approval.id}
                          onClick={(e) => { e.stopPropagation(); setDelegateDialog(approval); }}
                        >
                          <Send className="w-3 h-3" /> Delegate
                        </Button>
                      </div>
                    )}

                    {/* Expand indicator */}
                    <button onClick={() => toggleExpand(approval)} className="mt-1 shrink-0 text-muted-foreground hover:text-foreground">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* -- Expanded Detail -- */}
                  {isExpanded && (
                    <div className="border-t bg-muted/30">
                      {/* Comment input for quick approve */}
                      {isPending && (
                        <div className="px-4 pt-3 pb-2">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0" />
                            <Input
                              placeholder="Add a comment before approving (optional)..."
                              value={comment}
                              onChange={(e) => setComment((e.target as HTMLInputElement).value)}
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                      )}

                      {/* Expense line items */}
                      <div className="px-4 py-3">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          Expenses ({approval.expenseCount})
                        </h4>
                        {expenseList.length === 0 ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mr-2" />
                            <span className="text-sm text-muted-foreground">Loading expenses...</span>
                          </div>
                        ) : (
                          <div className="rounded-md border overflow-hidden">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-muted/50 text-xs text-muted-foreground">
                                  <th className="text-left px-3 py-2 font-medium">Merchant</th>
                                  <th className="text-left px-3 py-2 font-medium">Category</th>
                                  <th className="text-left px-3 py-2 font-medium">Date</th>
                                  <th className="text-center px-3 py-2 font-medium">Receipt</th>
                                  <th className="text-center px-3 py-2 font-medium">Policy</th>
                                  <th className="text-right px-3 py-2 font-medium">Amount</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {expenseList.map((exp) => (
                                  <tr key={exp.id} className="hover:bg-muted/30">
                                    <td className="px-3 py-2 font-medium">{exp.merchantName}</td>
                                    <td className="px-3 py-2 text-muted-foreground">{exp.category}</td>
                                    <td className="px-3 py-2 text-muted-foreground">{formatDate(exp.date)}</td>
                                    <td className="px-3 py-2 text-center">
                                      {exp.hasReceipt ? (
                                        <Badge variant="success" className="text-[9px]">Yes</Badge>
                                      ) : (
                                        <Badge variant="destructive" className="text-[9px]">Missing</Badge>
                                      )}
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      {exp.policyStatus === "COMPLIANT" ? (
                                        <ShieldCheck className="w-4 h-4 text-emerald-500 mx-auto" />
                                      ) : (
                                        <ShieldAlert className="w-4 h-4 text-amber-500 mx-auto" />
                                      )}
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                      <CurrencyDisplay amount={exp.amount} className="text-sm font-medium" />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="bg-muted/50 font-semibold">
                                  <td colSpan={5} className="px-3 py-2 text-right text-xs uppercase tracking-wider text-muted-foreground">
                                    Total
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <CurrencyDisplay amount={approval.amount} className="text-sm font-bold" />
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* Approval timeline */}
                      <div className="px-4 pb-4">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                          <History className="w-3 h-3" /> Approval History
                        </h4>
                        <div className="relative pl-4 space-y-3">
                          <div className="absolute left-[7px] top-1 bottom-1 w-px bg-border" />
                          {timeline.map((entry, i) => (
                            <div key={i} className="relative flex items-start gap-3">
                              <div className={`w-3 h-3 rounded-full border-2 shrink-0 -ml-[5.5px] mt-0.5 ${
                                entry.action === "Approved"
                                  ? "bg-emerald-500 border-emerald-500"
                                  : entry.action === "Rejected"
                                    ? "bg-red-500 border-red-500"
                                    : "bg-background border-muted-foreground/40"
                              }`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium">
                                  {entry.action}
                                  <span className="text-muted-foreground font-normal"> by {entry.by}</span>
                                </p>
                                <p className="text-[10px] text-muted-foreground">{formatDate(entry.at)}</p>
                                {entry.comment && (
                                  <p className="text-xs text-muted-foreground mt-0.5 italic">&quot;{entry.comment}&quot;</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ================================================================ */}
      {/* Reject Dialog */}
      {/* ================================================================ */}
      <Dialog open={!!rejectDialog} onOpenChange={(open) => { if (!open) { setRejectDialog(null); setRejectComment(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Expense Report</DialogTitle>
            <DialogDescription>
              Rejecting {rejectDialog?.reportNumber} by {rejectDialog?.employeeName} for{" "}
              <CurrencyDisplay amount={rejectDialog?.amount || 0} className="font-semibold" />.
              A comment is required.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <textarea
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Reason for rejection (required)..."
              value={rejectComment}
              onChange={(e) => setRejectComment((e.target as HTMLTextAreaElement).value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectDialog(null); setRejectComment(""); }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectComment.trim() || actionLoading === rejectDialog?.id}
              onClick={handleRejectConfirm}
            >
              {actionLoading === rejectDialog?.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )}
              Reject Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================================ */}
      {/* Delegate Dialog */}
      {/* ================================================================ */}
      <Dialog open={!!delegateDialog} onOpenChange={(open) => { if (!open) { setDelegateDialog(null); setDelegateTo(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delegate Approval</DialogTitle>
            <DialogDescription>
              Delegate {delegateDialog?.reportNumber} to another approver.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="text-sm font-medium">Select Approver</label>
            <div className="space-y-2">
              {APPROVERS.map((approver) => (
                <button
                  key={approver.id}
                  onClick={() => setDelegateTo(approver.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                    delegateTo === approver.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {approver.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{approver.name}</p>
                    <p className="text-xs text-muted-foreground">{approver.role}</p>
                  </div>
                  {delegateTo === approver.id && <Check className="w-4 h-4 text-primary" />}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDelegateDialog(null); setDelegateTo(""); }}>
              Cancel
            </Button>
            <Button
              disabled={!delegateTo || actionLoading === delegateDialog?.id}
              onClick={handleDelegateConfirm}
            >
              {actionLoading === delegateDialog?.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Delegate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================================ */}
      {/* Bulk Approve Confirmation */}
      {/* ================================================================ */}
      <Dialog open={bulkConfirm} onOpenChange={setBulkConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Approval</DialogTitle>
            <DialogDescription>
              You are about to approve {selectedIds.length} expense report{selectedIds.length !== 1 ? "s" : ""}.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md bg-muted p-3 space-y-1 max-h-48 overflow-y-auto">
            {approvals
              .filter((a) => selectedIds.includes(a.id))
              .map((a) => (
                <div key={a.id} className="flex items-center justify-between text-sm">
                  <span>{a.reportNumber} - {a.employeeName}</span>
                  <CurrencyDisplay amount={a.amount} className="text-sm font-medium" />
                </div>
              ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkConfirm(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={actionLoading === "bulk"}
              onClick={handleBulkApprove}
            >
              {actionLoading === "bulk" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCheck className="w-4 h-4" />
              )}
              Approve All ({selectedIds.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================================ */}
      {/* Escalation Settings Dialog */}
      {/* ================================================================ */}
      <Dialog open={escalationDialog} onOpenChange={(open) => { if (!open) { setEscalationDialog(false); setEscRunResult(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Auto-Escalation Settings
            </DialogTitle>
            <DialogDescription>
              Configure automatic escalation when approval SLA is breached.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Enable toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Auto-Escalation Enabled</p>
                <p className="text-xs text-muted-foreground">Automatically escalate overdue approvals</p>
              </div>
              <Switch
                checked={escConfig.enabled}
                onCheckedChange={(v) => setEscConfig((prev) => ({ ...prev, enabled: v }))}
              />
            </div>

            {escConfig.enabled && (
              <>
                {/* SLA Hours */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">SLA Threshold (hours)</label>
                  <p className="text-xs text-muted-foreground">Escalate if pending longer than this</p>
                  <Input
                    type="number"
                    value={escConfig.slaHours}
                    onChange={(e) => setEscConfig((prev) => ({ ...prev, slaHours: parseInt((e.target as HTMLInputElement).value) || 0 }))}
                    min={1}
                    max={720}
                    className="w-32"
                  />
                </div>

                {/* Escalate To */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Escalate To</label>
                  <p className="text-xs text-muted-foreground">Who receives the escalated approval</p>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={escConfig.escalateTo}
                    onChange={(e) => setEscConfig((prev) => ({ ...prev, escalateTo: (e.target as HTMLSelectElement).value as "SKIP_LEVEL" | "FINANCE" | "ADMIN" }))}
                  >
                    <option value="SKIP_LEVEL">Skip-Level Manager</option>
                    <option value="FINANCE">Finance Controller</option>
                    <option value="ADMIN">Company Admin</option>
                  </select>
                </div>

                {/* Max Escalations */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Max Escalations</label>
                  <p className="text-xs text-muted-foreground">Maximum times an approval can be escalated</p>
                  <Input
                    type="number"
                    value={escConfig.maxEscalations}
                    onChange={(e) => setEscConfig((prev) => ({ ...prev, maxEscalations: parseInt((e.target as HTMLInputElement).value) || 1 }))}
                    min={1}
                    max={5}
                    className="w-32"
                  />
                </div>

                {/* Notify Original Approver */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Notify Original Approver</p>
                    <p className="text-xs text-muted-foreground">Send notification when escalated</p>
                  </div>
                  <Switch
                    checked={escConfig.notifyOriginalApprover}
                    onCheckedChange={(v) => setEscConfig((prev) => ({ ...prev, notifyOriginalApprover: v }))}
                  />
                </div>

                {/* Run Now */}
                <div className="pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={escLoading}
                    onClick={runEscalationCheck}
                  >
                    {escLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    Run Escalation Check Now
                  </Button>
                  {escRunResult && (
                    <div className={`mt-2 rounded-md px-3 py-2 text-xs ${
                      escRunResult.escalated.length > 0
                        ? "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800"
                        : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                    }`}>
                      {escRunResult.escalated.length > 0 ? (
                        <p>Escalated {escRunResult.escalated.length} of {escRunResult.checked} pending approvals</p>
                      ) : (
                        <p>Checked {escRunResult.checked} pending approvals — none breached SLA</p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setEscalationDialog(false); setEscRunResult(null); }}>
              Cancel
            </Button>
            <Button
              disabled={escLoading}
              onClick={() => { saveEscalationConfig(); setEscalationDialog(false); setEscRunResult(null); }}
              style={{ backgroundColor: "#0d3b66" }}
              className="hover:opacity-90"
            >
              {escLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "PENDING":
      return <Badge variant="warning" className="text-[9px]">Pending</Badge>;
    case "APPROVED":
      return <Badge variant="success" className="text-[9px]">Approved</Badge>;
    case "REJECTED":
      return <Badge variant="destructive" className="text-[9px]">Rejected</Badge>;
    case "DELEGATED":
      return <Badge variant="info" className="text-[9px]">Delegated</Badge>;
    case "ESCALATED":
      return <Badge variant="destructive" className="text-[9px] bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800">Escalated</Badge>;
    default:
      return <Badge variant="secondary" className="text-[9px]">{status}</Badge>;
  }
}

function PolicyBadge({ score }: { score: number }) {
  if (score >= 90) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium">
        <ShieldCheck className="w-3 h-3" />
        Policy: {score}%
      </span>
    );
  }
  if (score >= 70) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium">
        <AlertTriangle className="w-3 h-3" />
        Policy: {score}% ({100 - score}% violations)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-medium">
      <ShieldAlert className="w-3 h-3" />
      Policy: {score}% ({100 - score}% violations)
    </span>
  );
}
