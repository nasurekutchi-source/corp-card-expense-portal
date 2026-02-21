"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getCompanies,
  getDivisions,
  getDepartments,
} from "@/lib/store";
import { formatINRCompact } from "@/lib/utils";
import {
  SlidersHorizontal,
  Search,
  ChevronRight,
  ChevronDown,
  Building2,
  Layers,
  Users,
  Shield,
  ShieldCheck,
  ShieldAlert,
  CreditCard,
  Globe,
  MapPin,
  Ban,
  Save,
  Loader2,
  ArrowDown,
  Undo2,
} from "lucide-react";

// =============================================================================
// Types
// =============================================================================

type PolicyNodeType = "company" | "division" | "department";

interface PolicyTreeNode {
  id: string;
  name: string;
  code?: string;
  type: PolicyNodeType;
  budget?: number;
  children?: PolicyTreeNode[];
  parentId?: string;
}

interface ChannelControls {
  pos: boolean;
  ecommerce: boolean;
  contactless: boolean;
  mobileWallet: boolean;
  atm: boolean;
}

interface GeographicControls {
  internationalAllowed: boolean;
  domesticOnly: boolean;
}

interface SpendLimits {
  perTransaction: number;
  daily: number;
  monthly: number;
}

interface CardControlPolicy {
  id: string;
  nodeId: string;
  nodeType: PolicyNodeType;
  nodeName: string;
  spendLimits: SpendLimits;
  channelControls: ChannelControls;
  geographicControls: GeographicControls;
  mccRestrictions: string[];
  isOverride: boolean;
  inheritedFrom?: string;
}

interface EffectivePolicyResult {
  policy: CardControlPolicy;
  source: string;
  sourceType: string;
}

// =============================================================================
// Constants
// =============================================================================

const MCC_CATEGORIES = [
  "Gambling",
  "Crypto",
  "Liquor",
  "ATM Cash Advance",
  "Tobacco",
  "Adult Entertainment",
  "Dating Services",
  "Firearms",
  "Pawn Shops",
  "Wire Transfers",
] as const;

const CHANNEL_LABELS: Record<keyof ChannelControls, { label: string; description: string }> = {
  pos: { label: "POS", description: "Point of Sale terminals" },
  ecommerce: { label: "E-Commerce", description: "Online purchases" },
  contactless: { label: "Contactless", description: "Tap-to-pay NFC" },
  mobileWallet: { label: "Mobile Wallet", description: "Google Pay, Apple Pay, etc." },
  atm: { label: "ATM", description: "Cash withdrawals" },
};

const NODE_TYPE_COLORS: Record<PolicyNodeType, string> = {
  company: "bg-blue-500/10 text-blue-600",
  division: "bg-purple-500/10 text-purple-600",
  department: "bg-amber-500/10 text-amber-600",
};

const NODE_TYPE_ICONS: Record<PolicyNodeType, React.ElementType> = {
  company: Building2,
  division: Layers,
  department: Users,
};

const NODE_TYPE_LABELS: Record<PolicyNodeType, string> = {
  company: "Company",
  division: "Division",
  department: "Department",
};

// =============================================================================
// Build Policy Tree (Companies -> Divisions -> Departments)
// =============================================================================

function buildPolicyTree(): PolicyTreeNode[] {
  const companies = getCompanies();
  const divisions = getDivisions();
  const departments = getDepartments();

  return companies.map((comp) => ({
    id: comp.id,
    name: comp.name,
    type: "company" as const,
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
            parentId: div.id,
          })),
      })),
  }));
}

// =============================================================================
// Tree filter
// =============================================================================

function filterPolicyTree(nodes: PolicyTreeNode[], query: string): PolicyTreeNode[] {
  if (!query.trim()) return nodes;
  const q = query.toLowerCase();

  return nodes
    .map((node) => {
      const childMatches = node.children ? filterPolicyTree(node.children, query) : [];
      const selfMatches =
        node.name.toLowerCase().includes(q) ||
        (node.code?.toLowerCase().includes(q) ?? false) ||
        node.type.toLowerCase().includes(q);

      if (selfMatches || childMatches.length > 0) {
        return {
          ...node,
          children: selfMatches ? node.children : childMatches,
        };
      }
      return null;
    })
    .filter(Boolean) as PolicyTreeNode[];
}

// =============================================================================
// PolicyTreeNodeComponent (left panel)
// =============================================================================

function PolicyTreeNodeComponent({
  node,
  depth = 0,
  selectedNodeId,
  onSelect,
  searchQuery,
}: {
  node: PolicyTreeNode;
  depth?: number;
  selectedNodeId: string;
  onSelect: (node: PolicyTreeNode) => void;
  searchQuery: string;
}) {
  const [expanded, setExpanded] = useState(depth < 2 || searchQuery.length > 0);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = node.id === selectedNodeId;
  const Icon = NODE_TYPE_ICONS[node.type];

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-2 px-2 rounded-md cursor-pointer group transition-colors ${
          isSelected
            ? "bg-primary/10 border border-primary/20"
            : "hover:bg-muted/50"
        }`}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={() => {
          onSelect(node);
          if (hasChildren) setExpanded(!expanded);
        }}
      >
        {hasChildren ? (
          expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          )
        ) : (
          <span className="w-3.5 shrink-0" />
        )}

        <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${NODE_TYPE_COLORS[node.type]}`}>
          <Icon className="w-3 h-3" />
        </div>

        <span className={`text-sm flex-1 truncate ${isSelected ? "font-semibold" : "font-medium"}`}>
          {node.name}
        </span>

        {node.code && (
          <span className="text-[10px] text-muted-foreground hidden group-hover:block">
            {node.code}
          </span>
        )}
      </div>

      {expanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <PolicyTreeNodeComponent
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedNodeId={selectedNodeId}
              onSelect={onSelect}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Toggle Switch Component
// =============================================================================

function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-primary" : "bg-muted-foreground/30"
      }`}
      onClick={() => onChange(!checked)}
    >
      <span
        className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg transition-transform ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// =============================================================================
// InheritedBadge Component
// =============================================================================

function InheritedBadge({ source, sourceType }: { source: string; sourceType: string }) {
  return (
    <Badge variant="outline" className="text-[10px] bg-orange-50 text-orange-700 border-orange-200 gap-1">
      <ArrowDown className="w-2.5 h-2.5" />
      Inherited from {sourceType}: {source}
    </Badge>
  );
}

// =============================================================================
// Main Page
// =============================================================================

export default function CardControlsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNode, setSelectedNode] = useState<PolicyTreeNode | null>(null);
  const [effectivePolicy, setEffectivePolicy] = useState<EffectivePolicyResult | null>(null);
  const [isDirectPolicy, setIsDirectPolicy] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Editable policy state
  const [editSpendLimits, setEditSpendLimits] = useState<SpendLimits>({ perTransaction: 0, daily: 0, monthly: 0 });
  const [editChannels, setEditChannels] = useState<ChannelControls>({ pos: true, ecommerce: true, contactless: true, mobileWallet: true, atm: false });
  const [editGeo, setEditGeo] = useState<GeographicControls>({ internationalAllowed: false, domesticOnly: true });
  const [editMccRestrictions, setEditMccRestrictions] = useState<string[]>([]);

  const tree = useMemo(() => buildPolicyTree(), []);
  const filteredTree = useMemo(() => filterPolicyTree(tree, searchQuery), [tree, searchQuery]);

  // Fetch effective policy when node is selected
  const fetchPolicy = useCallback(async (node: PolicyTreeNode) => {
    try {
      const res = await fetch(`/api/v1/card-controls?nodeId=${node.id}&nodeType=${node.type}&effective=true`);
      if (res.ok) {
        const json = await res.json();
        const result: EffectivePolicyResult = json.data;
        setEffectivePolicy(result);
        setIsDirectPolicy(result.policy.nodeId === node.id);

        // Pre-fill edit state
        setEditSpendLimits({ ...result.policy.spendLimits });
        setEditChannels({ ...result.policy.channelControls });
        setEditGeo({ ...result.policy.geographicControls });
        setEditMccRestrictions([...result.policy.mccRestrictions]);
        setIsEditing(false);
      }
    } catch {
      // Use defaults on error
      setEffectivePolicy(null);
      setIsDirectPolicy(false);
    }
  }, []);

  useEffect(() => {
    if (selectedNode) {
      fetchPolicy(selectedNode);
    }
  }, [selectedNode, fetchPolicy]);

  const handleNodeSelect = useCallback((node: PolicyTreeNode) => {
    setSelectedNode(node);
  }, []);

  const handleStartOverride = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleCancelEdit = useCallback(() => {
    if (effectivePolicy) {
      setEditSpendLimits({ ...effectivePolicy.policy.spendLimits });
      setEditChannels({ ...effectivePolicy.policy.channelControls });
      setEditGeo({ ...effectivePolicy.policy.geographicControls });
      setEditMccRestrictions([...effectivePolicy.policy.mccRestrictions]);
    }
    setIsEditing(false);
  }, [effectivePolicy]);

  const handleSave = useCallback(async () => {
    if (!selectedNode) return;

    setIsSaving(true);
    try {
      const body = {
        ...(isDirectPolicy && effectivePolicy?.policy.id !== "default"
          ? { id: effectivePolicy!.policy.id }
          : {}),
        nodeId: selectedNode.id,
        nodeType: selectedNode.type,
        nodeName: selectedNode.name,
        spendLimits: editSpendLimits,
        channelControls: editChannels,
        geographicControls: editGeo,
        mccRestrictions: editMccRestrictions,
        isOverride: true,
      };

      const method = isDirectPolicy && effectivePolicy?.policy.id !== "default" ? "PUT" : "POST";
      const res = await fetch("/api/v1/card-controls", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        // Re-fetch to update state
        await fetchPolicy(selectedNode);
      }
    } catch {
      // Silently fail in demo mode
    } finally {
      setIsSaving(false);
    }
  }, [selectedNode, isDirectPolicy, effectivePolicy, editSpendLimits, editChannels, editGeo, editMccRestrictions, fetchPolicy]);

  const toggleMcc = useCallback((category: string) => {
    setEditMccRestrictions((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  }, []);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const policy = effectivePolicy?.policy;
  const isInherited = effectivePolicy && !isDirectPolicy;
  const viewSpendLimits = isEditing ? editSpendLimits : (policy?.spendLimits || { perTransaction: 0, daily: 0, monthly: 0 });
  const viewChannels = isEditing ? editChannels : (policy?.channelControls || { pos: true, ecommerce: true, contactless: true, mobileWallet: true, atm: false });
  const viewGeo = isEditing ? editGeo : (policy?.geographicControls || { internationalAllowed: false, domesticOnly: true });
  const viewMcc = isEditing ? editMccRestrictions : (policy?.mccRestrictions || []);

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Card Control Policies"
        description="Manage card controls that cascade down the hierarchy"
      >
        {selectedNode && isEditing && (
          <>
            <Button variant="outline" onClick={handleCancelEdit}>
              <Undo2 className="w-4 h-4" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Policy
                </>
              )}
            </Button>
          </>
        )}
      </PageHeader>

      {/* Split view: tree on left, policy on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left panel: Hierarchy tree */}
        <div className="lg:col-span-4">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                Hierarchy
              </CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="pl-9 h-8 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-[calc(100vh-340px)]">
                <div className="space-y-0.5 pr-3">
                  {filteredTree.length > 0 ? (
                    filteredTree.map((node) => (
                      <PolicyTreeNodeComponent
                        key={node.id}
                        node={node}
                        selectedNodeId={selectedNode?.id || ""}
                        onSelect={handleNodeSelect}
                        searchQuery={searchQuery}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No matching nodes found
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right panel: Policy details */}
        <div className="lg:col-span-8">
          {!selectedNode ? (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-20">
                <SlidersHorizontal className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground text-sm">
                  Select a hierarchy node from the left panel to view or edit its card control policy.
                </p>
                <p className="text-muted-foreground text-xs mt-2">
                  Policies cascade: Company &rarr; Division &rarr; Department
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Node header */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${NODE_TYPE_COLORS[selectedNode.type]}`}>
                        {(() => { const Icon = NODE_TYPE_ICONS[selectedNode.type]; return <Icon className="w-5 h-5" />; })()}
                      </div>
                      <div>
                        <h3 className="font-semibold">{selectedNode.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[10px]">
                            {NODE_TYPE_LABELS[selectedNode.type]}
                          </Badge>
                          {isInherited && effectivePolicy && (
                            <InheritedBadge
                              source={effectivePolicy.source}
                              sourceType={effectivePolicy.sourceType}
                            />
                          )}
                          {isDirectPolicy && (
                            <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200 gap-1">
                              <ShieldCheck className="w-2.5 h-2.5" />
                              Direct Policy
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {!isEditing && (
                      <Button variant="outline" size="sm" onClick={handleStartOverride}>
                        <Shield className="w-3.5 h-3.5" />
                        {isDirectPolicy ? "Edit Policy" : "Override"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Spend Limits */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Spend Limits
                    {isInherited && !isEditing && effectivePolicy && (
                      <InheritedBadge source={effectivePolicy.source} sourceType={effectivePolicy.sourceType} />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {(["perTransaction", "daily", "monthly"] as const).map((key) => (
                      <div key={key} className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {key === "perTransaction" ? "Per Transaction" : key === "daily" ? "Daily" : "Monthly"}
                        </label>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={editSpendLimits[key]}
                            onChange={(e) =>
                              setEditSpendLimits((prev) => ({
                                ...prev,
                                [key]: Number(e.target.value),
                              }))
                            }
                            className="h-9"
                          />
                        ) : (
                          <div className="text-lg font-semibold">
                            {formatINRCompact(viewSpendLimits[key])}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Channel Controls */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Channel Controls
                    {isInherited && !isEditing && effectivePolicy && (
                      <InheritedBadge source={effectivePolicy.source} sourceType={effectivePolicy.sourceType} />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(Object.entries(CHANNEL_LABELS) as [keyof ChannelControls, { label: string; description: string }][]).map(
                      ([key, { label, description }]) => (
                        <div key={key} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                          <div>
                            <span className="text-sm font-medium">{label}</span>
                            <p className="text-xs text-muted-foreground">{description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {!isEditing && viewChannels[key] && (
                              <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">
                                Enabled
                              </Badge>
                            )}
                            {!isEditing && !viewChannels[key] && (
                              <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700 border-red-200">
                                Disabled
                              </Badge>
                            )}
                            {isEditing && (
                              <ToggleSwitch
                                checked={editChannels[key]}
                                onChange={(val) =>
                                  setEditChannels((prev) => ({ ...prev, [key]: val }))
                                }
                              />
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Geographic Controls */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Geographic Controls
                    {isInherited && !isEditing && effectivePolicy && (
                      <InheritedBadge source={effectivePolicy.source} sourceType={effectivePolicy.sourceType} />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <span className="text-sm font-medium">International Transactions</span>
                          <p className="text-xs text-muted-foreground">Allow card usage outside India</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!isEditing && viewGeo.internationalAllowed && (
                          <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">
                            Allowed
                          </Badge>
                        )}
                        {!isEditing && !viewGeo.internationalAllowed && (
                          <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700 border-red-200">
                            Blocked
                          </Badge>
                        )}
                        {isEditing && (
                          <ToggleSwitch
                            checked={editGeo.internationalAllowed}
                            onChange={(val) =>
                              setEditGeo((prev) => ({
                                ...prev,
                                internationalAllowed: val,
                                domesticOnly: !val,
                              }))
                            }
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <span className="text-sm font-medium">Domestic Only</span>
                          <p className="text-xs text-muted-foreground">Restrict to Indian merchants only</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!isEditing && viewGeo.domesticOnly && (
                          <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                            Enforced
                          </Badge>
                        )}
                        {!isEditing && !viewGeo.domesticOnly && (
                          <Badge variant="outline" className="text-[10px] bg-gray-50 text-gray-600 border-gray-200">
                            Off
                          </Badge>
                        )}
                        {isEditing && (
                          <ToggleSwitch
                            checked={editGeo.domesticOnly}
                            onChange={(val) =>
                              setEditGeo((prev) => ({
                                ...prev,
                                domesticOnly: val,
                                internationalAllowed: !val,
                              }))
                            }
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* MCC Restrictions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Ban className="w-4 h-4" />
                    MCC Restrictions (Blocked Categories)
                    {isInherited && !isEditing && effectivePolicy && (
                      <InheritedBadge source={effectivePolicy.source} sourceType={effectivePolicy.sourceType} />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {MCC_CATEGORIES.map((category) => {
                      const isBlocked = viewMcc.includes(category);
                      return (
                        <button
                          key={category}
                          type="button"
                          disabled={!isEditing}
                          onClick={() => isEditing && toggleMcc(category)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            isBlocked
                              ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                              : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                          } ${!isEditing ? "cursor-default" : "cursor-pointer"}`}
                        >
                          {isBlocked ? (
                            <ShieldAlert className="w-3 h-3" />
                          ) : (
                            <Shield className="w-3 h-3" />
                          )}
                          {category}
                          {isBlocked && (
                            <span className="text-[9px] font-bold uppercase">BLOCKED</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {!isEditing && viewMcc.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      No MCC categories are blocked at this level.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Save/Override button at bottom when editing */}
              {isEditing && (
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {isDirectPolicy ? "Save Changes" : "Save Override"}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
