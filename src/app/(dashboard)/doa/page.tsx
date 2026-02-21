"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { getDoaAuthorityLevels, getDoaApprovalMatrix } from "@/lib/store";
import { formatINRCompact } from "@/lib/utils";
import {
  Scale,
  Plus,
  Edit2,
  Trash2,
  Users,
  ArrowRight,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Calendar,
  GitBranch,
  Layers,
  ChevronRight,
} from "lucide-react";

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

export default function DoaPage() {
  const authorityLevels = getDoaAuthorityLevels();
  const approvalMatrix = getDoaApprovalMatrix();

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
                <p className="text-xl font-bold">{approvalMatrix.length}</p>
                <p className="text-xs text-muted-foreground">Approval Rules</p>
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

      <Tabs defaultValue="authority" className="space-y-4">
        <TabsList>
          <TabsTrigger value="authority">Authority Levels</TabsTrigger>
          <TabsTrigger value="matrix">Approval Matrix</TabsTrigger>
          <TabsTrigger value="delegations">Delegations</TabsTrigger>
          <TabsTrigger value="sod">SOD Rules</TabsTrigger>
        </TabsList>

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
                        <td className="py-3 font-medium">₹{rule.amountRange}</td>
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
    </div>
  );
}
