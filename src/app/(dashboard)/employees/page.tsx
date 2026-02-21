"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { getEmployees, getDepartments, getCards } from "@/lib/store";
import { getInitials } from "@/lib/utils";
import {
  Users,
  Plus,
  Search,
  Download,
  Upload,
  ChevronRight,
  CreditCard,
  Mail,
  Phone,
  Building2,
} from "lucide-react";

export default function EmployeesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const allEmployees = getEmployees();
  const allDepartments = getDepartments();
  const allCards = getCards();

  const employees = allEmployees.map((emp) => ({
    ...emp,
    department: allDepartments.find((d) => d.id === emp.departmentId)?.name || "",
    cardCount: allCards.filter((c) => c.employeeId === emp.id).length,
    activeCards: allCards.filter((c) => c.employeeId === emp.id && c.status === "ACTIVE").length,
  }));

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in">
      <PageHeader title="Employees" description={`${employees.length} employees across the organization`}>
        <Button variant="outline">
          <Upload className="w-4 h-4" />
          Import CSV
        </Button>
        <Button asChild>
          <Link href="/employees/new">
            <Plus className="w-4 h-4" />
            Add Employee
          </Link>
        </Button>
      </PageHeader>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, department..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Employee Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map((emp) => (
          <Card key={emp.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {getInitials(`${emp.firstName} ${emp.lastName}`)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{emp.firstName} {emp.lastName}</p>
                    <StatusBadge status={emp.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">{emp.employeeNumber}</p>

                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3 h-3" />
                      <span>{emp.department}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{emp.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="w-3 h-3" />
                      <span>{emp.activeCards} active / {emp.cardCount} total cards</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="secondary" className="text-[9px]">
                      {emp.level.replace("_", " ")}
                    </Badge>
                    {emp.pan && (
                      <Badge variant="outline" className="text-[9px]">
                        PAN: {emp.pan.slice(0, 4)}***
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link href={`/employees/${emp.id}`}>View Profile</Link>
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Manage Cards
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
