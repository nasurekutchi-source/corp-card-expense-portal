"use client";

import { useState, useMemo, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  assignEmployeeToNode,
} from "@/lib/store";
import type { Employee } from "@/lib/store";
import {
  Search,
  ChevronRight,
  ChevronDown,
  Building2,
  Landmark,
  CreditCard,
  Layers,
  Users,
  IndianRupee,
  GripVertical,
  UserCheck,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

// =============================================================================
// Types
// =============================================================================

type NodeType = "bank" | "program" | "company" | "division" | "department" | "costcenter";

interface TreeNode {
  id: string;
  name: string;
  code?: string;
  type: NodeType;
  level: number;
  children?: TreeNode[];
}

// =============================================================================
// Constants
// =============================================================================

const LEVEL_COLORS: Record<NodeType, string> = {
  bank: "bg-slate-500/10 text-slate-700",
  program: "bg-indigo-500/10 text-indigo-600",
  company: "bg-blue-500/10 text-blue-600",
  division: "bg-purple-500/10 text-purple-600",
  department: "bg-amber-500/10 text-amber-600",
  costcenter: "bg-emerald-500/10 text-emerald-600",
};

const LEVEL_BADGE_COLORS: Record<NodeType, string> = {
  bank: "bg-slate-100 text-slate-700 border-slate-200",
  program: "bg-indigo-100 text-indigo-700 border-indigo-200",
  company: "bg-blue-100 text-blue-700 border-blue-200",
  division: "bg-purple-100 text-purple-700 border-purple-200",
  department: "bg-amber-100 text-amber-700 border-amber-200",
  costcenter: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const LEVEL_ICONS: Record<NodeType, React.ElementType> = {
  bank: Landmark,
  program: CreditCard,
  company: Building2,
  division: Layers,
  department: Users,
  costcenter: IndianRupee,
};

const DROPPABLE_TYPES: NodeType[] = ["department", "costcenter"];

// =============================================================================
// Build Tree
// =============================================================================

function buildAssignTree(): TreeNode[] {
  const banks = getBankInstitutions();
  const programs = getPrograms();
  const companies = getCompanies();
  const divisions = getDivisions();
  const departments = getDepartments();
  const costCenters = getCostCenters();

  return banks.map((bank) => ({
    id: bank.id,
    name: bank.name,
    code: bank.code,
    type: "bank" as const,
    level: 1,
    children: programs
      .filter((p) => p.bankId === bank.id)
      .map((prog) => ({
        id: prog.id,
        name: prog.name,
        code: prog.code,
        type: "program" as const,
        level: 2,
        children: companies
          .filter((c) => c.programId === prog.id)
          .map((comp) => ({
            id: comp.id,
            name: comp.name,
            type: "company" as const,
            level: 3,
            children: divisions
              .filter((d) => d.companyId === comp.id)
              .map((div) => ({
                id: div.id,
                name: div.name,
                code: div.code,
                type: "division" as const,
                level: 4,
                children: departments
                  .filter((dept) => dept.divisionId === div.id)
                  .map((dept) => ({
                    id: dept.id,
                    name: dept.name,
                    code: dept.code,
                    type: "department" as const,
                    level: 5,
                    children: costCenters
                      .filter((cc) => cc.departmentId === dept.id)
                      .map((cc) => ({
                        id: cc.id,
                        name: cc.name,
                        code: cc.code,
                        type: "costcenter" as const,
                        level: 6,
                      })),
                  })),
              })),
          })),
      })),
  }));
}

// =============================================================================
// Employee Count Helper
// =============================================================================

function getEmployeeCountForNode(nodeId: string, nodeType: NodeType, employees: Employee[]): number {
  if (nodeType === "department") {
    return employees.filter((e) => e.departmentId === nodeId).length;
  }
  if (nodeType === "costcenter") {
    return employees.filter((e) => e.costCenterId === nodeId).length;
  }
  return 0;
}

// =============================================================================
// Draggable Employee Card
// =============================================================================

function DraggableEmployeeCard({
  employee,
  departmentName,
  costCenterName,
}: {
  employee: Employee;
  departmentName: string;
  costCenterName: string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: employee.id,
    data: { type: "employee", employee },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const isUnassigned = !employee.departmentId && !employee.costCenterId;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-3 p-3 rounded-lg border cursor-grab active:cursor-grabbing transition-all ${
        isDragging
          ? "opacity-50 border-primary shadow-lg scale-[1.02]"
          : "hover:border-primary/50 hover:bg-muted/30"
      }`}
    >
      <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">
            {employee.firstName} {employee.lastName}
          </span>
          {isUnassigned && (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-orange-50 text-orange-600 border-orange-200">
              Unassigned
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-muted-foreground">{employee.employeeNumber}</span>
          {departmentName && (
            <span className="text-[10px] text-muted-foreground truncate">
              {departmentName}
            </span>
          )}
          {costCenterName && (
            <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3.5">
              {costCenterName}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Droppable Tree Node
// =============================================================================

function DroppableTreeNode({
  node,
  depth = 0,
  activeOverId,
  employees,
}: {
  node: TreeNode;
  depth?: number;
  activeOverId: string | null;
  employees: Employee[];
}) {
  const [expanded, setExpanded] = useState(depth < 4);
  const hasChildren = node.children && node.children.length > 0;
  const isDroppable = DROPPABLE_TYPES.includes(node.type);
  const isHoveredDrop = activeOverId === node.id;
  const Icon = LEVEL_ICONS[node.type];

  const empCount = getEmployeeCountForNode(node.id, node.type, employees);

  const { setNodeRef, isOver } = useDroppable({
    id: node.id,
    data: { type: "tree-node", node },
    disabled: !isDroppable,
  });

  const highlightClass = isDroppable
    ? isHoveredDrop || isOver
      ? "ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
      : "hover:bg-muted/40"
    : "";

  return (
    <div>
      <div
        ref={isDroppable ? setNodeRef : undefined}
        className={`flex items-center gap-2 py-2 px-2 rounded-md cursor-pointer group transition-all ${highlightClass}`}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={() => setExpanded(!expanded)}
      >
        {hasChildren ? (
          expanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          )
        ) : (
          <span className="w-4 shrink-0" />
        )}

        <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${LEVEL_COLORS[node.type]}`}>
          <Icon className="w-3 h-3" />
        </div>

        <span className="text-sm font-medium flex-1 truncate">{node.name}</span>

        {node.code && (
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 shrink-0">
            {node.code}
          </Badge>
        )}

        {isDroppable && (
          <Badge
            variant="secondary"
            className={`text-[9px] px-1.5 py-0 h-4 shrink-0 ${
              isHoveredDrop || isOver ? "bg-emerald-100 text-emerald-700" : ""
            }`}
          >
            <Users className="w-2.5 h-2.5 mr-0.5" />
            {empCount}
          </Badge>
        )}

        {isDroppable && (
          <Badge
            variant="outline"
            className={`text-[8px] px-1 py-0 h-3.5 shrink-0 ${LEVEL_BADGE_COLORS[node.type]}`}
          >
            Drop here
          </Badge>
        )}
      </div>

      {expanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <DroppableTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              activeOverId={activeOverId}
              employees={employees}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Drag Overlay Content
// =============================================================================

function DragOverlayContent({ employee }: { employee: Employee }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-primary bg-white shadow-xl w-[280px]">
      <GripVertical className="w-4 h-4 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium">
          {employee.firstName} {employee.lastName}
        </span>
        <div className="text-[10px] text-muted-foreground">{employee.employeeNumber}</div>
      </div>
      <UserCheck className="w-4 h-4 text-primary shrink-0" />
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function AssignEmployeesTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [activeEmployee, setActiveEmployee] = useState<Employee | null>(null);
  const [activeOverId, setActiveOverId] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  // Sensors for dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Load data
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const employees = useMemo(() => getEmployees(), [version]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tree = useMemo(() => buildAssignTree(), [version]);
  const departments = useMemo(() => getDepartments(), []);
  const costCenters = useMemo(() => getCostCenters(), []);

  // Build lookup maps
  const deptMap = useMemo(() => {
    const map = new Map<string, string>();
    departments.forEach((d) => map.set(d.id, d.name));
    return map;
  }, [departments]);

  const ccMap = useMemo(() => {
    const map = new Map<string, string>();
    costCenters.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [costCenters]);

  // Filter employees
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
    if (departmentFilter === "__unassigned__") {
      result = result.filter((e) => !e.departmentId && !e.costCenterId);
    } else if (departmentFilter) {
      result = result.filter((e) => e.departmentId === departmentFilter);
    }
    return result;
  }, [employees, searchQuery, departmentFilter]);

  // Count unassigned
  const unassignedCount = useMemo(
    () => employees.filter((e) => !e.departmentId && !e.costCenterId).length,
    [employees]
  );

  // DnD handlers
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const emp = employees.find((e) => e.id === event.active.id);
      if (emp) setActiveEmployee(emp);
    },
    [employees]
  );

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const overId = event.over?.id;
    setActiveOverId(overId ? String(overId) : null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveEmployee(null);
      setActiveOverId(null);

      const { active, over } = event;
      if (!over) return;

      const employeeId = String(active.id);
      const nodeId = String(over.id);

      // Verify the drop target is a department or cost center
      const nodeData = over.data.current as { type?: string; node?: TreeNode } | undefined;
      if (!nodeData || nodeData.type !== "tree-node") return;
      const targetNode = nodeData.node;
      if (!targetNode || !DROPPABLE_TYPES.includes(targetNode.type)) return;

      const success = assignEmployeeToNode(employeeId, nodeId);
      if (success) {
        const emp = employees.find((e) => e.id === employeeId);
        const empName = emp ? `${emp.firstName} ${emp.lastName}` : "Employee";
        toast.success(`${empName} assigned to ${targetNode.name}`);
        setVersion((v) => v + 1);
      } else {
        toast.error("Failed to assign employee");
      }
    },
    [employees]
  );

  const handleDragCancel = useCallback(() => {
    setActiveEmployee(null);
    setActiveOverId(null);
  }, []);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-4 h-[calc(100vh-300px)] min-h-[500px]">
        {/* ============================================ */}
        {/* Left Panel - Employee List (40%)             */}
        {/* ============================================ */}
        <Card className="w-[40%] flex flex-col">
          <CardHeader className="pb-3 shrink-0">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Employees
              <Badge variant="secondary" className="text-[10px] ml-auto">
                {filteredEmployees.length} shown
              </Badge>
            </CardTitle>
            <div className="space-y-2 pt-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  className="pl-9 h-8 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {/* Department Filter */}
              <select
                className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <option value="">All Departments</option>
                <option value="__unassigned__">
                  Unassigned ({unassignedCount})
                </option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden px-3 pb-3">
            <ScrollArea className="h-full">
              <div className="space-y-2 pr-2">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp) => (
                    <DraggableEmployeeCard
                      key={emp.id}
                      employee={emp}
                      departmentName={deptMap.get(emp.departmentId) || ""}
                      costCenterName={ccMap.get(emp.costCenterId) || ""}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No employees matching your filters
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* ============================================ */}
        {/* Right Panel - Hierarchy Tree (60%)           */}
        {/* ============================================ */}
        <Card className="w-[60%] flex flex-col">
          <CardHeader className="pb-3 shrink-0">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Landmark className="w-4 h-4" />
              Hierarchy
              <Badge variant="outline" className="text-[9px] ml-2 bg-emerald-50 text-emerald-600 border-emerald-200">
                Drop employees on Department or Cost Center nodes
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden px-3 pb-3">
            <ScrollArea className="h-full">
              <div className="space-y-0.5 pr-2">
                {tree.map((node) => (
                  <DroppableTreeNode
                    key={node.id}
                    node={node}
                    activeOverId={activeOverId}
                    employees={employees}
                  />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeEmployee ? <DragOverlayContent employee={activeEmployee} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
