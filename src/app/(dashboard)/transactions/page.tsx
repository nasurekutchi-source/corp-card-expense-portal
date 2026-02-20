"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { demoTransactions } from "@/lib/demo-data";
import { formatDate } from "@/lib/utils";
import {
  Search,
  Filter,
  Download,
  ArrowRightLeft,
  MapPin,
  Receipt,
  Tag,
  ChevronRight,
  Calendar,
  Building2,
  CreditCard,
  Clock,
} from "lucide-react";

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filteredTxns = demoTransactions.filter((txn) => {
    const matchesSearch =
      txn.merchantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.mccCategory.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || txn.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: demoTransactions.length,
    settled: demoTransactions.filter((t) => t.status === "SETTLED").length,
    pending: demoTransactions.filter((t) => t.status === "PENDING").length,
    totalAmount: demoTransactions.reduce((sum, t) => sum + t.amount, 0),
  };

  return (
    <div className="space-y-6 animate-in">
      <PageHeader title="Transactions" description="Real-time transaction feed across all corporate cards">
        <Button variant="outline">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Transactions</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Settled</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.settled}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pending Auth</p>
            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Amount</p>
            <CurrencyDisplay amount={stats.totalAmount} compact className="text-2xl font-bold" />
          </CardContent>
        </Card>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search merchant, employee, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {["ALL", "SETTLED", "PENDING"].map((status) => (
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

      {/* Transaction List */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {filteredTxns.slice(0, 30).map((txn) => (
              <div
                key={txn.id}
                className="flex items-center gap-4 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <ArrowRightLeft className="w-5 h-5 text-muted-foreground" />
                </div>

                {/* Merchant + Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{txn.merchantName}</p>
                    {txn.status === "PENDING" && (
                      <Badge variant="warning" className="text-[9px]">
                        <Clock className="w-2.5 h-2.5 mr-0.5" />
                        Auth
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {txn.mccCategory}
                    </span>
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {txn.employeeName}
                    </span>
                    <span className="flex items-center gap-1">
                      <CreditCard className="w-3 h-3" />
                      ****{txn.cardLast4}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {txn.location.city}
                    </span>
                  </div>
                </div>

                {/* Channel */}
                <Badge variant="outline" className="text-[9px] hidden sm:flex">
                  {txn.channel}
                </Badge>

                {/* Receipt indicator */}
                {txn.hasReceipt && (
                  <Receipt className="w-4 h-4 text-emerald-500 hidden sm:block" />
                )}

                {/* Amount + Date */}
                <div className="text-right shrink-0">
                  <CurrencyDisplay amount={txn.amount} className="text-sm font-medium" />
                  <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(txn.timestamp)}</p>
                </div>

                {/* Status */}
                <StatusBadge status={txn.status} className="hidden sm:flex" />

                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
