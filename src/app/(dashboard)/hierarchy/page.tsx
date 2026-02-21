"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { getEnterprises, getCompanies, getDivisions, getDepartments, getCostCenters } from "@/lib/store";
import { formatINRCompact } from "@/lib/utils";
import {
  Network,
  Plus,
  Search,
  ChevronRight,
  ChevronDown,
  Building2,
  Layers,
  Users,
  FolderTree,
  IndianRupee,
  Edit2,
  Loader2,
} from "lucide-react";

// =============================================================================
// Types
// =============================================================================

interface TreeNode {
  id: string;
  name: string;
  code?: string;
  type: "enterprise" | "company" | "division" | "department" | "costcenter";
  budget?: number;
  utilized?: number;
  children?: TreeNode[];
  gstin?: string;
  glCodePrefix?: string;
  parentId?: string;
}

type NodeType = "enterprise" | "company" | "division" | "department" | "costcenter";

interface NodeFormData {
  name: string;
  type: NodeType;
  parentId: string;
  budget: string;
  code: string;
  glCodePrefix: string;
  gstin: string;
}

const EMPTY_FORM: NodeFormData = {
  name: "",
  type: "enterprise",
  parentId: "",
  budget: "",
  code: "",
  glCodePrefix: "",
  gstin: "",
};

const NODE_TYPE_LABELS: Record<NodeType, string> = {
  enterprise: "Enterprise",
  company: "Company",
  division: "Division",
  department: "Department",
  costcenter: "Cost Center",
};

// Maps our tree node type to the API's expected type value
const NODE_TYPE_TO_API: Record<NodeType, string> = {
  enterprise: "enterprise",
  company: "company",
  division: "division",
  department: "department",
  costcenter: "costCenter",
};

// =============================================================================
// Build Tree
// =============================================================================

function buildTree(): TreeNode[] {
  const enterprises = getEnterprises();
  const companies = getCompanies();
  const divisions = getDivisions();
  const departments = getDepartments();
  const costCenters = getCostCenters();

  return enterprises.map((ent) => ({
    id: ent.id,
    name: ent.name,
    type: "enterprise" as const,
    children: companies
      .filter((c) => c.enterpriseId === ent.id)
      .map((comp) => ({
        id: comp.id,
        name: comp.name,
        type: "company" as const,
        gstin: comp.gstin,
        parentId: ent.id,
        children: divisions
          .filter((d) => d.companyId === comp.id)
          .map((div) => ({
            id: div.id,
            name: div.name,
            code: div.code,
            type: "division" as const,
            budget: div.budget,
            parentId: comp.id,
            children: departments
              .filter((dept) => dept.divisionId === div.id)
              .map((dept) => ({
                id: dept.id,
                name: dept.name,
                code: dept.code,
                type: "department" as const,
                budget: dept.budget,
                glCodePrefix: dept.glCodePrefix,
                parentId: div.id,
                children: costCenters
                  .filter((cc) => cc.companyId === comp.id)
                  .slice(0, 2)
                  .map((cc) => ({
                    id: cc.id,
                    name: cc.name,
                    code: cc.code,
                    type: "costcenter" as const,
                    budget: cc.budget,
                    utilized: cc.utilized,
                    parentId: comp.id,
                  })),
              })),
          })),
      })),
  }));
}

// =============================================================================
// Flatten tree for parent selection dropdowns
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
    node.type.toLowerCase().includes(q) ||
    (node.gstin?.toLowerCase().includes(q) ?? false)
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
          children: selfMatches
            ? node.children // If the node itself matches, show all children
            : childMatches, // Otherwise only show matching descendants
        };
      }
      return null;
    })
    .filter(Boolean) as TreeNode[];
}

// =============================================================================
// Get valid parent types for each node type
// =============================================================================

function getParentTypesForNodeType(type: NodeType): NodeType[] {
  switch (type) {
    case "enterprise":
      return []; // No parent
    case "company":
      return ["enterprise"];
    case "division":
      return ["company"];
    case "department":
      return ["division"];
    case "costcenter":
      return ["company"];
    default:
      return [];
  }
}

// =============================================================================
// TreeNodeComponent
// =============================================================================

function TreeNodeComponent({
  node,
  depth = 0,
  searchQuery,
  onEdit,
}: {
  node: TreeNode;
  depth?: number;
  searchQuery: string;
  onEdit: (node: TreeNode) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 2 || searchQuery.length > 0);
  const hasChildren = node.children && node.children.length > 0;
  const utilPercent = node.budget && node.utilized ? Math.round((node.utilized / node.budget) * 100) : undefined;

  const typeIcons = {
    enterprise: Building2,
    company: Building2,
    division: Layers,
    department: Users,
    costcenter: IndianRupee,
  };
  const Icon = typeIcons[node.type];

  const typeColors = {
    enterprise: "bg-primary/10 text-primary",
    company: "bg-blue-500/10 text-blue-600",
    division: "bg-purple-500/10 text-purple-600",
    department: "bg-amber-500/10 text-amber-600",
    costcenter: "bg-emerald-500/10 text-emerald-600",
  };

  return (
    <div>
      <div
        className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 cursor-pointer group"
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
          <span className="w-4" />
        )}

        <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${typeColors[node.type]}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>

        <span className="text-sm font-medium flex-1 truncate">{node.name}</span>

        {node.code && (
          <Badge variant="outline" className="text-[9px] hidden group-hover:flex">
            {node.code}
          </Badge>
        )}

        {node.gstin && (
          <Badge variant="outline" className="text-[9px] hidden sm:flex">
            GSTIN: {node.gstin.slice(0, 4)}...
          </Badge>
        )}

        {node.budget && (
          <span className="text-xs text-muted-foreground hidden sm:block">
            {formatINRCompact(node.budget)}
          </span>
        )}

        {utilPercent !== undefined && (
          <div className="w-16 hidden sm:block">
            <Progress
              value={utilPercent}
              className="h-1.5"
            />
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(node);
          }}
        >
          <Edit2 className="w-3 h-3" />
        </Button>
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
}: {
  form: NodeFormData;
  setForm: React.Dispatch<React.SetStateAction<NodeFormData>>;
  allNodes: { node: TreeNode; depth: number }[];
  isEdit: boolean;
}) {
  const parentTypes = getParentTypesForNodeType(form.type);
  const needsParent = parentTypes.length > 0;
  const parentOptions = allNodes.filter((item) => parentTypes.includes(item.node.type));

  const showBudget = ["division", "department", "costcenter"].includes(form.type);
  const showCode = ["division", "department", "costcenter"].includes(form.type);
  const showGlCodePrefix = form.type === "department";
  const showGstin = form.type === "company";

  return (
    <div className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Name *</label>
        <Input
          placeholder="Enter node name"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
        />
      </div>

      {/* Type */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Type *</label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={form.type}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              type: e.target.value as NodeType,
              parentId: "", // Reset parent when type changes
            }))
          }
          disabled={isEdit}
        >
          {Object.entries(NODE_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Parent */}
      {needsParent && (
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Parent ({parentTypes.map((t) => NODE_TYPE_LABELS[t]).join(" / ")}) *
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
                {node.name} ({NODE_TYPE_LABELS[node.type]})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Code */}
      {showCode && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Code</label>
          <Input
            placeholder="e.g. DIV-001"
            value={form.code}
            onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
          />
        </div>
      )}

      {/* Budget */}
      {showBudget && (
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
      {showGlCodePrefix && (
        <div className="space-y-2">
          <label className="text-sm font-medium">GL Code Prefix</label>
          <Input
            placeholder="e.g. GL-4200"
            value={form.glCodePrefix}
            onChange={(e) => setForm((prev) => ({ ...prev, glCodePrefix: e.target.value }))}
          />
        </div>
      )}

      {/* GSTIN (Company only) */}
      {showGstin && (
        <div className="space-y-2">
          <label className="text-sm font-medium">GSTIN</label>
          <Input
            placeholder="e.g. 29AABCT1234D1ZP"
            value={form.gstin}
            onChange={(e) => setForm((prev) => ({ ...prev, gstin: e.target.value }))}
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

  // Build tree fresh each render (or when treeVersion changes)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tree = useMemo(() => buildTree(), [treeVersion]);
  const allNodes = useMemo(() => flattenTree(tree), [tree]);
  const filteredTree = useMemo(() => filterTree(tree, searchQuery), [tree, searchQuery]);

  // -------------------------------------------------------------------------
  // Build API record from form data
  // -------------------------------------------------------------------------

  const buildRecord = useCallback((form: NodeFormData) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const record: Record<string, any> = { name: form.name };

    switch (form.type) {
      case "company":
        record.enterpriseId = form.parentId;
        if (form.gstin) record.gstin = form.gstin;
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
        record.companyId = form.parentId;
        if (form.code) record.code = form.code;
        if (form.budget) record.budget = Number(form.budget);
        break;
    }

    return record;
  }, []);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleAdd = useCallback(async () => {
    if (!addForm.name.trim()) return;

    const parentTypes = getParentTypesForNodeType(addForm.type);
    if (parentTypes.length > 0 && !addForm.parentId) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/hierarchy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: NODE_TYPE_TO_API[addForm.type],
          record: buildRecord(addForm),
        }),
      });

      if (res.ok) {
        setAddDialogOpen(false);
        setAddForm({ ...EMPTY_FORM });
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
          type: NODE_TYPE_TO_API[editForm.type],
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
      type: node.type,
      parentId: node.parentId || "",
      budget: node.budget?.toString() || "",
      code: node.code || "",
      glCodePrefix: node.glCodePrefix || "",
      gstin: node.gstin || "",
    });
    setEditDialogOpen(true);
  }, []);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-6 animate-in">
      <PageHeader title="Organization Hierarchy" description="Manage your corporate hierarchy structure">
        <Button variant="outline">
          <FolderTree className="w-4 h-4" />
          Import from HRIS
        </Button>
        <Button onClick={() => { setAddForm({ ...EMPTY_FORM }); setAddDialogOpen(true); }}>
          <Plus className="w-4 h-4" />
          Add Node
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: "Enterprises", value: getEnterprises().length, icon: Building2 },
          { label: "Companies", value: getCompanies().length, icon: Building2 },
          { label: "Divisions", value: getDivisions().length, icon: Layers },
          { label: "Departments", value: getDepartments().length, icon: Users },
          { label: "Cost Centers", value: getCostCenters().length, icon: IndianRupee },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <stat.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
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

      {/* ============================================================= */}
      {/* Add Node Dialog                                                */}
      {/* ============================================================= */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Hierarchy Node</DialogTitle>
            <DialogDescription>
              Create a new node in your organization hierarchy.
            </DialogDescription>
          </DialogHeader>

          <NodeForm
            form={addForm}
            setForm={setAddForm}
            allNodes={allNodes}
            isEdit={false}
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
                  Add Node
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {NODE_TYPE_LABELS[editForm.type]}</DialogTitle>
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
