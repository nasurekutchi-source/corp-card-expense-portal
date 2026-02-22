"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/page-header";
import { getDoaAuthorityLevels, getDoaApprovalMatrix } from "@/lib/store";
import type { ApprovalChainRule, ApprovalChainStep } from "@/lib/store";
import { EXPENSE_CATEGORIES, ROLE_LABELS } from "@/lib/constants";
import { formatINRCompact, formatINR } from "@/lib/utils";
import {
  Scale,
  Plus,
  Edit2,
  Trash2,
  Users,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  GitBranch,
  Layers,
  ChevronUp,
  ChevronDown,
  Link2,
  Loader2,
  Check,
  X,
  Power,
  PowerOff,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Role options for the chain builder
// ---------------------------------------------------------------------------
const APPROVER_ROLES = [
  { value: "DEPT_MANAGER", label: "Department Manager" },
  { value: "FINANCE_CONTROLLER", label: "Finance Controller" },
  { value: "COMPANY_ADMIN", label: "Company Admin" },
  { value: "SYSTEM_ADMIN", label: "System Admin" },
] as const;

const ROLE_COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  DEPT_MANAGER: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-blue-800" },
  FINANCE_CONTROLLER: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300", border: "border-purple-200 dark:border-purple-800" },
  COMPANY_ADMIN: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800" },
  SYSTEM_ADMIN: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300", border: "border-red-200 dark:border-red-800" },
};

// Category options
const CATEGORY_OPTIONS = [
  { value: "ALL", label: "All Categories" },
  ...EXPENSE_CATEGORIES.map((c) => ({ value: c.code, label: c.label })),
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatAmountRange(min: number, max: number): string {
  const fmtMin = formatINRCompact(min);
  if (max === 0) return `${fmtMin} +`;
  return `${fmtMin} - ${formatINRCompact(max)}`;
}

function getRoleBadgeLabel(role: string): string {
  return ROLE_LABELS[role as keyof typeof ROLE_LABELS] || role;
}

// ---------------------------------------------------------------------------
// Demo data for other tabs
// ---------------------------------------------------------------------------

const demoDelegations = [
  { id: "del-1", delegator: "Rajesh Kumar", delegatee: "Priya Sharma", from: "2026-02-20", to: "2026-03-05", amountLimit: 100000, reason: "Annual leave", isActive: true },
  { id: "del-2", delegator: "Deepa Nair", delegatee: "Vikram Singh", from: "2026-02-25", to: "2026-02-28", amountLimit: 25000, reason: "Business travel", isActive: true },
  { id: "del-3", delegator: "Kavitha Reddy", delegatee: "Suresh Menon", from: "2026-01-15", to: "2026-01-31", amountLimit: 50000, reason: "Medical leave", isActive: false },
];

const sodRules = [
  { id: "sod-1", rule: "Submitter cannot approve own expenses", status: "ACTIVE", violations: 0 },
  { id: "sod-2", rule: "Same person cannot be requester and final approver", status: "ACTIVE", violations: 0 },
  { id: "sod-3", rule: "Finance controller cannot approve own department expenses", status: "ACTIVE", violations: 2 },
  { id: "sod-4", rule: "Delegation cannot create circular approval chain", status: "ACTIVE", violations: 0 },
];

// ---------------------------------------------------------------------------
// Empty form state
// ---------------------------------------------------------------------------

function emptyForm(): Omit<ApprovalChainRule, "id"> {
  return {
    name: "",
    amountMin: 0,
    amountMax: 0,
    category: "ALL",
    approverChain: [{ role: "DEPT_MANAGER", level: 1 }],
    isActive: true,
  };
}

// ============================================================================
// Main Component
// ============================================================================

export default function DoaPage() {
  const authorityLevels = getDoaAuthorityLevels();
  const approvalMatrix = getDoaApprovalMatrix();

  // -- Approval chain rules state --
  const [chainRules, setChainRules] = useState<ApprovalChainRule[]>([]);
  const [chainLoading, setChainLoading] = useState(true);
  const [chainSaving, setChainSaving] = useState(false);

  // Dialog state
  const [chainDialog, setChainDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<ApprovalChainRule | null>(null);
  const [form, setForm] = useState<Omit<ApprovalChainRule, "id">>(emptyForm());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // -- Fetch chain rules --
  const fetchChainRules = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/approvals/chain");
      const json = await res.json();
      setChainRules(json.data || []);
    } catch {
      // silent
    } finally {
      setChainLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChainRules();
  }, [fetchChainRules]);

  // -- Open add dialog --
  function openAddDialog() {
    setEditingRule(null);
    setForm(emptyForm());
    setChainDialog(true);
  }

  // -- Open edit dialog --
  function openEditDialog(rule: ApprovalChainRule) {
    setEditingRule(rule);
    setForm({
      name: rule.name,
      amountMin: rule.amountMin,
      amountMax: rule.amountMax,
      category: rule.category,
      approverChain: [...rule.approverChain],
      isActive: rule.isActive,
    });
    setChainDialog(true);
  }

  // -- Save (add or update) --
  async function handleSave() {
    setChainSaving(true);
    try {
      if (editingRule) {
        // Update
        const res = await fetch("/api/v1/approvals/chain", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingRule.id, ...form }),
        });
        if (res.ok) {
          const json = await res.json();
          setChainRules((prev) =>
            prev.map((r) => (r.id === editingRule.id ? json.data : r))
          );
        }
      } else {
        // Add
        const res = await fetch("/api/v1/approvals/chain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          const json = await res.json();
          setChainRules((prev) => [...prev, json.data]);
        }
      }
      setChainDialog(false);
    } catch {
      // silent
    } finally {
      setChainSaving(false);
    }
  }

  // -- Delete --
  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/v1/approvals/chain?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setChainRules((prev) => prev.filter((r) => r.id !== id));
      }
    } catch {
      // silent
    } finally {
      setDeleteConfirm(null);
    }
  }

  // -- Toggle active --
  async function handleToggleActive(rule: ApprovalChainRule) {
    try {
      const res = await fetch("/api/v1/approvals/chain", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rule.id, isActive: !rule.isActive }),
      });
      if (res.ok) {
        const json = await res.json();
        setChainRules((prev) =>
          prev.map((r) => (r.id === rule.id ? json.data : r))
        );
      }
    } catch {
      // silent
    }
  }

  // -- Chain step management --
  function addStep() {
    const nextLevel = form.approverChain.length + 1;
    // Pick first role not already in chain, or default to DEPT_MANAGER
    const usedRoles = form.approverChain.map((s) => s.role);
    const available = APPROVER_ROLES.find((r) => !usedRoles.includes(r.value));
    setForm((prev) => ({
      ...prev,
      approverChain: [
        ...prev.approverChain,
        { role: available?.value || "DEPT_MANAGER", level: nextLevel },
      ],
    }));
  }

  function removeStep(index: number) {
    setForm((prev) => ({
      ...prev,
      approverChain: prev.approverChain
        .filter((_, i) => i !== index)
        .map((step, i) => ({ ...step, level: i + 1 })),
    }));
  }

  function updateStepRole(index: number, role: string) {
    setForm((prev) => ({
      ...prev,
      approverChain: prev.approverChain.map((step, i) =>
        i === index ? { ...step, role } : step
      ),
    }));
  }

  function moveStep(index: number, direction: "up" | "down") {
    const newChain = [...form.approverChain];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newChain.length) return;
    [newChain[index], newChain[targetIndex]] = [newChain[targetIndex], newChain[index]];
    // Re-number levels
    const renumbered = newChain.map((step, i) => ({ ...step, level: i + 1 }));
    setForm((prev) => ({ ...prev, approverChain: renumbered }));
  }

  const isFormValid =
    form.name.trim().length > 0 &&
    form.approverChain.length > 0 &&
    form.amountMin >= 0 &&
    (form.amountMax === 0 || form.amountMax > form.amountMin);

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <div className="space-y-6 animate-in">
      <PageHeader title="Delegation of Authority" description="Configure approval authority levels and delegation rules">
        <Button variant="outline">
          <GitBranch className="w-4 h-4" />
          Simulate
        </Button>
        <Button>
          <Plus className="w-4 h-4" />
          Add Rule
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Layers className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold">{authorityLevels.length}</p>
                <p className="text-xs text-muted-foreground">Authority Levels</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Scale className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xl font-bold">{chainRules.filter((r) => r.isActive).length}</p>
                <p className="text-xs text-muted-foreground">Active Chains</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-xl font-bold">{demoDelegations.filter((d) => d.isActive).length}</p>
                <p className="text-xs text-muted-foreground">Active Delegations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-xl font-bold">{sodRules.length}</p>
                <p className="text-xs text-muted-foreground">SOD Rules</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="chains" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chains">Approval Chains</TabsTrigger>
          <TabsTrigger value="authority">Authority Levels</TabsTrigger>
          <TabsTrigger value="matrix">Approval Matrix</TabsTrigger>
          <TabsTrigger value="delegations">Delegations</TabsTrigger>
          <TabsTrigger value="sod">SOD Rules</TabsTrigger>
        </TabsList>

        {/* ================================================================ */}
        {/* Approval Chain Rules Tab                                         */}
        {/* ================================================================ */}
        <TabsContent value="chains" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Multi-Level Approval Chain Rules</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Define approval chains based on amount ranges and expense categories
              </p>
            </div>
            <Button size="sm" onClick={openAddDialog}>
              <Plus className="w-4 h-4" />
              New Chain Rule
            </Button>
          </div>

          {chainLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading rules...</span>
            </div>
          ) : chainRules.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Link2 className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No approval chain rules defined</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Create your first rule to define multi-level approval workflows
                </p>
                <Button size="sm" className="mt-4" onClick={openAddDialog}>
                  <Plus className="w-4 h-4" />
                  Create First Rule
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {chainRules.map((rule) => (
                <Card
                  key={rule.id}
                  className={`transition-all duration-200 hover:shadow-md ${
                    !rule.isActive ? "opacity-60" : ""
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Active indicator bar */}
                      <div
                        className={`w-1.5 self-stretch rounded-full shrink-0 ${
                          rule.isActive ? "bg-emerald-500" : "bg-muted-foreground/20"
                        }`}
                      />

                      {/* Main content */}
                      <div className="flex-1 min-w-0">
                        {/* Header row */}
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-sm">{rule.name}</h4>
                          {rule.isActive ? (
                            <Badge variant="success" className="text-[9px]">Active</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[9px]">Inactive</Badge>
                          )}
                        </div>

                        {/* Amount + Category row */}
                        <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted font-medium text-foreground">
                            {formatAmountRange(rule.amountMin, rule.amountMax)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {rule.category === "ALL"
                              ? "All Categories"
                              : EXPENSE_CATEGORIES.find((c) => c.code === rule.category)?.label || rule.category}
                          </Badge>
                        </div>

                        {/* Visual approval chain */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {rule.approverChain
                            .sort((a, b) => a.level - b.level)
                            .map((step, i) => {
                              const colors = ROLE_COLOR_MAP[step.role] || ROLE_COLOR_MAP.DEPT_MANAGER;
                              return (
                                <span key={i} className="flex items-center gap-1.5">
                                  {i > 0 && (
                                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                  )}
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${colors.bg} ${colors.text} ${colors.border}`}
                                  >
                                    <span className="w-4 h-4 rounded-full bg-white/60 dark:bg-black/20 flex items-center justify-center text-[10px] font-bold shrink-0">
                                      {step.level}
                                    </span>
                                    {getRoleBadgeLabel(step.role)}
                                  </span>
                                </span>
                              );
                            })}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title={rule.isActive ? "Deactivate" : "Activate"}
                          onClick={() => handleToggleActive(rule)}
                        >
                          {rule.isActive ? (
                            <Power className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <PowerOff className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(rule)}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeleteConfirm(rule.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Authority Levels */}
        <TabsContent value="authority" className="space-y-3">
          {authorityLevels.map((level, i) => (
            <Card key={level.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    L{i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{level.name}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>Max: {formatINRCompact(level.maxAmount)}</span>
                      <span>&middot;</span>
                      <span>Categories: {level.allowedCategories.join(", ")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Approval Matrix */}
        <TabsContent value="matrix">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Approval Rules by Amount Range</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 font-medium text-muted-foreground text-xs">Amount Range</th>
                      <th className="pb-2 font-medium text-muted-foreground text-xs">Category</th>
                      <th className="pb-2 font-medium text-muted-foreground text-xs">Required Approvers</th>
                      <th className="pb-2 font-medium text-muted-foreground text-xs w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvalMatrix.map((rule) => (
                      <tr key={rule.id} className="border-b last:border-0">
                        <td className="py-3 font-medium">{"\u20B9"}{rule.amountRange}</td>
                        <td className="py-3">
                          <Badge variant="outline" className="text-xs">{rule.category}</Badge>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1 flex-wrap">
                            {rule.approvers.split(" + ").map((approver, i) => (
                              <span key={i} className="flex items-center gap-1">
                                {i > 0 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
                                <Badge variant="secondary" className="text-xs">{approver}</Badge>
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3">
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Edit2 className="w-3 h-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delegations */}
        <TabsContent value="delegations" className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm">
              <Plus className="w-4 h-4" />
              New Delegation
            </Button>
          </div>
          {demoDelegations.map((del) => (
            <Card key={del.id} className={`transition-shadow ${del.isActive ? "hover:shadow-md" : "opacity-60"}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-12 rounded-full ${del.isActive ? "bg-emerald-500" : "bg-muted"}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{del.delegator}</span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{del.delegatee}</span>
                      {del.isActive ? (
                        <Badge variant="success" className="text-[9px]">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[9px]">Expired</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {del.from} to {del.to}
                      </span>
                      <span>&middot;</span>
                      <span>Max: {formatINRCompact(del.amountLimit)}</span>
                      <span>&middot;</span>
                      <span>{del.reason}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* SOD Rules */}
        <TabsContent value="sod" className="space-y-3">
          {sodRules.map((rule) => (
            <Card key={rule.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{rule.rule}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="success" className="text-[9px]">{rule.status}</Badge>
                      {rule.violations > 0 ? (
                        <span className="text-xs text-red-500 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {rule.violations} violations detected
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-500">No violations</span>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* ================================================================ */}
      {/* Add / Edit Chain Rule Dialog                                      */}
      {/* ================================================================ */}
      <Dialog
        open={chainDialog}
        onOpenChange={(open) => {
          if (!open) {
            setChainDialog(false);
            setEditingRule(null);
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? "Edit Approval Chain Rule" : "New Approval Chain Rule"}
            </DialogTitle>
            <DialogDescription>
              Define the amount range, category filter, and ordered approval chain for this rule.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Rule Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Rule Name</label>
              <Input
                placeholder="e.g. High-Value Travel Approvals"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    name: (e.target as HTMLInputElement).value,
                  }))
                }
              />
            </div>

            {/* Amount Range */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Amount Range (INR)</label>
              <p className="text-xs text-muted-foreground">
                Set max to 0 for unlimited upper bound
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Min</label>
                  <Input
                    type="number"
                    min={0}
                    value={form.amountMin}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        amountMin: parseInt((e.target as HTMLInputElement).value) || 0,
                      }))
                    }
                    placeholder="0"
                  />
                </div>
                <span className="text-muted-foreground mt-4">to</span>
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Max (0 = No Limit)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={form.amountMax}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        amountMax: parseInt((e.target as HTMLInputElement).value) || 0,
                      }))
                    }
                    placeholder="0"
                  />
                </div>
              </div>
              {form.amountMin >= 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Range: {formatAmountRange(form.amountMin, form.amountMax)}
                </p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Category Filter</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={form.category}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    category: (e.target as HTMLSelectElement).value,
                  }))
                }
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">
                  Only active rules are evaluated during approval routing
                </p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm((prev) => ({ ...prev, isActive: v }))}
              />
            </div>

            {/* Approver Chain Builder */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Approval Chain</label>
                  <p className="text-xs text-muted-foreground">
                    Define ordered approval steps. Expenses will route through each level sequentially.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {form.approverChain.map((step, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 rounded-lg border bg-muted/30 p-2.5"
                  >
                    {/* Step number badge */}
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {index + 1}
                    </div>

                    {/* Role dropdown */}
                    <select
                      className="flex-1 h-8 rounded-md border border-input bg-background px-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      value={step.role}
                      onChange={(e) =>
                        updateStepRole(index, (e.target as HTMLSelectElement).value)
                      }
                    >
                      {APPROVER_ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>

                    {/* Move up/down */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      disabled={index === 0}
                      onClick={() => moveStep(index, "up")}
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      disabled={index === form.approverChain.length - 1}
                      onClick={() => moveStep(index, "down")}
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </Button>

                    {/* Remove */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-destructive"
                      disabled={form.approverChain.length <= 1}
                      onClick={() => removeStep(index)}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Preview chain flow */}
              {form.approverChain.length > 0 && (
                <div className="rounded-lg border border-dashed bg-muted/20 p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-medium">
                    Chain Preview
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {form.approverChain.map((step, i) => {
                      const colors = ROLE_COLOR_MAP[step.role] || ROLE_COLOR_MAP.DEPT_MANAGER;
                      return (
                        <span key={i} className="flex items-center gap-1.5">
                          {i > 0 && (
                            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          )}
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-medium ${colors.bg} ${colors.text} ${colors.border}`}
                          >
                            <span className="text-[10px] font-bold">L{step.level}</span>
                            {getRoleBadgeLabel(step.role)}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={addStep}
                disabled={form.approverChain.length >= 4}
              >
                <Plus className="w-3.5 h-3.5" />
                Add Approval Step
                {form.approverChain.length >= 4 && (
                  <span className="text-xs text-muted-foreground ml-1">(max 4)</span>
                )}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setChainDialog(false);
                setEditingRule(null);
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={!isFormValid || chainSaving}
              onClick={handleSave}
              style={{ backgroundColor: "#0d3b66" }}
              className="hover:opacity-90"
            >
              {chainSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {editingRule ? "Update Rule" : "Create Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================================ */}
      {/* Delete Confirmation Dialog                                        */}
      {/* ================================================================ */}
      <Dialog
        open={!!deleteConfirm}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirm(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Chain Rule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this approval chain rule? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
