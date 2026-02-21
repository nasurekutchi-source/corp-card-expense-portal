"use client";

import { useState, useEffect, useCallback } from "react";
import {
  GitPullRequest,
  CreditCard,
  TrendingUp,
  XCircle,
  Shield,
  Globe,
  CheckCircle2,
  Clock,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Search,
  Check,
  X,
  Loader2,
  User,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/page-header";
import { formatINR, formatDate } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================

interface WorkflowApprovalStep {
  name: string;
  role: string;
  status: string;
  date: string | null;
}

interface WorkflowComment {
  author: string;
  text: string;
  date: string;
}

interface WorkflowRequest {
  id: string;
  type: string;
  requestorId: string;
  requestorName: string;
  department: string;
  status: string;
  details: Record<string, unknown>;
  currentApprover: string;
  approvalChain: WorkflowApprovalStep[];
  createdAt: string;
  updatedAt: string;
  comments: WorkflowComment[];
}

// =============================================================================
// Constants
// =============================================================================

type WorkflowType =
  | "CARD_REQUEST"
  | "LIMIT_CHANGE"
  | "CARD_CANCELLATION"
  | "CONTROLS_OVERRIDE"
  | "INTERNATIONAL_ENABLE";

const TYPE_LABELS: Record<WorkflowType, string> = {
  CARD_REQUEST: "New Card Request",
  LIMIT_CHANGE: "Limit Change",
  CARD_CANCELLATION: "Card Cancellation",
  CONTROLS_OVERRIDE: "Controls Override",
  INTERNATIONAL_ENABLE: "International Enable",
};

const TYPE_COLORS: Record<WorkflowType, { bg: string; text: string; icon: React.ElementType }> = {
  CARD_REQUEST: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", icon: CreditCard },
  LIMIT_CHANGE: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", icon: TrendingUp },
  CARD_CANCELLATION: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", icon: XCircle },
  CONTROLS_OVERRIDE: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-400", icon: Shield },
  INTERNATIONAL_ENABLE: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", icon: Globe },
};

const STATUS_COLORS: Record<string, { variant: "warning" | "success" | "destructive"; icon: React.ElementType }> = {
  PENDING: { variant: "warning", icon: Clock },
  APPROVED: { variant: "success", icon: CheckCircle2 },
  REJECTED: { variant: "destructive", icon: XCircle },
};

// =============================================================================
// Helper Functions
// =============================================================================

function getTypeConfig(type: string) {
  return TYPE_COLORS[type as WorkflowType] || TYPE_COLORS.CARD_REQUEST;
}

function getTypeLabel(type: string) {
  return TYPE_LABELS[type as WorkflowType] || type;
}

function getStatusConfig(status: string) {
  return STATUS_COLORS[status] || STATUS_COLORS.PENDING;
}

function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

function isWithin24h(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  return now.getTime() - date.getTime() < 24 * 60 * 60 * 1000;
}

// =============================================================================
// WorkflowRequestCard Component
// =============================================================================

function WorkflowRequestCard({
  workflow,
  onApprove,
  onReject,
}: {
  workflow: WorkflowRequest;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const typeConfig = getTypeConfig(workflow.type);
  const statusConfig = getStatusConfig(workflow.status);
  const TypeIcon = typeConfig.icon;
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="hover:shadow-md transition-all">
      <CardContent className="p-5">
        {/* Top Row: Type Badge + Status Badge */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${typeConfig.bg} ${typeConfig.text}`}>
              <TypeIcon className="w-3.5 h-3.5" />
              {getTypeLabel(workflow.type)}
            </div>
          </div>
          <Badge variant={statusConfig.variant} className="flex items-center gap-1 text-[11px]">
            <StatusIcon className="w-3 h-3" />
            {workflow.status}
          </Badge>
        </div>

        {/* Requestor Info */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold">{workflow.requestorName}</p>
            <p className="text-xs text-muted-foreground">{workflow.department}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-[11px] text-muted-foreground">
              {formatDate(workflow.createdAt)}
            </p>
          </div>
        </div>

        {/* Key Details */}
        <div className="bg-muted/50 rounded-lg p-3 mb-3">
          <WorkflowDetails type={workflow.type} details={workflow.details} />
        </div>

        {/* Approval Chain Timeline */}
        <div className="mb-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Approval Chain
          </p>
          <div className="space-y-0">
            {workflow.approvalChain.map((step, idx) => {
              const stepColor =
                step.status === "APPROVED"
                  ? "bg-emerald-500"
                  : step.status === "REJECTED"
                    ? "bg-red-500"
                    : "bg-amber-400";
              const stepTextColor =
                step.status === "APPROVED"
                  ? "text-emerald-600"
                  : step.status === "REJECTED"
                    ? "text-red-600"
                    : "text-amber-600";
              const isLast = idx === workflow.approvalChain.length - 1;

              return (
                <div key={idx} className="flex items-start gap-3">
                  {/* Vertical timeline dot + line */}
                  <div className="flex flex-col items-center">
                    <div className={`w-2.5 h-2.5 rounded-full ${stepColor} shrink-0 mt-1`} />
                    {!isLast && <div className="w-px h-6 bg-border" />}
                  </div>
                  {/* Step info */}
                  <div className="flex items-center gap-2 pb-1 min-w-0 flex-1">
                    <span className="text-xs font-medium truncate">{step.name}</span>
                    <span className="text-[10px] text-muted-foreground">({step.role})</span>
                    <span className={`text-[10px] font-semibold ${stepTextColor} ml-auto shrink-0`}>
                      {step.status}
                    </span>
                    {step.date && (
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatDate(step.date)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Comments Toggle */}
        {workflow.comments.length > 0 && (
          <div className="border-t pt-3">
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {workflow.comments.length} comment{workflow.comments.length !== 1 ? "s" : ""}
              {showComments ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>

            {showComments && (
              <div className="mt-2 space-y-2">
                {workflow.comments.map((comment, idx) => (
                  <div key={idx} className="bg-muted/40 rounded-md p-2.5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-semibold">{comment.author}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDate(comment.date)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{comment.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons for PENDING */}
        {workflow.status === "PENDING" && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t">
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 flex-1"
              onClick={() => onApprove(workflow.id)}
            >
              <Check className="w-3.5 h-3.5" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="flex-1"
              onClick={() => onReject(workflow.id)}
            >
              <X className="w-3.5 h-3.5" />
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// WorkflowDetails Component — renders key details per type
// =============================================================================

function WorkflowDetails({
  type,
  details: rawDetails,
}: {
  type: string;
  details: Record<string, unknown>;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const details = rawDetails as any;
  switch (type) {
    case "CARD_REQUEST":
      return (
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <p className="text-muted-foreground">Card Type</p>
            <p className="font-medium">{String(details.cardType || "N/A")}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Network</p>
            <p className="font-medium">{String(details.network || "N/A")}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Requested Limit</p>
            <p className="font-medium">
              {details.requestedLimit
                ? formatINR(Number(details.requestedLimit))
                : "N/A"}
            </p>
          </div>
          {details.justification && (
            <div className="col-span-3 mt-1">
              <p className="text-muted-foreground">Justification</p>
              <p className="font-medium">{String(details.justification)}</p>
            </div>
          )}
        </div>
      );

    case "LIMIT_CHANGE":
      return (
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div>
              <p className="text-muted-foreground">Current Limit</p>
              <p className="font-medium">
                {details.currentLimit ? formatINR(Number(details.currentLimit)) : "N/A"}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 mt-3" />
            <div>
              <p className="text-muted-foreground">Requested Limit</p>
              <p className="font-semibold text-amber-600">
                {details.requestedLimit ? formatINR(Number(details.requestedLimit)) : "N/A"}
              </p>
            </div>
          </div>
          {details.reason && (
            <div>
              <p className="text-muted-foreground">Reason</p>
              <p className="font-medium">{String(details.reason)}</p>
            </div>
          )}
        </div>
      );

    case "CARD_CANCELLATION":
      return (
        <div className="space-y-1 text-xs">
          {details.cardId && (
            <div>
              <p className="text-muted-foreground">Card ID</p>
              <p className="font-medium">{String(details.cardId)}</p>
            </div>
          )}
          {details.reason && (
            <div>
              <p className="text-muted-foreground">Reason</p>
              <p className="font-medium">{String(details.reason)}</p>
            </div>
          )}
        </div>
      );

    case "CONTROLS_OVERRIDE":
      return (
        <div className="space-y-1 text-xs">
          {details.override && (
            <div>
              <p className="text-muted-foreground">Override</p>
              <p className="font-medium">{String(details.override)}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            {details.currentSetting && (
              <div>
                <p className="text-muted-foreground">Current Setting</p>
                <p className="font-medium">{String(details.currentSetting)}</p>
              </div>
            )}
            {details.requestedSetting && (
              <div>
                <p className="text-muted-foreground">Requested Setting</p>
                <p className="font-semibold text-purple-600">{String(details.requestedSetting)}</p>
              </div>
            )}
          </div>
          {details.duration && (
            <div>
              <p className="text-muted-foreground">Duration</p>
              <p className="font-medium">{String(details.duration)}</p>
            </div>
          )}
        </div>
      );

    case "INTERNATIONAL_ENABLE":
      return (
        <div className="space-y-1 text-xs">
          {details.countries && (
            <div>
              <p className="text-muted-foreground">Countries</p>
              <p className="font-medium">
                {Array.isArray(details.countries)
                  ? (details.countries as string[]).join(", ")
                  : String(details.countries)}
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            {details.duration && (
              <div>
                <p className="text-muted-foreground">Duration</p>
                <p className="font-medium">{String(details.duration)}</p>
              </div>
            )}
            {details.purpose && (
              <div>
                <p className="text-muted-foreground">Purpose</p>
                <p className="font-medium">{String(details.purpose)}</p>
              </div>
            )}
          </div>
        </div>
      );

    default:
      return (
        <div className="text-xs text-muted-foreground">
          {Object.entries(details).map(([key, val]) => (
            <div key={key} className="flex gap-2">
              <span className="font-medium capitalize">{key}:</span>
              <span>{String(val)}</span>
            </div>
          ))}
        </div>
      );
  }
}

// =============================================================================
// Main Page
// =============================================================================

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // -------------------------------------------------------------------------
  // Fetch workflows
  // -------------------------------------------------------------------------
  const fetchWorkflows = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/v1/workflows?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setWorkflows(json.data || []);
      }
    } catch {
      // Silently handle fetch errors in demo mode
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, searchQuery]);

  useEffect(() => {
    setLoading(true);
    fetchWorkflows();
  }, [fetchWorkflows]);

  // -------------------------------------------------------------------------
  // Approve / Reject actions
  // -------------------------------------------------------------------------
  const handleApprove = useCallback(
    async (id: string) => {
      setActionLoading(id);
      try {
        const wf = workflows.find((w) => w.id === id);
        if (!wf) return;

        await fetch("/api/v1/workflows", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id,
            action: "approve",
            approverName: wf.currentApprover,
            comment: "Approved via workflow dashboard",
          }),
        });
        await fetchWorkflows();
      } catch {
        // Silently handle in demo mode
      } finally {
        setActionLoading(null);
      }
    },
    [workflows, fetchWorkflows]
  );

  const handleReject = useCallback(
    async (id: string) => {
      setActionLoading(id);
      try {
        const wf = workflows.find((w) => w.id === id);
        if (!wf) return;

        await fetch("/api/v1/workflows", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id,
            action: "reject",
            approverName: wf.currentApprover,
            comment: "Rejected via workflow dashboard",
          }),
        });
        await fetchWorkflows();
      } catch {
        // Silently handle in demo mode
      } finally {
        setActionLoading(null);
      }
    },
    [workflows, fetchWorkflows]
  );

  // -------------------------------------------------------------------------
  // Computed summary stats
  // -------------------------------------------------------------------------
  const pendingCount = workflows.filter((w) => w.status === "PENDING").length;
  const approvedTodayCount = workflows.filter(
    (w) => w.status === "APPROVED" && isWithin24h(w.updatedAt)
  ).length;
  const rejectedCount = workflows.filter((w) => w.status === "REJECTED").length;
  const totalCount = workflows.length;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Workflow Requests"
        description="Card request approvals, limit changes, cancellations, and controls overrides"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-amber-500" />
              <p className="text-xs text-muted-foreground">Pending Requests</p>
            </div>
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <p className="text-xs text-muted-foreground">Approved Today</p>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{approvedTodayCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="w-4 h-4 text-red-500" />
              <p className="text-xs text-muted-foreground">Rejected</p>
            </div>
            <p className="text-2xl font-bold text-destructive">{rejectedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <GitPullRequest className="w-4 h-4 text-blue-500" />
              <p className="text-xs text-muted-foreground">Total Requests</p>
            </div>
            <p className="text-2xl font-bold">{totalCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Type Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground uppercase">
                Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full sm:w-48 h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="ALL">All Types</option>
                <option value="CARD_REQUEST">New Card Request</option>
                <option value="LIMIT_CHANGE">Limit Change</option>
                <option value="CARD_CANCELLATION">Card Cancellation</option>
                <option value="CONTROLS_OVERRIDE">Controls Override</option>
                <option value="INTERNATIONAL_ENABLE">International Enable</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground uppercase">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-40 h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {/* Search */}
            <div className="space-y-1 flex-1">
              <label className="text-[10px] font-medium text-muted-foreground uppercase">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search by name, department, or type..."
                  className="pl-9 h-9 text-xs"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Request Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading workflow requests...</span>
        </div>
      ) : workflows.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <GitPullRequest className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">No workflow requests found.</p>
            <p className="text-muted-foreground text-xs mt-1">
              Try adjusting your filters or search query.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {workflows.map((wf) => (
            <WorkflowRequestCard
              key={wf.id}
              workflow={wf}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      )}
    </div>
  );
}
