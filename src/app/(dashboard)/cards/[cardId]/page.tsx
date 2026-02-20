"use client";

import { use } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { PageHeader } from "@/components/shared/page-header";
import { demoCards, demoTransactions } from "@/lib/demo-data";
import { formatINR, formatINRCompact, formatDate } from "@/lib/utils";
import {
  CreditCard,
  ArrowLeft,
  Snowflake,
  PlayCircle,
  Settings,
  ArrowRightLeft,
  Shield,
  Wifi,
  Copy,
  MapPin,
  Globe,
  ShoppingCart,
  Smartphone,
  Monitor,
  Edit2,
  Trash2,
} from "lucide-react";

function CardVisual3D({ card }: { card: typeof demoCards[0] }) {
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
            •••• •••• •••• {card.last4Digits}
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

export default function CardDetailPage({ params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = use(params);
  const card = demoCards.find((c) => c.id === cardId) || demoCards[0];
  const transactions = demoTransactions.filter((t) => t.cardId === card.id).slice(0, 15);
  const isFrozen = card.status === "FROZEN";

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title={`Card •${card.last4Digits}`}
        description={`${card.type} ${card.network} card assigned to ${card.employeeName}`}
      >
        <Button variant="outline" asChild>
          <Link href="/cards">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </Button>
        <Button variant={isFrozen ? "default" : "destructive"}>
          {isFrozen ? <PlayCircle className="w-4 h-4" /> : <Snowflake className="w-4 h-4" />}
          {isFrozen ? "Unfreeze" : "Freeze Card"}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card Visual */}
        <div className="flex flex-col items-center gap-4">
          <CardVisual3D card={card} />
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
                <StatusBadge status={card.status} />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Monthly Limit</p>
                <CurrencyDisplay amount={card.spendLimits.monthly} compact className="text-lg font-bold" />
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

            {/* Limits */}
            <TabsContent value="limits">
              <Card>
                <CardContent className="p-4 space-y-4">
                  {[
                    { label: "Per Transaction", value: card.spendLimits.perTransaction },
                    { label: "Daily Limit", value: card.spendLimits.daily },
                    { label: "Monthly Limit", value: card.spendLimits.monthly },
                  ].map((limit) => (
                    <div key={limit.label} className="flex items-center justify-between">
                      <span className="text-sm">{limit.label}</span>
                      <div className="flex items-center gap-2">
                        <CurrencyDisplay amount={limit.value} className="text-sm font-medium" />
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Controls */}
            <TabsContent value="controls">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-3">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Channel Controls</h4>
                    {[
                      { label: "POS (Point of Sale)", icon: ShoppingCart, enabled: true },
                      { label: "E-Commerce", icon: Monitor, enabled: true },
                      { label: "Contactless (NFC)", icon: Wifi, enabled: true },
                      { label: "Mobile Wallet", icon: Smartphone, enabled: false },
                    ].map((ch) => (
                      <div key={ch.label} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2">
                          <ch.icon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{ch.label}</span>
                        </div>
                        <Badge variant={ch.enabled ? "success" : "outline"} className="text-[9px]">
                          {ch.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3 pt-3 border-t">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Geographic Controls</h4>
                    <div className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">International Transactions</span>
                      </div>
                      <Badge variant="outline" className="text-[9px]">Disabled</Badge>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Domestic Only</span>
                      </div>
                      <Badge variant="success" className="text-[9px]">Enabled</Badge>
                    </div>
                  </div>
                  <div className="space-y-3 pt-3 border-t">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">MCC Restrictions</h4>
                    <div className="flex gap-1.5 flex-wrap">
                      {["Gambling", "Crypto", "Liquor Stores", "ATM Cash Advance"].map((mcc) => (
                        <Badge key={mcc} variant="destructive" className="text-[9px]">{mcc} ✕</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Transactions */}
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
