"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { APP_NAME, DEMO_USERS, ROLE_LABELS } from "@/lib/constants";
import { useModuleConfig } from "@/components/providers/module-config-provider";
import { toast } from "sonner";
import {
  Building2,
  Users,
  Layers,
  GitBranch,
  Palette,
  Globe,
  Bell,
  Shield,
  Mail,
  Save,
  ChevronRight,
  ToggleRight,
  ToggleLeft,
  CreditCard,
  Receipt,
  Bot,
  FileText,
  Database,
  Server,
  Webhook,
  FileUp,
  ArrowRightLeft,
  Clock,
  CheckCircle,
  Zap,
  FileStack,
  ChevronDown,
  Plus,
  X,
  Pencil,
  Tag,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface AuditLogEntry {
  id: string;
  timestamp: string;
  entityType: string;
  entityId: string;
  action: string;
  userId: string;
  userName: string;
  changes: Record<string, { old: any; new: any }> | null;
  metadata: Record<string, any> | null;
  ipAddress: string;
}

// =============================================================================
// Expense Category Manager (inline component for Modules tab)
// =============================================================================

interface ExpenseCategorySub {
  code: string;
  label: string;
  glPrefix?: string;
}

interface ExpenseCategoryItem {
  id: string;
  code: string;
  label: string;
  icon: string;
  color: string;
  isActive: boolean;
  sortOrder: number;
  subcategories: ExpenseCategorySub[];
}

function ExpenseCategoryManager() {
  const [categories, setCategories] = useState<ExpenseCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [newCatLabel, setNewCatLabel] = useState("");
  const [newSubLabel, setNewSubLabel] = useState("");
  const [newSubGl, setNewSubGl] = useState("");

  const fetchCategories = useCallback(() => {
    setLoading(true);
    fetch("/api/v1/expense-categories")
      .then((r) => r.json())
      .then((data) => {
        setCategories(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  async function toggleActive(cat: ExpenseCategoryItem) {
    const res = await fetch("/api/v1/expense-categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: cat.id, isActive: !cat.isActive }),
    });
    if (res.ok) {
      const updated = await res.json();
      setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      toast.success(`${cat.label} ${!cat.isActive ? "activated" : "deactivated"}`);
    }
  }

  async function saveEdit(cat: ExpenseCategoryItem) {
    const res = await fetch("/api/v1/expense-categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: cat.id,
        label: editLabel.trim() || cat.label,
        color: editColor.trim() || cat.color,
        icon: editIcon.trim() || cat.icon,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setEditingId(null);
      toast.success("Category updated");
    }
  }

  async function addCategory() {
    if (!newCatLabel.trim()) return;
    const code = newCatLabel.trim().toUpperCase().replace(/\s+/g, "_").slice(0, 20);
    const res = await fetch("/api/v1/expense-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, label: newCatLabel.trim(), subcategories: [] }),
    });
    if (res.ok) {
      const cat = await res.json();
      setCategories((prev) => [...prev, cat]);
      setNewCatLabel("");
      toast.success("Category added");
    }
  }

  async function addSubcategory(categoryId: string) {
    if (!newSubLabel.trim()) return;
    const code = newSubLabel.trim().toUpperCase().replace(/\s+/g, "_").slice(0, 30);
    const res = await fetch("/api/v1/expense-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "addSubcategory",
        categoryId,
        subcategory: {
          code,
          label: newSubLabel.trim(),
          glPrefix: newSubGl.trim() || undefined,
        },
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setNewSubLabel("");
      setNewSubGl("");
      toast.success("Subcategory added");
    }
  }

  async function removeSubcategory(categoryId: string, subCode: string) {
    const res = await fetch("/api/v1/expense-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "removeSubcategory", categoryId, subCode }),
    });
    if (res.ok) {
      const updated = await res.json();
      setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      toast.success("Subcategory removed");
    }
  }

  function startEdit(cat: ExpenseCategoryItem) {
    setEditingId(cat.id);
    setEditLabel(cat.label);
    setEditColor(cat.color);
    setEditIcon(cat.icon);
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Expense Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">Loading categories...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Tag className="w-4 h-4" />
          Expense Categories
        </CardTitle>
        <CardDescription className="text-xs">
          Configure categories and subcategories for expense classification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new category */}
        <div className="flex gap-2">
          <Input
            placeholder="New category name..."
            value={newCatLabel}
            onChange={(e) => setNewCatLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCategory()}
            className="h-8 text-sm flex-1"
          />
          <Button size="sm" className="h-8" onClick={addCategory} disabled={!newCatLabel.trim()}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add
          </Button>
        </div>

        {/* Category list */}
        <div className="border rounded-lg divide-y">
          {categories.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">No categories configured</p>
          )}
          {categories.map((cat) => (
            <div key={cat.id}>
              {/* Category row */}
              <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/30">
                {/* Expand toggle */}
                <button
                  onClick={() => setExpandedId(expandedId === cat.id ? null : cat.id)}
                  className="shrink-0"
                >
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground transition-transform ${
                      expandedId === cat.id ? "rotate-0" : "-rotate-90"
                    }`}
                  />
                </button>

                {/* Color dot */}
                <div
                  className="w-3 h-3 rounded-full shrink-0 border"
                  style={{ backgroundColor: cat.color || "#6b7280" }}
                />

                {/* Label (or edit mode) */}
                {editingId === cat.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <Input
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      className="h-7 text-xs flex-1"
                      placeholder="Label"
                    />
                    <Input
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      className="h-7 text-xs w-24"
                      placeholder="Color (#hex)"
                    />
                    <Input
                      value={editIcon}
                      onChange={(e) => setEditIcon(e.target.value)}
                      className="h-7 text-xs w-28"
                      placeholder="Icon name"
                    />
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => saveEdit(cat)}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-medium flex-1">{cat.label}</p>
                    <Badge variant="outline" className="text-[9px] shrink-0">
                      {cat.subcategories.length} sub
                    </Badge>
                    <button onClick={() => startEdit(cat)} className="shrink-0">
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                    </button>
                    <Switch
                      checked={cat.isActive}
                      onCheckedChange={() => toggleActive(cat)}
                    />
                  </>
                )}
              </div>

              {/* Expanded subcategories */}
              {expandedId === cat.id && (
                <div className="bg-muted/20 px-3 py-2 border-t">
                  <div className="ml-7 space-y-1.5">
                    {cat.subcategories.length === 0 && (
                      <p className="text-[11px] text-muted-foreground py-1">No subcategories</p>
                    )}
                    {cat.subcategories.map((sub) => (
                      <div
                        key={sub.code}
                        className="flex items-center gap-3 py-1 px-2 rounded hover:bg-muted/50 group"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                        <p className="text-xs flex-1">{sub.label}</p>
                        {sub.glPrefix && (
                          <Badge variant="outline" className="text-[8px] font-mono">
                            GL: {sub.glPrefix}
                          </Badge>
                        )}
                        <button
                          onClick={() => removeSubcategory(cat.id, sub.code)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        >
                          <X className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    ))}

                    {/* Add subcategory row */}
                    <div className="flex items-center gap-2 pt-1.5 border-t border-dashed mt-1.5">
                      <Input
                        placeholder="Subcategory name"
                        value={expandedId === cat.id ? newSubLabel : ""}
                        onChange={(e) => setNewSubLabel(e.target.value)}
                        className="h-7 text-xs flex-1"
                        onKeyDown={(e) => e.key === "Enter" && addSubcategory(cat.id)}
                      />
                      <Input
                        placeholder="GL Prefix"
                        value={expandedId === cat.id ? newSubGl : ""}
                        onChange={(e) => setNewSubGl(e.target.value)}
                        className="h-7 text-xs w-28"
                        onKeyDown={(e) => e.key === "Enter" && addSubcategory(cat.id)}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => addSubcategory(cat.id)}
                        disabled={!newSubLabel.trim()}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const { config: modules, updateConfig } = useModuleConfig();
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const fetchAuditLogs = useCallback(() => {
    setAuditLoading(true);
    fetch("/api/v1/audit?limit=50")
      .then((res) => res.json())
      .then((data) => setAuditLogs(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setAuditLoading(false));
  }, []);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  return (
    <div className="space-y-6 animate-in">
      <PageHeader title="Settings" description="Manage your organization settings and preferences">
        <Button onClick={() => toast.success("Settings saved successfully")}>
          <Save className="w-4 h-4" />
          Save Changes
        </Button>
      </PageHeader>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="users">Users & Roles</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Organization Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Organization Name</label>
                  <Input defaultValue="Bharat Financial Services" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Legal Name</label>
                  <Input defaultValue="Bharat Financial Services India Private Limited" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">PAN</label>
                  <Input defaultValue="AABCU9603R" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">CIN</label>
                  <Input defaultValue="U65100MH2020PTC123456" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Base Currency</label>
                  <Input defaultValue="INR (₹)" disabled />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Financial Year</label>
                  <Input defaultValue="April - March" disabled />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Branding
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Platform Name</label>
                  <Input defaultValue={APP_NAME} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Primary Color</label>
                  <div className="flex gap-2">
                    <Input defaultValue="#9C1D26" className="flex-1" />
                    <div className="w-10 h-10 rounded-md bg-[#9C1D26] border" />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Logo</label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <CreditCard className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">Drag & drop logo or click to upload</p>
                  <p className="text-[10px] text-muted-foreground mt-1">PNG, SVG (max 1MB)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Modules */}
        <TabsContent value="modules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Module Configuration</CardTitle>
              <CardDescription className="text-xs">Enable or disable modules for your organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {[
                { key: "cardPortal", label: "Card Portal", desc: "Corporate card issuance, controls, and transaction management", icon: CreditCard },
                { key: "expenseManagement", label: "Expense Management", desc: "Expense creation, reports, and approval workflows", icon: Receipt },
                { key: "ocrReceipts", label: "Receipt OCR", desc: "Automatic receipt scanning and data extraction", icon: FileText },
                { key: "aiAssistant", label: "AI Expense Assistant", desc: "Intelligent chatbot for expense submission and queries", icon: Bot },
                { key: "mileageTracking", label: "Mileage Tracking", desc: "GPS-based mileage calculation for reimbursement", icon: Globe },
                { key: "perDiem", label: "Per Diem", desc: "Automatic per diem allowance calculation by city tier", icon: Building2 },
                { key: "teamsIntegration", label: "Microsoft Teams Integration", desc: "Submit and approve expenses from Teams", icon: Users },
                { key: "apExport", label: "AP Export", desc: "Export to Tally, SAP, or custom AP systems", icon: Layers },
                { key: "virtualCardIssuance", label: "Virtual Card Issuance", desc: "Instant virtual card creation for employees (single-use and recurring)", icon: CreditCard },
                { key: "rbiLrs", label: "RBI LRS Compliance", desc: "Liberalised Remittance Scheme tracking for international card spends", icon: Globe },
                { key: "gstCompliance", label: "GST Compliance", desc: "GSTIN validation, HSN/SAC lookup, CGST/SGST/IGST auto-calculation", icon: Receipt },
              ].map((mod) => (
                <div key={mod.key} className="flex items-center gap-4 py-3 px-2 rounded-md hover:bg-muted/50">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <mod.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{mod.label}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{mod.desc}</p>
                  </div>
                  <button
                    onClick={() => {
                      const k = mod.key as keyof typeof modules;
                      const newVal = !modules[k];
                      // Prevent turning off both core modules
                      if (!newVal && (k === "cardPortal" || k === "expenseManagement")) {
                        const other = k === "cardPortal" ? modules.expenseManagement : modules.cardPortal;
                        if (!other) {
                          toast.error("At least one core module (Card Portal or Expense Management) must be enabled");
                          return;
                        }
                      }
                      updateConfig({ [k]: newVal });
                      toast.success(`${mod.label} ${newVal ? "enabled" : "disabled"}`);
                    }}
                    className="shrink-0"
                  >
                    {modules[mod.key as keyof typeof modules] ? (
                      <ToggleRight className="w-8 h-8 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-muted-foreground" />
                    )}
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Payment Processing Mode — only when Expense Management is ON */}
          {modules.expenseManagement && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Payment Processing Mode
                </CardTitle>
                <CardDescription className="text-xs">
                  Choose how reimbursement payments are processed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <button
                  onClick={() => {
                    updateConfig({ paymentMode: "REALTIME" });
                    toast.success("Payment mode set to Real-time API");
                  }}
                  className={`w-full flex items-start gap-4 p-4 rounded-lg border-2 transition-colors text-left ${
                    modules.paymentMode === "REALTIME"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    modules.paymentMode === "REALTIME" ? "bg-primary/10" : "bg-muted"
                  }`}>
                    <Zap className={`w-5 h-5 ${modules.paymentMode === "REALTIME" ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">Real-time API</p>
                      {modules.paymentMode === "REALTIME" && (
                        <Badge variant="success" className="text-[9px]">Active</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Process reimbursements instantly via bank API integration (NEFT/RTGS/IMPS)
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                    modules.paymentMode === "REALTIME" ? "border-primary" : "border-muted-foreground/30"
                  }`}>
                    {modules.paymentMode === "REALTIME" && (
                      <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    )}
                  </div>
                </button>

                <button
                  onClick={() => {
                    updateConfig({ paymentMode: "BATCH" });
                    toast.success("Payment mode set to Batch File");
                  }}
                  className={`w-full flex items-start gap-4 p-4 rounded-lg border-2 transition-colors text-left ${
                    modules.paymentMode === "BATCH"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    modules.paymentMode === "BATCH" ? "bg-primary/10" : "bg-muted"
                  }`}>
                    <FileStack className={`w-5 h-5 ${modules.paymentMode === "BATCH" ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">Batch File</p>
                      {modules.paymentMode === "BATCH" && (
                        <Badge variant="success" className="text-[9px]">Active</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Generate NEFT payment files for bulk processing through bank portal
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                    modules.paymentMode === "BATCH" ? "border-primary" : "border-muted-foreground/30"
                  }`}>
                    {modules.paymentMode === "BATCH" && (
                      <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    )}
                  </div>
                </button>
              </CardContent>
            </Card>
          )}

          {/* Expense Categories — only when Expense Management is ON */}
          {modules.expenseManagement && (
            <ExpenseCategoryManager />
          )}
        </TabsContent>

        {/* Users */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Users
                </CardTitle>
                <Button size="sm">
                  <Mail className="w-4 h-4" />
                  Invite User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {DEMO_USERS.map((user) => (
                  <div key={user.email} className="flex items-center gap-4 py-2 px-2 rounded-md hover:bg-muted/50">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                      {user.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS]}
                    </Badge>
                    <Badge variant="success" className="text-[9px]">Active</Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Role Permissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left pb-2 font-medium text-muted-foreground">Permission</th>
                      <th className="pb-2 font-medium text-muted-foreground text-center">Admin</th>
                      <th className="pb-2 font-medium text-muted-foreground text-center">Finance</th>
                      <th className="pb-2 font-medium text-muted-foreground text-center">Manager</th>
                      <th className="pb-2 font-medium text-muted-foreground text-center">Employee</th>
                      <th className="pb-2 font-medium text-muted-foreground text-center">Auditor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { perm: "Manage hierarchy", admin: true, finance: false, manager: false, employee: false, auditor: false },
                      { perm: "Issue cards", admin: true, finance: true, manager: false, employee: false, auditor: false },
                      { perm: "View all transactions", admin: true, finance: true, manager: true, employee: false, auditor: true },
                      { perm: "Submit expenses", admin: true, finance: true, manager: true, employee: true, auditor: false },
                      { perm: "Approve expenses", admin: true, finance: true, manager: true, employee: false, auditor: false },
                      { perm: "Configure policies", admin: true, finance: true, manager: false, employee: false, auditor: false },
                      { perm: "View reports", admin: true, finance: true, manager: true, employee: false, auditor: true },
                      { perm: "Manage DOA", admin: true, finance: true, manager: false, employee: false, auditor: false },
                      { perm: "Process reimbursements", admin: true, finance: true, manager: false, employee: false, auditor: false },
                      { perm: "View audit trail", admin: true, finance: false, manager: false, employee: false, auditor: true },
                    ].map((row) => (
                      <tr key={row.perm} className="border-b last:border-0">
                        <td className="py-2 font-medium">{row.perm}</td>
                        {[row.admin, row.finance, row.manager, row.employee, row.auditor].map((val, i) => (
                          <td key={i} className="py-2 text-center">
                            {val ? "✓" : "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations" className="space-y-6">
          {/* TSYS PRIME — Card Management System */}
          <Card className="border-blue-200 dark:border-blue-900">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                    <Server className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-medium">TSYS PRIME</CardTitle>
                    <CardDescription className="text-xs">Card Management System — Authorization, Settlement, Statements</CardDescription>
                  </div>
                </div>
                <Badge variant="success" className="text-[9px]">Connected</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Real-Time Integration */}
                <div className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Webhook className="w-4 h-4 text-emerald-500" />
                    <p className="text-xs font-medium">Real-Time (Webhook)</p>
                    <Badge variant="success" className="text-[8px] ml-auto">Active</Badge>
                  </div>
                  <div className="space-y-1 text-[11px] text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Authorization events</span>
                      <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500" />Live</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Decline notifications</span>
                      <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500" />Live</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Card status changes</span>
                      <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500" />Live</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fraud alerts</span>
                      <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500" />Live</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground border-t pt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Last event: 2 minutes ago
                  </div>
                </div>
                {/* Batch Integration */}
                <div className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <FileUp className="w-4 h-4 text-blue-500" />
                    <p className="text-xs font-medium">Batch (File Import)</p>
                    <Badge variant="success" className="text-[8px] ml-auto">Active</Badge>
                  </div>
                  <div className="space-y-1 text-[11px] text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Settlement file (daily)</span>
                      <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500" />OK</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Statement file (monthly)</span>
                      <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500" />OK</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Chargeback file (daily)</span>
                      <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500" />OK</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Card inventory file (weekly)</span>
                      <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500" />OK</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground border-t pt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Last batch: Today 06:00 AM IST
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  <ArrowRightLeft className="w-3 h-3" />
                  Test Connection
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs">Configure Endpoints</Button>
                <Button variant="outline" size="sm" className="h-7 text-xs">View Logs</Button>
              </div>
            </CardContent>
          </Card>

          {/* Oracle EBS — AP Connectivity */}
          <Card className="border-orange-200 dark:border-orange-900">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                    <Database className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-medium">Oracle E-Business Suite (EBS)</CardTitle>
                    <CardDescription className="text-xs">AP Connectivity — Invoice Import, Payment Export, GL Journal</CardDescription>
                  </div>
                </div>
                <Badge variant="success" className="text-[9px]">Connected</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: "AP Invoice Import", desc: "Expense reports → AP invoices", status: "Active", lastSync: "1 hour ago" },
                  { label: "Payment Export", desc: "Reimbursements → AP payments", status: "Active", lastSync: "2 hours ago" },
                  { label: "GL Journal Export", desc: "Cost center → GL account mapping", status: "Active", lastSync: "Daily 11PM" },
                ].map((flow) => (
                  <div key={flow.label} className="border rounded-lg p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium">{flow.label}</p>
                      <Badge variant="success" className="text-[8px]">{flow.status}</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{flow.desc}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> Last sync: {flow.lastSync}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  <ArrowRightLeft className="w-3 h-3" />
                  Test Connection
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs">Field Mapping</Button>
                <Button variant="outline" size="sm" className="h-7 text-xs">View Sync History</Button>
              </div>
            </CardContent>
          </Card>

          {/* Other Integrations */}
          <div>
            <h3 className="text-sm font-medium mb-3">Other Integrations</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { name: "Card Network (MC CDF)", desc: "Mastercard CDF 3.0 data feed", status: "Connected", icon: CreditCard },
                { name: "Card Network (Visa VCF)", desc: "Visa VCF 4.0 data feed", status: "Connected", icon: CreditCard },
                { name: "Microsoft Teams", desc: "Submit & approve expenses in Teams", status: "Connected", icon: Users },
                { name: "Tally Prime", desc: "Export vouchers to Tally Prime", status: "Available", icon: FileText },
                { name: "Slack", desc: "Notifications and approval actions", status: "Available", icon: Bell },
                { name: "HRMS (SuccessFactors)", desc: "Employee data sync", status: "Available", icon: Users },
              ].map((integration) => (
                <Card key={integration.name} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <integration.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{integration.name}</p>
                          <Badge
                            variant={integration.status === "Connected" ? "success" : "outline"}
                            className="text-[9px]"
                          >
                            {integration.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{integration.desc}</p>
                        <Button
                          variant={integration.status === "Connected" ? "outline" : "default"}
                          size="sm"
                          className="mt-2 h-7 text-xs"
                        >
                          {integration.status === "Connected" ? "Configure" : "Connect"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {[
                  { event: "Expense submitted for approval", email: true, push: true, teams: true },
                  { event: "Expense approved/rejected", email: true, push: true, teams: true },
                  { event: "Card transaction alert", email: false, push: true, teams: false },
                  { event: "Policy violation detected", email: true, push: true, teams: false },
                  { event: "Reimbursement processed", email: true, push: true, teams: false },
                  { event: "Card limit approaching (80%)", email: true, push: true, teams: false },
                  { event: "Approval SLA approaching", email: true, push: false, teams: true },
                  { event: "Receipt reminder", email: false, push: true, teams: false },
                ].map((notif) => (
                  <div key={notif.event} className="flex items-center gap-4 py-2.5 px-2 rounded-md hover:bg-muted/50">
                    <p className="flex-1 text-sm">{notif.event}</p>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <input type="checkbox" defaultChecked={notif.email} className="rounded" />
                        Email
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <input type="checkbox" defaultChecked={notif.push} className="rounded" />
                        Push
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <input type="checkbox" defaultChecked={notif.teams} className="rounded" />
                        Teams
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Trail */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <GitBranch className="w-4 h-4" />
                    Audit Trail
                  </CardTitle>
                  <CardDescription className="text-xs">Complete history of all actions in the system</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={fetchAuditLogs}>
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {auditLoading ? (
                <p className="text-sm text-muted-foreground text-center py-8">Loading audit logs...</p>
              ) : auditLogs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left pb-2 font-medium text-muted-foreground">Timestamp</th>
                        <th className="text-left pb-2 font-medium text-muted-foreground">Entity Type</th>
                        <th className="text-left pb-2 font-medium text-muted-foreground">Entity ID</th>
                        <th className="text-left pb-2 font-medium text-muted-foreground">Action</th>
                        <th className="text-left pb-2 font-medium text-muted-foreground">User</th>
                        <th className="text-left pb-2 font-medium text-muted-foreground">Changes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="py-2 pr-3 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </td>
                          <td className="py-2 pr-3">
                            <Badge variant="outline" className="text-[9px]">{log.entityType}</Badge>
                          </td>
                          <td className="py-2 pr-3 font-mono text-[10px]">{log.entityId}</td>
                          <td className="py-2 pr-3">
                            <Badge
                              variant={
                                log.action === "CREATE" ? "success"
                                  : log.action === "APPROVE" ? "success"
                                  : log.action === "REJECT" ? "destructive"
                                  : "outline"
                              }
                              className="text-[9px]"
                            >
                              {log.action}
                            </Badge>
                          </td>
                          <td className="py-2 pr-3">{log.userName}</td>
                          <td className="py-2 max-w-[200px] truncate text-muted-foreground">
                            {log.changes
                              ? Object.entries(log.changes)
                                  .map(([k, v]) => `${k}: ${JSON.stringify(v.old)} → ${JSON.stringify(v.new)}`)
                                  .join(", ")
                              : log.metadata
                                ? Object.entries(log.metadata)
                                    .map(([k, v]) => `${k}: ${v}`)
                                    .join(", ")
                                : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No audit log entries yet. Actions performed in the system will appear here.
                  </p>
                  {/* Fallback demo data for initial display */}
                  {[
                    { action: "Card frozen", entity: "Card *1005", user: "Rajesh Kumar", role: "System Admin", time: "2 min ago", type: "CARD" },
                    { action: "Expense approved", entity: "EXP-2026-0003", user: "Deepa Nair", role: "Dept Manager", time: "15 min ago", type: "APPROVAL" },
                    { action: "Policy updated", entity: "Meal Expense Cap", user: "Arun Patel", role: "Finance Controller", time: "1 hour ago", type: "POLICY" },
                    { action: "Employee onboarded", entity: "Rahul Verma (BFS009)", user: "Priya Sharma", role: "Company Admin", time: "2 hours ago", type: "EMPLOYEE" },
                    { action: "Report submitted", entity: "EXP-2026-0005", user: "Vikram Singh", role: "Employee", time: "3 hours ago", type: "REPORT" },
                    { action: "Card limit changed", entity: "Card *1003", user: "Arun Patel", role: "Finance Controller", time: "5 hours ago", type: "CARD" },
                    { action: "DOA delegation created", entity: "Rajesh to Priya", user: "Rajesh Kumar", role: "System Admin", time: "1 day ago", type: "DOA" },
                    { action: "Reimbursement processed", entity: "EXP-2026-0001", user: "Arun Patel", role: "Finance Controller", time: "1 day ago", type: "PAYMENT" },
                  ].map((log, i) => (
                    <div key={i} className="flex items-center gap-3 py-1.5">
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">{log.action}</span>
                          {" — "}
                          <span className="text-muted-foreground">{log.entity}</span>
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{log.user}</span>
                          <Badge variant="outline" className="text-[8px]">{log.role}</Badge>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge variant="outline" className="text-[9px]">{log.type}</Badge>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{log.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
