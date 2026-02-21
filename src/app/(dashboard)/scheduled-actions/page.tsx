"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/page-header";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import {
  Calendar,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Pause,
  Play,
  TrendingUp,
} from "lucide-react";

interface ScheduledCardAction {
  id: string;
  cardId: string;
  cardLast4: string;
  employeeId: string;
  employeeName: string;
  actionType: string;
  scheduledDate: string;
  recurrence: string;
  status: string;
  details: Record<string, unknown>;
  createdAt: string;
}

const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

export default function ScheduledActionsPage() {
  const [actions, setActions] = useState<ScheduledCardAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionTypeFilter, setActionTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state for creating a new scheduled action
  const [formCardId, setFormCardId] = useState("");
  const [formActionType, setFormActionType] = useState("FREEZE");
  const [formScheduledDate, setFormScheduledDate] = useState("");
  const [formRecurrence, setFormRecurrence] = useState("ONCE");
  const [formReason, setFormReason] = useState("");

  const fetchActions = async () => {
    try {
      const res = await fetch("/api/v1/scheduled-actions");
      const json = await res.json();
      setActions(json.data || []);
    } catch {
      console.error("Failed to fetch scheduled actions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, []);

  // Apply client-side filters
  const filtered = useMemo(() => {
    let result = [...actions];

    if (actionTypeFilter !== "ALL") {
      result = result.filter((a) => a.actionType === actionTypeFilter);
    }

    if (statusFilter !== "ALL") {
      result = result.filter((a) => a.status === statusFilter);
    }

    // Sort by scheduledDate descending (most recent first)
    result.sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());

    return result;
  }, [actions, actionTypeFilter, statusFilter]);

  // Summary stats (computed from full dataset)
  const stats = useMemo(() => {
    const pending = actions.filter((a) => a.status === "PENDING").length;
    const executed = actions.filter((a) => a.status === "EXECUTED").length;
    const cancelled = actions.filter((a) => a.status === "CANCELLED").length;
    return { pending, executed, cancelled };
  }, [actions]);

  const actionTypeBadge = (type: string) => {
    switch (type) {
      case "FREEZE":
        return <Badge variant="destructive">{type}</Badge>;
      case "UNFREEZE":
        return <Badge variant="success">{type}</Badge>;
      case "LIMIT_CHANGE":
        return <Badge variant="info">{type.replace("_", " ")}</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="warning">{status}</Badge>;
      case "EXECUTED":
        return <Badge variant="success">{status}</Badge>;
      case "CANCELLED":
        return <Badge variant="secondary">{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const actionTypeIcon = (type: string) => {
    switch (type) {
      case "FREEZE":
        return <Pause className="w-4 h-4 text-red-500" />;
      case "UNFREEZE":
        return <Play className="w-4 h-4 text-emerald-500" />;
      case "LIMIT_CHANGE":
        return <TrendingUp className="w-4 h-4 text-blue-500" />;
      default:
        return <Calendar className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const handleCancel = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/scheduled-actions?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to cancel action");
        return;
      }

      toast.success("Scheduled action cancelled");
      // Re-fetch to update the list
      fetchActions();
    } catch {
      toast.error("Failed to cancel scheduled action");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formCardId || !formScheduledDate) {
      toast.error("Card ID and Scheduled Date are required");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/scheduled-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: formCardId,
          actionType: formActionType,
          scheduledDate: formScheduledDate,
          recurrence: formRecurrence,
          details: formReason ? { reason: formReason } : {},
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to create scheduled action");
        return;
      }

      toast.success("Scheduled action created");
      setDialogOpen(false);
      resetForm();
      fetchActions();
    } catch {
      toast.error("Failed to create scheduled action");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormCardId("");
    setFormActionType("FREEZE");
    setFormScheduledDate("");
    setFormRecurrence("ONCE");
    setFormReason("");
  };

  const renderDetails = (action: ScheduledCardAction) => {
    if (!action.details || Object.keys(action.details).length === 0) return "---";
    if (action.details.reason) return String(action.details.reason);
    if (action.details.newLimit) return `New limit: ${formatINR(Number(action.details.newLimit))}`;
    return JSON.stringify(action.details);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in">
        <PageHeader
          title="Scheduled Card Actions"
          description="Auto-freeze, unfreeze, and limit changes on scheduled dates"
        />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-4 w-24 bg-muted rounded animate-pulse mb-2" />
                <div className="h-8 w-16 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Scheduled Card Actions"
        description="Auto-freeze, unfreeze, and limit changes on scheduled dates"
      >
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4" />
              Schedule Action
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Scheduled Action</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase">
                  Card ID
                </label>
                <Input
                  placeholder="e.g. card-001"
                  value={formCardId}
                  onChange={(e) => setFormCardId(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase">
                  Action Type
                </label>
                <select
                  value={formActionType}
                  onChange={(e) => setFormActionType(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="FREEZE">Freeze</option>
                  <option value="UNFREEZE">Unfreeze</option>
                  <option value="LIMIT_CHANGE">Limit Change</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase">
                  Scheduled Date
                </label>
                <Input
                  type="date"
                  value={formScheduledDate}
                  onChange={(e) => setFormScheduledDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase">
                  Recurrence
                </label>
                <select
                  value={formRecurrence}
                  onChange={(e) => setFormRecurrence(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="ONCE">Once</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase">
                  Reason
                </label>
                <textarea
                  placeholder="Reason for scheduling this action..."
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Creating..." : "Create Action"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-amber-500" />
              <p className="text-xs text-muted-foreground">Pending Actions</p>
            </div>
            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <p className="text-xs text-muted-foreground">Executed</p>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{stats.executed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="w-4 h-4 text-gray-400" />
              <p className="text-xs text-muted-foreground">Cancelled</p>
            </div>
            <p className="text-2xl font-bold text-gray-500">{stats.cancelled}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="space-y-1">
          <select
            value={actionTypeFilter}
            onChange={(e) => setActionTypeFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="ALL">All Action Types</option>
            <option value="FREEZE">Freeze</option>
            <option value="UNFREEZE">Unfreeze</option>
            <option value="LIMIT_CHANGE">Limit Change</option>
          </select>
        </div>
        <div className="space-y-1">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="EXECUTED">Executed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Scheduled Actions Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Card</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Employee</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Action Type</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Scheduled Date</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Recurrence</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">Details</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Created</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center">
                      <Calendar className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No scheduled actions found</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((action) => (
                    <tr
                      key={action.id}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {actionTypeIcon(action.actionType)}
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>****{action.cardLast4}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                        {action.employeeName}
                      </td>
                      <td className="px-4 py-3">{actionTypeBadge(action.actionType)}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {formatDate(action.scheduledDate)}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <Badge variant="outline" className="text-[10px]">
                          {action.recurrence}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">{statusBadge(action.status)}</td>
                      <td className="px-4 py-3 hidden xl:table-cell text-xs text-muted-foreground max-w-[200px] truncate">
                        {renderDetails(action)}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">
                        {formatDate(action.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {action.status === "PENDING" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleCancel(action.id)}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Cancel
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">---</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div className="py-3 text-center border-t">
              <p className="text-xs text-muted-foreground">
                Showing {filtered.length} scheduled action{filtered.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
