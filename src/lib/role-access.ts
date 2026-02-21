"use client";

import { useSession } from "next-auth/react";
import type { UserRole } from "./constants";

// ==================== MODULE CONFIG ====================
export interface ModuleConfig {
  cardPortal: boolean;
  expenseManagement: boolean;
  ocrReceipts: boolean;
  aiAssistant: boolean;
  mileageTracking: boolean;
  perDiem: boolean;
  teamsIntegration: boolean;
  apExport: boolean;
  virtualCardIssuance: boolean;
  rbiLrs: boolean;
  gstCompliance: boolean;
}

export const defaultModuleConfig: ModuleConfig = {
  cardPortal: true,
  expenseManagement: true,
  ocrReceipts: true,
  aiAssistant: true,
  mileageTracking: false,
  perDiem: false,
  teamsIntegration: true,
  apExport: true,
  virtualCardIssuance: true,
  rbiLrs: false,
  gstCompliance: false,
};

// ==================== NAV ACCESS ====================
export type NavSection =
  | "dashboard"
  | "hierarchy"
  | "employees"
  | "cards"
  | "card_controls"
  | "transactions"
  | "expenses"
  | "expense_reports"
  | "approvals"
  | "policies"
  | "doa"
  | "reimbursements"
  | "ai_assistant"
  | "reports"
  | "settings"
  | "integrations"
  | "audit_trail"
  | "data_management"
  | "my_cards"
  | "my_transactions"
  | "my_expenses"
  | "my_statements"
  | "statements"
  | "payments"
  | "workflows"
  | "disputes"
  | "subscriptions"
  | "scheduled_actions"
  | "company_management";

const ROLE_NAV: Record<UserRole, NavSection[]> = {
  SYSTEM_ADMIN: [
    "dashboard", "hierarchy", "employees", "cards", "card_controls", "transactions",
    "expenses", "expense_reports", "approvals", "policies", "doa", "reimbursements",
    "ai_assistant", "reports", "settings", "integrations", "audit_trail", "data_management",
    "statements", "payments", "workflows", "disputes", "subscriptions", "scheduled_actions",
    "company_management",
  ],
  COMPANY_ADMIN: [
    "dashboard", "hierarchy", "employees", "cards", "card_controls", "transactions",
    "expenses", "expense_reports", "approvals", "policies", "doa", "reimbursements",
    "ai_assistant", "reports", "settings", "integrations", "data_management",
    "statements", "payments", "workflows", "disputes", "subscriptions", "scheduled_actions",
  ],
  FINANCE_CONTROLLER: [
    "dashboard", "cards", "transactions",
    "expenses", "expense_reports", "approvals", "policies", "reimbursements",
    "reports", "integrations",
    "statements", "payments", "disputes",
  ],
  DEPT_MANAGER: [
    "dashboard", "cards", "transactions",
    "expenses", "expense_reports", "approvals",
    "reports",
    "statements", "workflows", "disputes",
  ],
  EMPLOYEE: [
    "dashboard", "my_cards", "my_transactions",
    "my_expenses", "my_statements",
    "disputes",
  ],
  AUDITOR: [
    "dashboard", "cards", "transactions",
    "expenses", "expense_reports", "approvals", "policies", "doa", "reimbursements",
    "reports", "audit_trail",
    "statements", "payments", "workflows", "disputes", "subscriptions",
  ],
};

const EXPENSE_SECTIONS: NavSection[] = [
  "expenses", "expense_reports", "approvals", "policies", "doa",
  "reimbursements", "my_expenses",
];

export function canAccessNav(
  role: UserRole,
  section: NavSection,
  moduleConfig: ModuleConfig = defaultModuleConfig
): boolean {
  if (EXPENSE_SECTIONS.includes(section) && !moduleConfig.expenseManagement) return false;
  if (section === "ai_assistant" && (!moduleConfig.aiAssistant || !moduleConfig.expenseManagement)) return false;
  return ROLE_NAV[role]?.includes(section) ?? false;
}

// ==================== DASHBOARD WIDGETS ====================
export type DashboardWidget =
  | "spend_mtd"
  | "active_cards"
  | "limit_utilization"
  | "pending_approvals"
  | "policy_compliance"
  | "spend_by_category"
  | "monthly_trend"
  | "hierarchy_spend"
  | "recent_transactions"
  | "top_spenders"
  | "pending_approval_list"
  | "quick_actions"
  | "my_balance"
  | "my_recent_txns"
  | "my_missing_receipts"
  | "my_pending_approvals";

const ROLE_WIDGETS: Record<UserRole, DashboardWidget[]> = {
  SYSTEM_ADMIN: [
    "spend_mtd", "active_cards", "limit_utilization", "pending_approvals",
    "hierarchy_spend", "monthly_trend", "spend_by_category",
    "recent_transactions", "top_spenders", "pending_approval_list", "quick_actions",
  ],
  COMPANY_ADMIN: [
    "spend_mtd", "active_cards", "limit_utilization", "pending_approvals",
    "hierarchy_spend", "monthly_trend", "spend_by_category",
    "recent_transactions", "top_spenders", "pending_approval_list", "quick_actions",
  ],
  FINANCE_CONTROLLER: [
    "spend_mtd", "active_cards", "limit_utilization", "pending_approvals",
    "hierarchy_spend", "monthly_trend", "spend_by_category",
    "recent_transactions", "pending_approval_list",
  ],
  DEPT_MANAGER: [
    "spend_mtd", "active_cards", "pending_approvals",
    "monthly_trend", "recent_transactions", "pending_approval_list",
  ],
  EMPLOYEE: [
    "my_balance", "my_recent_txns", "my_missing_receipts", "my_pending_approvals",
  ],
  AUDITOR: [
    "spend_mtd", "active_cards", "limit_utilization", "policy_compliance",
    "hierarchy_spend", "spend_by_category",
    "recent_transactions", "top_spenders",
  ],
};

const EXPENSE_WIDGETS: DashboardWidget[] = [
  "pending_approvals", "pending_approval_list", "policy_compliance",
  "my_missing_receipts", "my_pending_approvals",
];

export function canSeeWidget(
  role: UserRole,
  widget: DashboardWidget,
  moduleConfig: ModuleConfig = defaultModuleConfig
): boolean {
  if (EXPENSE_WIDGETS.includes(widget) && !moduleConfig.expenseManagement) return false;
  return ROLE_WIDGETS[role]?.includes(widget) ?? false;
}

// ==================== ROLE HELPERS ====================
export function isAdminRole(role: UserRole): boolean {
  return role === "SYSTEM_ADMIN" || role === "COMPANY_ADMIN";
}

export function canSeeAllData(role: UserRole): boolean {
  return ["SYSTEM_ADMIN", "COMPANY_ADMIN", "FINANCE_CONTROLLER", "AUDITOR"].includes(role);
}

export function isReadOnly(role: UserRole): boolean {
  return role === "AUDITOR";
}

export function isEmployeeRole(role: UserRole): boolean {
  return role === "EMPLOYEE";
}

// ==================== HOOK ====================
export function useUserRole(): { role: UserRole; name: string; isLoading: boolean } {
  const { data: session, status } = useSession();
  const role = ((session?.user as any)?.role as UserRole) || "EMPLOYEE";
  const name = session?.user?.name || "User";
  return { role, name, isLoading: status === "loading" };
}
