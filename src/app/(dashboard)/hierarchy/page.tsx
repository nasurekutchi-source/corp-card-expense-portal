"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { Progress } from "@/components/ui/progress";
import { AssignEmployeesTab } from "@/components/hierarchy/assign-employees-tab";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  getBankInstitutions,
  getPrograms,
  getCompanies,
  getDivisions,
  getDepartments,
  getCostCenters,
} from "@/lib/store";
import { formatINRCompact } from "@/lib/utils";
import {
  Network,
  Plus,
  Search,
  ChevronRight,
  ChevronDown,
  Building2,
  Landmark,
  CreditCard,
  Layers,
  Users,
  IndianRupee,
  Edit2,
  Loader2,
  FolderTree,
  Info,
  UserPlus,
} from "lucide-react";

// =============================================================================
// Types
// =============================================================================

type NodeType = "bank" | "program" | "company" | "division" | "department" | "costcenter";

interface TreeNode {
  id: string;
  name: string;
  code?: string;
  type: NodeType;
  level: number;
  budget?: number;
  utilized?: number;
  children?: TreeNode[];
  // Company fields
  legalName?: string;
  pan?: string;
  cin?: string;
  gstin?: string;
  baseCurrency?: string;
  // Program fields
  description?: string;
  status?: string;
  // Cost center fields
  glCode?: string;
  // Department fields
  glCodePrefix?: string;
  // Linking
  parentId?: string;
}

interface NodeFormData {
  name: string;
  code: string;
  type: NodeType;
  parentId: string;
  // Company fields
  legalName: string;
  pan: string;
  cin: string;
  gstin: string;
  baseCurrency: string;
  // Program fields
  description: string;
  // Division/Department/Cost Center fields
  budget: string;
  glCodePrefix: string;
  glCode: string;
}

const EMPTY_FORM: NodeFormData = {
  name: "",
  code: "",
  type: "bank",
  parentId: "",
  legalName: "",
  pan: "",
  cin: "",
  gstin: "",
  baseCurrency: "INR",
  description: "",
  budget: "",
  glCodePrefix: "",
  glCode: "",
};

// =============================================================================
// 6-Level Hierarchy Configuration
// =============================================================================

const HIERARCHY_LEVELS: Record<NodeType, { level: number; label: string; apiType: string; childType: NodeType | null; parentType: NodeType | null }> = {
  bank:       { level: 1, label: "Bank/Institution",  apiType: "bank",       childType: "program",    parentType: null },
  program:    { level: 2, label: "Program",            apiType: "program",    childType: "company",    parentType: "bank" },
  company:    { level: 3, label: "Company",            apiType: "company",    childType: "division",   parentType: "program" },
  division:   { level: 4, label: "Division",           apiType: "division",   childType: "department", parentType: "company" },
  department: { level: 5, label: "Department",         apiType: "department", childType: "costcenter", parentType: "division" },
  costcenter: { level: 6, label: "Cost Center",        apiType: "costCenter", childType: null,         parentType: "department" },
};

const LEVEL_COLORS: Record<NodeType, string> = {
  bank:       "bg-slate-500/10 text-slate-700",
  program:    "bg-indigo-500/10 text-indigo-600",
  company:    "bg-blue-500/10 text-blue-600",
  division:   "bg-purple-500/10 text-purple-600",
  department: "bg-amber-500/10 text-amber-600",
  costcenter: "bg-emerald-500/10 text-emerald-600",
};

const LEVEL_BADGE_COLORS: Record<NodeType, string> = {
  bank:       "bg-slate-100 text-slate-700 border-slate-200",
  program:    "bg-indigo-100 text-indigo-700 border-indigo-200",
  company:    "bg-blue-100 text-blue-700 border-blue-200",
  division:   "bg-purple-100 text-purple-700 border-purple-200",
  department: "bg-amber-100 text-amber-700 border-amber-200",
  costcenter: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const LEVEL_ICONS: Record<NodeType, React.ElementType> = {
  bank:       Landmark,
  program:    CreditCard,
  company:    Building2,
  division:   Layers,
  department: Users,
  costcenter: IndianRupee,
};

// =============================================================================
// Build Tree
// =============================================================================

function buildTree(): TreeNode[] {
  const banks = getBankInstitutions();
  const programs = getPrograms();
  const companies = getCompanies();
  const divisions = getDivisions();
  const departments = getDepartments();
  const costCenters = getCostCenters();

  return banks.map((bank) => ({
    id: bank.id,
    name: bank.name,
    code: bank.code,
    type: "bank" as const,
    level: 1,
    status: bank.status,
    children: programs
      .filter((p) => p.bankId === bank.id)
      .map((prog) => ({
        id: prog.id,
        name: prog.name,
        code: prog.code,
        type: "program" as const,
        level: 2,
        description: prog.description,
        status: prog.status,
        parentId: bank.id,
        children: companies
          .filter((c) => c.programId === prog.id)
          .map((comp) => ({
            id: comp.id,
            name: comp.name,
            type: "company" as const,
            level: 3,
            legalName: comp.legalName,
            pan: comp.pan,
            cin: comp.cin,
            gstin: comp.gstin,
            baseCurrency: comp.baseCurrency,
            parentId: prog.id,
            children: divisions
              .filter((d) => d.companyId === comp.id)
              .map((div) => ({
                id: div.id,
                name: div.name,
                code: div.code,
                type: "division" as const,
                level: 4,
                budget: div.budget,
                parentId: comp.id,
                children: departments
                  .filter((dept) => dept.divisionId === div.id)
                  .map((dept) => ({
                    id: dept.id,
                    name: dept.name,
                    code: dept.code,
                    type: "department" as const,
                    level: 5,
                    budget: dept.budget,
                    glCodePrefix: dept.glCodePrefix,
                    parentId: div.id,
                    children: costCenters
                      .filter((cc) => cc.departmentId === dept.id)
                      .map((cc) => ({
                        id: cc.id,
                        name: cc.name,
                        code: cc.code,
                        type: "costcenter" as const,
                        level: 6,
                        budget: cc.budget,
                        utilized: cc.utilized,
                        glCode: cc.glCode,
                        parentId: dept.id,
                      })),
                  })),
              })),
          })),
      })),
  }));
}

// =============================================================================
// Flatten tree for parent selection
// =============================================================================

function flattenTree(nodes: TreeNode[], depth = 0): { node: TreeNode; depth: number }[] {
  const result: { node: TreeNode; depth: number }[] = [];
  for (const node of nodes) {
    result.push({ node, depth });
    if (node.children) {
      result.push(...flattenTree(node.children, depth + 1));
    }
  }
  return result;
}

// =============================================================================
// Search / filter helpers
// =============================================================================

function nodeMatchesSearch(node: TreeNode, query: string): boolean {
  const q = query.toLowerCase();
  return (
    node.name.toLowerCase().includes(q) ||
    (node.code?.toLowerCase().includes(q) ?? false) ||
    HIERARCHY_LEVELS[node.type].label.toLowerCase().includes(q) ||
    (node.gstin?.toLowerCase().includes(q) ?? false) ||
    (node.pan?.toLowerCase().includes(q) ?? false) ||
    (node.glCode?.toLowerCase().includes(q) ?? false)
  );
}

function filterTree(nodes: TreeNode[], query: string): TreeNode[] {
  if (!query.trim()) return nodes;

  return nodes
    .map((node) => {
      const childMatches = node.children ? filterTree(node.children, query) : [];
      const selfMatches = nodeMatchesSearch(node, query);

      if (selfMatches || childMatches.length > 0) {
        return {
          ...node,
          children: selfMatches ? node.children : childMatches,
        };
      }
      return null;
    })
    .filter(Boolean) as TreeNode[];
}

// =============================================================================
// Count nodes by type
// =============================================================================

function countNodes(nodes: TreeNode[]): Record<NodeType, number> {
  const counts: Record<NodeType, number> = {
    bank: 0,
    program: 0,
    company: 0,
    division: 0,
    department: 0,
    costcenter: 0,
  };

  function walk(items: TreeNode[]) {
    for (const node of items) {
      counts[node.type]++;
      if (node.children) walk(node.children);
    }
  }
  walk(nodes);
  return counts;
}

// =============================================================================
// TreeNodeComponent
// =============================================================================

function TreeNodeComponent({
  node,
  depth = 0,
  searchQuery,
  onEdit,
  onAddChild,
}: {
  node: TreeNode;
  depth?: number;
  searchQuery: string;
  onEdit: (node: TreeNode) => void;
  onAddChild: (parentNode: TreeNode) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 3 || searchQuery.length > 0);
  const hasChildren = node.children && node.children.length > 0;
  const utilPercent = node.budget && node.utilized ? Math.round((node.utilized / node.budget) * 100) : undefined;
  const config = HIERARCHY_LEVELS[node.type];
  const Icon = LEVEL_ICONS[node.type];
  const canAddChild = config.childType !== null;

  return (
    <div>
      <div
        className="flex items-center gap-2 py-2 px-2 rounded-md hover:bg-muted/50 cursor-pointer group transition-colors"
        style={{ paddingLeft: `${depth * 24 + 8}px` }}
        onClick={() => setExpanded(!expanded)}
      >
        {hasChildren ? (
          expanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          )
        ) : (
          <span className="w-4 shrink-0" />
        )}

        <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${LEVEL_COLORS[node.type]}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>

        <span className="text-sm font-medium flex-1 truncate">{node.name}</span>

        {/* Level badge */}
        <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 shrink-0 ${LEVEL_BADGE_COLORS[node.type]}`}>
          L{config.level} {config.label}
        </Badge>

        {node.code && (
          <Badge variant="outline" className="text-[9px] hidden group-hover:flex shrink-0">
            {node.code}
          </Badge>
        )}

        {node.gstin && (
          <Badge variant="outline" className="text-[9px] hidden sm:flex shrink-0">
            GSTIN: {node.gstin.slice(0, 4)}...
          </Badge>
        )}

        {node.pan && (
          <Badge variant="outline" className="text-[9px] hidden sm:flex shrink-0">
            PAN: {node.pan}
          </Badge>
        )}

        {node.budget && (
          <span className="text-xs text-muted-foreground hidden sm:block shrink-0">
            {formatINRCompact(node.budget)}
          </span>
        )}

        {utilPercent !== undefined && (
          <div className="w-16 hidden sm:block shrink-0">
            <Progress value={utilPercent} className="h-1.5" />
          </div>
        )}

        {node.glCode && (
          <Badge variant="outline" className="text-[9px] hidden group-hover:flex shrink-0">
            GL: {node.glCode}
          </Badge>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {canAddChild && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              title={`Add ${HIERARCHY_LEVELS[config.childType!].label}`}
              onClick={(e) => {
                e.stopPropagation();
                onAddChild(node);
              }}
            >
              <Plus className="w-3 h-3" />
            </Button>
          )}
          {node.type !== "bank" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              title={`Edit ${config.label}`}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(node);
              }}
            >
              <Edit2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {expanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              depth={depth + 1}
              searchQuery={searchQuery}
              onEdit={onEdit}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Node Form (shared between Add and Edit dialogs)
// =============================================================================

function NodeForm({
  form,
  setForm,
  allNodes,
  isEdit,
  fixedType,
  fixedParentId,
}: {
  form: NodeFormData;
  setForm: React.Dispatch<React.SetStateAction<NodeFormData>>;
  allNodes: { node: TreeNode; depth: number }[];
  isEdit: boolean;
  fixedType?: NodeType;
  fixedParentId?: string;
}) {
  const config = HIERARCHY_LEVELS[form.type];
  const parentType = config.parentType;
  const needsParent = parentType !== null;
  const parentOptions = parentType ? allNodes.filter((item) => item.node.type === parentType) : [];

  const isBank = form.type === "bank";
  const isProgram = form.type === "program";
  const isCompany = form.type === "company";
  const isDivision = form.type === "division";
  const isDepartment = form.type === "department";
  const isCostCenter = form.type === "costcenter";

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
      {/* Type indicator */}
      <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
        <Badge className={`${LEVEL_BADGE_COLORS[form.type]} text-xs`}>
          Level {config.level}
        </Badge>
        <span className="text-sm font-medium">{config.label}</span>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Name *</label>
        <Input
          placeholder={`Enter ${config.label.toLowerCase()} name`}
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
        />
      </div>

      {/* Code (for program, division, department, cost center) */}
      {(isProgram || isDivision || isDepartment || isCostCenter) && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Code</label>
          <Input
            placeholder={isCostCenter ? "e.g. CC-SM-01" : isDivision ? "e.g. CB" : "e.g. CCP"}
            value={form.code}
            onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
          />
        </div>
      )}

      {/* Parent selection (hidden if fixed) */}
      {needsParent && !fixedParentId && (
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Parent ({HIERARCHY_LEVELS[parentType!].label}) *
          </label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={form.parentId}
            onChange={(e) => setForm((prev) => ({ ...prev, parentId: e.target.value }))}
            disabled={isEdit}
          >
            <option value="">Select parent...</option>
            {parentOptions.map(({ node }) => (
              <option key={node.id} value={node.id}>
                {node.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Program-specific fields */}
      {isProgram && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <Input
            placeholder="Program description"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          />
        </div>
      )}

      {/* Company-specific fields */}
      {isCompany && (
        <>
          <div className="space-y-2">
            <label className="text-sm font-medium">Legal Name</label>
            <Input
              placeholder="Full legal entity name"
              value={form.legalName}
              onChange={(e) => setForm((prev) => ({ ...prev, legalName: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">PAN</label>
              <Input
                placeholder="e.g. AABCU9603R"
                value={form.pan}
                onChange={(e) => setForm((prev) => ({ ...prev, pan: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">CIN</label>
              <Input
                placeholder="e.g. U65100MH2020PTC..."
                value={form.cin}
                onChange={(e) => setForm((prev) => ({ ...prev, cin: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">GSTIN</label>
              <Input
                placeholder="e.g. 29AABCT1234D1ZP"
                value={form.gstin}
                onChange={(e) => setForm((prev) => ({ ...prev, gstin: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Base Currency</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={form.baseCurrency}
                onChange={(e) => setForm((prev) => ({ ...prev, baseCurrency: e.target.value }))}
              >
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>
        </>
      )}

      {/* Budget (Division, Department, Cost Center) */}
      {(isDivision || isDepartment || isCostCenter) && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Budget (INR)</label>
          <Input
            type="number"
            placeholder="0"
            value={form.budget}
            onChange={(e) => setForm((prev) => ({ ...prev, budget: e.target.value }))}
          />
        </div>
      )}

      {/* GL Code Prefix (Department only) */}
      {isDepartment && (
        <div className="space-y-2">
          <label className="text-sm font-medium">GL Code Prefix</label>
          <Input
            placeholder="e.g. 4200"
            value={form.glCodePrefix}
            onChange={(e) => setForm((prev) => ({ ...prev, glCodePrefix: e.target.value }))}
          />
        </div>
      )}

      {/* GL Code (Cost Center only) */}
      {isCostCenter && (
        <div className="space-y-2">
          <label className="text-sm font-medium">GL Code</label>
          <Input
            placeholder="e.g. 4100-001"
            value={form.glCode}
            onChange={(e) => setForm((prev) => ({ ...prev, glCode: e.target.value }))}
          />
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Main Page
// =============================================================================

export default function HierarchyPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addForm, setAddForm] = useState<NodeFormData>({ ...EMPTY_FORM });
  const [editForm, setEditForm] = useState<NodeFormData>({ ...EMPTY_FORM });
  const [editingNodeId, setEditingNodeId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [treeVersion, setTreeVersion] = useState(0);
  const [addChildType, setAddChildType] = useState<NodeType | null>(null);
  const [addParentId, setAddParentId] = useState<string>("");

  // Build tree fresh each render (or when treeVersion changes)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tree = useMemo(() => buildTree(), [treeVersion]);
  const allNodes = useMemo(() => flattenTree(tree), [tree]);
  const filteredTree = useMemo(() => filterTree(tree, searchQuery), [tree, searchQuery]);
  const nodeCounts = useMemo(() => countNodes(tree), [tree]);

  // -------------------------------------------------------------------------
  // Build API record from form data
  // -------------------------------------------------------------------------

  const buildRecord = useCallback((form: NodeFormData) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const record: Record<string, any> = { name: form.name };

    switch (form.type) {
      case "program":
        record.bankId = form.parentId;
        if (form.code) record.code = form.code;
        if (form.description) record.description = form.description;
        break;
      case "company":
        // Map programId as the parent link; also set enterpriseId to the bank
        record.programId = form.parentId;
        // Look up program to find bankId
        const prog = getPrograms().find((p) => p.id === form.parentId);
        record.enterpriseId = prog?.bankId || "";
        if (form.legalName) record.legalName = form.legalName;
        if (form.pan) record.pan = form.pan;
        if (form.cin) record.cin = form.cin;
        if (form.gstin) record.gstin = form.gstin;
        record.baseCurrency = form.baseCurrency || "INR";
        break;
      case "division":
        record.companyId = form.parentId;
        if (form.code) record.code = form.code;
        if (form.budget) record.budget = Number(form.budget);
        break;
      case "department":
        record.divisionId = form.parentId;
        if (form.code) record.code = form.code;
        if (form.budget) record.budget = Number(form.budget);
        if (form.glCodePrefix) record.glCodePrefix = form.glCodePrefix;
        break;
      case "costcenter":
        record.departmentId = form.parentId;
        // Look up department to find company for backward compat
        const dept = getDepartments().find((d) => d.id === form.parentId);
        const div = dept ? getDivisions().find((d) => d.id === dept.divisionId) : undefined;
        record.companyId = div?.companyId || "";
        if (form.code) record.code = form.code;
        if (form.budget) record.budget = Number(form.budget);
        if (form.glCode) record.glCode = form.glCode;
        break;
    }

    return record;
  }, []);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  // Open "Add Child" dialog context-sensitively
  const openAddChildDialog = useCallback((parentNode: TreeNode) => {
    const config = HIERARCHY_LEVELS[parentNode.type];
    const childType = config.childType;
    if (!childType) return;

    setAddChildType(childType);
    setAddParentId(parentNode.id);
    setAddForm({
      ...EMPTY_FORM,
      type: childType,
      parentId: parentNode.id,
    });
    setAddDialogOpen(true);
  }, []);

  // Open generic "Add Node" dialog (top-level)
  const openAddDialog = useCallback(() => {
    setAddChildType(null);
    setAddParentId("");
    setAddForm({ ...EMPTY_FORM, type: "program" });
    setAddDialogOpen(true);
  }, []);

  const handleAdd = useCallback(async () => {
    if (!addForm.name.trim()) return;

    const config = HIERARCHY_LEVELS[addForm.type];
    if (config.parentType && !addForm.parentId) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/hierarchy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: HIERARCHY_LEVELS[addForm.type].apiType,
          record: buildRecord(addForm),
        }),
      });

      if (res.ok) {
        setAddDialogOpen(false);
        setAddForm({ ...EMPTY_FORM });
        setAddChildType(null);
        setAddParentId("");
        setTreeVersion((v) => v + 1);
        router.refresh();
      }
    } catch {
      // Silently fail in demo mode
    } finally {
      setIsSubmitting(false);
    }
  }, [addForm, buildRecord, router]);

  const handleEdit = useCallback(async () => {
    if (!editForm.name.trim() || !editingNodeId) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/hierarchy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: HIERARCHY_LEVELS[editForm.type].apiType,
          id: editingNodeId,
          record: buildRecord(editForm),
        }),
      });

      if (res.ok) {
        setEditDialogOpen(false);
        setEditForm({ ...EMPTY_FORM });
        setEditingNodeId("");
        setTreeVersion((v) => v + 1);
        router.refresh();
      }
    } catch {
      // Silently fail in demo mode
    } finally {
      setIsSubmitting(false);
    }
  }, [editForm, editingNodeId, buildRecord, router]);

  const openEditDialog = useCallback((node: TreeNode) => {
    setEditingNodeId(node.id);
    setEditForm({
      name: node.name,
      code: node.code || "",
      type: node.type,
      parentId: node.parentId || "",
      legalName: node.legalName || "",
      pan: node.pan || "",
      cin: node.cin || "",
      gstin: node.gstin || "",
      baseCurrency: node.baseCurrency || "INR",
      description: node.description || "",
      budget: node.budget?.toString() || "",
      glCodePrefix: node.glCodePrefix || "",
      glCode: node.glCode || "",
    });
    setEditDialogOpen(true);
  }, []);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const childTypeLabel = addChildType ? HIERARCHY_LEVELS[addChildType].label : "Node";
  const parentNodeName = addParentId ? allNodes.find((n) => n.node.id === addParentId)?.node.name : null;

  return (
    <div className="space-y-6 animate-in">
      <PageHeader title="Organization Hierarchy" description="Visa/Mastercard 6-level corporate card hierarchy">
        <Button variant="outline">
          <FolderTree className="w-4 h-4" />
          Import from HRIS
        </Button>
        <Button onClick={openAddDialog}>
          <Plus className="w-4 h-4" />
          Add Node
        </Button>
      </PageHeader>

      <Tabs defaultValue="tree" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tree">
            <Network className="w-3.5 h-3.5 mr-1.5" />
            Tree View
          </TabsTrigger>
          <TabsTrigger value="assign">
            <UserPlus className="w-3.5 h-3.5 mr-1.5" />
            Assign Employees
          </TabsTrigger>
        </TabsList>

        {/* ==================== TREE VIEW TAB ==================== */}
        <TabsContent value="tree" className="space-y-4">
          {/* Level Legend */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Hierarchy Levels</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(HIERARCHY_LEVELS) as [NodeType, typeof HIERARCHY_LEVELS[NodeType]][]).map(([type, config]) => {
                  const Icon = LEVEL_ICONS[type];
                  return (
                    <div
                      key={type}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium ${LEVEL_BADGE_COLORS[type]} border`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>L{config.level}</span>
                      <span>{config.label}</span>
                      <Badge variant="secondary" className="ml-1 text-[9px] h-4 px-1">
                        {nodeCounts[type]}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {(Object.entries(HIERARCHY_LEVELS) as [NodeType, typeof HIERARCHY_LEVELS[NodeType]][]).map(([type, config]) => {
              const Icon = LEVEL_ICONS[type];
              return (
                <Card key={type}>
                  <CardContent className="p-3 flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${LEVEL_COLORS[type]}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg font-bold">{nodeCounts[type]}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{config.label}s</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search hierarchy nodes..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Tree */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Network className="w-4 h-4" />
                Organization Tree
                {searchQuery && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Filtered
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-0.5">
                {filteredTree.length > 0 ? (
                  filteredTree.map((node) => (
                    <TreeNodeComponent
                      key={node.id}
                      node={node}
                      searchQuery={searchQuery}
                      onEdit={openEditDialog}
                      onAddChild={openAddChildDialog}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    {searchQuery
                      ? `No nodes matching "${searchQuery}"`
                      : "No hierarchy nodes found. Click \"Add Node\" to create one."}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== ASSIGN EMPLOYEES TAB ==================== */}
        <TabsContent value="assign">
          <AssignEmployeesTab />
        </TabsContent>
      </Tabs>

      {/* ============================================================= */}
      {/* Add Node Dialog                                                */}
      {/* ============================================================= */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {addChildType
                ? `Add ${childTypeLabel}`
                : "Add Hierarchy Node"}
            </DialogTitle>
            <DialogDescription>
              {parentNodeName
                ? `Adding a ${childTypeLabel.toLowerCase()} under "${parentNodeName}".`
                : "Create a new node in your organization hierarchy. Select a type to begin."}
            </DialogDescription>
          </DialogHeader>

          {/* If no fixed child type, allow type selection (only non-bank types) */}
          {!addChildType && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Node Type *</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={addForm.type}
                onChange={(e) =>
                  setAddForm((prev) => ({
                    ...prev,
                    type: e.target.value as NodeType,
                    parentId: "",
                  }))
                }
              >
                {(Object.entries(HIERARCHY_LEVELS) as [NodeType, typeof HIERARCHY_LEVELS[NodeType]][])
                  .filter(([type]) => type !== "bank") // Bank is read-only
                  .map(([type, config]) => (
                    <option key={type} value={type}>
                      L{config.level} - {config.label}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <NodeForm
            form={addForm}
            setForm={setAddForm}
            allNodes={allNodes}
            isEdit={false}
            fixedType={addChildType || undefined}
            fixedParentId={addParentId || undefined}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={isSubmitting || !addForm.name.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add {addChildType ? childTypeLabel : "Node"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================= */}
      {/* Edit Node Dialog                                               */}
      {/* ============================================================= */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit {HIERARCHY_LEVELS[editForm.type]?.label || "Node"}</DialogTitle>
            <DialogDescription>
              Update the details for this hierarchy node.
            </DialogDescription>
          </DialogHeader>

          <NodeForm
            form={editForm}
            setForm={setEditForm}
            allNodes={allNodes}
            isEdit={true}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isSubmitting || !editForm.name.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Edit2 className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
