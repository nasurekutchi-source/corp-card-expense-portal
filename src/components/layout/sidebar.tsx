"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { APP_NAME, ROLE_LABELS, type UserRole } from "@/lib/constants";
import { useUserRole, canAccessNav, type NavSection } from "@/lib/role-access";
import { useModuleConfig } from "@/components/providers/module-config-provider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  LayoutDashboard,
  Network,
  Users,
  Receipt,
  FileText,
  CheckSquare,
  Shield,
  Settings,
  BarChart3,
  GitBranch,
  Bot,
  ChevronLeft,
  ChevronRight,
  ArrowRightLeft,
  Banknote,
  Scale,
  Layers,
  SlidersHorizontal,
  Database,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  section: NavSection;
  badge?: string | number;
  badgeVariant?: "default" | "destructive" | "warning" | "success";
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

function getNavGroups(role: UserRole, mc: import("@/lib/role-access").ModuleConfig): NavGroup[] {

  // Employee/Cardholder — personal navigation only
  if (role === "EMPLOYEE") {
    const groups: NavGroup[] = [
      {
        label: "Overview",
        items: [
          { label: "My Dashboard", href: "/", icon: LayoutDashboard, section: "dashboard" },
        ],
      },
      {
        label: "My Cards",
        items: [
          { label: "My Cards", href: "/cards", icon: CreditCard, section: "my_cards" },
          { label: "My Transactions", href: "/transactions", icon: ArrowRightLeft, section: "my_transactions" },
        ],
      },
    ];

    if (mc.expenseManagement) {
      groups.push({
        label: "My Expenses",
        items: [
          { label: "My Expenses", href: "/expenses", icon: Receipt, section: "my_expenses" },
          { label: "My Reports", href: "/expense-reports", icon: FileText, section: "my_statements" },
        ],
      });
    }

    return groups;
  }

  // All other roles
  const groups: NavGroup[] = [
    {
      label: "Overview",
      items: [
        { label: "Dashboard", href: "/", icon: LayoutDashboard, section: "dashboard" },
      ],
    },
  ];

  // Card Portal
  const cardItems: NavItem[] = [];
  if (canAccessNav(role, "hierarchy", mc))
    cardItems.push({ label: "Hierarchy", href: "/hierarchy", icon: Network, section: "hierarchy" });
  if (canAccessNav(role, "employees", mc))
    cardItems.push({ label: "Employees", href: "/employees", icon: Users, section: "employees" });
  if (canAccessNav(role, "cards", mc))
    cardItems.push({ label: "Cards", href: "/cards", icon: CreditCard, section: "cards" });
  if (canAccessNav(role, "card_controls", mc))
    cardItems.push({ label: "Card Controls", href: "/cards/new", icon: SlidersHorizontal, section: "card_controls" });
  if (canAccessNav(role, "transactions", mc))
    cardItems.push({ label: "Transactions", href: "/transactions", icon: ArrowRightLeft, section: "transactions" });
  if (cardItems.length > 0)
    groups.push({ label: "Card Portal", items: cardItems });

  // Expense Management (only if enabled)
  if (mc.expenseManagement) {
    const expItems: NavItem[] = [];
    if (canAccessNav(role, "expenses", mc))
      expItems.push({ label: "Expenses", href: "/expenses", icon: Receipt, section: "expenses" });
    if (canAccessNav(role, "expense_reports", mc))
      expItems.push({ label: "Expense Reports", href: "/expense-reports", icon: FileText, section: "expense_reports" });
    if (canAccessNav(role, "approvals", mc))
      expItems.push({ label: "Approvals", href: "/approvals", icon: CheckSquare, section: "approvals", badge: role !== "AUDITOR" ? 8 : undefined, badgeVariant: "destructive" });
    if (canAccessNav(role, "policies", mc))
      expItems.push({ label: "Policies", href: "/policies", icon: Shield, section: "policies" });
    if (canAccessNav(role, "doa", mc))
      expItems.push({ label: "DOA Config", href: "/doa", icon: Scale, section: "doa" });
    if (canAccessNav(role, "reimbursements", mc))
      expItems.push({ label: "Reimbursements", href: "/reimbursements", icon: Banknote, section: "reimbursements" });
    if (expItems.length > 0)
      groups.push({ label: "Expense Management", items: expItems });
  }

  // Intelligent Service
  if (canAccessNav(role, "ai_assistant", mc))
    groups.push({ label: "Intelligent Service", items: [{ label: "AI Assistant", href: "/ai-assistant", icon: Bot, section: "ai_assistant" }] });

  // Reports
  if (canAccessNav(role, "reports", mc))
    groups.push({ label: "Reports & Analytics", items: [{ label: "Reports", href: "/reports", icon: BarChart3, section: "reports" }] });

  // Administration
  const adminItems: NavItem[] = [];
  if (canAccessNav(role, "settings", mc))
    adminItems.push({ label: "Settings", href: "/settings", icon: Settings, section: "settings" });
  if (canAccessNav(role, "integrations", mc))
    adminItems.push({ label: "Integrations", href: "/settings/integrations", icon: Layers, section: "integrations" });
  if (canAccessNav(role, "data_management", mc))
    adminItems.push({ label: "Data Management", href: "/settings/data-management", icon: Database, section: "data_management" });
  if (canAccessNav(role, "audit_trail", mc))
    adminItems.push({ label: "Audit Trail", href: "/settings/audit", icon: GitBranch, section: "audit_trail" });
  if (adminItems.length > 0)
    groups.push({ label: "Administration", items: adminItems });

  return groups;
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { role } = useUserRole();
  const { config: moduleConfig } = useModuleConfig();
  const navGroups = getNavGroups(role, moduleConfig);

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center shrink-0">
          <CreditCard className="w-5 h-5 text-sidebar-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-sidebar-foreground truncate">{APP_NAME}</span>
            <span className="text-[10px] text-sidebar-foreground/50 truncate">Enterprise Platform</span>
          </div>
        )}
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div className="px-4 py-2 border-b border-sidebar-border">
          <Badge variant="outline" className="text-[9px] text-sidebar-foreground/60 border-sidebar-border w-full justify-center">
            {ROLE_LABELS[role] || role}
          </Badge>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-2">
        <nav className="space-y-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/" && pathname?.startsWith(item.href));

                  return (
                    <Link
                      key={item.href + item.section}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-primary"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <item.icon className={cn("w-4 h-4 shrink-0", isActive && "text-sidebar-primary")} />
                      {!collapsed && (
                        <>
                          <span className="truncate flex-1">{item.label}</span>
                          {item.badge && (
                            <Badge
                              variant={item.badgeVariant || "default"}
                              className="h-5 min-w-[20px] flex items-center justify-center text-[10px] px-1.5"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Collapse toggle */}
      <div className="border-t border-sidebar-border p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span className="ml-2 text-xs">Collapse</span>}
        </Button>
      </div>
    </aside>
  );
}
