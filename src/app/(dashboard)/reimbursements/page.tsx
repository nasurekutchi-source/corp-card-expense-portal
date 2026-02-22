"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { PageHeader } from "@/components/shared/page-header";
// Payment profiles fetched from API
import { useModuleConfig } from "@/components/providers/module-config-provider";
import { formatINRCompact } from "@/lib/utils";
import {
  Banknote,
  Download,
  CheckCircle2,
  Clock,
  Send,
  RefreshCw,
  IndianRupee,
  Landmark,
  CreditCard,
  Loader2,
} from "lucide-react";

// -- Reimbursement type matching store interface --

interface ReimbursementItem {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  expenseReportId: string;
  reportNumber: string;
  grossAmount: number;
  tdsAmount: number;
  netAmount: number;
  status: "PENDING" | "INITIATED" | "PROCESSING" | "PAID" | "FAILED";
  paymentMethod: string;
  paymentRef: string;
  bankAccount: string;
  ifscCode: string;
  bankName: string;
  initiatedAt: string | null;
  processedAt: string | null;
  paidAt: string | null;
  failureReason: string | null;
}

export default function ReimbursementsPage() {
  const { config: modules } = useModuleConfig();
  const paymentMode = modules.paymentMode || "BATCH";
  const [reimbursements, setReimbursements] = useState<ReimbursementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [paymentProfiles, setPaymentProfiles] = useState<any[]>([]);

  // Fetch payment profiles from API
  useEffect(() => {
    fetch("/api/v1/payment-profiles")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPaymentProfiles(data);
      })
      .catch(() => {});
  }, []);

  // -- Fetch reimbursements from API --
  const fetchReimbursements = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/reimbursements");
      const json = await res.json();
      setReimbursements(json.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReimbursements();
  }, [fetchReimbursements]);

  // -- Initiate a single reimbursement --
  async function handleInitiate(id: string) {
    setActionLoading(id);
    try {
      const res = await fetch("/api/v1/reimbursements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "initiate", id }),
      });
      if (res.ok) {
        await fetchReimbursements();
      }
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  }

  // -- Bulk process (initiate all PENDING) --
  async function handleProcessPayments() {
    const pendingIds = reimbursements.filter((r) => r.status === "PENDING").map((r) => r.id);
    if (pendingIds.length === 0) return;
    setActionLoading("bulk");
    try {
      const res = await fetch("/api/v1/reimbursements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bulk-initiate", ids: pendingIds }),
      });
      if (res.ok) {
        await fetchReimbursements();
      }
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  }

  // -- Real-time: Initiate Payment (simulates PENDING → INITIATED → PROCESSING → PAID) --
  async function handleRealtimeInitiate(id: string) {
    setActionLoading(id);
    try {
      // Step 1: PENDING → INITIATED
      await fetch("/api/v1/reimbursements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "initiate", id }),
      });
      await fetchReimbursements();

      // Step 2: Simulate processing delay, then INITIATED → PROCESSING
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await fetch("/api/v1/reimbursements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "process", id, paymentRef: `RTGS${Date.now()}` }),
      });
      await fetchReimbursements();

      // Step 3: Simulate bank response delay, then PROCESSING → PAID
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await fetch("/api/v1/reimbursements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete", id }),
      });
      await fetchReimbursements();
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  }

  // -- Download NEFT file --
  async function handleDownloadNEFT() {
    try {
      const res = await fetch("/api/v1/reimbursements?format=neft");
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to generate NEFT file");
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="?(.+?)"?$/);
      const filename = match ? match[1] : `neft-payment-${new Date().toISOString().split("T")[0]}.csv`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to download NEFT file");
    }
  }

  // -- Compute stats from fetched data --
  const stats = {
    pending: reimbursements.filter((r) => r.status === "PENDING" || r.status === "INITIATED").length,
    processing: reimbursements.filter((r) => r.status === "PROCESSING").length,
    paid: reimbursements.filter((r) => r.status === "PAID").length,
    totalPending: reimbursements
      .filter((r) => r.status !== "PAID")
      .reduce((s, r) => s + r.netAmount, 0),
    totalPaid: reimbursements
      .filter((r) => r.status === "PAID")
      .reduce((s, r) => s + r.netAmount, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      <PageHeader title="Reimbursements" description="Track reimbursement status and payment profiles">
        <Badge variant={paymentMode === "REALTIME" ? "success" : "outline"} className="text-xs">
          {paymentMode === "REALTIME" ? "Real-time API" : "Batch File"}
        </Badge>
        {paymentMode === "BATCH" && (
          <>
            <Button variant="outline" onClick={handleDownloadNEFT}>
              <Download className="w-4 h-4" />
              NEFT File
            </Button>
            <Button onClick={handleProcessPayments} disabled={actionLoading === "bulk" || stats.pending === 0}>
              {actionLoading === "bulk" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Process Payments
            </Button>
          </>
        )}
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats.processing}</p>
                <p className="text-xs text-muted-foreground">Processing</p>
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
                <p className="text-xl font-bold">{stats.paid}</p>
                <p className="text-xs text-muted-foreground">Paid</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <IndianRupee className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <p className="text-xl font-bold">{formatINRCompact(stats.totalPending)}</p>
                <p className="text-xs text-muted-foreground">Pending Amount</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Banknote className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-xl font-bold">{formatINRCompact(stats.totalPaid)}</p>
                <p className="text-xs text-muted-foreground">Total Paid</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reimbursements" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reimbursements">Reimbursement Queue</TabsTrigger>
          <TabsTrigger value="profiles">Payment Profiles</TabsTrigger>
        </TabsList>

        {/* Reimbursements */}
        <TabsContent value="reimbursements" className="space-y-3">
          {reimbursements.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No reimbursements found.
              </CardContent>
            </Card>
          )}
          {reimbursements.map((reimb) => (
            <Card key={reimb.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Status indicator */}
                  <div
                    className={`w-2 h-14 rounded-full ${
                      reimb.status === "PAID"
                        ? "bg-emerald-500"
                        : reimb.status === "PROCESSING"
                          ? "bg-blue-500"
                          : reimb.status === "FAILED"
                            ? "bg-red-500"
                            : reimb.status === "INITIATED"
                              ? "bg-sky-500"
                              : "bg-amber-500"
                    }`}
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{reimb.reportNumber}</p>
                      <StatusBadge status={reimb.status} />
                      {reimb.paymentMethod && (
                        <Badge variant="outline" className="text-[9px]">
                          {reimb.paymentMethod}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{reimb.employeeName}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Landmark className="w-3 h-3" />
                        {reimb.bankName} &middot; A/C {reimb.bankAccount}
                      </span>
                      {reimb.paymentRef && (
                        <>
                          <span>&middot;</span>
                          <span className="font-mono text-emerald-600">{reimb.paymentRef}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Amount breakdown */}
                  <div className="text-right hidden sm:block">
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <div className="flex justify-between gap-4">
                        <span>Gross</span>
                        <CurrencyDisplay amount={reimb.grossAmount} compact className="text-xs" />
                      </div>
                      {reimb.tdsAmount > 0 && (
                        <div className="flex justify-between gap-4 text-red-500">
                          <span>TDS</span>
                          <span>
                            -
                            <CurrencyDisplay
                              amount={reimb.tdsAmount}
                              compact
                              className="text-xs inline"
                            />
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="border-t mt-1 pt-1">
                      <CurrencyDisplay amount={reimb.netAmount} compact className="text-lg font-bold" />
                    </div>
                  </div>

                  {/* Action */}
                  <div>
                    {paymentMode === "REALTIME" && reimb.status === "PENDING" && (
                      <Button
                        size="sm"
                        onClick={() => handleRealtimeInitiate(reimb.id)}
                        disabled={actionLoading === reimb.id}
                      >
                        {actionLoading === reimb.id ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <Send className="w-3 h-3 mr-1" />
                        )}
                        Initiate Payment
                      </Button>
                    )}
                    {paymentMode === "BATCH" && reimb.status === "PENDING" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleInitiate(reimb.id)}
                        disabled={actionLoading === reimb.id}
                      >
                        {actionLoading === reimb.id ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <Send className="w-3 h-3 mr-1" />
                        )}
                        Initiate
                      </Button>
                    )}
                    {reimb.status === "PROCESSING" && (
                      <Button variant="outline" size="sm">
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Check Status
                      </Button>
                    )}
                  </div>
                </div>

                {/* Pipeline */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t text-[10px]">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>Approved</span>
                  </div>
                  <div
                    className={`h-px flex-1 ${
                      reimb.status !== "PENDING" ? "bg-blue-500" : "bg-border"
                    }`}
                  />
                  <div className="flex items-center gap-1">
                    {reimb.status !== "PENDING" ? (
                      <CheckCircle2 className="w-3 h-3 text-blue-500" />
                    ) : (
                      <Clock className="w-3 h-3 text-muted-foreground" />
                    )}
                    <span>Initiated</span>
                  </div>
                  <div
                    className={`h-px flex-1 ${
                      reimb.status === "PROCESSING"
                        ? "bg-blue-500 animate-pulse"
                        : reimb.status === "PAID"
                          ? "bg-emerald-500"
                          : "bg-border"
                    }`}
                  />
                  <div className="flex items-center gap-1">
                    {reimb.status === "PROCESSING" ? (
                      <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />
                    ) : reimb.status === "PAID" ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Clock className="w-3 h-3 text-muted-foreground" />
                    )}
                    <span>Processing</span>
                  </div>
                  <div
                    className={`h-px flex-1 ${
                      reimb.status === "PAID" ? "bg-emerald-500" : "bg-border"
                    }`}
                  />
                  <div className="flex items-center gap-1">
                    {reimb.status === "PAID" ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Clock className="w-3 h-3 text-muted-foreground" />
                    )}
                    <span>Paid</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Payment Profiles */}
        <TabsContent value="profiles" className="space-y-3">
          {paymentProfiles.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Landmark className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No payment profiles found</p>
                <p className="text-xs mt-1">Payment profiles are created during employee onboarding or from the employee profile page.</p>
              </CardContent>
            </Card>
          )}
          {paymentProfiles.map((profile) => (
            <Card key={profile.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    {profile.type === "UPI" ? (
                      <CreditCard className="w-5 h-5 text-primary" />
                    ) : (
                      <Landmark className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{profile.employeeName}</p>
                      <Badge variant="success" className="text-[9px]">
                        {profile.status}
                      </Badge>
                      {profile.isPrimary && (
                        <Badge variant="outline" className="text-[9px]">
                          Primary
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {profile.type === "UPI" ? (
                        <span>UPI: {profile.upiVpa}</span>
                      ) : (
                        <>
                          <span>{profile.bankName}</span>
                          <span>&middot;</span>
                          <span>A/C: {profile.accountNumber}</span>
                          <span>&middot;</span>
                          <span>IFSC: {profile.ifscCode || profile.ifsc}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {profile.type === "UPI" ? "UPI" : "Bank Account"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
