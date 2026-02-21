"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page-header";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { getPolicies, getStats } from "@/lib/store";
import {
  Shield,
  Plus,
  Search,
  ToggleLeft,
  ToggleRight,
  Edit2,
  Copy,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  FileWarning,
  ShieldAlert,
  ChevronRight,
  Tag,
  Activity,
  Layers,
} from "lucide-react";

export default function PoliciesPage() {
  const [policies, setPolicies] = useState(getPolicies());

  const stats = {
    total: policies.length,
    active: policies.filter((p) => p.isActive).length,
    hard: policies.filter((p) => p.severity === "HARD").length,
    soft: policies.filter((p) => p.severity === "SOFT").length,
    compliance: getStats().policyComplianceScore,
  };

  return (
    <div className="space-y-6 animate-in">
      <PageHeader title="Policy Engine" description="Configure expense policies and compliance rules">
        <Button variant="outline">
          <Shield className="w-4 h-4" />
          Run Audit
        </Button>
        <Button asChild>
          <Link href="/policies/new">
            <Plus className="w-4 h-4" />
            Create Policy
          </Link>
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Policies</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats.hard}</p>
                <p className="text-xs text-muted-foreground">Hard Block</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats.soft}</p>
                <p className="text-xs text-muted-foreground">Soft Warn</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Activity className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats.compliance}%</p>
                <p className="text-xs text-muted-foreground">Compliance</p>
              </div>
            </div>
          </CardContent>
        </Card>
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

      {/* Policies List */}
      <div className="space-y-3">
        {policies.map((policy) => (
          <Card key={policy.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Status toggle */}
                <button
                  onClick={() => {
                    setPolicies((prev) =>
                      prev.map((p) => (p.id === policy.id ? { ...p, isActive: !p.isActive } : p))
                    );
                  }}
                  className="shrink-0"
                >
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
                            {r.threshold && `Receipt threshold: ₹${r.threshold}`}
                            {r.blockedMCCs && `${r.blockedMCCs.length} blocked MCCs`}
                          </span>
                          {r.maxAmount && (
                            <>
                              <span>&middot;</span>
                              <span>Max: ₹{r.maxAmount.toLocaleString("en-IN")}</span>
                            </>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
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
          <Button variant="outline" className="mt-4">
            Configure AI Agent
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
