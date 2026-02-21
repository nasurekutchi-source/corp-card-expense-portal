"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { formatINR, formatINRCompact } from "@/lib/utils";
import { toast } from "sonner";
import {
  Building2,
  Plus,
  Search,
  CreditCard,
  TrendingUp,
  IndianRupee,
  AlertCircle,
  MoreHorizontal,
  Eye,
  UserCog,
  Pause,
  FileText,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Company {
  id: string;
  name: string;
  cin: string;
  status: "ACTIVE" | "PENDING_KYB" | "SUSPENDED";
  creditLimit: number;
  cardsIssued: number;
  outstanding: number;
  programStartDate: string;
  rmName: string;
  industry: string;
  entityType: string;
}

const DEMO_COMPANIES: Company[] = [
  {
    id: "comp-001",
    name: "TechNova Solutions Pvt Ltd",
    cin: "U72200KA2018PTC123456",
    status: "ACTIVE",
    creditLimit: 5000000,
    cardsIssued: 45,
    outstanding: 1850000,
    programStartDate: "2024-03-15",
    rmName: "Sanjay Mehta",
    industry: "IT/Technology",
    entityType: "Private Limited",
  },
  {
    id: "comp-002",
    name: "Bharat Manufacturing Corp",
    cin: "L29200MH2005PLC987654",
    status: "ACTIVE",
    creditLimit: 15000000,
    cardsIssued: 120,
    outstanding: 7200000,
    programStartDate: "2023-08-01",
    rmName: "Neha Kapoor",
    industry: "Manufacturing",
    entityType: "Public Limited",
  },
  {
    id: "comp-003",
    name: "Pinnacle Services Ltd",
    cin: "U74999DL2022PTC456789",
    status: "PENDING_KYB",
    creditLimit: 2500000,
    cardsIssued: 0,
    outstanding: 0,
    programStartDate: "2026-02-10",
    rmName: "Amit Joshi",
    industry: "Financial Services",
    entityType: "Private Limited",
  },
];

function getStatusBadge(status: Company["status"]) {
  switch (status) {
    case "ACTIVE":
      return <Badge variant="success">Active</Badge>;
    case "PENDING_KYB":
      return <Badge variant="warning">Pending KYB</Badge>;
    case "SUSPENDED":
      return <Badge variant="destructive">Suspended</Badge>;
  }
}

export default function CompanyManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filteredCompanies = DEMO_COMPANIES.filter((company) => {
    const matchesSearch =
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.cin.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || company.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalCompanies: DEMO_COMPANIES.length,
    activePrograms: DEMO_COMPANIES.filter((c) => c.status === "ACTIVE").length,
    totalCreditSanctioned: DEMO_COMPANIES.reduce(
      (sum, c) => sum + c.creditLimit,
      0
    ),
    totalOutstanding: DEMO_COMPANIES.reduce(
      (sum, c) => sum + c.outstanding,
      0
    ),
  };

  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Company Management"
        description="Manage corporate client programs and onboarding"
      >
        <Button asChild>
          <Link href="/admin/companies/new">
            <Plus className="w-4 h-4" />
            Onboard New Company
          </Link>
        </Button>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Total Companies",
            value: stats.totalCompanies.toString(),
            icon: Building2,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Active Programs",
            value: stats.activePrograms.toString(),
            icon: TrendingUp,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Total Credit Sanctioned",
            value: formatINRCompact(stats.totalCreditSanctioned),
            icon: IndianRupee,
            color: "text-violet-600",
            bg: "bg-violet-50",
          },
          {
            label: "Total Outstanding",
            value: formatINRCompact(stats.totalOutstanding),
            icon: AlertCircle,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}
              >
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xl font-bold">{stat.value}</p>
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
            placeholder="Search by company name or CIN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-1">
          {[
            { key: "ALL", label: "All" },
            { key: "ACTIVE", label: "Active" },
            { key: "PENDING_KYB", label: "Pending KYB" },
            { key: "SUSPENDED", label: "Suspended" },
          ].map((status) => (
            <Button
              key={status.key}
              variant={statusFilter === status.key ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status.key)}
            >
              {status.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Company Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left text-xs font-medium text-muted-foreground p-3">
                  Company Name
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground p-3">
                  CIN
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground p-3">
                  Status
                </th>
                <th className="text-right text-xs font-medium text-muted-foreground p-3">
                  Credit Limit
                </th>
                <th className="text-center text-xs font-medium text-muted-foreground p-3">
                  Cards Issued
                </th>
                <th className="text-right text-xs font-medium text-muted-foreground p-3">
                  Outstanding
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground p-3">
                  Program Start
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground p-3">
                  RM Name
                </th>
                <th className="text-center text-xs font-medium text-muted-foreground p-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map((company) => (
                <tr
                  key={company.id}
                  className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() =>
                    toast.info(
                      `Company details for ${company.name} — coming soon`
                    )
                  }
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#0d3b66]/10 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-[#0d3b66]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{company.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {company.industry} &middot; {company.entityType}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                      {company.cin}
                    </code>
                  </td>
                  <td className="p-3">{getStatusBadge(company.status)}</td>
                  <td className="p-3 text-right">
                    <span className="text-sm font-medium">
                      {formatINR(company.creditLimit)}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm">{company.cardsIssued}</span>
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <span
                      className={`text-sm font-medium ${
                        company.outstanding > 0
                          ? "text-amber-600"
                          : "text-muted-foreground"
                      }`}
                    >
                      {formatINR(company.outstanding)}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="text-sm">
                      {new Date(company.programStartDate).toLocaleDateString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
                      )}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="text-sm">{company.rmName}</span>
                  </td>
                  <td className="p-3 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            toast.info(
                              `Viewing details for ${company.name} — coming soon`
                            );
                          }}
                        >
                          <Eye className="w-3.5 h-3.5 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            toast.info(
                              `Managing admins for ${company.name} — coming soon`
                            );
                          }}
                        >
                          <UserCog className="w-3.5 h-3.5 mr-2" />
                          Manage Admins
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            toast.info(
                              `KYB documents for ${company.name} — coming soon`
                            );
                          }}
                        >
                          <FileText className="w-3.5 h-3.5 mr-2" />
                          KYB Documents
                        </DropdownMenuItem>
                        {company.status === "ACTIVE" && (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.warning(
                                `Program suspension for ${company.name} — coming soon`
                              );
                            }}
                          >
                            <Pause className="w-3.5 h-3.5 mr-2" />
                            Suspend Program
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCompanies.length === 0 && (
          <div className="p-12 text-center">
            <Building2 className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              No companies match your search criteria
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
