"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { PageHeader } from "@/components/shared/page-header";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getCards, getTransactions } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import {
  ArrowLeft,
  Snowflake,
  PlayCircle,
  ArrowRightLeft,
  Wifi,
  Copy,
  MapPin,
  Globe,
  ShoppingCart,
  Smartphone,
  Monitor,
  Edit2,
  Check,
  X,
  Save,
  Plus,
  Loader2,
  Banknote,
} from "lucide-react";

// =============================================================================
// Card Visual Component (unchanged)
// =============================================================================

function CardVisual3D({ card }: { card: ReturnType<typeof getCards>[0] }) {
  const gradients: Record<string, string> = {
    VISA: "from-blue-900 via-blue-800 to-blue-600",
    MASTERCARD: "from-gray-900 via-gray-800 to-red-900",
    RUPAY: "from-emerald-900 via-emerald-800 to-teal-600",
  };

  return (
    <div className={`relative w-full max-w-sm aspect-[1.586/1] rounded-2xl bg-gradient-to-br ${gradients[card.network]} p-6 text-white shadow-2xl`}>
      <div className="absolute top-0 left-0 w-full h-full rounded-2xl bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]" />
      <div className="relative h-full flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest opacity-60">
              {card.type}
            </p>
            <p className="text-sm font-medium opacity-80 mt-0.5">CorpCard Pro</p>
          </div>
          <Wifi className="w-6 h-6 opacity-40 rotate-90" />
        </div>
        <div>
          <div className="w-10 h-7 rounded bg-gradient-to-br from-yellow-300 to-yellow-500 mb-4" />
          <p className="text-xl tracking-[0.25em] font-mono">
            &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; &bull;&bull;&bull;&bull; {card.last4Digits}
          </p>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[9px] uppercase tracking-wider opacity-50">Cardholder</p>
            <p className="text-sm font-medium">{card.employeeName}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-wider opacity-50">Expires</p>
            <p className="text-sm font-medium">{card.expiryDate.slice(2, 7).replace("-", "/")}</p>
          </div>
          <p className="text-lg font-bold opacity-80">{card.network}</p>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MCC Categories available for blocking
// =============================================================================

const AVAILABLE_MCC_CATEGORIES = [
  "Gambling",
  "Crypto",
  "Liquor Stores",
  "ATM Cash Advance",
  "Tobacco Shops",
  "Dating Services",
  "Pawn Shops",
  "Wire Transfers",
  "Money Orders",
  "Firearms",
  "Adult Entertainment",
  "Lottery",
];

// =============================================================================
// Controls type (local state shape)
// =============================================================================

interface ControlsState {
  channels: {
    pos: boolean;
    ecommerce: boolean;
    contactless: boolean;
    mobileWallet: boolean;
    atm: boolean;
  };
  geographic: {
    international: boolean;
    domesticOnly: boolean;
  };
  mccRestrictions: string[];
}

const DEFAULT_CONTROLS: ControlsState = {
  channels: {
    pos: true,
    ecommerce: true,
    contactless: true,
    mobileWallet: false,
    atm: true,
  },
  geographic: {
    international: false,
    domesticOnly: true,
  },
  mccRestrictions: ["Gambling", "Crypto", "Liquor Stores", "ATM Cash Advance"],
};

// =============================================================================
// Main Page Component
// =============================================================================

export default function CardDetailPage({ params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = use(params);
  const cards = getCards();
  const allTransactions = getTransactions();
  const card = cards.find((c) => c.id === cardId) || cards[0];
  const transactions = allTransactions.filter((t) => t.cardId === card.id).slice(0, 15);

  // ---------------------------------------------------------------------------
  // Card status state (for freeze/unfreeze)
  // ---------------------------------------------------------------------------
  const [cardStatus, setCardStatus] = useState(card.status);
  const [freezeLoading, setFreezeLoading] = useState(false);
  const isFrozen = cardStatus === "FROZEN";

  // ---------------------------------------------------------------------------
  // Spend Limits inline editing state
  // ---------------------------------------------------------------------------
  const [limits, setLimits] = useState({
    perTransaction: card.spendLimits.perTransaction,
    daily: card.spendLimits.daily,
    monthly: card.spendLimits.monthly,
  });
  const [editingLimit, setEditingLimit] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [limitSaving, setLimitSaving] = useState(false);

  // ---------------------------------------------------------------------------
  // Card Controls state
  // ---------------------------------------------------------------------------
  const [controls, setControls] = useState<ControlsState>(DEFAULT_CONTROLS);
  const [controlsDirty, setControlsDirty] = useState(false);
  const [controlsSaving, setControlsSaving] = useState(false);

  // Load controls from API on mount
  useEffect(() => {
    async function loadControls() {
      try {
        const res = await fetch(`/api/v1/cards/${card.id}`);
        if (res.ok) {
          const json = await res.json();
          if (json.data?.controls) {
            setControls(json.data.controls);
          }
        }
      } catch {
        // Silently fall back to defaults
      }
    }
    loadControls();
  }, [card.id]);

  // ---------------------------------------------------------------------------
  // Freeze / Unfreeze handler
  // ---------------------------------------------------------------------------
  const handleFreezeToggle = useCallback(async () => {
    setFreezeLoading(true);
    try {
      const action = isFrozen ? "unfreeze" : "freeze";
      const res = await fetch(`/api/v1/cards/${card.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const json = await res.json();
      if (res.ok && json.data) {
        setCardStatus(json.data.status);
        toast.success(
          isFrozen ? "Card unfrozen successfully" : "Card frozen successfully"
        );
      } else {
        toast.error(json.error || `Failed to ${action} card`);
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setFreezeLoading(false);
    }
  }, [card.id, isFrozen]);

  // ---------------------------------------------------------------------------
  // Spend Limit editing handlers
  // ---------------------------------------------------------------------------
  const startEditingLimit = (key: string, currentValue: number) => {
    setEditingLimit(key);
    setEditValue(String(currentValue));
  };

  const cancelEditingLimit = () => {
    setEditingLimit(null);
    setEditValue("");
  };

  const saveLimitEdit = useCallback(
    async (key: string) => {
      const newValue = parseInt(editValue, 10);
      if (isNaN(newValue) || newValue < 0) {
        toast.error("Please enter a valid positive number");
        return;
      }

      const newLimits = { ...limits, [key]: newValue };

      // Client-side validation
      if (newLimits.perTransaction > newLimits.daily) {
        toast.error("Per-transaction limit cannot exceed daily limit");
        return;
      }
      if (newLimits.daily > newLimits.monthly) {
        toast.error("Daily limit cannot exceed monthly limit");
        return;
      }

      setLimitSaving(true);
      try {
        const res = await fetch(`/api/v1/cards/${card.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ spendLimits: newLimits }),
        });

        const json = await res.json();
        if (res.ok && json.data) {
          setLimits(json.data.spendLimits);
          setEditingLimit(null);
          setEditValue("");
          toast.success("Spend limit updated successfully");
        } else {
          toast.error(json.error || "Failed to update spend limit");
        }
      } catch {
        toast.error("Network error. Please try again.");
      } finally {
        setLimitSaving(false);
      }
    },
    [card.id, editValue, limits]
  );

  // ---------------------------------------------------------------------------
  // Card Controls handlers
  // ---------------------------------------------------------------------------
  const updateChannelControl = (key: keyof ControlsState["channels"], value: boolean) => {
    setControls((prev) => ({
      ...prev,
      channels: { ...prev.channels, [key]: value },
    }));
    setControlsDirty(true);
  };

  const updateGeoControl = (key: keyof ControlsState["geographic"], value: boolean) => {
    setControls((prev) => ({
      ...prev,
      geographic: { ...prev.geographic, [key]: value },
    }));
    setControlsDirty(true);
  };

  const removeMccRestriction = (mcc: string) => {
    setControls((prev) => ({
      ...prev,
      mccRestrictions: prev.mccRestrictions.filter((m) => m !== mcc),
    }));
    setControlsDirty(true);
  };

  const addMccRestriction = (mcc: string) => {
    if (controls.mccRestrictions.includes(mcc)) return;
    setControls((prev) => ({
      ...prev,
      mccRestrictions: [...prev.mccRestrictions, mcc],
    }));
    setControlsDirty(true);
  };

  const saveControls = useCallback(async () => {
    setControlsSaving(true);
    try {
      const res = await fetch(`/api/v1/cards/${card.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ controls }),
      });

      const json = await res.json();
      if (res.ok) {
        setControlsDirty(false);
        toast.success("Card controls updated successfully");
      } else {
        toast.error(json.error || "Failed to update card controls");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setControlsSaving(false);
    }
  }, [card.id, controls]);

  // ---------------------------------------------------------------------------
  // Helper: check if a control matches the "company default"
  // (cosmetic hint; defaults are the initial values)
  // ---------------------------------------------------------------------------
  const isChannelDefault = (key: keyof ControlsState["channels"]) =>
    controls.channels[key] === DEFAULT_CONTROLS.channels[key];
  const isGeoDefault = (key: keyof ControlsState["geographic"]) =>
    controls.geographic[key] === DEFAULT_CONTROLS.geographic[key];

  // ---------------------------------------------------------------------------
  // Available MCC categories that are not already restricted
  // ---------------------------------------------------------------------------
  const availableMccToAdd = AVAILABLE_MCC_CATEGORIES.filter(
    (mcc) => !controls.mccRestrictions.includes(mcc)
  );

  // ---------------------------------------------------------------------------
  // Limit items config
  // ---------------------------------------------------------------------------
  const limitItems = [
    { key: "perTransaction", label: "Per Transaction", value: limits.perTransaction },
    { key: "daily", label: "Daily Limit", value: limits.daily },
    { key: "monthly", label: "Monthly Limit", value: limits.monthly },
  ];

  // ---------------------------------------------------------------------------
  // Channel controls config
  // ---------------------------------------------------------------------------
  const channelItems: {
    key: keyof ControlsState["channels"];
    label: string;
    icon: typeof ShoppingCart;
  }[] = [
    { key: "pos", label: "POS (Point of Sale)", icon: ShoppingCart },
    { key: "ecommerce", label: "E-Commerce", icon: Monitor },
    { key: "contactless", label: "Contactless (NFC)", icon: Wifi },
    { key: "mobileWallet", label: "Mobile Wallet", icon: Smartphone },
    { key: "atm", label: "ATM Withdrawal", icon: Banknote },
  ];

  // ---------------------------------------------------------------------------
  // Geographic controls config
  // ---------------------------------------------------------------------------
  const geoItems: {
    key: keyof ControlsState["geographic"];
    label: string;
    icon: typeof Globe;
  }[] = [
    { key: "international", label: "International Transactions", icon: Globe },
    { key: "domesticOnly", label: "Domestic Only", icon: MapPin },
  ];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title={`Card \u2022${card.last4Digits}`}
        description={`${card.type} ${card.network} card assigned to ${card.employeeName}`}
      >
        <Button variant="outline" asChild>
          <Link href="/cards">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </Button>
        <Button
          variant={isFrozen ? "default" : "destructive"}
          onClick={handleFreezeToggle}
          disabled={freezeLoading}
        >
          {freezeLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isFrozen ? (
            <PlayCircle className="w-4 h-4" />
          ) : (
            <Snowflake className="w-4 h-4" />
          )}
          {freezeLoading
            ? isFrozen
              ? "Unfreezing..."
              : "Freezing..."
            : isFrozen
              ? "Unfreeze"
              : "Freeze Card"}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card Visual */}
        <div className="flex flex-col items-center gap-4">
          <CardVisual3D card={{ ...card, status: cardStatus }} />
          {card.type === "VIRTUAL" && (
            <div className="flex gap-2 w-full max-w-sm">
              <Button variant="outline" size="sm" className="flex-1">
                <Copy className="w-3 h-3 mr-1" />
                Copy Number
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <Copy className="w-3 h-3 mr-1" />
                Copy CVV
              </Button>
            </div>
          )}
        </div>

        {/* Card Info */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Status</p>
                <StatusBadge status={cardStatus} />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Monthly Limit</p>
                <CurrencyDisplay amount={limits.monthly} compact className="text-lg font-bold" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Utilization</p>
                <p className="text-lg font-bold">{card.utilizationPercent}%</p>
                <Progress value={card.utilizationPercent} className="h-1.5 mt-1" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Transactions</p>
                <p className="text-lg font-bold">{transactions.length}</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="limits" className="space-y-3">
            <TabsList>
              <TabsTrigger value="limits">Spend Limits</TabsTrigger>
              <TabsTrigger value="controls">Card Controls</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
            </TabsList>

            {/* ============================================================= */}
            {/* Spend Limits Tab - Inline Editing                             */}
            {/* ============================================================= */}
            <TabsContent value="limits">
              <Card>
                <CardContent className="p-4 space-y-4">
                  {limitItems.map((limit) => (
                    <div key={limit.key} className="flex items-center justify-between">
                      <span className="text-sm">{limit.label}</span>
                      <div className="flex items-center gap-2">
                        {editingLimit === limit.key ? (
                          <>
                            <div className="flex items-center gap-1">
                              <span className="text-sm text-muted-foreground">&#8377;</span>
                              <Input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-32 h-8 text-sm"
                                min={0}
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveLimitEdit(limit.key);
                                  if (e.key === "Escape") cancelEditingLimit();
                                }}
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={() => saveLimitEdit(limit.key)}
                              disabled={limitSaving}
                            >
                              {limitSaving ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={cancelEditingLimit}
                              disabled={limitSaving}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <CurrencyDisplay amount={limit.value} className="text-sm font-medium" />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => startEditingLimit(limit.key, limit.value)}
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ============================================================= */}
            {/* Card Controls Tab - Toggle Switches + MCC Editing             */}
            {/* ============================================================= */}
            <TabsContent value="controls">
              <Card>
                <CardContent className="p-4 space-y-4">
                  {/* Channel Controls */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Channel Controls
                    </h4>
                    {channelItems.map((ch) => (
                      <div key={ch.key} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                          <ch.icon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{ch.label}</span>
                          {isChannelDefault(ch.key) && (
                            <span className="text-[9px] text-muted-foreground italic">
                              Inherited from Company
                            </span>
                          )}
                        </div>
                        <Switch
                          checked={controls.channels[ch.key]}
                          onCheckedChange={(checked) => updateChannelControl(ch.key, checked)}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Geographic Controls */}
                  <div className="space-y-3 pt-3 border-t">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Geographic Controls
                    </h4>
                    {geoItems.map((geo) => (
                      <div key={geo.key} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                          <geo.icon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{geo.label}</span>
                          {isGeoDefault(geo.key) && (
                            <span className="text-[9px] text-muted-foreground italic">
                              Inherited from Department
                            </span>
                          )}
                        </div>
                        <Switch
                          checked={controls.geographic[geo.key]}
                          onCheckedChange={(checked) => updateGeoControl(geo.key, checked)}
                        />
                      </div>
                    ))}
                  </div>

                  {/* MCC Restrictions */}
                  <div className="space-y-3 pt-3 border-t">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      MCC Restrictions
                    </h4>
                    <div className="flex gap-1.5 flex-wrap">
                      {controls.mccRestrictions.map((mcc) => (
                        <Badge
                          key={mcc}
                          variant="destructive"
                          className="text-[9px] cursor-pointer hover:bg-destructive/80 gap-1"
                          onClick={() => removeMccRestriction(mcc)}
                        >
                          {mcc}
                          <X className="w-2.5 h-2.5" />
                        </Badge>
                      ))}
                      {availableMccToAdd.length > 0 && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-6 text-[9px] px-2 gap-1">
                              <Plus className="w-2.5 h-2.5" />
                              Add
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="max-h-48 overflow-y-auto">
                            {availableMccToAdd.map((mcc) => (
                              <DropdownMenuItem
                                key={mcc}
                                onClick={() => addMccRestriction(mcc)}
                                className="text-xs cursor-pointer"
                              >
                                {mcc}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                    {controls.mccRestrictions.length === 0 && (
                      <p className="text-xs text-muted-foreground italic">
                        No MCC categories blocked. All merchant types are allowed.
                      </p>
                    )}
                  </div>

                  {/* Save Controls Button */}
                  <div className="pt-3 border-t flex justify-end">
                    <Button
                      onClick={saveControls}
                      disabled={!controlsDirty || controlsSaving}
                      size="sm"
                    >
                      {controlsSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      ) : (
                        <Save className="w-4 h-4 mr-1" />
                      )}
                      {controlsSaving ? "Saving..." : "Save Controls"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ============================================================= */}
            {/* Transactions Tab (read-only, unchanged)                       */}
            {/* ============================================================= */}
            <TabsContent value="transactions">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    {transactions.map((txn) => (
                      <div key={txn.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                          <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{txn.merchantName}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(txn.timestamp)} &middot; {txn.location.city}
                          </p>
                        </div>
                        <div className="text-right">
                          <CurrencyDisplay amount={txn.amount} className="text-sm font-medium" />
                          <StatusBadge status={txn.status} />
                        </div>
                      </div>
                    ))}
                    {transactions.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        No transactions found for this card.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
