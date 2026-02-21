"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { PageHeader } from "@/components/shared/page-header";
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
  ChevronDown,
  Building2,
  CreditCard,
  Clock,
  X,
  SlidersHorizontal,
} from "lucide-react";

const MCC_CATEGORIES = [
  "All Categories",
  "Airlines",
  "Hotels",
  "Restaurants",
  "Fast Food",
  "Groceries",
  "Gas Station",
  "Software",
  "Office Equipment",
  "Business Services",
  "Retail",
  "Medical",
];

const CHANNELS = ["All Channels", "POS", "ECOM", "ATM", "CONTACTLESS", "MOBILE_WALLET"];

const DEPARTMENTS = [
  "All Departments",
  "Sales & Marketing",
  "Engineering",
  "Operations",
  "Finance",
  "HR & Admin",
  "Procurement",
  "Customer Support",
  "Executive Office",
];

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Advanced filters
  const [mccFilter, setMccFilter] = useState("All Categories");
  const [channelFilter, setChannelFilter] = useState("All Channels");
  const [deptFilter, setDeptFilter] = useState("All Departments");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [cardFilter, setCardFilter] = useState("");

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (mccFilter !== "All Categories") count++;
    if (channelFilter !== "All Channels") count++;
    if (deptFilter !== "All Departments") count++;
    if (amountMin) count++;
    if (amountMax) count++;
    if (dateFrom) count++;
    if (dateTo) count++;
    if (cardFilter) count++;
    return count;
  }, [mccFilter, channelFilter, deptFilter, amountMin, amountMax, dateFrom, dateTo, cardFilter]);

  const clearFilters = () => {
    setMccFilter("All Categories");
    setChannelFilter("All Channels");
    setDeptFilter("All Departments");
    setAmountMin("");
    setAmountMax("");
    setDateFrom("");
    setDateTo("");
    setCardFilter("");
    setStatusFilter("ALL");
    setSearchQuery("");
  };

  const filteredTxns = useMemo(() => {
    return demoTransactions.filter((txn) => {
      const matchesSearch =
        !searchQuery ||
        txn.merchantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        txn.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        txn.mccCategory.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || txn.status === statusFilter;
      const matchesMcc = mccFilter === "All Categories" || txn.mccCategory === mccFilter;
      const matchesChannel = channelFilter === "All Channels" || txn.channel === channelFilter;
      const matchesCard = !cardFilter || txn.cardLast4.includes(cardFilter);
      const matchesAmountMin = !amountMin || txn.amount >= Number(amountMin);
      const matchesAmountMax = !amountMax || txn.amount <= Number(amountMax);

      return matchesSearch && matchesStatus && matchesMcc && matchesChannel && matchesCard && matchesAmountMin && matchesAmountMax;
    });
  }, [searchQuery, statusFilter, mccFilter, channelFilter, cardFilter, amountMin, amountMax]);

  const stats = useMemo(() => ({
    total: filteredTxns.length,
    settled: filteredTxns.filter((t) => t.status === "SETTLED").length,
    pending: filteredTxns.filter((t) => t.status === "PENDING").length,
    declined: filteredTxns.filter((t) => t.status === "DECLINED").length,
    totalAmount: filteredTxns.reduce((sum, t) => sum + t.amount, 0),
  }), [filteredTxns]);

  return (
    <div className="space-y-6 animate-in">
      <PageHeader title="Transactions" description="Real-time transaction feed across all corporate cards">
        <Button variant="outline">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total</p>
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
            <p className="text-xs text-muted-foreground">Declined</p>
            <p className="text-2xl font-bold text-red-600">{stats.declined}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Amount</p>
            <CurrencyDisplay amount={stats.totalAmount} compact className="text-2xl font-bold" />
          </CardContent>
        </Card>
      </div>

      {/* Search + Status Filter */}
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
          {["ALL", "SETTLED", "PENDING", "DECLINED"].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
            </Button>
          ))}
          <Button
            variant={showAdvanced ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="ml-1"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <Badge className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[9px]">
                {activeFilterCount}
              </Badge>
            )}
            <ChevronDown className={`w-3 h-3 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Advanced Filters</p>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-xs">
                  <X className="w-3 h-3" />
                  Clear all ({activeFilterCount})
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* MCC Category */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground uppercase">MCC Category</label>
                <select
                  value={mccFilter}
                  onChange={(e) => setMccFilter(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {MCC_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Channel */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground uppercase">Channel</label>
                <select
                  value={channelFilter}
                  onChange={(e) => setChannelFilter(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {CHANNELS.map((ch) => (
                    <option key={ch} value={ch}>{ch}</option>
                  ))}
                </select>
              </div>

              {/* Department */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground uppercase">Department</label>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Card (last 4) */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground uppercase">Card (last 4)</label>
                <Input
                  placeholder="e.g. 1005"
                  value={cardFilter}
                  onChange={(e) => setCardFilter(e.target.value)}
                  className="h-9 text-xs"
                  maxLength={4}
                />
              </div>

              {/* Amount Min */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground uppercase">Amount Min (₹)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={amountMin}
                  onChange={(e) => setAmountMin(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              {/* Amount Max */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground uppercase">Amount Max (₹)</label>
                <Input
                  type="number"
                  placeholder="No limit"
                  value={amountMax}
                  onChange={(e) => setAmountMax(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              {/* Date From */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground uppercase">Date From</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              {/* Date To */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground uppercase">Date To</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active filter chips */}
      {activeFilterCount > 0 && !showAdvanced && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Active filters:</span>
          {mccFilter !== "All Categories" && (
            <Badge variant="secondary" className="text-xs gap-1">
              {mccFilter}
              <X className="w-3 h-3 cursor-pointer" onClick={() => setMccFilter("All Categories")} />
            </Badge>
          )}
          {channelFilter !== "All Channels" && (
            <Badge variant="secondary" className="text-xs gap-1">
              {channelFilter}
              <X className="w-3 h-3 cursor-pointer" onClick={() => setChannelFilter("All Channels")} />
            </Badge>
          )}
          {deptFilter !== "All Departments" && (
            <Badge variant="secondary" className="text-xs gap-1">
              {deptFilter}
              <X className="w-3 h-3 cursor-pointer" onClick={() => setDeptFilter("All Departments")} />
            </Badge>
          )}
          {cardFilter && (
            <Badge variant="secondary" className="text-xs gap-1">
              Card ****{cardFilter}
              <X className="w-3 h-3 cursor-pointer" onClick={() => setCardFilter("")} />
            </Badge>
          )}
          {(amountMin || amountMax) && (
            <Badge variant="secondary" className="text-xs gap-1">
              ₹{amountMin || "0"} — ₹{amountMax || "∞"}
              <X className="w-3 h-3 cursor-pointer" onClick={() => { setAmountMin(""); setAmountMax(""); }} />
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-5 text-[10px] px-2">
            Clear all
          </Button>
        </div>
      )}

      {/* Transaction List */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {filteredTxns.length === 0 ? (
              <div className="py-12 text-center">
                <Filter className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No transactions match your filters</p>
                <Button variant="ghost" size="sm" onClick={clearFilters} className="mt-2 text-xs">
                  Clear all filters
                </Button>
              </div>
            ) : (
              filteredTxns.slice(0, 30).map((txn) => (
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
                      <span className="flex items-center gap-1 hidden md:flex">
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
              ))
            )}
          </div>
          {filteredTxns.length > 30 && (
            <div className="py-3 text-center border-t">
              <p className="text-xs text-muted-foreground">
                Showing 30 of {filteredTxns.length} transactions
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
