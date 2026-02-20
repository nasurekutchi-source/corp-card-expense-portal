"use client";

import { use } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { PageHeader } from "@/components/shared/page-header";
import { demoEmployees, demoCards, demoTransactions, demoExpenses, demoDepartments, demoCostCenters } from "@/lib/demo-data";
import { getInitials, formatDate, formatINRCompact } from "@/lib/utils";
import {
  ArrowLeft,
  CreditCard,
  ArrowRightLeft,
  Receipt,
  Mail,
  Phone,
  Building2,
  MapPin,
  User,
  Calendar,
  Edit2,
  Shield,
} from "lucide-react";

export default function EmployeeDetailPage({ params }: { params: Promise<{ empId: string }> }) {
  const { empId } = use(params);
  const emp = demoEmployees.find((e) => e.id === empId) || demoEmployees[0];
  const dept = demoDepartments.find((d) => d.id === emp.departmentId);
  const cc = demoCostCenters.find((c) => c.id === emp.costCenterId);
  const cards = demoCards.filter((c) => c.employeeId === emp.id);
  const transactions = demoTransactions.filter((t) => t.employeeId === emp.id).slice(0, 10);
  const expenses = demoExpenses.filter((e) => e.employeeId === emp.id).slice(0, 10);
  const totalSpend = transactions.reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title={`${emp.firstName} ${emp.lastName}`}
        description={`${emp.employeeNumber} · ${dept?.name || ""}`}
      >
        <Button variant="outline" asChild>
          <Link href="/employees">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </Button>
        <Button variant="outline">
          <Edit2 className="w-4 h-4" />
          Edit Profile
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card>
          <CardContent className="p-6 text-center">
            <Avatar className="h-20 w-20 mx-auto">
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {getInitials(`${emp.firstName} ${emp.lastName}`)}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-lg font-bold mt-3">{emp.firstName} {emp.lastName}</h2>
            <StatusBadge status={emp.status} />

            <div className="mt-4 space-y-2 text-left">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">{emp.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">{emp.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">{dept?.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">{cc?.name} ({cc?.code})</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">PAN: {emp.pan?.slice(0, 4)}****</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t flex flex-wrap gap-2 justify-center">
              <Badge variant="secondary">{emp.level.replace("_", " ")}</Badge>
              <Badge variant="outline">{cards.length} Cards</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Total Spend</p>
                <CurrencyDisplay amount={totalSpend} compact className="text-lg font-bold" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Cards</p>
                <p className="text-lg font-bold">{cards.filter((c) => c.status === "ACTIVE").length}/{cards.length}</p>
                <p className="text-[10px] text-muted-foreground">active/total</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Transactions</p>
                <p className="text-lg font-bold">{transactions.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Expenses</p>
                <p className="text-lg font-bold">{expenses.length}</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="cards" className="space-y-3">
            <TabsList>
              <TabsTrigger value="cards">Assigned Cards</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
            </TabsList>

            <TabsContent value="cards">
              <div className="space-y-2">
                {cards.map((card) => (
                  <Card key={card.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">•••• {card.last4Digits}</span>
                            <StatusBadge status={card.status} />
                            <Badge variant="outline" className="text-[9px]">{card.type}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {card.network} · Expires {card.expiryDate.slice(0, 7)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{card.utilizationPercent}%</p>
                          <p className="text-[10px] text-muted-foreground">utilized</p>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/cards/${card.id}`}>View</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

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
                          <p className="text-xs text-muted-foreground">{formatDate(txn.timestamp)} · {txn.mccCategory}</p>
                        </div>
                        <CurrencyDisplay amount={txn.amount} className="text-sm font-medium" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="expenses">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    {expenses.map((exp) => (
                      <div key={exp.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                          <Receipt className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{exp.merchantName}</p>
                          <p className="text-xs text-muted-foreground">{exp.category} · {formatDate(exp.date)}</p>
                        </div>
                        <StatusBadge status={exp.policyStatus} />
                        <CurrencyDisplay amount={exp.amount} className="text-sm font-medium" />
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
