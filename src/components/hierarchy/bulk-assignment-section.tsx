"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getEmployees,
  getDepartments,
  getCostCenters,
  getDivisions,
  getCompanies,
  getPrograms,
  getBankInstitutions,
  bulkAssignEmployeesToNode,
  findHierarchyNodeByCode,
} from "@/lib/store";
import type { Employee, Department, CostCenter, Division, Company, Program, BankInstitution } from "@/lib/store";
import {
  Search,
  Users,
  CheckSquare,
  FolderTree,
  Upload,
  FileSpreadsheet,
  Loader2,
  Check,
  AlertCircle,
  UserCheck,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

// =============================================================================
// CSV Assignment Types
// =============================================================================

interface CSVAssignment {
  employeeNumber: string;
  nodeCode: string;
  employeeName?: string;
  nodeType?: string;
  status: "valid" | "invalid";
  error?: string;
}

// =============================================================================
// Cascading Hierarchy Selector
// =============================================================================

function CascadingHierarchySelector({
  selectedNodeId,
  onSelect,
}: {
  selectedNodeId: string;
  onSelect: (nodeId: string, nodeType: string, nodeName: string) => void;
}) {
  const [bankId, setBankId] = useState("");
  const [programId, setProgramId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [divisionId, setDivisionId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [costCenterId, setCostCenterId] = useState("");

  const banks = useMemo(() => getBankInstitutions(), []);
  const programs = useMemo(() => getPrograms(), []);
  const companies = useMemo(() => getCompanies(), []);
  const divisions = useMemo(() => getDivisions(), []);
  const departments = useMemo(() => getDepartments(), []);
  const costCenters = useMemo(() => getCostCenters(), []);

  const filteredPrograms = useMemo(
    () => (bankId ? programs.filter((p) => p.bankId === bankId) : []),
    [bankId, programs]
  );

  const filteredCompanies = useMemo(
    () => (programId ? companies.filter((c) => c.programId === programId) : []),
    [programId, companies]
  );

  const filteredDivisions = useMemo(
    () => (companyId ? divisions.filter((d) => d.companyId === companyId) : []),
    [companyId, divisions]
  );

  const filteredDepartments = useMemo(
    () => (divisionId ? departments.filter((d) => d.divisionId === divisionId) : []),
    [divisionId, departments]
  );

  const filteredCostCenters = useMemo(
    () => (departmentId ? costCenters.filter((c) => c.departmentId === departmentId) : []),
    [departmentId, costCenters]
  );

  const selectClasses =
    "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground font-medium">
        Select the target hierarchy node (drill down through levels):
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* L1 - Bank */}
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            L1 - Bank/Institution
          </label>
          <select
            className={selectClasses}
            value={bankId}
            onChange={(e) => {
              setBankId(e.target.value);
              setProgramId("");
              setCompanyId("");
              setDivisionId("");
              setDepartmentId("");
              setCostCenterId("");
              onSelect("", "", "");
            }}
          >
            <option value="">Select bank...</option>
            {banks.map((b) => (
              <option key={b.id} value={b.id}>
                Bank - {b.name} ({b.code})
              </option>
            ))}
          </select>
        </div>

        {/* L2 - Program */}
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            L2 - Program
          </label>
          <select
            className={selectClasses}
            value={programId}
            disabled={!bankId}
            onChange={(e) => {
              setProgramId(e.target.value);
              setCompanyId("");
              setDivisionId("");
              setDepartmentId("");
              setCostCenterId("");
              onSelect("", "", "");
            }}
          >
            <option value="">Select program...</option>
            {filteredPrograms.map((p) => (
              <option key={p.id} value={p.id}>
                Program - {p.name} ({p.code})
              </option>
            ))}
          </select>
        </div>

        {/* L3 - Company */}
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            L3 - Company
          </label>
          <select
            className={selectClasses}
            value={companyId}
            disabled={!programId}
            onChange={(e) => {
              setCompanyId(e.target.value);
              setDivisionId("");
              setDepartmentId("");
              setCostCenterId("");
              onSelect("", "", "");
            }}
          >
            <option value="">Select company...</option>
            {filteredCompanies.map((c) => (
              <option key={c.id} value={c.id}>
                Company - {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* L4 - Division */}
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            L4 - Division
          </label>
          <select
            className={selectClasses}
            value={divisionId}
            disabled={!companyId}
            onChange={(e) => {
              setDivisionId(e.target.value);
              setDepartmentId("");
              setCostCenterId("");
              onSelect("", "", "");
            }}
          >
            <option value="">Select division...</option>
            {filteredDivisions.map((d) => (
              <option key={d.id} value={d.id}>
                Division - {d.name} ({d.code})
              </option>
            ))}
          </select>
        </div>

        {/* L5 - Department (ASSIGNABLE) */}
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            L5 - Department
            <Badge variant="outline" className="text-[8px] ml-1 bg-amber-50 text-amber-600 border-amber-200 px-1 py-0">
              Assignable
            </Badge>
          </label>
          <select
            className={`${selectClasses} ${departmentId && !costCenterId ? "ring-2 ring-amber-400" : ""}`}
            value={departmentId}
            disabled={!divisionId}
            onChange={(e) => {
              const deptId = e.target.value;
              setDepartmentId(deptId);
              setCostCenterId("");
              if (deptId) {
                const dept = departments.find((d) => d.id === deptId);
                onSelect(deptId, "department", dept?.name || "");
              } else {
                onSelect("", "", "");
              }
            }}
          >
            <option value="">Select department...</option>
            {filteredDepartments.map((d) => (
              <option key={d.id} value={d.id}>
                Department - {d.name} ({d.code})
              </option>
            ))}
          </select>
        </div>

        {/* L6 - Cost Center (ASSIGNABLE) */}
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            L6 - Cost Center
            <Badge variant="outline" className="text-[8px] ml-1 bg-emerald-50 text-emerald-600 border-emerald-200 px-1 py-0">
              Assignable
            </Badge>
          </label>
          <select
            className={`${selectClasses} ${costCenterId ? "ring-2 ring-emerald-400" : ""}`}
            value={costCenterId}
            disabled={!departmentId}
            onChange={(e) => {
              const ccId = e.target.value;
              setCostCenterId(ccId);
              if (ccId) {
                const cc = costCenters.find((c) => c.id === ccId);
                onSelect(ccId, "costCenter", cc?.name || "");
              } else {
                // Fall back to department selection
                if (departmentId) {
                  const dept = departments.find((d) => d.id === departmentId);
                  onSelect(departmentId, "department", dept?.name || "");
                }
              }
            }}
          >
            <option value="">Select cost center (optional)...</option>
            {filteredCostCenters.map((c) => (
              <option key={c.id} value={c.id}>
                Cost Center - {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function BulkAssignmentSection() {
  // -- State --
  const [step, setStep] = useState<1 | 2>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [targetNodeId, setTargetNodeId] = useState("");
  const [targetNodeType, setTargetNodeType] = useState("");
  const [targetNodeName, setTargetNodeName] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [version, setVersion] = useState(0);

  // -- CSV State --
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvDragOver, setCsvDragOver] = useState(false);
  const [csvAssignments, setCsvAssignments] = useState<CSVAssignment[]>([]);
  const [csvProcessing, setCsvProcessing] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // -- Data --
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const employees = useMemo(() => getEmployees(), [version]);
  const departments = useMemo(() => getDepartments(), []);

  const deptMap = useMemo(() => {
    const map = new Map<string, string>();
    departments.forEach((d) => map.set(d.id, d.name));
    return map;
  }, [departments]);

  // -- Filter employees --
  const filteredEmployees = useMemo(() => {
    let result = employees;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.firstName.toLowerCase().includes(q) ||
          e.lastName.toLowerCase().includes(q) ||
          e.employeeNumber.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q)
      );
    }
    if (deptFilter) {
      result = result.filter((e) => e.departmentId === deptFilter);
    }
    return result;
  }, [employees, searchQuery, deptFilter]);

  // -- Selection handlers --
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredEmployees.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEmployees.map((e) => e.id)));
    }
  }, [filteredEmployees, selectedIds.size]);

  const isAllSelected = filteredEmployees.length > 0 && selectedIds.size === filteredEmployees.length;

  // -- Assign handler --
  const handleAssign = useCallback(async () => {
    if (selectedIds.size === 0 || !targetNodeId) return;

    setAssigning(true);
    try {
      const count = bulkAssignEmployeesToNode(Array.from(selectedIds), targetNodeId);
      toast.success(`Successfully assigned ${count} employee${count !== 1 ? "s" : ""} to ${targetNodeName}`);
      setSelectedIds(new Set());
      setStep(1);
      setVersion((v) => v + 1);
    } catch {
      toast.error("Assignment failed");
    } finally {
      setAssigning(false);
    }
  }, [selectedIds, targetNodeId, targetNodeName]);

  // -- CSV handlers --
  const handleCSVFileSelect = useCallback((file: File | null) => {
    if (file && !file.name.endsWith(".csv")) {
      toast.error("Please select a CSV file");
      return;
    }
    setCsvFile(file);
    setCsvAssignments([]);
  }, []);

  const handleCSVParse = useCallback(async () => {
    if (!csvFile) return;

    setCsvProcessing(true);
    try {
      const text = await csvFile.text();
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length < 2) {
        toast.error("CSV file must have a header row and at least one data row");
        setCsvProcessing(false);
        return;
      }

      // Skip header
      const dataLines = lines.slice(1);
      const assignments: CSVAssignment[] = [];
      const allEmployees = getEmployees();

      for (const line of dataLines) {
        const parts = line.split(",").map((p) => p.trim());
        const employeeNumber = parts[0] || "";
        const nodeCode = parts[1] || "";

        if (!employeeNumber || !nodeCode) {
          assignments.push({
            employeeNumber,
            nodeCode,
            status: "invalid",
            error: "Missing employee number or node code",
          });
          continue;
        }

        // Validate employee
        const emp = allEmployees.find((e) => e.employeeNumber === employeeNumber);
        if (!emp) {
          assignments.push({
            employeeNumber,
            nodeCode,
            status: "invalid",
            error: `Employee "${employeeNumber}" not found`,
          });
          continue;
        }

        // Validate node
        const nodeInfo = findHierarchyNodeByCode(nodeCode);
        if (!nodeInfo) {
          assignments.push({
            employeeNumber,
            nodeCode,
            status: "invalid",
            error: `Node "${nodeCode}" not found`,
          });
          continue;
        }

        assignments.push({
          employeeNumber,
          nodeCode,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          nodeType: nodeInfo.type === "department" ? "Department" : "Cost Center",
          status: "valid",
        });
      }

      setCsvAssignments(assignments);

      const validCount = assignments.filter((a) => a.status === "valid").length;
      const invalidCount = assignments.filter((a) => a.status === "invalid").length;
      if (invalidCount > 0) {
        toast.warning(`Parsed ${validCount} valid, ${invalidCount} invalid assignments`);
      } else {
        toast.success(`Parsed ${validCount} valid assignments`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to parse CSV");
    } finally {
      setCsvProcessing(false);
    }
  }, [csvFile]);

  const handleCSVConfirm = useCallback(() => {
    const validAssignments = csvAssignments.filter((a) => a.status === "valid");
    if (validAssignments.length === 0) {
      toast.error("No valid assignments to process");
      return;
    }

    const allEmployees = getEmployees();
    let successCount = 0;

    for (const assignment of validAssignments) {
      const emp = allEmployees.find((e) => e.employeeNumber === assignment.employeeNumber);
      const nodeInfo = findHierarchyNodeByCode(assignment.nodeCode);
      if (emp && nodeInfo) {
        const result = bulkAssignEmployeesToNode([emp.id], nodeInfo.id);
        successCount += result;
      }
    }

    toast.success(`Successfully processed ${successCount} assignment${successCount !== 1 ? "s" : ""}`);
    setCsvFile(null);
    setCsvAssignments([]);
    setVersion((v) => v + 1);
    if (csvInputRef.current) csvInputRef.current.value = "";
  }, [csvAssignments]);

  // -- Render --
  const validCsvCount = csvAssignments.filter((a) => a.status === "valid").length;
  const invalidCsvCount = csvAssignments.filter((a) => a.status === "invalid").length;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">Bulk Hierarchy Assignment</CardTitle>
              <CardDescription className="text-xs">
                Assign multiple employees to a hierarchy node (Department or Cost Center) at once
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* ============================================================= */}
      {/* Step 1: Select Employees                                       */}
      {/* ============================================================= */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CheckSquare className="w-4 h-4" />
            Step 1: Select Employees
            {selectedIds.size > 0 && (
              <Badge className="ml-2 bg-primary text-primary-foreground text-[10px]">
                {selectedIds.size} selected
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by name, employee number, email..."
                className="pl-9 h-8 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="flex h-8 rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 w-full sm:w-48"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Employee Table */}
          <div className="border rounded-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 border-b text-xs font-medium text-muted-foreground">
              <label className="flex items-center gap-2 cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span>Select All</span>
              </label>
              <span className="flex-1">Employee</span>
              <span className="w-24 hidden sm:block">Number</span>
              <span className="w-32 hidden md:block">Department</span>
              <span className="w-20 hidden lg:block">Status</span>
            </div>

            {/* Body */}
            <ScrollArea className="h-[280px]">
              <div>
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp) => {
                    const isSelected = selectedIds.has(emp.id);
                    const deptName = deptMap.get(emp.departmentId) || "Unassigned";

                    return (
                      <div
                        key={emp.id}
                        className={`flex items-center gap-3 px-4 py-2 border-b last:border-b-0 cursor-pointer transition-colors ${
                          isSelected ? "bg-primary/5" : "hover:bg-muted/30"
                        }`}
                        onClick={() => toggleSelect(emp.id)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(emp.id)}
                          className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium">
                            {emp.firstName} {emp.lastName}
                          </span>
                          <span className="text-[10px] text-muted-foreground ml-2 sm:hidden">
                            {emp.employeeNumber}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground w-24 hidden sm:block truncate">
                          {emp.employeeNumber}
                        </span>
                        <span className="text-xs text-muted-foreground w-32 hidden md:block truncate">
                          {deptName}
                        </span>
                        <span className="w-20 hidden lg:block">
                          <Badge
                            variant="outline"
                            className={`text-[9px] px-1.5 py-0 h-4 ${
                              emp.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                : "bg-gray-50 text-gray-500 border-gray-200"
                            }`}
                          >
                            {emp.status}
                          </Badge>
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No employees found
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Next Button */}
          {selectedIds.size > 0 && (
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setStep(2)}>
                Next: Choose Target Node
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============================================================= */}
      {/* Step 2: Choose Hierarchy Node & Assign                         */}
      {/* ============================================================= */}
      {step === 2 && selectedIds.size > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FolderTree className="w-4 h-4" />
              Step 2: Choose Target Node & Assign
              <Badge variant="secondary" className="text-[10px] ml-2">
                {selectedIds.size} employee{selectedIds.size !== 1 ? "s" : ""} selected
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CascadingHierarchySelector
              selectedNodeId={targetNodeId}
              onSelect={(nodeId, nodeType, nodeName) => {
                setTargetNodeId(nodeId);
                setTargetNodeType(nodeType);
                setTargetNodeName(nodeName);
              }}
            />

            {/* Target Summary */}
            {targetNodeId && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    Assign {selectedIds.size} employee{selectedIds.size !== 1 ? "s" : ""} to{" "}
                    <span className="font-bold">{targetNodeName}</span>
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-500">
                    Target type: {targetNodeType === "costCenter" ? "Cost Center" : "Department"}
                  </p>
                </div>
              </div>
            )}

            {/* Assign Button */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button
                size="sm"
                disabled={!targetNodeId || assigning}
                onClick={handleAssign}
              >
                {assigning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    Assign {selectedIds.size} Employee{selectedIds.size !== 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============================================================= */}
      {/* CSV Upload Zone                                                */}
      {/* ============================================================= */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            CSV Bulk Assignment
          </CardTitle>
          <CardDescription className="text-xs">
            Upload a CSV file with columns: <code className="text-[10px] bg-muted px-1 rounded">Employee Number, Hierarchy Node Code</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              csvDragOver
                ? "border-primary bg-primary/5"
                : csvFile
                ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            }`}
            onClick={() => csvInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setCsvDragOver(true);
            }}
            onDragLeave={() => setCsvDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setCsvDragOver(false);
              handleCSVFileSelect(e.dataTransfer.files?.[0] ?? null);
            }}
          >
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => handleCSVFileSelect(e.target.files?.[0] ?? null)}
            />
            {csvFile ? (
              <div className="flex items-center justify-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  {csvFile.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({(csvFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Drag & drop a CSV file or click to browse
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Format: Employee Number, Hierarchy Node Code
                </p>
              </>
            )}
          </div>

          {/* Parse Button */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="h-8 text-xs"
              disabled={!csvFile || csvProcessing}
              onClick={handleCSVParse}
            >
              {csvProcessing ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Parsing...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-3 h-3" />
                  Parse & Preview
                </>
              )}
            </Button>
            {csvFile && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  setCsvFile(null);
                  setCsvAssignments([]);
                  if (csvInputRef.current) csvInputRef.current.value = "";
                }}
              >
                Clear
              </Button>
            )}
          </div>

          {/* Preview Table */}
          {csvAssignments.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">
                  {validCsvCount} valid
                </Badge>
                {invalidCsvCount > 0 && (
                  <Badge variant="destructive" className="text-[10px]">
                    {invalidCsvCount} invalid
                  </Badge>
                )}
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 border-b text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  <span className="w-5 shrink-0"></span>
                  <span className="w-28">Employee #</span>
                  <span className="flex-1">Name</span>
                  <span className="w-28">Node Code</span>
                  <span className="w-24">Type</span>
                </div>
                <ScrollArea className="h-[200px]">
                  <div>
                    {csvAssignments.map((a, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-3 px-4 py-1.5 border-b last:border-b-0 text-xs ${
                          a.status === "invalid" ? "bg-red-50 dark:bg-red-900/10" : ""
                        }`}
                      >
                        <span className="w-5 shrink-0">
                          {a.status === "valid" ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                          )}
                        </span>
                        <span className="w-28 font-mono text-[10px]">{a.employeeNumber}</span>
                        <span className="flex-1 truncate">
                          {a.employeeName || (
                            <span className="text-red-500">{a.error}</span>
                          )}
                        </span>
                        <span className="w-28 font-mono text-[10px]">{a.nodeCode}</span>
                        <span className="w-24 text-muted-foreground">{a.nodeType || "-"}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Confirm Button */}
              {validCsvCount > 0 && (
                <Button size="sm" onClick={handleCSVConfirm}>
                  <UserCheck className="w-4 h-4" />
                  Confirm {validCsvCount} Assignment{validCsvCount !== 1 ? "s" : ""}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
