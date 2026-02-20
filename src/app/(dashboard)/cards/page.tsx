"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { PageHeader } from "@/components/shared/page-header";
import { demoCards } from "@/lib/demo-data";
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Snowflake,
  Sun,
  MoreHorizontal,
  Wifi,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function CardVisual({ card }: { card: (typeof demoCards)[0] }) {
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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filteredCards = demoCards.filter((card) => {
    const matchesSearch =
      card.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.last4Digits.includes(searchQuery) ||
      card.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || card.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: demoCards.length,
    active: demoCards.filter((c) => c.status === "ACTIVE").length,
    frozen: demoCards.filter((c) => c.status === "FROZEN").length,
    virtual: demoCards.filter((c) => c.type === "VIRTUAL").length,
  };

  return (
    <div className="space-y-6 animate-in">
      <PageHeader title="Card Management" description="Manage corporate cards across your organization">
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
                    <DropdownMenuItem>Edit Controls</DropdownMenuItem>
                    <DropdownMenuItem>View Transactions</DropdownMenuItem>
                    <DropdownMenuItem>Set Limits</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Cancel Card</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
