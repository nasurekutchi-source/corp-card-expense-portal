"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { getEmployees, getDepartments, getCards } from "@/lib/store";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";
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
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

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

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split("\n").filter((line) => line.trim());
      if (lines.length < 2) {
        toast.error("CSV file must have a header row and at least one data row");
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const records = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim());
        const record: Record<string, string> = {};
        headers.forEach((header, idx) => {
          if (values[idx]) record[header] = values[idx];
        });
        return {
          firstName: record["firstname"] || record["first_name"] || record["first name"] || "",
          lastName: record["lastname"] || record["last_name"] || record["last name"] || "",
          email: record["email"] || "",
          phone: record["phone"] || "",
          employeeNumber: record["employeenumber"] || record["employee_number"] || record["employee number"] || "",
          pan: record["pan"] || "",
          departmentId: record["departmentid"] || record["department_id"] || record["department id"] || "",
          costCenterId: record["costcenterid"] || record["cost_center_id"] || record["cost center id"] || "",
          level: record["level"] || "STAFF",
        };
      });

      const res = await fetch("/api/v1/employees/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Failed to import employees");
        return;
      }

      if (result.errors?.length > 0) {
        toast.warning(`Imported ${result.imported} of ${result.total} employees. ${result.errors.length} errors.`);
      } else {
        toast.success(`Successfully imported ${result.imported} employees`);
      }

      router.refresh();
    } catch (err) {
      toast.error("Failed to parse CSV file");
    } finally {
      setImporting(false);
      // Reset file input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6 animate-in">
      <PageHeader title="Employees" description={`${employees.length} employees across the organization`}>
        <input
          type="file"
          ref={fileInputRef}
          accept=".csv"
          className="hidden"
          onChange={handleCsvImport}
        />
        <Button
          variant="outline"
          disabled={importing}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-4 h-4" />
          {importing ? "Importing..." : "Import CSV"}
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
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => router.push(`/cards?employeeId=${emp.id}`)}
                >
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
