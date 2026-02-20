"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { PageHeader } from "@/components/shared/page-header";
import { Progress } from "@/components/ui/progress";
import { demoEnterprises, demoCompanies, demoDivisions, demoDepartments, demoCostCenters } from "@/lib/demo-data";
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
} from "lucide-react";

interface TreeNode {
  id: string;
  name: string;
  code?: string;
  type: "enterprise" | "company" | "division" | "department" | "costcenter";
  budget?: number;
  utilized?: number;
  children?: TreeNode[];
  gstin?: string;
}

function buildTree(): TreeNode[] {
  return demoEnterprises.map((ent) => ({
    id: ent.id,
    name: ent.name,
    type: "enterprise" as const,
    children: demoCompanies
      .filter((c) => c.enterpriseId === ent.id)
      .map((comp) => ({
        id: comp.id,
        name: comp.name,
        type: "company" as const,
        gstin: comp.gstin,
        children: demoDivisions
          .filter((d) => d.companyId === comp.id)
          .map((div) => ({
            id: div.id,
            name: div.name,
            code: div.code,
            type: "division" as const,
            budget: div.budget,
            children: demoDepartments
              .filter((dept) => dept.divisionId === div.id)
              .map((dept) => ({
                id: dept.id,
                name: dept.name,
                code: dept.code,
                type: "department" as const,
                budget: dept.budget,
                children: demoCostCenters
                  .filter((cc) => cc.companyId === comp.id)
                  .slice(0, 2)
                  .map((cc) => ({
                    id: cc.id,
                    name: cc.name,
                    code: cc.code,
                    type: "costcenter" as const,
                    budget: cc.budget,
                    utilized: cc.utilized,
                  })),
              })),
          })),
      })),
  }));
}

function TreeNodeComponent({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
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
          onClick={(e) => { e.stopPropagation(); }}
        >
          <Edit2 className="w-3 h-3" />
        </Button>
      </div>

      {expanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <TreeNodeComponent key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HierarchyPage() {
  const tree = buildTree();

  return (
    <div className="space-y-6 animate-in">
      <PageHeader title="Organization Hierarchy" description="Manage your corporate hierarchy structure">
        <Button variant="outline">
          <FolderTree className="w-4 h-4" />
          Import from HRIS
        </Button>
        <Button>
          <Plus className="w-4 h-4" />
          Add Node
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: "Enterprises", value: demoEnterprises.length, icon: Building2 },
          { label: "Companies", value: demoCompanies.length, icon: Building2 },
          { label: "Divisions", value: demoDivisions.length, icon: Layers },
          { label: "Departments", value: demoDepartments.length, icon: Users },
          { label: "Cost Centers", value: demoCostCenters.length, icon: IndianRupee },
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
        <Input placeholder="Search hierarchy nodes..." className="pl-10" />
      </div>

      {/* Tree */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Network className="w-4 h-4" />
            Organization Tree
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-0.5">
            {tree.map((node) => (
              <TreeNodeComponent key={node.id} node={node} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
