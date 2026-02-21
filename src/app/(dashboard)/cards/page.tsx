"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { PageHeader } from "@/components/shared/page-header";
import { getCards, getEmployees } from "@/lib/store";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  CreditCard,
  Plus,
  Search,
  Snowflake,
  Sun,
  MoreHorizontal,
  Wifi,
  Eye,
  Settings2,
  ArrowRightLeft,
  Gauge,
  XCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type CardData = ReturnType<typeof getCards>[0];

function CardVisual({ card }: { card: CardData }) {
  const networkColors = {
    VISA: "from-blue-600 to-blue-800",
    MASTERCARD: "from-red-600 to-orange-600",
    RUPAY: "from-green-600 to-teal-700",
  };

  return (
    <div
      className={`relative w-full aspect-[1.586/1] rounded-xl bg-gradient-to-br ${
        networkColors[card.network as keyof typeof networkColors] || "from-gray-700 to-gray-900"
      } p-4 text-white shadow-lg overflow-hidden`}
    >
      {/* Background pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-6 -translate-x-6" />

      <div className="relative h-full flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div>
            {card.type === "VIRTUAL" && (
              <Badge className="bg-white/20 text-white border-0 text-[9px] mb-1">VIRTUAL</Badge>
            )}
            {card.type === "SINGLE_USE" && (
              <Badge className="bg-amber-500/30 text-white border-0 text-[9px] mb-1">SINGLE USE</Badge>
            )}
          </div>
          <Wifi className="w-5 h-5 text-white/60 rotate-90" />
        </div>

        <div>
          <p className="font-mono text-lg tracking-[0.2em] mb-2">
            **** **** **** {card.last4Digits}
          </p>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] text-white/60 uppercase">Cardholder</p>
              <p className="text-xs font-medium">{card.employeeName}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-white/60">EXP</p>
              <p className="text-xs font-medium">{card.expiryDate.slice(5, 7)}/{card.expiryDate.slice(2, 4)}</p>
            </div>
            <p className="text-sm font-bold tracking-wider">{card.network}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CardsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const employeeIdFilter = searchParams?.get("employeeId") ?? null;
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [loadingCardId, setLoadingCardId] = useState<string | null>(null);

  // Set Limits dialog state
  const [limitsDialogOpen, setLimitsDialogOpen] = useState(false);
  const [limitsCard, setLimitsCard] = useState<CardData | null>(null);
  const [limitsForm, setLimitsForm] = useState({
    perTransaction: 0,
    daily: 0,
    monthly: 0,
  });
  const [savingLimits, setSavingLimits] = useState(false);

  // Cancel Card confirmation state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelCard, setCancelCard] = useState<CardData | null>(null);
  const [cancellingCard, setCancellingCard] = useState(false);

  const allCards = getCards();
  const allEmployees = getEmployees();

  // Filter by employee if query param present
  const cards = employeeIdFilter
    ? allCards.filter((c) => c.employeeId === employeeIdFilter)
    : allCards;

  const filterEmployee = employeeIdFilter
    ? allEmployees.find((e) => e.id === employeeIdFilter)
    : null;

  const filteredCards = cards.filter((card) => {
    const matchesSearch =
      card.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.last4Digits.includes(searchQuery) ||
      card.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || card.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: cards.length,
    active: cards.filter((c) => c.status === "ACTIVE").length,
    frozen: cards.filter((c) => c.status === "FROZEN").length,
    virtual: cards.filter((c) => c.type === "VIRTUAL").length,
  };

  // ---------- Freeze / Unfreeze ----------
  async function handleFreezeToggle(card: CardData) {
    const newStatus = card.status === "FROZEN" ? "ACTIVE" : "FROZEN";
    setLoadingCardId(card.id);
    try {
      const res = await fetch(`/api/v1/cards/${card.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update card");
      }
      toast.success(
        newStatus === "FROZEN"
          ? `Card ****${card.last4Digits} has been frozen`
          : `Card ****${card.last4Digits} has been unfrozen`
      );
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update card status");
    } finally {
      setLoadingCardId(null);
    }
  }

  // ---------- Cancel Card ----------
  function openCancelDialog(card: CardData) {
    setCancelCard(card);
    setCancelDialogOpen(true);
  }

  async function handleCancelCard() {
    if (!cancelCard) return;
    setCancellingCard(true);
    try {
      const res = await fetch(`/api/v1/cards/${cancelCard.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to cancel card");
      }
      toast.success(`Card ****${cancelCard.last4Digits} has been cancelled`);
      setCancelDialogOpen(false);
      setCancelCard(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel card");
    } finally {
      setCancellingCard(false);
    }
  }

  // ---------- Set Limits ----------
  function openLimitsDialog(card: CardData) {
    setLimitsCard(card);
    setLimitsForm({
      perTransaction: card.spendLimits.perTransaction,
      daily: card.spendLimits.daily,
      monthly: card.spendLimits.monthly,
    });
    setLimitsDialogOpen(true);
  }

  async function handleSaveLimits() {
    if (!limitsCard) return;
    setSavingLimits(true);
    try {
      const res = await fetch(`/api/v1/cards/${limitsCard.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spendLimits: {
            perTransaction: limitsForm.perTransaction,
            daily: limitsForm.daily,
            monthly: limitsForm.monthly,
          },
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update limits");
      }
      toast.success(`Spend limits updated for card ****${limitsCard.last4Digits}`);
      setLimitsDialogOpen(false);
      setLimitsCard(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update limits");
    } finally {
      setSavingLimits(false);
    }
  }

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title={filterEmployee ? `Cards — ${filterEmployee.firstName} ${filterEmployee.lastName}` : "Card Management"}
        description={filterEmployee ? `Showing cards assigned to ${filterEmployee.firstName} ${filterEmployee.lastName}` : "Manage corporate cards across your organization"}
      >
        {filterEmployee && (
          <Button variant="outline" asChild>
            <Link href="/cards">Show All Cards</Link>
          </Button>
        )}
        <Button asChild>
          <Link href="/cards/new">
            <Plus className="w-4 h-4" />
            Request Card
          </Link>
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Cards", value: stats.total, icon: CreditCard },
          { label: "Active", value: stats.active, icon: Sun },
          { label: "Frozen", value: stats.frozen, icon: Snowflake },
          { label: "Virtual", value: stats.virtual, icon: Wifi },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <stat.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by cardholder, card number, department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-1">
          {["ALL", "ACTIVE", "FROZEN", "SUSPENDED"].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
            </Button>
          ))}
        </div>
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCards.slice(0, 12).map((card) => (
          <Card key={card.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-4">
              <CardVisual card={card} />
            </div>
            <CardContent className="pb-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{card.employeeName}</p>
                  <p className="text-xs text-muted-foreground">{card.department}</p>
                </div>
                <StatusBadge status={card.status} />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Monthly limit utilization</span>
                  <span className="font-medium">{card.utilizationPercent}%</span>
                </div>
                <Progress
                  value={card.utilizationPercent}
                  className="h-1.5"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Limit: <CurrencyDisplay amount={card.spendLimits.monthly} compact className="text-xs" /></span>
                <span>Expires: {card.expiryDate.slice(5, 7)}/{card.expiryDate.slice(2, 4)}</span>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link href={`/cards/${card.id}`}>
                    <Eye className="w-3 h-3" /> View
                  </Link>
                </Button>
                <Button
                  variant={card.status === "FROZEN" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  disabled={loadingCardId === card.id || card.status === "CANCELLED"}
                  onClick={() => handleFreezeToggle(card)}
                >
                  {card.status === "FROZEN" ? (
                    <><Sun className="w-3 h-3" /> Unfreeze</>
                  ) : (
                    <><Snowflake className="w-3 h-3" /> Freeze</>
                  )}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push(`/cards/${card.id}`)}>
                      <Settings2 className="w-3.5 h-3.5 mr-2" />
                      Edit Controls
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push(`/transactions?cardId=${card.id}`)}>
                      <ArrowRightLeft className="w-3.5 h-3.5 mr-2" />
                      View Transactions
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openLimitsDialog(card)}>
                      <Gauge className="w-3.5 h-3.5 mr-2" />
                      Set Limits
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      disabled={card.status === "CANCELLED"}
                      onClick={() => openCancelDialog(card)}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-2" />
                      Cancel Card
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ---- Set Limits Dialog ---- */}
      <Dialog open={limitsDialogOpen} onOpenChange={setLimitsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Spend Limits</DialogTitle>
            <DialogDescription>
              {limitsCard
                ? `Adjust spend limits for card ****${limitsCard.last4Digits} (${limitsCard.employeeName})`
                : "Adjust spend limits for this card"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Per Transaction Limit (INR)</label>
              <Input
                type="number"
                value={limitsForm.perTransaction}
                onChange={(e) =>
                  setLimitsForm((f) => ({ ...f, perTransaction: parseInt(e.target.value) || 0 }))
                }
              />
              <input
                type="range"
                min={0}
                max={500000}
                step={5000}
                value={limitsForm.perTransaction}
                onChange={(e) =>
                  setLimitsForm((f) => ({ ...f, perTransaction: parseInt(e.target.value) }))
                }
                className="w-full accent-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Daily Limit (INR)</label>
              <Input
                type="number"
                value={limitsForm.daily}
                onChange={(e) =>
                  setLimitsForm((f) => ({ ...f, daily: parseInt(e.target.value) || 0 }))
                }
              />
              <input
                type="range"
                min={0}
                max={1000000}
                step={10000}
                value={limitsForm.daily}
                onChange={(e) =>
                  setLimitsForm((f) => ({ ...f, daily: parseInt(e.target.value) }))
                }
                className="w-full accent-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Monthly Limit (INR)</label>
              <Input
                type="number"
                value={limitsForm.monthly}
                onChange={(e) =>
                  setLimitsForm((f) => ({ ...f, monthly: parseInt(e.target.value) || 0 }))
                }
              />
              <input
                type="range"
                min={0}
                max={5000000}
                step={50000}
                value={limitsForm.monthly}
                onChange={(e) =>
                  setLimitsForm((f) => ({ ...f, monthly: parseInt(e.target.value) }))
                }
                className="w-full accent-primary"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLimitsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveLimits} disabled={savingLimits}>
              {savingLimits ? "Saving..." : "Save Limits"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Cancel Card Confirmation ---- */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Card</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelCard
                ? `Are you sure you want to permanently cancel card ****${cancelCard.last4Digits} assigned to ${cancelCard.employeeName}? This action cannot be undone.`
                : "Are you sure you want to cancel this card?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancellingCard}>Keep Card</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelCard}
              disabled={cancellingCard}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancellingCard ? "Cancelling..." : "Yes, Cancel Card"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
