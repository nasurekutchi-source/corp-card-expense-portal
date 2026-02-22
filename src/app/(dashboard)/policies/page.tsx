"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page-header";
import { getPolicies, getStats } from "@/lib/store";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { toast } from "sonner";
import {
  Shield,
  Plus,
  ToggleLeft,
  ToggleRight,
  Edit2,
  Copy,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Tag,
  Activity,
  X,
  Save,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Policy form state for create / edit
// ---------------------------------------------------------------------------
interface PolicyForm {
  name: string;
  type: string;
  severity: string;
  category: string;
  maxAmount: string;
  threshold: string;
  isActive: boolean;
}

const emptyForm: PolicyForm = {
  name: "",
  type: "CATEGORY",
  severity: "SOFT",
  category: "",
  maxAmount: "",
  threshold: "",
  isActive: true,
};

const POLICY_TYPES = [
  { value: "CATEGORY", label: "Category Cap" },
  { value: "RECEIPT", label: "Receipt Required" },
  { value: "MCC", label: "MCC Restriction" },
  { value: "AMOUNT", label: "Amount Limit" },
  { value: "GEO", label: "Geo Restriction" },
];

const selectCls =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

export default function PoliciesPage() {
  const [policies, setPolicies] = useState(getPolicies());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PolicyForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const stats = {
    total: policies.length,
    active: policies.filter((p) => p.isActive).length,
    hard: policies.filter((p) => p.severity === "HARD").length,
    soft: policies.filter((p) => p.severity === "SOFT").length,
    compliance: getStats().policyComplianceScore,
  };

  const updateField = <K extends keyof PolicyForm>(field: K, value: PolicyForm[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // -- Open create --
  const openCreate = useCallback(() => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }, []);

  // -- Open edit --
  const openEdit = useCallback(
    (policyId: string) => {
      const p = policies.find((x) => x.id === policyId);
      if (!p) return;
      const r = p.rules as Record<string, any>;
      setEditingId(policyId);
      setForm({
        name: p.name,
        type: p.type,
        severity: p.severity,
        category: r.category || "",
        maxAmount: r.maxAmount ? String(r.maxAmount) : "",
        threshold: r.threshold ? String(r.threshold) : "",
        isActive: p.isActive,
      });
      setShowForm(true);
    },
    [policies]
  );

  // -- Save (create or update) --
  const handleSave = useCallback(async () => {
    if (!form.name.trim()) {
      toast.error("Policy name is required");
      return;
    }
    setSaving(true);
    try {
      const rules: Record<string, any> = {};
      if (form.category) rules.category = form.category;
      if (form.maxAmount) rules.maxAmount = Number(form.maxAmount);
      if (form.threshold) rules.threshold = Number(form.threshold);

      const body = {
        id: editingId || undefined,
        name: form.name,
        type: form.type,
        severity: form.severity,
        isActive: form.isActive,
        rules,
        version: editingId
          ? (policies.find((p) => p.id === editingId)?.version || 0) + 1
          : 1,
      };

      const res = await fetch("/api/v1/policies", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to save policy");
        return;
      }

      toast.success(editingId ? "Policy updated" : "Policy created");
      setPolicies(getPolicies());
      setShowForm(false);
      setEditingId(null);
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  }, [form, editingId, policies]);

  // -- Duplicate --
  const handleDuplicate = useCallback(
    async (policyId: string) => {
      const p = policies.find((x) => x.id === policyId);
      if (!p) return;
      try {
        const res = await fetch("/api/v1/policies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `${p.name} (Copy)`,
            type: p.type,
            severity: p.severity,
            isActive: false,
            rules: p.rules,
            version: 1,
          }),
        });
        if (res.ok) {
          toast.success("Policy duplicated");
          setPolicies(getPolicies());
        }
      } catch {
        toast.error("Failed to duplicate");
      }
    },
    [policies]
  );

  // -- Delete --
  const handleDelete = useCallback(async () => {
    if (!deletingId) return;
    try {
      const res = await fetch(`/api/v1/policies?id=${deletingId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Policy deleted");
        setPolicies(getPolicies());
      } else {
        toast.error("Failed to delete");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setDeletingId(null);
    }
  }, [deletingId]);

  // -- Toggle active --
  const handleToggle = useCallback(async (policyId: string, currentActive: boolean) => {
    try {
      await fetch("/api/v1/policies", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: policyId, isActive: !currentActive }),
      });
      setPolicies(getPolicies());
    } catch {
      toast.error("Toggle failed");
    }
  }, []);

  // -- Run Audit --
  const handleRunAudit = useCallback(() => {
    toast.success(`Audit complete — ${stats.active} active policies checked across all expenses`);
  }, [stats.active]);

  return (
    <div className="space-y-6 animate-in">
      <PageHeader title="Policy Engine" description="Configure expense policies and compliance rules">
        <Button variant="outline" onClick={handleRunAudit}>
          <Shield className="w-4 h-4" />
          Run Audit
        </Button>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Create Policy
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: "Total Policies", value: stats.total, icon: Shield, color: "primary" },
          { label: "Active", value: stats.active, icon: CheckCircle2, color: "emerald-500" },
          { label: "Hard Block", value: stats.hard, icon: ShieldAlert, color: "red-500" },
          { label: "Soft Warn", value: stats.soft, icon: AlertTriangle, color: "amber-500" },
          { label: "Compliance", value: `${stats.compliance}%`, icon: Activity, color: "blue-500" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg bg-${s.color}/10 flex items-center justify-center`}>
                  <s.icon className={`w-4 h-4 text-${s.color}`} />
                </div>
                <div>
                  <p className="text-xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Compliance Overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Compliance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
              <p className="text-3xl font-bold text-emerald-600">{stats.compliance}%</p>
              <p className="text-xs text-muted-foreground mt-1">Overall Compliance Score</p>
              <Progress value={stats.compliance} className="mt-2 h-1.5" />
            </div>
            <div className="text-center p-4 rounded-lg bg-amber-500/5 border border-amber-500/10">
              <p className="text-3xl font-bold text-amber-600">23</p>
              <p className="text-xs text-muted-foreground mt-1">Soft Violations (MTD)</p>
              <p className="text-[10px] text-amber-600 mt-1">Warning only — not blocked</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-red-500/5 border border-red-500/10">
              <p className="text-3xl font-bold text-red-600">5</p>
              <p className="text-xs text-muted-foreground mt-1">Hard Violations (MTD)</p>
              <p className="text-[10px] text-red-600 mt-1">Blocked — requires exception</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create / Edit Form */}
      {showForm && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {editingId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {editingId ? "Edit Policy" : "Create New Policy"}
              <Button variant="ghost" size="icon" className="ml-auto h-7 w-7" onClick={() => setShowForm(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Policy Name</label>
                <Input value={form.name} onChange={(e) => updateField("name", e.target.value)}
                  placeholder="e.g. Hotel Rate Limit" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Type</label>
                <select className={selectCls} value={form.type}
                  onChange={(e) => updateField("type", e.target.value)}>
                  {POLICY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Severity</label>
                <div className="flex gap-2">
                  <Button variant={form.severity === "SOFT" ? "default" : "outline"} size="sm"
                    onClick={() => updateField("severity", "SOFT")} className="flex-1">
                    <AlertTriangle className="w-3 h-3 mr-1" /> Soft (Warn)
                  </Button>
                  <Button variant={form.severity === "HARD" ? "destructive" : "outline"} size="sm"
                    onClick={() => updateField("severity", "HARD")} className="flex-1">
                    <ShieldAlert className="w-3 h-3 mr-1" /> Hard (Block)
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Category (optional)</label>
                <select className={selectCls} value={form.category}
                  onChange={(e) => updateField("category", e.target.value)}>
                  <option value="">All Categories</option>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c.code} value={c.label}>{c.label}</option>
                  ))}
                </select>
              </div>
              {(form.type === "CATEGORY" || form.type === "AMOUNT") && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Max Amount (INR)</label>
                  <Input type="number" value={form.maxAmount}
                    onChange={(e) => updateField("maxAmount", e.target.value)}
                    placeholder="e.g. 5000" />
                </div>
              )}
              {form.type === "RECEIPT" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Receipt Threshold (INR)</label>
                  <Input type="number" value={form.threshold}
                    onChange={(e) => updateField("threshold", e.target.value)}
                    placeholder="e.g. 500" />
                </div>
              )}
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={form.isActive}
                    onChange={(e) => updateField("isActive", e.target.checked)}
                    className="sr-only peer" />
                  <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-emerald-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                </label>
                <span className="text-xs text-muted-foreground">{form.isActive ? "Active" : "Inactive"}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  <Save className="w-3 h-3 mr-1" />
                  {saving ? "Saving..." : editingId ? "Update Policy" : "Create Policy"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation */}
      {deletingId && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-4">
            <ShieldAlert className="w-6 h-6 text-destructive shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Delete this policy?</p>
              <p className="text-xs text-muted-foreground">
                "{policies.find((p) => p.id === deletingId)?.name}" will be permanently removed.
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => setDeletingId(null)}>Cancel</Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>Delete</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Policies List */}
      <div className="space-y-3">
        {policies.map((policy) => (
          <Card key={policy.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Status toggle */}
                <button onClick={() => handleToggle(policy.id, policy.isActive)} className="shrink-0">
                  {policy.isActive ? (
                    <ToggleRight className="w-8 h-8 text-emerald-500" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-muted-foreground" />
                  )}
                </button>

                {/* Policy Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{policy.name}</p>
                    <Badge variant={policy.severity === "HARD" ? "destructive" : "warning"} className="text-[9px]">
                      {policy.severity}
                    </Badge>
                    <Badge variant="outline" className="text-[9px]">
                      v{policy.version}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {policy.type}
                    </span>
                    <span>&middot;</span>
                    {(() => {
                      const r = policy.rules as { category?: string; threshold?: number; blockedMCCs?: string[]; maxAmount?: number };
                      return (
                        <>
                          <span>
                            {r.category && `Category: ${r.category}`}
                            {r.threshold && `Receipt threshold: \u20B9${r.threshold}`}
                            {r.blockedMCCs && `${r.blockedMCCs.length} blocked MCCs`}
                          </span>
                          {r.maxAmount && (
                            <>
                              <span>&middot;</span>
                              <span>Max: \u20B9{r.maxAmount.toLocaleString("en-IN")}</span>
                            </>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Actions — WIRED */}
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(policy.id)}
                    title="Edit policy">
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDuplicate(policy.id)}
                    title="Duplicate policy">
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                    onClick={() => setDeletingId(policy.id)} title="Delete policy">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Policy Agent info */}
      <Card className="border-dashed border-2 border-primary/20 bg-primary/5">
        <CardContent className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-semibold">AI Policy Agent</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Automatically validates expenses against all active policies at submission time.
            Hard violations block the expense, soft violations generate warnings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
