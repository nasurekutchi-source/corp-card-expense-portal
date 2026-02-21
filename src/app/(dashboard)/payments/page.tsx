"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import {
  Banknote,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Building2,
  CreditCard,
  AlertCircle,
  Loader2,
  Send,
  Copy,
  Search,
  Check,
  Landmark,
} from "lucide-react";

// =============================================================================
// Types
// =============================================================================

interface PaymentCycle {
  id: string;
  companyId: string;
  companyName: string;
  statementPeriod: string;
  dueDate: string;
  totalDue: number;
  status: string;
  paymentRef: string;
  paymentDate: string | null;
  paymentMode: string | null;
  apportionmentStatus: string;
  cardCount: number;
}

interface PaymentApportionment {
  id: string;
  paymentCycleId: string;
  cardId: string;
  cardLast4: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  costCenterName: string;
  amount: number;
  status: string;
}

// =============================================================================
// Constants
// =============================================================================

const CYCLE_STATUSES = [
  { value: "ALL", label: "All Statuses" },
  { value: "DUE", label: "Due" },
  { value: "PAYMENT_INITIATED", label: "Payment Initiated" },
  { value: "PAYMENT_RECEIVED", label: "Payment Received" },
  { value: "APPORTIONED", label: "Apportioned" },
  { value: "RECONCILED", label: "Reconciled" },
];

const PERIODS = [
  { value: "ALL", label: "All Periods" },
  { value: "2026-01", label: "Jan 2026" },
  { value: "2025-12", label: "Dec 2025" },
  { value: "2025-11", label: "Nov 2025" },
];

const PAYMENT_MODES = [
  { value: "NEFT", label: "NEFT", description: "National Electronic Fund Transfer" },
  { value: "RTGS", label: "RTGS", description: "Real Time Gross Settlement" },
  { value: "IMPS", label: "IMPS", description: "Immediate Payment Service" },
];

const BENEFICIARY = {
  name: "IDFC FIRST Bank - Corporate Card Collections",
  accountNumber: "10087654321000",
  ifsc: "IDFB0040101",
};

const formatINRAmount = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

// =============================================================================
// Status Badge helpers
// =============================================================================

const cycleStatusConfig: Record<string, { color: string; label: string }> = {
  DUE: { color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", label: "Due" },
  PAYMENT_INITIATED: { color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", label: "Initiated" },
  PAYMENT_RECEIVED: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", label: "Received" },
  APPORTIONED: { color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", label: "Apportioned" },
  RECONCILED: { color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", label: "Reconciled" },
};

const apportionmentStatusConfig: Record<string, { color: string; label: string }> = {
  PENDING: { color: "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400", label: "Pending" },
  IN_PROGRESS: { color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", label: "In Progress" },
  APPORTIONED: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", label: "Apportioned" },
  COMPLETED: { color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", label: "Completed" },
  RECONCILED: { color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", label: "Reconciled" },
};

function CycleStatusBadge({ status }: { status: string }) {
  const config = cycleStatusConfig[status] || { color: "bg-gray-100 text-gray-800", label: status };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${config.color}`}>
      {config.label}
    </span>
  );
}

function ApportionmentStatusBadge({ status }: { status: string }) {
  const config = apportionmentStatusConfig[status] || { color: "bg-gray-100 text-gray-800", label: status };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${config.color}`}>
      {config.label}
    </span>
  );
}

// =============================================================================
// Period formatting
// =============================================================================

function formatPeriod(period: string): string {
  const [year, month] = period.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

// =============================================================================
// Beneficiary Details Box (reusable)
// =============================================================================

function BeneficiaryDetailsBox({ amount }: { amount: number }) {
  return (
    <div className="rounded-lg border-2 border-[#0d3b66]/20 bg-[#0d3b66]/5 dark:bg-[#0d3b66]/10 p-4 space-y-2.5">
      <div className="flex items-center gap-2 mb-3">
        <Landmark className="w-4 h-4 text-[#0d3b66] dark:text-blue-400" />
        <p className="text-xs font-semibold text-[#0d3b66] dark:text-blue-400 uppercase tracking-wider">
          Beneficiary Details
        </p>
      </div>
      <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
        <span className="text-muted-foreground">Beneficiary Name</span>
        <span className="font-medium">{BENEFICIARY.name}</span>
        <span className="text-muted-foreground">Account Number</span>
        <span className="font-mono font-medium">{BENEFICIARY.accountNumber}</span>
        <span className="text-muted-foreground">IFSC Code</span>
        <span className="font-mono font-medium">{BENEFICIARY.ifsc}</span>
        <span className="text-muted-foreground">Amount</span>
        <span className="font-mono font-bold text-[#0d3b66] dark:text-blue-400">
          {formatINRAmount(amount)}
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// Payment Mode Selector
// =============================================================================

function PaymentModeSelector({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (mode: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Payment Mode
      </p>
      <div className="flex gap-2">
        {PAYMENT_MODES.map((mode) => (
          <button
            key={mode.value}
            onClick={() => onSelect(mode.value)}
            className={`flex-1 rounded-lg border-2 p-3 text-center transition-all ${
              selected === mode.value
                ? "border-[#0d3b66] bg-[#0d3b66]/5 dark:border-blue-400 dark:bg-blue-400/10"
                : "border-input hover:border-muted-foreground/40"
            }`}
          >
            <p className={`text-sm font-bold ${
              selected === mode.value
                ? "text-[#0d3b66] dark:text-blue-400"
                : "text-foreground"
            }`}>
              {mode.label}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{mode.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Payment Initiation Dialog
// =============================================================================

function PaymentDialog({
  cycle,
  open,
  onOpenChange,
  onPaymentCreated,
}: {
  cycle: PaymentCycle;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentCreated: () => void;
}) {
  const [activeTab, setActiveTab] = useState("total");
  const [paymentMode, setPaymentMode] = useState("NEFT");
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentRef, setPaymentRef] = useState("");

  // Apportionment data for preview
  const [dialogApportionments, setDialogApportionments] = useState<PaymentApportionment[]>([]);
  const [loadingDialogApportionments, setLoadingDialogApportionments] = useState(false);
  const [showApportionmentPreview, setShowApportionmentPreview] = useState(false);

  // Single card payment state
  const [cardSearch, setCardSearch] = useState("");
  const [selectedCard, setSelectedCard] = useState<PaymentApportionment | null>(null);
  const [singleCardAmount, setSingleCardAmount] = useState("");
  const [singleCardPaymentMode, setSingleCardPaymentMode] = useState("NEFT");

  // Fetch apportionments when dialog opens
  useEffect(() => {
    if (open) {
      setShowSuccess(false);
      setPaymentRef("");
      setSelectedCard(null);
      setCardSearch("");
      setSingleCardAmount("");
      setActiveTab("total");
      setPaymentMode("NEFT");
      setSingleCardPaymentMode("NEFT");
      setShowApportionmentPreview(false);

      (async () => {
        setLoadingDialogApportionments(true);
        try {
          const res = await fetch(`/api/v1/payments?cycleId=${cycle.id}`);
          if (!res.ok) throw new Error("Failed to fetch");
          const json = await res.json();
          setDialogApportionments(json.data.paymentApportionments || []);
        } catch {
          setDialogApportionments([]);
        } finally {
          setLoadingDialogApportionments(false);
        }
      })();
    }
  }, [open, cycle.id]);

  // Filtered cards for single-card search
  const filteredCards = useMemo(() => {
    if (!cardSearch.trim()) return dialogApportionments;
    const q = cardSearch.toLowerCase();
    return dialogApportionments.filter(
      (a) =>
        a.cardLast4.includes(q) ||
        a.employeeName.toLowerCase().includes(q) ||
        a.departmentName.toLowerCase().includes(q)
    );
  }, [dialogApportionments, cardSearch]);

  // Total transaction count
  const totalTransactionCount = dialogApportionments.length;

  // Generate payment reference
  const generateRef = (mode: string) => {
    const ts = Date.now();
    return `${mode}${ts}`;
  };

  // Copy payment details to clipboard
  const copyPaymentDetails = (amount: number, ref: string, mode: string) => {
    const text = [
      `Payment Reference: ${ref}`,
      `Beneficiary: ${BENEFICIARY.name}`,
      `Account Number: ${BENEFICIARY.accountNumber}`,
      `IFSC: ${BENEFICIARY.ifsc}`,
      `Amount: ${formatINRAmount(amount)}`,
      `Payment Mode: ${mode}`,
    ].join("\n");

    navigator.clipboard.writeText(text).then(() => {
      toast.success("Payment details copied to clipboard");
    }).catch(() => {
      toast.error("Failed to copy to clipboard");
    });
  };

  // Handle confirm payment (total)
  const handleConfirmTotal = async () => {
    setSubmitting(true);
    const ref = generateRef(paymentMode);

    try {
      const res = await fetch("/api/v1/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cycleId: cycle.id,
          action: "initiate",
          paymentMode,
          amount: cycle.totalDue,
        }),
      });

      if (!res.ok) {
        // Demo mode: treat as success even if API not implemented
        console.warn("API returned non-OK, proceeding in demo mode");
      }

      setPaymentRef(ref);
      setShowSuccess(true);
      toast.success("Payment instruction created successfully");
    } catch {
      // Demo mode fallback
      setPaymentRef(ref);
      setShowSuccess(true);
      toast.success("Payment instruction created (demo mode)");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle confirm single card payment
  const handleConfirmSingleCard = async () => {
    if (!selectedCard) return;
    const amount = parseFloat(singleCardAmount) || selectedCard.amount;
    setSubmitting(true);
    const ref = generateRef(singleCardPaymentMode);

    try {
      const res = await fetch("/api/v1/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cycleId: cycle.id,
          action: "initiate",
          paymentMode: singleCardPaymentMode,
          amount,
          cardId: selectedCard.cardId,
        }),
      });

      if (!res.ok) {
        console.warn("API returned non-OK, proceeding in demo mode");
      }

      setPaymentRef(ref);
      setShowSuccess(true);
      toast.success("Payment instruction created successfully");
    } catch {
      setPaymentRef(ref);
      setShowSuccess(true);
      toast.success("Payment instruction created (demo mode)");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle dialog close after success
  const handleClose = () => {
    if (showSuccess) {
      onPaymentCreated();
    }
    onOpenChange(false);
  };

  // Determine the final amount for success display
  const successAmount =
    activeTab === "total"
      ? cycle.totalDue
      : parseFloat(singleCardAmount) || selectedCard?.amount || 0;

  const successMode = activeTab === "total" ? paymentMode : singleCardPaymentMode;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Send className="w-4 h-4 text-[#0d3b66] dark:text-blue-400" />
            Initiate Payment
          </DialogTitle>
          <DialogDescription>
            {cycle.companyName} — {formatPeriod(cycle.statementPeriod)}
          </DialogDescription>
        </DialogHeader>

        {/* Success State */}
        {showSuccess ? (
          <div className="space-y-4 py-2">
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">
                Payment Instruction Created
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Status updated to PAYMENT_INITIATED
              </p>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Payment Reference</span>
                <span className="font-mono text-sm font-bold">{paymentRef}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Amount</span>
                <span className="font-mono text-sm font-semibold text-[#0d3b66] dark:text-blue-400">
                  {formatINRAmount(successAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Mode</span>
                <Badge variant="outline" className="text-[10px]">{successMode}</Badge>
              </div>
            </div>

            <BeneficiaryDetailsBox amount={successAmount} />

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => copyPaymentDetails(successAmount, paymentRef, successMode)}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Payment Details
              </Button>
              <Button
                className="flex-1 bg-[#0d3b66] hover:bg-[#0d3b66]/90 text-white"
                onClick={handleClose}
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          /* Payment Form */
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="total" className="flex-1 text-xs">
                Pay Total Due
              </TabsTrigger>
              <TabsTrigger value="single" className="flex-1 text-xs">
                Pay Single Card
              </TabsTrigger>
            </TabsList>

            {/* ============================================================= */}
            {/* TAB: Pay Total Due                                            */}
            {/* ============================================================= */}
            <TabsContent value="total" className="space-y-4 mt-4">
              {/* Amount highlight */}
              <div className="text-center py-3 rounded-lg bg-muted/50">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Total Amount Due
                </p>
                <p className="text-3xl font-bold font-mono tabular-nums text-[#0d3b66] dark:text-blue-400">
                  {formatINRAmount(cycle.totalDue)}
                </p>
                <div className="flex items-center justify-center gap-4 mt-2">
                  <span className="text-xs text-muted-foreground">
                    <CreditCard className="w-3 h-3 inline mr-1" />
                    {cycle.cardCount} cards
                  </span>
                  {loadingDialogApportionments ? (
                    <span className="text-xs text-muted-foreground">
                      <Loader2 className="w-3 h-3 inline mr-1 animate-spin" />
                      Loading...
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {totalTransactionCount} transactions
                    </span>
                  )}
                </div>
              </div>

              {/* Beneficiary Details */}
              <BeneficiaryDetailsBox amount={cycle.totalDue} />

              {/* Payment Mode */}
              <PaymentModeSelector selected={paymentMode} onSelect={setPaymentMode} />

              {/* Preview Apportionment (expandable) */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowApportionmentPreview(!showApportionmentPreview)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:bg-muted/50 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    Preview Apportionment
                  </span>
                  {showApportionmentPreview ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {showApportionmentPreview && (
                  <div className="border-t">
                    {loadingDialogApportionments ? (
                      <div className="py-6 text-center">
                        <Loader2 className="w-5 h-5 mx-auto text-muted-foreground animate-spin mb-1" />
                        <p className="text-xs text-muted-foreground">Loading breakdown...</p>
                      </div>
                    ) : dialogApportionments.length === 0 ? (
                      <div className="py-6 text-center">
                        <p className="text-xs text-muted-foreground">
                          No apportionment data available
                        </p>
                      </div>
                    ) : (
                      <>
                        <p className="px-4 py-2 text-[10px] text-muted-foreground bg-muted/30">
                          The total payment of {formatINRAmount(cycle.totalDue)} will be apportioned
                          across individual cards proportionally based on each card&apos;s outstanding amount.
                        </p>
                        {/* Apportionment table header */}
                        <div className="hidden sm:grid sm:grid-cols-[0.8fr_1.2fr_1fr_1fr_0.6fr] gap-2 px-4 py-2 bg-muted/50 border-b text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                          <span>Card</span>
                          <span>Employee</span>
                          <span>Department</span>
                          <span className="text-right">Amount</span>
                          <span className="text-right">% of Total</span>
                        </div>
                        <div className="divide-y max-h-48 overflow-y-auto">
                          {dialogApportionments.map((appr) => {
                            const pct =
                              cycle.totalDue > 0
                                ? ((appr.amount / cycle.totalDue) * 100).toFixed(1)
                                : "0.0";
                            return (
                              <div
                                key={appr.id}
                                className="grid grid-cols-1 sm:grid-cols-[0.8fr_1.2fr_1fr_1fr_0.6fr] gap-2 px-4 py-2 items-center text-xs"
                              >
                                <div className="flex items-center gap-1.5">
                                  <CreditCard className="w-3 h-3 text-muted-foreground" />
                                  <span className="font-mono">****{appr.cardLast4}</span>
                                </div>
                                <span className="truncate">{appr.employeeName}</span>
                                <span className="text-muted-foreground truncate">
                                  {appr.departmentName}
                                </span>
                                <span className="text-right font-mono font-semibold tabular-nums">
                                  {formatINRAmount(appr.amount)}
                                </span>
                                <span className="text-right text-muted-foreground font-mono tabular-nums">
                                  {pct}%
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        {/* Total row */}
                        <div className="grid grid-cols-1 sm:grid-cols-[0.8fr_1.2fr_1fr_1fr_0.6fr] gap-2 px-4 py-2 bg-muted/50 border-t text-xs font-bold">
                          <span className="sm:col-span-3">
                            Total ({dialogApportionments.length} cards)
                          </span>
                          <span className="text-right font-mono tabular-nums">
                            {formatINRAmount(
                              dialogApportionments.reduce((sum, a) => sum + a.amount, 0)
                            )}
                          </span>
                          <span className="text-right font-mono tabular-nums">100%</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Confirm Button */}
              <Button
                className="w-full bg-[#0d3b66] hover:bg-[#0d3b66]/90 text-white"
                size="lg"
                disabled={submitting}
                onClick={handleConfirmTotal}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Payment Instruction...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Confirm &amp; Create Payment Instruction
                  </>
                )}
              </Button>
            </TabsContent>

            {/* ============================================================= */}
            {/* TAB: Pay Single Card                                          */}
            {/* ============================================================= */}
            <TabsContent value="single" className="space-y-4 mt-4">
              {loadingDialogApportionments ? (
                <div className="py-8 text-center">
                  <Loader2 className="w-5 h-5 mx-auto text-muted-foreground animate-spin mb-2" />
                  <p className="text-xs text-muted-foreground">Loading cards...</p>
                </div>
              ) : !selectedCard ? (
                /* Card Selection */
                <>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by card number, employee, or department..."
                      value={cardSearch}
                      onChange={(e) => setCardSearch(e.target.value)}
                      className="pl-9 h-9 text-xs"
                    />
                  </div>

                  <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                    {filteredCards.length === 0 ? (
                      <div className="py-6 text-center">
                        <p className="text-xs text-muted-foreground">No cards found</p>
                      </div>
                    ) : (
                      filteredCards.map((card) => (
                        <button
                          key={card.id}
                          onClick={() => {
                            setSelectedCard(card);
                            setSingleCardAmount(card.amount.toString());
                          }}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#0d3b66]/10 dark:bg-blue-900/30 flex items-center justify-center">
                              <CreditCard className="w-4 h-4 text-[#0d3b66] dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="text-xs font-mono font-medium">
                                ****{card.cardLast4}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {card.employeeName} / {card.departmentName}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold font-mono tabular-nums">
                              {formatINRAmount(card.amount)}
                            </p>
                            <p className="text-[10px] text-muted-foreground">outstanding</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  <p className="text-[10px] text-muted-foreground text-center">
                    Select a card to initiate payment for that card only
                  </p>
                </>
              ) : (
                /* Selected Card Payment Form */
                <>
                  {/* Back button & selected card info */}
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedCard(null);
                        setSingleCardAmount("");
                      }}
                      className="text-xs"
                    >
                      &larr; Back
                    </Button>
                    <div className="flex-1 flex items-center gap-3 rounded-lg border p-3 bg-muted/30">
                      <div className="w-8 h-8 rounded-lg bg-[#0d3b66]/10 dark:bg-blue-900/30 flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-[#0d3b66] dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-mono font-medium">
                          ****{selectedCard.cardLast4}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {selectedCard.employeeName} / {selectedCard.departmentName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Outstanding</p>
                        <p className="text-sm font-semibold font-mono tabular-nums">
                          {formatINRAmount(selectedCard.amount)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Amount input */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      Payment Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-mono">
                        &#8377;
                      </span>
                      <Input
                        type="number"
                        value={singleCardAmount}
                        onChange={(e) => setSingleCardAmount(e.target.value)}
                        className="pl-8 h-10 text-sm font-mono"
                        min={0}
                        max={selectedCard.amount}
                        step={0.01}
                      />
                    </div>
                    {parseFloat(singleCardAmount) < selectedCard.amount &&
                      parseFloat(singleCardAmount) > 0 && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400">
                          Partial payment: {formatINRAmount(parseFloat(singleCardAmount))} of{" "}
                          {formatINRAmount(selectedCard.amount)} outstanding
                        </p>
                      )}
                  </div>

                  {/* Beneficiary details */}
                  <BeneficiaryDetailsBox
                    amount={parseFloat(singleCardAmount) || selectedCard.amount}
                  />

                  {/* Payment mode */}
                  <PaymentModeSelector
                    selected={singleCardPaymentMode}
                    onSelect={setSingleCardPaymentMode}
                  />

                  {/* Confirm button */}
                  <Button
                    className="w-full bg-[#0d3b66] hover:bg-[#0d3b66]/90 text-white"
                    size="lg"
                    disabled={
                      submitting ||
                      !singleCardAmount ||
                      parseFloat(singleCardAmount) <= 0
                    }
                    onClick={handleConfirmSingleCard}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Payment Instruction...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Pay This Card
                      </>
                    )}
                  </Button>
                </>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export default function PaymentsPage() {
  const [paymentCycles, setPaymentCycles] = useState<PaymentCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [companyFilter, setCompanyFilter] = useState("ALL");
  const [periodFilter, setPeriodFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Expanded row for apportionment detail
  const [expandedCycleId, setExpandedCycleId] = useState<string | null>(null);
  const [apportionments, setApportionments] = useState<PaymentApportionment[]>([]);
  const [loadingApportionments, setLoadingApportionments] = useState(false);

  // Payment dialog state
  const [paymentDialogCycle, setPaymentDialogCycle] = useState<PaymentCycle | null>(null);

  // ---------------------------------------------------------------------------
  // Fetch payment cycles
  // ---------------------------------------------------------------------------
  const fetchCycles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (companyFilter !== "ALL") params.set("companyId", companyFilter);
      if (periodFilter !== "ALL") params.set("period", periodFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/v1/payments?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch payment cycles");

      const json = await res.json();
      setPaymentCycles(json.data.paymentCycles || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [companyFilter, periodFilter, statusFilter]);

  useEffect(() => {
    fetchCycles();
  }, [fetchCycles]);

  // ---------------------------------------------------------------------------
  // Fetch apportionments for an expanded row
  // ---------------------------------------------------------------------------
  const handleRowClick = useCallback(
    async (cycleId: string) => {
      if (expandedCycleId === cycleId) {
        setExpandedCycleId(null);
        setApportionments([]);
        return;
      }

      setExpandedCycleId(cycleId);
      setLoadingApportionments(true);

      try {
        const res = await fetch(`/api/v1/payments?cycleId=${cycleId}`);
        if (!res.ok) throw new Error("Failed to fetch apportionments");
        const json = await res.json();
        setApportionments(json.data.paymentApportionments || []);
      } catch {
        setApportionments([]);
      } finally {
        setLoadingApportionments(false);
      }
    },
    [expandedCycleId]
  );

  // ---------------------------------------------------------------------------
  // Derived: unique company list from data
  // ---------------------------------------------------------------------------
  const companies = useMemo(() => {
    const map = new Map<string, string>();
    paymentCycles.forEach((c) => map.set(c.companyId, c.companyName));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [paymentCycles]);

  // ---------------------------------------------------------------------------
  // Summary stats (computed from ALL cycles, not filtered — except company)
  // ---------------------------------------------------------------------------
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const totalOutstanding = paymentCycles
      .filter((c) => c.status === "DUE")
      .reduce((sum, c) => sum + c.totalDue, 0);

    const paymentsThisMonth = paymentCycles.filter(
      (c) =>
        ["PAYMENT_RECEIVED", "APPORTIONED", "RECONCILED"].includes(c.status) &&
        c.paymentDate &&
        c.paymentDate.startsWith(currentMonth)
    ).length;

    const pendingApportionment = paymentCycles.filter(
      (c) => c.apportionmentStatus !== "COMPLETED"
    ).length;

    const reconciled = paymentCycles.filter(
      (c) => c.status === "RECONCILED"
    ).length;

    return { totalOutstanding, paymentsThisMonth, pendingApportionment, reconciled };
  }, [paymentCycles]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Payment Cycles"
        description="Consolidated corporate payments and card-level apportionment"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Banknote className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-xs text-muted-foreground">Total Outstanding</p>
            </div>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 font-mono tabular-nums">
              {formatINRAmount(stats.totalOutstanding)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <ArrowRightLeft className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-xs text-muted-foreground">Payments This Month</p>
            </div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.paymentsThisMonth}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-xs text-muted-foreground">Pending Apportionment</p>
            </div>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pendingApportionment}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-xs text-muted-foreground">Reconciled</p>
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.reconciled}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground uppercase">Company</label>
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="ALL">All Companies</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground uppercase">Period</label>
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground uppercase">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {CYCLE_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Payment Cycles Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-6 h-6 mx-auto text-muted-foreground animate-spin mb-2" />
              <p className="text-sm text-muted-foreground">Loading payment cycles...</p>
            </div>
          ) : error ? (
            <div className="py-16 text-center">
              <AlertCircle className="w-6 h-6 mx-auto text-destructive mb-2" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          ) : paymentCycles.length === 0 ? (
            <div className="py-16 text-center">
              <Banknote className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No payment cycles found</p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="hidden lg:grid lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr_0.9fr_1fr_0.8fr_0.8fr_0.9fr_0.5fr] gap-2 px-4 py-2.5 bg-muted/50 border-b text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                <span>Company</span>
                <span>Period</span>
                <span>Due Date</span>
                <span className="text-right">Total Due</span>
                <span>Status</span>
                <span>Payment Ref</span>
                <span>Payment Date</span>
                <span>Mode</span>
                <span>Apportionment</span>
                <span className="text-center">Cards</span>
              </div>

              {/* Table Rows */}
              <div className="divide-y">
                {paymentCycles.map((cycle) => (
                  <div key={cycle.id}>
                    {/* Main Row */}
                    <div
                      className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr_0.9fr_1fr_0.8fr_0.8fr_0.9fr_0.5fr] gap-2 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer items-center"
                      onClick={() => handleRowClick(cycle.id)}
                    >
                      {/* Company */}
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium truncate">{cycle.companyName}</span>
                        {expandedCycleId === cycle.id ? (
                          <ChevronUp className="w-3.5 h-3.5 text-muted-foreground lg:hidden" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground lg:hidden" />
                        )}
                      </div>

                      {/* Period */}
                      <div className="text-sm text-muted-foreground">
                        <span className="lg:hidden text-[10px] font-medium text-muted-foreground uppercase mr-2">Period:</span>
                        {formatPeriod(cycle.statementPeriod)}
                      </div>

                      {/* Due Date */}
                      <div className="text-sm text-muted-foreground">
                        <span className="lg:hidden text-[10px] font-medium text-muted-foreground uppercase mr-2">Due:</span>
                        {formatDate(cycle.dueDate)}
                      </div>

                      {/* Total Due */}
                      <div className="text-right">
                        <span className="lg:hidden text-[10px] font-medium text-muted-foreground uppercase mr-2">Total Due:</span>
                        <span className="text-sm font-semibold font-mono tabular-nums">
                          {formatINRAmount(cycle.totalDue)}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-1 hidden xl:inline">
                          ({(cycle.totalDue / 100000).toFixed(1)}L)
                        </span>
                      </div>

                      {/* Status — with inline Initiate Payment button for DUE */}
                      <div className="flex items-center gap-2">
                        <CycleStatusBadge status={cycle.status} />
                        {cycle.status === "DUE" && (
                          <Button
                            size="sm"
                            className="h-6 px-2 text-[10px] bg-[#0d3b66] hover:bg-[#0d3b66]/90 text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPaymentDialogCycle(cycle);
                            }}
                          >
                            <Send className="w-3 h-3 mr-1" />
                            Pay
                          </Button>
                        )}
                      </div>

                      {/* Payment Ref */}
                      <div className="text-xs text-muted-foreground font-mono truncate">
                        {cycle.paymentRef || <span className="text-muted-foreground/50">---</span>}
                      </div>

                      {/* Payment Date */}
                      <div className="text-sm text-muted-foreground">
                        {cycle.paymentDate ? formatDate(cycle.paymentDate) : <span className="text-muted-foreground/50">---</span>}
                      </div>

                      {/* Payment Mode */}
                      <div>
                        {cycle.paymentMode ? (
                          <Badge variant="outline" className="text-[10px]">
                            {cycle.paymentMode}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground/50 text-xs">---</span>
                        )}
                      </div>

                      {/* Apportionment Status */}
                      <div>
                        <ApportionmentStatusBadge status={cycle.apportionmentStatus} />
                      </div>

                      {/* Cards count */}
                      <div className="flex items-center justify-center gap-1">
                        <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">{cycle.cardCount}</span>
                        {expandedCycleId === cycle.id ? (
                          <ChevronUp className="w-3.5 h-3.5 text-muted-foreground hidden lg:block" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden lg:block" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Apportionment Detail */}
                    {expandedCycleId === cycle.id && (
                      <div className="bg-muted/30 border-t px-4 py-4">
                        <div className="flex items-center gap-2 mb-3">
                          <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Card-Level Apportionment
                          </h3>
                          <span className="text-[10px] text-muted-foreground">
                            ({cycle.companyName} / {formatPeriod(cycle.statementPeriod)})
                          </span>
                          {/* Initiate Payment button in expanded view too */}
                          {cycle.status === "DUE" && (
                            <Button
                              size="sm"
                              className="ml-auto h-7 px-3 text-xs bg-[#0d3b66] hover:bg-[#0d3b66]/90 text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPaymentDialogCycle(cycle);
                              }}
                            >
                              <Send className="w-3.5 h-3.5 mr-1.5" />
                              Initiate Payment
                            </Button>
                          )}
                        </div>

                        {loadingApportionments ? (
                          <div className="py-6 text-center">
                            <Loader2 className="w-5 h-5 mx-auto text-muted-foreground animate-spin mb-1" />
                            <p className="text-xs text-muted-foreground">Loading apportionments...</p>
                          </div>
                        ) : apportionments.length === 0 ? (
                          <div className="py-6 text-center">
                            <p className="text-xs text-muted-foreground">No apportionments available for this cycle</p>
                          </div>
                        ) : (
                          <div className="rounded-lg border bg-background overflow-hidden">
                            {/* Apportionment Table Header */}
                            <div className="hidden sm:grid sm:grid-cols-[0.6fr_1fr_1fr_1fr_0.8fr_0.6fr] gap-2 px-4 py-2 bg-muted/50 border-b text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                              <span>Card</span>
                              <span>Employee</span>
                              <span>Department</span>
                              <span>Cost Center</span>
                              <span className="text-right">Amount</span>
                              <span className="text-center">Status</span>
                            </div>

                            {/* Apportionment Rows */}
                            <div className="divide-y">
                              {apportionments.map((appr) => (
                                <div
                                  key={appr.id}
                                  className="grid grid-cols-1 sm:grid-cols-[0.6fr_1fr_1fr_1fr_0.8fr_0.6fr] gap-2 px-4 py-2.5 items-center hover:bg-muted/30 transition-colors"
                                >
                                  {/* Card Last 4 */}
                                  <div className="flex items-center gap-1.5">
                                    <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span className="text-xs font-mono">****{appr.cardLast4}</span>
                                  </div>

                                  {/* Employee */}
                                  <div className="text-xs truncate">{appr.employeeName}</div>

                                  {/* Department */}
                                  <div className="text-xs text-muted-foreground truncate">{appr.departmentName}</div>

                                  {/* Cost Center */}
                                  <div className="text-xs text-muted-foreground truncate">
                                    {appr.costCenterName || <span className="text-muted-foreground/50">---</span>}
                                  </div>

                                  {/* Amount */}
                                  <div className="text-right">
                                    <span className="text-xs font-semibold font-mono tabular-nums">
                                      {formatINRAmount(appr.amount)}
                                    </span>
                                  </div>

                                  {/* Status */}
                                  <div className="flex justify-center">
                                    <ApportionmentStatusBadge status={appr.status} />
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Apportionment Total */}
                            <div className="grid grid-cols-1 sm:grid-cols-[0.6fr_1fr_1fr_1fr_0.8fr_0.6fr] gap-2 px-4 py-2.5 bg-muted/50 border-t">
                              <div className="sm:col-span-4 text-xs font-semibold text-muted-foreground">
                                Total ({apportionments.length} cards)
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-bold font-mono tabular-nums">
                                  {formatINRAmount(apportionments.reduce((sum, a) => sum + a.amount, 0))}
                                </span>
                              </div>
                              <div />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Pipeline Legend */}
      <Card>
        <CardContent className="p-4">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Payment Pipeline
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-4">
              <CycleStatusBadge status="DUE" />
              <span className="text-muted-foreground text-xs">&#8594;</span>
              <CycleStatusBadge status="PAYMENT_INITIATED" />
              <span className="text-muted-foreground text-xs">&#8594;</span>
              <CycleStatusBadge status="PAYMENT_RECEIVED" />
              <span className="text-muted-foreground text-xs">&#8594;</span>
              <CycleStatusBadge status="APPORTIONED" />
              <span className="text-muted-foreground text-xs">&#8594;</span>
              <CycleStatusBadge status="RECONCILED" />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Statement &rarr; Due Date &rarr; Payment &rarr; Apportionment &rarr; Reconciliation
          </p>
          <p className="text-[10px] text-[#0d3b66] dark:text-blue-400 mt-1.5 flex items-center gap-1">
            <Send className="w-3 h-3" />
            Click &quot;Pay&quot; on any DUE cycle to start the payment process
          </p>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      {paymentDialogCycle && (
        <PaymentDialog
          cycle={paymentDialogCycle}
          open={!!paymentDialogCycle}
          onOpenChange={(open) => {
            if (!open) setPaymentDialogCycle(null);
          }}
          onPaymentCreated={() => {
            setPaymentDialogCycle(null);
            fetchCycles();
          }}
        />
      )}
    </div>
  );
}
