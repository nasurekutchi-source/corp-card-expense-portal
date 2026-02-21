"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { formatDate } from "@/lib/utils";
import {
  Repeat,
  CreditCard,
  Search,
  TrendingUp,
  Building2,
  CircleDollarSign,
} from "lucide-react";

interface DetectedSubscription {
  id: string;
  cardId: string;
  cardLast4: string;
  employeeId: string;
  employeeName: string;
  merchantName: string;
  mcc: string;
  frequency: string;
  lastChargeDate: string;
  lastChargeAmount: number;
  avgAmount: number;
  totalCharges: number;
  isActive: boolean;
  detectedAt: string;
}

const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<DetectedSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [frequencyFilter, setFrequencyFilter] = useState("ALL");

  useEffect(() => {
    async function fetchSubscriptions() {
      try {
        const res = await fetch("/api/v1/subscriptions");
        const json = await res.json();
        setSubscriptions(json.data || []);
      } catch {
        console.error("Failed to fetch subscriptions");
      } finally {
        setLoading(false);
      }
    }
    fetchSubscriptions();
  }, []);

  // Apply client-side filters
  const filtered = useMemo(() => {
    let result = [...subscriptions];

    // Frequency filter
    if (frequencyFilter !== "ALL") {
      result = result.filter((s) => s.frequency === frequencyFilter);
    }

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.merchantName.toLowerCase().includes(q) ||
          s.employeeName.toLowerCase().includes(q) ||
          s.cardLast4.includes(q)
      );
    }

    // Sort by avgAmount descending
    result.sort((a, b) => b.avgAmount - a.avgAmount);

    return result;
  }, [subscriptions, frequencyFilter, searchQuery]);

  // Summary stats (computed from full dataset, not filtered)
  const stats = useMemo(() => {
    const active = subscriptions.filter((s) => s.isActive);
    const activeCount = active.length;
    const monthlySpend = active
      .filter((s) => s.frequency === "MONTHLY")
      .reduce((sum, s) => sum + s.avgAmount, 0);
    const annualCommitment = active.reduce((sum, s) => {
      if (s.frequency === "MONTHLY") return sum + s.avgAmount * 12;
      if (s.frequency === "QUARTERLY") return sum + s.avgAmount * 4;
      if (s.frequency === "ANNUAL") return sum + s.avgAmount;
      return sum;
    }, 0);
    const uniqueVendors = new Set(subscriptions.map((s) => s.merchantName)).size;

    return { activeCount, monthlySpend, annualCommitment, uniqueVendors };
  }, [subscriptions]);

  const frequencyBadge = (freq: string) => {
    switch (freq) {
      case "MONTHLY":
        return <Badge variant="info">{freq}</Badge>;
      case "QUARTERLY":
        return (
          <Badge className="border-transparent bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
            {freq}
          </Badge>
        );
      case "ANNUAL":
        return (
          <Badge className="border-transparent bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
            {freq}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{freq}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in">
        <PageHeader
          title="Subscription Detection"
          description="Auto-detected recurring charges across all corporate cards"
        />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-4 w-24 bg-muted rounded animate-pulse mb-2" />
                <div className="h-8 w-16 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Subscription Detection"
        description="Auto-detected recurring charges across all corporate cards"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Repeat className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Active Subscriptions</p>
            </div>
            <p className="text-2xl font-bold">{stats.activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CircleDollarSign className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Monthly Spend</p>
            </div>
            <p className="text-2xl font-bold text-blue-600">{formatINR(stats.monthlySpend)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Annual Commitment</p>
            </div>
            <p className="text-2xl font-bold text-amber-600">{formatINR(stats.annualCommitment)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Vendors</p>
            </div>
            <p className="text-2xl font-bold">{stats.uniqueVendors}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="space-y-1">
          <select
            value={frequencyFilter}
            onChange={(e) => setFrequencyFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="ALL">All Frequencies</option>
            <option value="MONTHLY">Monthly</option>
            <option value="QUARTERLY">Quarterly</option>
            <option value="ANNUAL">Annual</option>
          </select>
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search merchant, employee, card..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Merchant</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Card</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Employee</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Frequency</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Last Charge</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Avg Amount</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Total Charges</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <Repeat className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No subscriptions found</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((sub) => (
                    <tr
                      key={sub.id}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <Repeat className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <span className="font-medium truncate max-w-[160px]">{sub.merchantName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>****{sub.cardLast4}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                        {sub.employeeName}
                      </td>
                      <td className="px-4 py-3">{frequencyBadge(sub.frequency)}</td>
                      <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                        {formatDate(sub.lastChargeDate)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatINR(sub.avgAmount)}
                      </td>
                      <td className="px-4 py-3 text-right hidden md:table-cell text-muted-foreground">
                        {sub.totalCharges}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {sub.isActive ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400">
                            <span className="w-2 h-2 rounded-full bg-gray-400" />
                            Inactive
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div className="py-3 text-center border-t">
              <p className="text-xs text-muted-foreground">
                Showing {filtered.length} subscription{filtered.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
