"use client";

import { use } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { PageHeader } from "@/components/shared/page-header";
import { getTransactions } from "@/lib/store";
import { useModuleConfig } from "@/components/providers/module-config-provider";
import { formatINR, formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  CreditCard,
  MapPin,
  Store,
  Clock,
  FileText,
  Tag,
  MessageSquare,
  AlertTriangle,
  Receipt,
  Upload,
  Camera,
  CheckCircle2,
  Globe,
  Smartphone,
  IndianRupee,
} from "lucide-react";

export default function TransactionDetailPage({ params }: { params: Promise<{ txnId: string }> }) {
  const { txnId } = use(params);
  const { config: mc } = useModuleConfig();
  const transactions = getTransactions();
  const txn = transactions.find((t) => t.id === txnId) || transactions[0];

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title={txn.merchantName}
        description={`Transaction ${txn.id} · ${formatDate(txn.timestamp)}`}
      >
        <Button variant="outline" asChild>
          <Link href="/transactions">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </Button>
        <Button variant="outline">
          <AlertTriangle className="w-4 h-4" />
          Dispute
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Amount Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Transaction Amount</p>
                  <CurrencyDisplay amount={txn.amount} className="text-3xl font-bold mt-1" />
                  {txn.currency !== txn.billingCurrency && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Billing: <CurrencyDisplay amount={txn.billingAmount} className="inline" /> {txn.billingCurrency}
                    </p>
                  )}
                </div>
                <StatusBadge status={txn.status} />
              </div>

              {/* GST */}
              <div className="mt-4 pt-4 border-t flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <IndianRupee className="w-3.5 h-3.5" />
                  <span>GST: {formatINR(txn.gstAmount)}</span>
                </div>
                <Badge variant="outline" className="text-[9px]">18% slab</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Details */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Transaction Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Event Type</span>
                  <Badge variant="outline">{txn.eventType}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Auth Code</span>
                  <span className="font-mono">{txn.authCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Channel</span>
                  <Badge variant="secondary" className="text-xs">{txn.channel}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Card</span>
                  <span>•••• {txn.cardLast4}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Employee</span>
                  <span>{txn.employeeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Timestamp</span>
                  <span>{new Date(txn.timestamp).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Merchant Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Store className="w-4 h-4" />
                Merchant Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Merchant</span>
                  <span className="font-medium">{txn.merchantName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">MCC</span>
                  <span>{txn.mcc} — {txn.mccCategory}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">City</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {txn.location.city}, {txn.location.country}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue={mc.expenseManagement ? "receipt" : "dispute"} className="space-y-3">
            <TabsList>
              {mc.expenseManagement && <TabsTrigger value="receipt">Receipt</TabsTrigger>}
              {mc.expenseManagement && <TabsTrigger value="notes">Notes & Tags</TabsTrigger>}
              <TabsTrigger value="dispute">Dispute</TabsTrigger>
            </TabsList>

            {mc.expenseManagement && (
              <TabsContent value="receipt">
                <Card>
                  <CardContent className="p-6">
                    {txn.hasReceipt ? (
                      <div className="text-center">
                        <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center mb-3">
                          <Receipt className="w-12 h-12 text-muted-foreground/30" />
                        </div>
                        <p className="text-sm text-muted-foreground">Receipt uploaded via mobile camera</p>
                        <div className="flex justify-center gap-2 mt-3">
                          <Button variant="outline" size="sm">View Full</Button>
                          <Button variant="outline" size="sm">Re-upload</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed rounded-lg p-8 text-center">
                        <Camera className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                        <p className="font-medium text-sm">No receipt attached</p>
                        <p className="text-xs text-muted-foreground mt-1">Upload a receipt image or PDF</p>
                        <div className="flex justify-center gap-2 mt-4">
                          <Button variant="outline" size="sm">
                            <Upload className="w-3 h-3 mr-1" />
                            Upload
                          </Button>
                          <Button variant="outline" size="sm">
                            <Camera className="w-3 h-3 mr-1" />
                            Camera
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {mc.expenseManagement && (
              <TabsContent value="notes">
                <Card>
                  <CardContent className="p-4 space-y-4">
                    <div>
                      <label className="text-xs font-medium">Tags</label>
                      <p className="text-[10px] text-muted-foreground mb-1">Employee assigns tags for expense categorization</p>
                      <div className="flex gap-1.5 flex-wrap mt-1.5">
                        <Badge variant="secondary" className="text-xs">business-travel</Badge>
                        <Badge variant="secondary" className="text-xs">Q4-review</Badge>
                        <Button variant="outline" size="sm" className="h-6 text-xs">+ Add Tag</Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium">Business Purpose</label>
                      <Input
                        className="mt-1.5"
                        placeholder="Enter business purpose..."
                        defaultValue="Client meeting — Q4 planning review"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Notes</label>
                      <textarea
                        className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                        placeholder="Add notes..."
                      />
                    </div>
                    <Button size="sm">Save Notes</Button>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            <TabsContent value="dispute">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center py-6">
                    <AlertTriangle className="w-10 h-10 mx-auto text-amber-500 mb-3" />
                    <h3 className="font-medium">Raise a Dispute</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                      If you believe this transaction is fraudulent or incorrect, you can raise a dispute.
                      The card network will investigate within 45-90 days.
                    </p>
                    <Button className="mt-4" variant="destructive">
                      <AlertTriangle className="w-4 h-4" />
                      Raise Dispute
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Timeline */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Transaction Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: "Authorization", time: txn.timestamp, status: "done" },
                  { label: "Notification sent", time: txn.timestamp, status: "done" },
                  ...(mc.expenseManagement ? [{ label: "Receipt captured", time: txn.hasReceipt ? txn.timestamp : null, status: txn.hasReceipt ? "done" : "pending" }] : []),
                  { label: "Settlement", time: txn.status === "SETTLED" ? txn.timestamp : null, status: txn.status === "SETTLED" ? "done" : "pending" },
                  ...(mc.expenseManagement ? [{ label: "Expense created", time: null, status: "pending" }] : []),
                ].map((step, i, arr) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-2.5 h-2.5 rounded-full ${step.status === "done" ? "bg-emerald-500" : "bg-muted"}`} />
                      {i < arr.length - 1 && <div className="w-px h-full bg-border" />}
                    </div>
                    <div className="pb-3">
                      <p className={`text-xs font-medium ${step.status === "done" ? "" : "text-muted-foreground"}`}>{step.label}</p>
                      {step.time && (
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(step.time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {mc.expenseManagement && (
                <>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Receipt className="w-3.5 h-3.5 mr-2" />
                    Create Expense
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Tag className="w-3.5 h-3.5 mr-2" />
                    Categorize
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <FileText className="w-3.5 h-3.5 mr-2" />
                    Add to Report
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" className="w-full justify-start">
                <CreditCard className="w-3.5 h-3.5 mr-2" />
                View Card
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link href="/transactions">
                  <FileText className="w-3.5 h-3.5 mr-2" />
                  All Transactions
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
